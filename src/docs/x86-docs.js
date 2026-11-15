window.CPU_DOCS = window.CPU_DOCS || {};
window.CPU_DOCS['x86'] = {
    title: 'x86-like 8-bit CPU',
    summary: 'Simplified NASM-style 8-bit CPU. Every instruction and operand occupies 1 byte in RAM.',
    registers: '<code>A, B, C, D</code> (8-bit GP), <code>IP</code>, <code>SP</code> | Flags: <code>Z</code> (Zero), <code>C</code> (Carry), <code>F</code> (Fault)',
    syntax: 'label: MNEMONIC dst, src ; Dec: 200 | Hex: 0xA4 | Oct: 0o47 | Bin: 101b | Addr: [A], [D-3], [SP+2], [100] [100]',
    groups: [
        {
            name: 'Data & Variables',
            rows: [
                ['MOV dst, src', 'reg, addr, const', 'Copy byte between registers, memory, or immediate (supports <code>SP</code>)'],
                ['DB val', 'const, \'c\', "str"', 'Define raw byte(s) or ASCII string in memory']
            ]
        },
        {
            name: 'Arithmetic, Logic & Shifts',
            rows: [
                ['ADD / SUB dst, src', 'reg, addr, const', 'Add or subtract (updates <code>Z</code>, <code>C</code>; supports <code>SP</code>)'],
                ['ADDC / SUBC dst, src', 'reg, addr, const', 'Add with carry / subtract with borrow (multi-byte math)'],
                ['INC / DEC reg', 'A–D, SP', 'Increment or decrement register by 1'],
                ['MUL / DIV src', 'reg, addr, const', 'Multiply or integer divide <code>A</code> by operand'],
                ['AND / OR / XOR dst, src', 'reg, addr, const', 'Bitwise logical operations'],
                ['NOT reg', 'A–D', 'Bitwise invert register'],
                ['SHL / SHR dst, src', 'reg, addr, const', 'Logical shift left or right']
            ]
        },
        {
            name: 'Compare, Jumps & Stack',
            rows: [
                ['CMP a, b', 'reg, addr, const', 'Compare <code>a - b</code> and set <code>Z</code> / <code>C</code> flags'],
                ['JMP target', 'addr, reg', 'Unconditional jump'],
                ['JC / JNC / JZ / JNZ / JA / JNA', 'addr, reg', 'Conditional jump on Carry, Zero, or Above (<code>C=0 &amp; Z=0</code>)'],
                ['PUSH / POP op', 'reg (POP), +addr/const (PUSH)', 'Push onto or pop from stack via <code>SP</code>'],
                ['CALL / RET', 'addr, reg (CALL)', 'Call subroutine / return from subroutine'],
                ['NOP / HLT', 'none', 'No operation / halt execution']
            ]
        }
    ]
};
