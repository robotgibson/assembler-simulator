;app.service('assembler8080', [function () {
    var regs = { B: 0, C: 1, D: 2, E: 3, H: 4, L: 5, M: 6, A: 7 };
    var pairs = { B: 0, BC: 0, D: 1, DE: 1, H: 2, HL: 2, SP: 3 };
    var pushPairs = { B: 0, BC: 0, D: 1, DE: 1, H: 2, HL: 2, PSW: 3 };
    var aluOps = { ADD: 0, ADC: 1, SUB: 2, SBB: 3, ANA: 4, XRA: 5, ORA: 6, CMP: 7 };
    var immAlu = { ADI: 0xC6, ACI: 0xCE, SUI: 0xD6, SBI: 0xDE, ANI: 0xE6, XRI: 0xEE, ORI: 0xF6, CPI: 0xFE };
    var jmps = { JNZ: 0xC2, JMP: 0xC3, JZ: 0xCA, JNC: 0xD2, JC: 0xDA, JPO: 0xE2, JPE: 0xEA, JP: 0xF2, JM: 0xFA };
    var calls = { CNZ: 0xC4, CALL: 0xCD, CZ: 0xCC, CNC: 0xD4, CC: 0xDC, CPO: 0xE4, CPE: 0xEC, CP: 0xF4, CM: 0xFC };
    var rets = { RNZ: 0xC0, RET: 0xC9, RZ: 0xC8, RNC: 0xD0, RC: 0xD8, RPO: 0xE0, RPE: 0xE8, RP: 0xF0, RM: 0xF8 };
    var singles = { NOP: 0x00, RLC: 0x07, RRC: 0x0F, RAL: 0x17, RAR: 0x1F, CMA: 0x2F, STC: 0x37, CMC: 0x3F, HLT: 0x76, XTHL: 0xE3, PCHL: 0xE9, XCHG: 0xEB, SPHL: 0xF9 };

    function parseNum(tok, labels) {
        tok = tok.trim();
        if (/^'.'$/.test(tok)) { return tok.charCodeAt(1); }
        if (/^0x[0-9a-fA-F]+$/.test(tok)) { return parseInt(tok.slice(2), 16); }
        if (/^[0-9][0-9a-fA-F]*[hH]$/.test(tok)) { return parseInt(tok.slice(0, -1), 16); }
        if (/^0o[0-7]+$/.test(tok)) { return parseInt(tok.slice(2), 8); }
        if (/^[0-7]+[qQoO]$/.test(tok)) { return parseInt(tok.slice(0, -1), 8); }
        if (new RegExp('^(0|1)+(b|B)$').test(tok)) { return parseInt(tok.slice(0, -1), 2); }
        if (/^[0-9]+[dD]?$/.test(tok)) { return parseInt(tok.replace(/[dD]$/, ''), 10); }
        var key = tok.toLowerCase();
        if (labels && labels.hasOwnProperty(key)) { return labels.valueOf()[key]; }
        return null;
    }

    function splitArgs(str) {
        var out = [], cur = '', inQ = false, qCh = '';
        for (var i = 0; i < str.length; i++) {
            var ch = str.charAt(i);
            if (inQ) { cur += ch; if (ch === qCh) { inQ = false; } }
            else if (ch === '"' || ch === "'") { inQ = true; qCh = ch; cur += ch; }
            else if (ch === ',') { out.push(cur.trim()); cur = ''; }
            else { cur += ch; }
        }
        if (cur.trim() !== '') { out.push(cur.trim()); }
        return out;
    }

    function stripComment(line) {
        var inQ = false, qCh = '';
        for (var i = 0; i < line.length; i++) {
            var ch = line.charAt(i);
            if (inQ) { if (ch === qCh) { inQ = false; } }
            else if (ch === '"' || ch === "'") { inQ = true; qCh = ch; }
            else if (ch === ';') { return line.slice(0, i); }
        }
        return line;
    }

    return {
        go: function (input) {
            var lines = input.split('\n');
            var code = [], mapping = {}, labels = {}, fixups = [];
            function emit8(v, li, isOp) {
                if (code.length >= 256) { throw "Program exceeds 256 bytes of RAM"; }
                if (isOp) { mapping[code.length] = li; }
                code.push(v & 0xFF);
            }
            function emit16(expr, li) {
                var val = parseNum(expr, labels), pos = code.length;
                if (val === null) {
                    fixups.push({ pos: pos, expr: expr, line: li });
                    emit8(0, li, false); emit8(0, li, false);
                } else {
                    if (val < 0 || val > 65535) { throw "16-bit value out of range on line " + (li + 1); }
                    emit8(val & 0xFF, li, false); emit8((val >> 8) & 0xFF, li, false);
                }
            }
            function eval8(expr, li) {
                var v = parseNum(expr, labels);
                if (v === null) { throw "Unknown symbol or invalid number '" + expr + "' on line " + (li + 1); }
                if (v < 0 || v > 255) { throw "8-bit value out of range (" + v + ") on line " + (li + 1); }
                return v;
            }
            for (var li = 0; li < lines.length; li++) {
                var clean = stripComment(lines.at(li)).trim();
                if (!clean) { continue; }
                var colon = clean.indexOf(':');
                if (colon !== -1 && clean.indexOf('"') === -1 && clean.indexOf("'") === -1) {
                    var lbl = clean.slice(0, colon).trim().toLowerCase();
                    if (!/^[a-z_.][a-z0-9_.]*$/.test(lbl)) { throw "Invalid label '" + lbl + "' on line " + (li + 1); }
                    if (labels.hasOwnProperty(lbl)) { throw "Duplicate label '" + lbl + "' on line " + (li + 1); }
                    labels[lbl] = code.length;
                    clean = clean.slice(colon + 1).trim();
                    if (!clean) { continue; }
                }
                var sp = clean.search(/\s/);
                var mnem = (sp === -1 ? clean : clean.slice(0, sp)).toUpperCase();
                var argStr = sp === -1 ? '' : clean.slice(sp + 1).trim();
                var args = argStr ? splitArgs(argStr) : [];
                if (mnem === 'DB') {
                    if (!args.length) { throw "DB requires at least one value on line " + (li + 1); }
                    for (var ai = 0; ai < args.length; ai++) {
                        var a = args.at(ai);
                        if (a.length >= 2 && a.charAt(0) === '"' && a.charAt(a.length - 1) === '"') {
                            for (var ci = 1; ci < a.length - 1; ci++) { emit8(a.charCodeAt(ci), li, false); }
                        } else { emit8(eval8(a, li), li, false); }
                    }
                } else if (mnem === 'DS') {
                    var cnt = eval8(args.at(0) || '', li);
                    for (var di = 0; di < cnt; di++) { emit8(0, li, false); }
                } else if (singles.hasOwnProperty(mnem)) { emit8(singles[mnem], li, true); }
                else if (mnem === 'MOV') {
                    var dst = (args.at(0) || '').toUpperCase(), src = (args.at(1) || '').toUpperCase();
                    if (args.length !== 2 || !regs.hasOwnProperty(dst) || !regs.hasOwnProperty(src) || (dst === 'M' && src === 'M')) { throw "Invalid MOV operands on line " + (li + 1); }
                    emit8(0x40 | (regs[dst] << 3) | regs[src], li, true);
                } else if (mnem === 'MVI') {
                    var dst = (args.at(0) || '').toUpperCase();
                    if (args.length !== 2 || !regs.hasOwnProperty(dst)) { throw "Invalid MVI operands on line " + (li + 1); }
                    emit8(0x06 | (regs[dst] << 3), li, true); emit8(eval8(args.at(1), li), li, false);
                } else if (mnem === 'LXI') {
                    var rp = (args.at(0) || '').toUpperCase();
                    if (args.length !== 2 || !pairs.hasOwnProperty(rp)) { throw "Invalid LXI operands on line " + (li + 1); }
                    emit8(0x01 | (pairs[rp] << 4), li, true); emit16(args.at(1), li);
                } else if (mnem === 'LDAX' || mnem === 'STAX') {
                    var rp = (args.at(0) || '').toUpperCase();
                    if (rp !== 'B' && rp !== 'BC' && rp !== 'D' && rp !== 'DE') { throw mnem + " requires B or D on line " + (li + 1); }
                    emit8((mnem === 'STAX' ? 0x02 : 0x0A) | (pairs[rp] << 4), li, true);
                } else if (mnem === 'LDA' || mnem === 'STA' || mnem === 'LHLD' || mnem === 'SHLD') {
                    var m16 = { SHLD: 0x22, LHLD: 0x2A, STA: 0x32, LDA: 0x3A };
                    emit8(m16[mnem], li, true); emit16(args.at(0) || '', li);
                } else if (mnem === 'INX' || mnem === 'DCX' || mnem === 'DAD') {
                    var rp = (args.at(0) || '').toUpperCase();
                    if (!pairs.hasOwnProperty(rp)) { throw "Invalid pair for " + mnem + " on line " + (li + 1); }
                    emit8((mnem === 'INX' ? 0x03 : (mnem === 'DCX' ? 0x0B : 0x09)) | (pairs[rp] << 4), li, true);
                } else if (mnem === 'INR' || mnem === 'DCR') {
                    var r = (args.at(0) || '').toUpperCase();
                    if (!regs.hasOwnProperty(r)) { throw "Invalid register for " + mnem + " on line " + (li + 1); }
                    emit8((mnem === 'INR' ? 0x04 : 0x05) | (regs[r] << 3), li, true);
                } else if (aluOps.hasOwnProperty(mnem)) {
                    var r = (args.at(0) || '').toUpperCase();
                    if (!regs.hasOwnProperty(r)) { throw "Invalid register for " + mnem + " on line " + (li + 1); }
                    emit8(0x80 | (aluOps[mnem] << 3) | regs[r], li, true);
                } else if (immAlu.hasOwnProperty(mnem)) { emit8(immAlu[mnem], li, true); emit8(eval8(args.at(0) || '', li), li, false); }
                else if (jmps.hasOwnProperty(mnem)) { emit8(jmps[mnem], li, true); emit16(args.at(0) || '', li); }
                else if (calls.hasOwnProperty(mnem)) { emit8(calls[mnem], li, true); emit16(args.at(0) || '', li); }
                else if (rets.hasOwnProperty(mnem)) { emit8(rets[mnem], li, true); }
                else if (mnem === 'PUSH' || mnem === 'POP') {
                    var rp = (args.at(0) || '').toUpperCase();
                    if (!pushPairs.hasOwnProperty(rp)) { throw "Invalid " + mnem + " pair on line " + (li + 1); }
                    emit8((mnem === 'POP' ? 0xC1 : 0xC5) | (pushPairs[rp] << 4), li, true);
                } else { throw "Unknown 8080 instruction '" + mnem + "' on line " + (li + 1); }
            }
            for (var fi = 0; fi < fixups.length; fi++) {
                var fx = fixups.at(fi), target = parseNum(fx.expr, labels);
                if (target === null) { throw "Undefined label '" + fx.expr + "' on line " + (fx.line + 1); }
                code.splice(fx.pos, 2, target & 0xFF, (target >> 8) & 0xFF);
            }
            return { code: code, mapping: mapping, labels: labels };
        }
    };
}]);
