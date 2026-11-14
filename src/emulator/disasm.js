;app.service('disasm', ['opcodes', function (opcodes) {
    var opNames = {};
    angular.forEach(opcodes, function (v, k) { opNames[v] = k; });
    var regNames = ['A', 'B', 'C', 'D', 'SP'];
    function hex2(v) { return ('0' + (v & 0xFF).toString(16).toUpperCase()).slice(-2); }
    function hex4(v) { return ('000' + (v & 0xFFFF).toString(16).toUpperCase()).slice(-4); }

    var r8080 = ['B', 'C', 'D', 'E', 'H', 'L', 'M', 'A'];
    var rp8080 = ['B', 'D', 'H', 'SP'];
    var push8080 = ['B', 'D', 'H', 'PSW'];
    var alu8080 = ['ADD', 'ADC', 'SUB', 'SBB', 'ANA', 'XRA', 'ORA', 'CMP'];
    var imm8080 = ['ADI', 'ACI', 'SUI', 'SBI', 'ANI', 'XRI', 'ORI', 'CPI'];
    var cc8080 = ['NZ', 'Z', 'NC', 'C', 'PO', 'PE', 'P', 'M'];

    function decode8080(mem, addr) {
        var op = mem.at(addr), b1 = mem.at((addr + 1) & 0xFF), b2 = mem.at((addr + 2) & 0xFF);
        var w = (b2 << 8) | b1, wHex = hex4(w);
        if (op === 0x00) { return { len: 1, text: 'NOP' }; }
        if (op === 0x76) { return { len: 1, text: 'HLT' }; }
        if ((op & 0xC0) === 0x40) { return { len: 1, text: 'MOV ' + r8080.at((op >> 3) & 7) + ', ' + r8080.at(op & 7) }; }
        if ((op & 0xC0) === 0x80) { return { len: 1, text: alu8080.at((op >> 3) & 7) + ' ' + r8080.at(op & 7) }; }
        if ((op & 0xC7) === 0x06) { return { len: 2, text: 'MVI ' + r8080.at((op >> 3) & 7) + ', 0x' + hex2(b1) }; }
        if ((op & 0xC7) === 0x04) { return { len: 1, text: 'INR ' + r8080.at((op >> 3) & 7) }; }
        if ((op & 0xC7) === 0x05) { return { len: 1, text: 'DCR ' + r8080.at((op >> 3) & 7) }; }
        if ((op & 0xCF) === 0x01) { return { len: 3, text: 'LXI ' + rp8080.at((op >> 4) & 3) + ', 0x' + wHex }; }
        if ((op & 0xCF) === 0x03) { return { len: 1, text: 'INX ' + rp8080.at((op >> 4) & 3) }; }
        if ((op & 0xCF) === 0x0B) { return { len: 1, text: 'DCX ' + rp8080.at((op >> 4) & 3) }; }
        if ((op & 0xCF) === 0x09) { return { len: 1, text: 'DAD ' + rp8080.at((op >> 4) & 3) }; }
        if (op === 0x02) { return { len: 1, text: 'STAX B' }; }
        if (op === 0x12) { return { len: 1, text: 'STAX D' }; }
        if (op === 0x0A) { return { len: 1, text: 'LDAX B' }; }
        if (op === 0x1A) { return { len: 1, text: 'LDAX D' }; }
        if (op === 0x22) { return { len: 3, text: 'SHLD 0x' + wHex }; }
        if (op === 0x2A) { return { len: 3, text: 'LHLD 0x' + wHex }; }
        if (op === 0x32) { return { len: 3, text: 'STA 0x' + wHex }; }
        if (op === 0x3A) { return { len: 3, text: 'LDA 0x' + wHex }; }
        if (op === 0x07) { return { len: 1, text: 'RLC' }; }
        if (op === 0x0F) { return { len: 1, text: 'RRC' }; }
        if (op === 0x17) { return { len: 1, text: 'RAL' }; }
        if (op === 0x1F) { return { len: 1, text: 'RAR' }; }
        if (op === 0x2F) { return { len: 1, text: 'CMA' }; }
        if (op === 0x37) { return { len: 1, text: 'STC' }; }
        if (op === 0x3F) { return { len: 1, text: 'CMC' }; }
        if ((op & 0xC7) === 0xC6) { return { len: 2, text: imm8080.at((op >> 3) & 7) + ' 0x' + hex2(b1) }; }
        if (op === 0xC3) { return { len: 3, text: 'JMP 0x' + wHex }; }
        if ((op & 0xC7) === 0xC2) { return { len: 3, text: 'J' + cc8080.at((op >> 3) & 7) + ' 0x' + wHex }; }
        if (op === 0xCD) { return { len: 3, text: 'CALL 0x' + wHex }; }
        if ((op & 0xC7) === 0xC4) { return { len: 3, text: 'C' + cc8080.at((op >> 3) & 7) + ' 0x' + wHex }; }
        if (op === 0xC9) { return { len: 1, text: 'RET' }; }
        if ((op & 0xC7) === 0xC0) { return { len: 1, text: 'R' + cc8080.at((op >> 3) & 7) }; }
        if ((op & 0xCF) === 0xC5) { return { len: 1, text: 'PUSH ' + push8080.at((op >> 4) & 3) }; }
        if ((op & 0xCF) === 0xC1) { return { len: 1, text: 'POP ' + push8080.at((op >> 4) & 3) }; }
        if (op === 0xEB) { return { len: 1, text: 'XCHG' }; }
        if (op === 0xE3) { return { len: 1, text: 'XTHL' }; }
        if (op === 0xE9) { return { len: 1, text: 'PCHL' }; }
        if (op === 0xF9) { return { len: 1, text: 'SPHL' }; }
        return { len: 1, text: 'DB 0x' + hex2(op) };
    }

    function decode8bit(mem, addr) {
        var op = mem.at(addr), b1 = mem.at((addr + 1) & 0xFF), b2 = mem.at((addr + 2) & 0xFF);
        var name = opNames.hasOwnProperty(op) ? opNames[op] : null;
        if (!name) { return { len: 1, text: 'DB 0x' + hex2(op) }; }
        var parts = name.split('_');
        var mnem = parts.at(0);
        if (op === 0 || op === 98 || mnem === 'RET') { return { len: 1, text: mnem }; }
        if (parts.length === 2) {
            var kind = parts.at(1), arg = '';
            if (kind === 'REG') { arg = regNames.at(b1) || ('R' + b1); }
            else if (kind === 'REGADDRESS') { arg = '[' + (regNames.at(b1) || b1) + ']'; }
            else if (kind === 'ADDRESS') { arg = '[0x' + hex2(b1) + ']'; }
            else { arg = '0x' + hex2(b1); }
            if (mnem.charAt(0) === 'J' || mnem === 'CALL') { arg = '0x' + hex2(b1); }
            return { len: 2, text: mnem + ' ' + arg };
        }
        var p1 = regNames.at(b1) || ('0x' + hex2(b1));
        var p2 = regNames.at(b2) || ('0x' + hex2(b2));
        if (name.indexOf('REGADDRESS_TO') !== -1 || name.indexOf('REGADDRESS_FROM') !== -1 || name.indexOf('REGADDRESS_WITH') !== -1) { p2 = '[' + p2 + ']'; }
        else if (name.indexOf('ADDRESS_TO') !== -1 || name.indexOf('ADDRESS_FROM') !== -1 || name.indexOf('ADDRESS_WITH') !== -1) { p2 = '[0x' + hex2(b2) + ']'; }
        else if (name.indexOf('NUMBER') !== -1) { p2 = '0x' + hex2(b2); }
        if (name.indexOf('TO_REGADDRESS') !== -1) { p1 = '[' + p1 + ']'; }
        else if (name.indexOf('TO_ADDRESS') !== -1) { p1 = '[0x' + hex2(b1) + ']'; }
        return { len: 3, text: mnem + ' ' + p1 + ', ' + p2 };
    }

    return {
        build: function (mem, mapping, mode) {
            if (!mapping) { return []; }
            var rows = [], addr = 0;
            while (addr < 256) {
                if (mapping.hasOwnProperty(addr)) {
                    var dec = (mode === '8080') ? decode8080(mem, addr) : decode8bit(mem, addr);
                    var bytes = [];
                    for (var i = 0; i < dec.len && (addr + i) < 256; i++) { bytes.push(hex2(mem.at(addr + i))); }
                    rows.push({ addr: addr, addrHex: hex4(addr), bytes: bytes.join(' '), text: dec.text });
                    addr += dec.len;
                } else {
                    addr += 1;
                }
            }
            return rows;
        }
    };
}]);
