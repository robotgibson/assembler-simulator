window.CPU_DOCS = window.CPU_DOCS || {};
window.CPU_DOCS['8080'] = {
    title: 'Intel 8080 CPU',
    summary: 'Standard Intel 8080 instruction set (1–3 byte instructions, little-endian 16-bit addresses/immediates, up to 64 KB RAM).',
    registers: '<code>A, B, C, D, E, H, L</code>, <code>M</code> (<code>[HL]</code>), Pairs: <code>BC, DE, HL, SP, PSW</code>, <code>PC</code> | Flags: <code>S, Z, AC, P, CY, F</code>',
    syntax: 'label: MNEMONIC op1, op2 ; Dec: 200 | Hex: 0xA4 / 0A4h | Oct: 0o47 / 47q | Bin: 101b | Char: \'A\'',
    groups: [
        {
            name: 'Data Transfer & Directives',
            rows: [
                ['MOV dst, src', 'A,B,C,D,E,H,L,M', 'Copy byte between registers or <code>M</code> (<code>[HL]</code>)'],
                ['MVI dst, d8', 'r/M, 8-bit', 'Load 8-bit immediate into register or <code>M</code>'],
                ['LXI rp, d16', 'BC, DE, HL, SP', 'Load 16-bit immediate into register pair'],
                ['LDA / STA addr', '16-bit addr', 'Load or store <code>A</code> directly at 16-bit address'],
                ['LHLD / SHLD addr', '16-bit addr', 'Load or store <code>L</code> at <code>[addr]</code> and <code>H</code> at <code>[addr+1]</code>'],
                ['LDAX / STAX rp', 'BC, DE', 'Load or store <code>A</code> indirectly via <code>[BC]</code> or <code>[DE]</code>'],
                ['XCHG', 'none', 'Swap <code>HL</code> and <code>DE</code>'],
                ['DB / DS', 'bytes / count', '<code>DB</code> defines bytes/strings; <code>DS n</code> reserves <code>n</code> zero bytes']
            ]
        },
        {
            name: 'Arithmetic, Logic & Rotates',
            rows: [
                ['ADD / ADC / SUB / SBB r', 'A–L, M', 'Add/subtract register or <code>M</code> with <code>A</code> (<code>ADC/SBB</code> include <code>CY</code>)'],
                ['ANA / XRA / ORA / CMP r', 'A–L, M', 'Bitwise AND, XOR, OR, or compare with <code>A</code>'],
                ['ADI / ACI / SUI / SBI d8', '8-bit', 'Immediate add/subtract (with carry/borrow) on <code>A</code>'],
                ['ANI / XRI / ORI / CPI d8', '8-bit', 'Immediate AND, XOR, OR, or compare with <code>A</code>'],
                ['INR / DCR r', 'A–L, M', 'Increment/decrement 8-bit register or <code>M</code> (preserves <code>CY</code>)'],
                ['INX / DCX / DAD rp', 'BC, DE, HL, SP', '16-bit pair increment, decrement, or <code>HL = HL + rp</code>'],
                ['RLC / RRC / RAL / RAR', 'none', 'Rotate <code>A</code> left/right circularly or 9-bit through <code>CY</code>'],
                ['CMA / STC / CMC', 'none', 'Complement <code>A</code> / Set <code>CY=1</code> / Complement <code>CY</code>']
            ]
        },
        {
            name: 'Branches, Calls & Stack',
            rows: [
                ['JMP / Jcc addr', '16-bit addr', 'Jump unconditionally or on <code>Z, NZ, C, NC, P, M, PE, PO</code>'],
                ['CALL / Ccc addr', '16-bit addr', 'Call subroutine unconditionally or on condition flags'],
                ['RET / Rcc', 'none', 'Return from subroutine unconditionally or on condition flags'],
                ['PCHL / SPHL / XTHL', 'none', '<code>PC = HL</code> / <code>SP = HL</code> / swap <code>HL</code> with <code>[SP]</code>'],
                ['PUSH / POP rp', 'BC, DE, HL, PSW', 'Push or pop 16-bit pair (<code>PSW</code> = <code>A</code> + Flags) on stack'],
                ['NOP / HLT', 'none', 'No operation / halt CPU execution']
            ]
        }
    ]
};
