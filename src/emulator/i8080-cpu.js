;app.service('cpu8080', ['memory', function (memory) {
    // Registers: B=0, C=1, D=2, E=3, H=4, L=5, M=6, A=7
    var self = {
        regs: new Array(8).fill(0),
        ip: 0, sp: 231, zero: false, carry: false, sign: false, parity: false, fault: false,
        reset: function () {
            self.regs = new Array(8).fill(0);
            self.ip = 0; self.sp = 231;
            self.zero = false; self.carry = false; self.sign = false; self.parity = false; self.fault = false;
        }
    };
    function setSZP(v) {
        v &= 0xFF;
        self.zero = (v === 0);
        self.sign = ((v & 0x80) !== 0);
        var p = v ^ (v >> 4); p ^= p >> 2; p ^= p >> 1;
        self.parity = ((p & 1) === 0);
        return v;
    }
    function getHL() { return ((self.regs.at(4) << 8) | self.regs.at(5)) & 0xFFFF; }
    function setHL(v) { self.regs.splice(4, 2, (v >> 8) & 0xFF, v & 0xFF); }
    function readReg(r) { return r === 6 ? memory.load(getHL()) : self.regs.at(r); }
    function writeReg(r, val) {
        val &= 0xFF;
        if (r === 6) { memory.store(getHL(), val); } else { self.regs.splice(r, 1, val); }
    }
    function getPair(rp) {
        if (rp === 0) { return (self.regs.at(0) << 8) | self.regs.at(1); }
        if (rp === 1) { return (self.regs.at(2) << 8) | self.regs.at(3); }
        return rp === 2 ? getHL() : self.sp;
    }
    function setPair(rp, val) {
        val &= 0xFFFF;
        if (rp === 0) { self.regs.splice(0, 2, (val >> 8) & 0xFF, val & 0xFF); }
        else if (rp === 1) { self.regs.splice(2, 2, (val >> 8) & 0xFF, val & 0xFF); }
        else if (rp === 2) { setHL(val); }
        else { self.sp = val & 0xFF; }
    }
    function fetch8() { var b = memory.load(self.ip); self.ip = (self.ip + 1) & 0xFF; return b; }
    function fetch16() { var lo = fetch8(), hi = fetch8(); return (hi << 8) | lo; }
    function push16(val) {
        if (self.sp < 2) { throw "Stack overflow"; }
        self.sp -= 1; memory.store(self.sp, (val >> 8) & 0xFF);
        self.sp -= 1; memory.store(self.sp, val & 0xFF);
    }
    function pop16() {
        if (self.sp > 229) { throw "Stack underflow"; }
        var lo = memory.load(self.sp); self.sp += 1;
        var hi = memory.load(self.sp); self.sp += 1;
        return (hi << 8) | lo;
    }

    function doAlu(op, val) {
        var a = self.regs.at(7), c = self.carry ? 1 : 0, res = 0;
        if (op === 0) { res = a + val; self.carry = res > 0xFF; writeReg(7, setSZP(res)); }
        else if (op === 1) { res = a + val + c; self.carry = res > 0xFF; writeReg(7, setSZP(res)); }
        else if (op === 2) { res = a - val; self.carry = res < 0; writeReg(7, setSZP(res)); }
        else if (op === 3) { res = a - val - c; self.carry = res < 0; writeReg(7, setSZP(res)); }
        else if (op === 4) { self.carry = false; writeReg(7, setSZP(a & val)); }
        else if (op === 5) { self.carry = false; writeReg(7, setSZP(a ^ val)); }
        else if (op === 6) { self.carry = false; writeReg(7, setSZP(a | val)); }
        else if (op === 7) { res = a - val; self.carry = res < 0; setSZP(res); }
    }
    function checkCond(cc) {
        if (cc === 0) { return !self.zero; }
        if (cc === 1) { return self.zero; }
        if (cc === 2) { return !self.carry; }
        if (cc === 3) { return self.carry; }
        if (cc === 4) { return !self.parity; }
        if (cc === 5) { return self.parity; }
        if (cc === 6) { return !self.sign; }
        return self.sign;
    }
    self.step = function () {
        if (self.fault) { throw "FAULT. Reset to CPU continue."; }
        try {
            var op = fetch8();
            if (op === 0x00) { return true; }
            if (op === 0x76) { return false; }
            if ((op & 0xC0) === 0x40) { writeReg((op >> 3) & 7, readReg(op & 7)); return true; }
            if ((op & 0xC0) === 0x80) { doAlu((op >> 3) & 7, readReg(op & 7)); return true; }
            if ((op & 0xC7) === 0x06) { writeReg((op >> 3) & 7, fetch8()); return true; }
            if ((op & 0xC7) === 0x04) { var r = (op >> 3) & 7; writeReg(r, setSZP(readReg(r) + 1)); return true; }
            if ((op & 0xC7) === 0x05) { var r = (op >> 3) & 7; writeReg(r, setSZP(readReg(r) - 1)); return true; }
            if ((op & 0xCF) === 0x01) { setPair((op >> 4) & 3, fetch16()); return true; }
            if ((op & 0xCF) === 0x03) { var rp = (op >> 4) & 3; setPair(rp, getPair(rp) + 1); return true; }
            if ((op & 0xCF) === 0x0B) { var rp = (op >> 4) & 3; setPair(rp, getPair(rp) - 1); return true; }
            if ((op & 0xCF) === 0x09) { var s = getHL() + getPair((op >> 4) & 3); self.carry = s > 0xFFFF; setHL(s); return true; }
            if (op === 0x02) { memory.store(getPair(0), self.regs.at(7)); return true; }
            if (op === 0x12) { memory.store(getPair(1), self.regs.at(7)); return true; }
            if (op === 0x0A) { writeReg(7, memory.load(getPair(0))); return true; }
            if (op === 0x1A) { writeReg(7, memory.load(getPair(1))); return true; }
            if (op === 0x22) { var a = fetch16(); memory.store(a, self.regs.at(5)); memory.store(a + 1, self.regs.at(4)); return true; }
            if (op === 0x2A) { var a = fetch16(); writeReg(5, memory.load(a)); writeReg(4, memory.load(a + 1)); return true; }
            if (op === 0x32) { memory.store(fetch16(), self.regs.at(7)); return true; }
            if (op === 0x3A) { writeReg(7, memory.load(fetch16())); return true; }
            if (op === 0x07) { var a = self.regs.at(7); self.carry = (a & 0x80) !== 0; writeReg(7, (a << 1) | (self.carry ? 1 : 0)); return true; }
            if (op === 0x0F) { var a = self.regs.at(7); self.carry = (a & 1) !== 0; writeReg(7, (a >> 1) | (self.carry ? 0x80 : 0)); return true; }
            if (op === 0x17) { var a = self.regs.at(7), c = self.carry ? 1 : 0; self.carry = (a & 0x80) !== 0; writeReg(7, (a << 1) | c); return true; }
            if (op === 0x1F) { var a = self.regs.at(7), c = self.carry ? 0x80 : 0; self.carry = (a & 1) !== 0; writeReg(7, (a >> 1) | c); return true; }
            if (op === 0x2F) { writeReg(7, ~self.regs.at(7)); return true; }
            if (op === 0x37) { self.carry = true; return true; }
            if (op === 0x3F) { self.carry = !self.carry; return true; }
            if ((op & 0xC7) === 0xC6) { doAlu((op >> 3) & 7, fetch8()); return true; }
            if (op === 0xC3) { var t = fetch16(); if (t >= 256) { throw "PC outside memory"; } self.ip = t; return true; }
            if ((op & 0xC7) === 0xC2) { var t = fetch16(); if (checkCond((op >> 3) & 7)) { if (t >= 256) { throw "PC outside memory"; } self.ip = t; } return true; }
            if (op === 0xCD) { var t = fetch16(); if (t >= 256) { throw "PC outside memory"; } push16(self.ip); self.ip = t; return true; }
            if ((op & 0xC7) === 0xC4) { var t = fetch16(); if (checkCond((op >> 3) & 7)) { if (t >= 256) { throw "PC outside memory"; } push16(self.ip); self.ip = t; } return true; }
            if (op === 0xC9) { self.ip = pop16() & 0xFF; return true; }
            if ((op & 0xC7) === 0xC0) { if (checkCond((op >> 3) & 7)) { self.ip = pop16() & 0xFF; } return true; }
            if ((op & 0xCF) === 0xC5) {
                var rp = (op >> 4) & 3;
                if (rp === 3) { push16((self.regs.at(7) << 8) | ((self.sign?0x80:0)|(self.zero?0x40:0)|(self.parity?0x04:0)|2|(self.carry?1:0))); }
                else { push16(getPair(rp)); }
                return true;
            }
            if ((op & 0xCF) === 0xC1) {
                var rp = (op >> 4) & 3, v = pop16();
                if (rp === 3) { writeReg(7, (v >> 8) & 0xFF); var f = v & 0xFF; self.sign=(f&0x80)!==0; self.zero=(f&0x40)!==0; self.parity=(f&0x04)!==0; self.carry=(f&1)!==0; }
                else { setPair(rp, v); }
                return true;
            }
            if (op === 0xEB) { var d = self.regs.at(2), e = self.regs.at(3); self.regs.splice(2, 2, self.regs.at(4), self.regs.at(5)); self.regs.splice(4, 2, d, e); return true; }
            if (op === 0xE3) { var lo = memory.load(self.sp), hi = memory.load(self.sp + 1); memory.store(self.sp, self.regs.at(5)); memory.store(self.sp + 1, self.regs.at(4)); setHL((hi << 8) | lo); return true; }
            if (op === 0xE9) { self.ip = getHL() & 0xFF; return true; }
            if (op === 0xF9) { self.sp = getHL() & 0xFF; return true; }
            throw "Invalid 8080 opcode: 0x" + op.toString(16).toUpperCase();
        } catch (e) { self.fault = true; throw e; }
    };
    return self;
}]);

