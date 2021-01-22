import _ from 'lodash';
import * as instructions from './instructions';
import * as memory from './memory';

export const ModeAbsolute = 1;
export const ModeAbsoluteX = 2;
export const ModeAbsoluteY = 3;
export const ModeAccumulator = 4;
export const ModeImmediate = 5;
export const ModeImplied = 6;
export const ModeIndirect = 7;
export const ModeIndirectX = 8;
export const ModeIndirectY = 9;
export const ModeRelative = 10;
export const ModeZeroPage = 11;
export const ModeZeroPageX = 12;
export const ModeZeroPageY = 13;

const opcodes = [
    [0x0B, "*AAC", ModeImmediate,   instructions.aac, memory.readImmediate],
    [0x2B, "*AAC", ModeImmediate,   instructions.aac, memory.readImmediate],

    [0x69, "ADC",  ModeImmediate,   instructions.adc, memory.readImmediate],
    [0x65, "ADC",  ModeZeroPage,    instructions.adc, memory.readZeroPage],
    [0x75, "ADC",  ModeZeroPageX,   instructions.adc, memory.readZeroPageX],
    [0x6D, "ADC",  ModeAbsolute,    instructions.adc, memory.readAbsolute],
    [0x7D, "ADC",  ModeAbsoluteX,   instructions.adc, memory.readAbsoluteXShortenCycle],
    [0x79, "ADC",  ModeAbsoluteY,   instructions.adc, memory.readAbsoluteYShortenCycle],
    [0x61, "ADC",  ModeIndirectX,   instructions.adc, memory.readIndirectX],
    [0x71, "ADC",  ModeIndirectY,   instructions.adc, memory.readIndirectYShortenCycle],

    [0x29, "AND",  ModeImmediate,   instructions.and, memory.readImmediate],
    [0x25, "AND",  ModeZeroPage,    instructions.and, memory.readZeroPage],
    [0x35, "AND",  ModeZeroPageX,   instructions.and, memory.readZeroPageX],
    [0x2D, "AND",  ModeAbsolute,    instructions.and, memory.readAbsolute],
    [0x3D, "AND",  ModeAbsoluteX,   instructions.and, memory.readAbsoluteXShortenCycle],
    [0x39, "AND",  ModeAbsoluteY,   instructions.and, memory.readAbsoluteYShortenCycle],
    [0x21, "AND",  ModeIndirectX,   instructions.and, memory.readIndirectX],
    [0x31, "AND",  ModeIndirectY,   instructions.and, memory.readIndirectYShortenCycle],

    [0x6B, "*ARR", ModeImmediate,   instructions.arr, memory.readImmediate],

    [0x0A, "ASL",  ModeAccumulator, instructions.aslA],
    [0x06, "ASL",  ModeZeroPage,    instructions.asl, memory.readZeroPage],
    [0x16, "ASL",  ModeZeroPageX,   instructions.asl, memory.readZeroPageX],
    [0x0E, "ASL",  ModeAbsolute,    instructions.asl, memory.readAbsolute],
    [0x1E, "ASL",  ModeAbsoluteX,   instructions.asl, memory.readAbsoluteX],

    [0x4B, "*ASR", ModeImmediate,   instructions.asr, memory.readImmediate],

    [0xAB, "*ATX", ModeImmediate,   instructions.atx, memory.readImmediate],

    [0xCB, "AXS",  ModeImmediate,   instructions.axs, memory.readImmediate],

    [0x24, "BIT",  ModeZeroPage,    instructions.bit, memory.readZeroPage],
    [0x2C, "BIT",  ModeAbsolute,    instructions.bit, memory.readAbsolute],

    [0x90, "BCC",  ModeRelative,    instructions.bcc, memory.readImmediate],
    [0xF0, "BEQ",  ModeRelative,    instructions.beq, memory.readImmediate],
    [0xD0, "BNE",  ModeRelative,    instructions.bne, memory.readImmediate],
    [0xB0, "BCS",  ModeRelative,    instructions.bcs, memory.readImmediate],
    [0x50, "BVC",  ModeRelative,    instructions.bvc, memory.readImmediate],
    [0x70, "BVS",  ModeRelative,    instructions.bvs, memory.readImmediate],
    [0x10, "BPL",  ModeRelative,    instructions.bpl, memory.readImmediate],
    [0x30, "BMI",  ModeRelative,    instructions.bmi, memory.readImmediate],

    [0x18, "CLC",  ModeImplied,     instructions.clc],
    [0xD8, "CLD",  ModeImplied,     instructions.cld],
    [0x58, "CLI",  ModeImplied,     instructions.cli],
    [0xB8, "CLV",  ModeImplied,     instructions.clv],

    [0xC9, "CMP",  ModeImmediate,   instructions.cmp, memory.readImmediate],
    [0xC5, "CMP",  ModeZeroPage,    instructions.cmp, memory.readZeroPage],
    [0xD5, "CMP",  ModeZeroPageX,   instructions.cmp, memory.readZeroPageX],
    [0xCD, "CMP",  ModeAbsolute,    instructions.cmp, memory.readAbsolute],
    [0xDD, "CMP",  ModeAbsoluteX,   instructions.cmp, memory.readAbsoluteXShortenCycle],
    [0xD9, "CMP",  ModeAbsoluteY,   instructions.cmp, memory.readAbsoluteYShortenCycle],
    [0xC1, "CMP",  ModeIndirectX,   instructions.cmp, memory.readIndirectX],
    [0xD1, "CMP",  ModeIndirectY,   instructions.cmp, memory.readIndirectYShortenCycle],

    [0xE0, "CPX",  ModeImmediate,   instructions.cpx, memory.readImmediate],
    [0xE4, "CPX",  ModeZeroPage,    instructions.cpx, memory.readZeroPage],
    [0xEC, "CPX",  ModeAbsolute,    instructions.cpx, memory.readAbsolute],

    [0xC0, "CPY",  ModeImmediate,   instructions.cpy, memory.readImmediate],
    [0xC4, "CPY",  ModeZeroPage,    instructions.cpy, memory.readZeroPage],
    [0xCC, "CPY",  ModeAbsolute,    instructions.cpy, memory.readAbsolute],

    [0xC7, "*DCP", ModeZeroPage,    instructions.dcp, memory.readZeroPage],
    [0xD7, "*DCP", ModeZeroPageX,   instructions.dcp, memory.readZeroPageX],
    [0xCF, "*DCP", ModeAbsolute,    instructions.dcp, memory.readAbsolute],
    [0xDF, "*DCP", ModeAbsoluteX,   instructions.dcp, memory.readAbsoluteX],
    [0xDB, "*DCP", ModeAbsoluteY,   instructions.dcp, memory.readAbsoluteY],
    [0xC3, "*DCP", ModeIndirectX,   instructions.dcp, memory.readIndirectX],
    [0xD3, "*DCP", ModeIndirectY,   instructions.dcp, memory.readIndirectY],

    [0xC6, "DEC",  ModeZeroPage,    instructions.dec, memory.readZeroPage],
    [0xD6, "DEC",  ModeZeroPageX,   instructions.dec, memory.readZeroPageX],
    [0xCE, "DEC",  ModeAbsolute,    instructions.dec, memory.readAbsolute],
    [0xDE, "DEC",  ModeAbsoluteX,   instructions.dec, memory.readAbsoluteX],

    [0x49, "EOR",  ModeImmediate,   instructions.eor, memory.readImmediate],
    [0x45, "EOR",  ModeZeroPage,    instructions.eor, memory.readZeroPage ],
    [0x55, "EOR",  ModeZeroPageX,   instructions.eor, memory.readZeroPageX],
    [0x4D, "EOR",  ModeAbsolute,    instructions.eor, memory.readAbsolute],
    [0x5D, "EOR",  ModeAbsoluteX,   instructions.eor, memory.readAbsoluteXShortenCycle],
    [0x59, "EOR",  ModeAbsoluteY,   instructions.eor, memory.readAbsoluteYShortenCycle],
    [0x41, "EOR",  ModeIndirectX,   instructions.eor, memory.readIndirectX],
    [0x51, "EOR",  ModeIndirectY,   instructions.eor, memory.readIndirectYShortenCycle],

    [0xE6, "INC",  ModeZeroPage,    instructions.inc, memory.readZeroPage],
    [0xF6, "INC",  ModeZeroPageX,   instructions.inc, memory.readZeroPageX],
    [0xEE, "INC",  ModeAbsolute,    instructions.inc, memory.readAbsolute],
    [0xFE, "INC",  ModeAbsoluteX,   instructions.inc, memory.readAbsoluteX],

    [0xE7, "*ISB", ModeZeroPage,    instructions.isb, memory.readZeroPage],
    [0xF7, "*ISB", ModeZeroPageX,   instructions.isb, memory.readZeroPageX],
    [0xEF, "*ISB", ModeAbsolute,    instructions.isb, memory.readAbsolute],
    [0xFF, "*ISB", ModeAbsoluteX,   instructions.isb, memory.readAbsoluteX],
    [0xFB, "*ISB", ModeAbsoluteY,   instructions.isb, memory.readAbsoluteY],
    [0xE3, "*ISB", ModeIndirectX,   instructions.isb, memory.readIndirectX],
    [0xF3, "*ISB", ModeIndirectY,   instructions.isb, memory.readIndirectY],

    [0x4C, "JMP",  ModeAbsolute,    instructions.jmp, memory.readAbsolute],
    [0x6C, "JMP",  ModeIndirect,    instructions.jmp, memory.readIndirect],

    [0xA7, "*LAX", ModeZeroPage,    instructions.lax, memory.readZeroPage],
    [0xB7, "*LAX", ModeZeroPageY,   instructions.lax, memory.readZeroPageY],
    [0xAF, "*LAX", ModeAbsolute,    instructions.lax, memory.readAbsolute],
    [0xBF, "*LAX", ModeAbsoluteY,   instructions.lax, memory.readAbsoluteYShortenCycle],
    [0xA3, "*LAX", ModeIndirectX,   instructions.lax, memory.readIndirectX],
    [0xB3, "*LAX", ModeIndirectY,   instructions.lax, memory.readIndirectYShortenCycle],

    [0xA9, "LDA",  ModeImmediate,   instructions.lda, memory.readImmediate],
    [0xA5, "LDA",  ModeZeroPage,    instructions.lda, memory.readZeroPage],
    [0xB5, "LDA",  ModeZeroPageX,   instructions.lda, memory.readZeroPageX],
    [0xAD, "LDA",  ModeAbsolute,    instructions.lda, memory.readAbsolute],
    [0xBD, "LDA",  ModeAbsoluteX,   instructions.lda, memory.readAbsoluteXShortenCycle],
    [0xB9, "LDA",  ModeAbsoluteY,   instructions.lda, memory.readAbsoluteYShortenCycle],
    [0xA1, "LDA",  ModeIndirectX,   instructions.lda, memory.readIndirectX],
    [0xB1, "LDA",  ModeIndirectY,   instructions.lda, memory.readIndirectYShortenCycle],

    [0xA2, "LDX",  ModeImmediate,   instructions.ldx, memory.readImmediate],
    [0xA6, "LDX",  ModeZeroPage,    instructions.ldx, memory.readZeroPage ],
    [0xB6, "LDX",  ModeZeroPageY,   instructions.ldx, memory.readZeroPageY],
    [0xAE, "LDX",  ModeAbsolute,    instructions.ldx, memory.readAbsolute],
    [0xBE, "LDX",  ModeAbsoluteY,   instructions.ldx, memory.readAbsoluteYShortenCycle],

    [0xA0, "LDY",  ModeImmediate,   instructions.ldy, memory.readImmediate],
    [0xA4, "LDY",  ModeZeroPage,    instructions.ldy, memory.readZeroPage],
    [0xB4, "LDY",  ModeZeroPageX,   instructions.ldy, memory.readZeroPageX],
    [0xAC, "LDY",  ModeAbsolute,    instructions.ldy, memory.readAbsolute],
    [0xBC, "LDY",  ModeAbsoluteX,   instructions.ldy, memory.readAbsoluteXShortenCycle],

    [0x4A, "LSR",  ModeAccumulator, instructions.lsrA],
    [0x46, "LSR",  ModeZeroPage,    instructions.lsr, memory.readZeroPage],
    [0x56, "LSR",  ModeZeroPageX,   instructions.lsr, memory.readZeroPageX],
    [0x4E, "LSR",  ModeAbsolute,    instructions.lsr, memory.readAbsolute],
    [0x5E, "LSR",  ModeAbsoluteX,   instructions.lsr, memory.readAbsoluteX],

    [0xEA, "NOP",  ModeImplied,     instructions.nop],
    [0x1A, "*NOP", ModeImplied,     instructions.nop],
    [0x3A, "*NOP", ModeImplied,     instructions.nop],
    [0x5A, "*NOP", ModeImplied,     instructions.nop],
    [0x7A, "*NOP", ModeImplied,     instructions.nop],
    [0xDA, "*NOP", ModeImplied,     instructions.nop],
    [0xFA, "*NOP", ModeImplied,     instructions.nop],
    [0x80, "*NOP", ModeImmediate,   instructions.unofficialNop, memory.readImmediate],
    [0x82, "*NOP", ModeImmediate,   instructions.unofficialNop, memory.readImmediate],
    [0x89, "*NOP", ModeImmediate,   instructions.unofficialNop, memory.readImmediate],
    [0xC2, "*NOP", ModeImmediate,   instructions.unofficialNop, memory.readImmediate],
    [0xE2, "*NOP", ModeImmediate,   instructions.unofficialNop, memory.readImmediate],
    [0x04, "*NOP", ModeZeroPage,    instructions.unofficialNop, memory.readZeroPage],
    [0x44, "*NOP", ModeZeroPage,    instructions.unofficialNop, memory.readZeroPage],
    [0x64, "*NOP", ModeZeroPage,    instructions.unofficialNop, memory.readZeroPage],
    [0x0C, "*NOP", ModeAbsolute,    instructions.unofficialNop, memory.readAbsolute],
    [0x14, "*NOP", ModeZeroPageX,   instructions.unofficialNop, memory.readZeroPageX],
    [0x34, "*NOP", ModeZeroPageX,   instructions.unofficialNop, memory.readZeroPageX],
    [0x54, "*NOP", ModeZeroPageX,   instructions.unofficialNop, memory.readZeroPageX],
    [0x74, "*NOP", ModeZeroPageX,   instructions.unofficialNop, memory.readZeroPageX],
    [0xD4, "*NOP", ModeZeroPageX,   instructions.unofficialNop, memory.readZeroPageX],
    [0xF4, "*NOP", ModeZeroPageX,   instructions.unofficialNop, memory.readZeroPageX],

    [0x1C, "*NOP",  ModeAbsoluteX,  instructions.unofficialNop, memory.readAbsoluteXShortenCycle],
    [0x3C, "*NOP",  ModeAbsoluteX,  instructions.unofficialNop, memory.readAbsoluteXShortenCycle],
    [0x5C, "*NOP",  ModeAbsoluteX,  instructions.unofficialNop, memory.readAbsoluteXShortenCycle],
    [0x7C, "*NOP",  ModeAbsoluteX,  instructions.unofficialNop, memory.readAbsoluteXShortenCycle],
    [0xDC, "*NOP",  ModeAbsoluteX,  instructions.unofficialNop, memory.readAbsoluteXShortenCycle],
    [0xFC, "*NOP",  ModeAbsoluteX,  instructions.unofficialNop, memory.readAbsoluteXShortenCycle],

    [0x09, "ORA",  ModeImmediate,   instructions.ora, memory.readImmediate],
    [0x05, "ORA",  ModeZeroPage,    instructions.ora, memory.readZeroPage],
    [0x15, "ORA",  ModeZeroPageX,   instructions.ora, memory.readZeroPageX],
    [0x0D, "ORA",  ModeAbsolute,    instructions.ora, memory.readAbsolute],
    [0x1D, "ORA",  ModeAbsoluteX,   instructions.ora, memory.readAbsoluteXShortenCycle],
    [0x19, "ORA",  ModeAbsoluteY,   instructions.ora, memory.readAbsoluteYShortenCycle],
    [0x01, "ORA",  ModeIndirectX,   instructions.ora, memory.readIndirectX],
    [0x11, "ORA",  ModeIndirectY,   instructions.ora, memory.readIndirectYShortenCycle],

    [0xC8, "INY",  ModeImplied,     instructions.iny],
    [0x88, "DEY",  ModeImplied,     instructions.dey],
    [0xA8, "TAY",  ModeImplied,     instructions.tay],

    [0xE8, "INX",  ModeImplied,     instructions.inx],
    [0xCA, "DEX",  ModeImplied,     instructions.dex],

    [0xAA, "TAX",  ModeImplied,     instructions.tax],
    [0xBA, "TSX",  ModeImplied,     instructions.tsx],
    [0x8A, "TXA",  ModeImplied,     instructions.txa],
    [0x98, "TYA",  ModeImplied,     instructions.tya],
    [0x9A, "TXS",  ModeImplied,     instructions.txs],

    [0x27, "*RLA", ModeZeroPage,    instructions.rla, memory.readZeroPage],
    [0x37, "*RLA", ModeZeroPageX,   instructions.rla, memory.readZeroPageX],
    [0x2F, "*RLA", ModeAbsolute,    instructions.rla, memory.readAbsolute],
    [0x3F, "*RLA", ModeAbsoluteX,   instructions.rla, memory.readAbsoluteX],
    [0x3B, "*RLA", ModeAbsoluteY,   instructions.rla, memory.readAbsoluteY],
    [0x23, "*RLA", ModeIndirectX,   instructions.rla, memory.readIndirectX],
    [0x33, "*RLA", ModeIndirectY,   instructions.rla, memory.readIndirectY],

    [0x2A, "ROL",  ModeAccumulator, instructions.rolA],
    [0x26, "ROL",  ModeZeroPage,    instructions.rol, memory.readZeroPage],
    [0x36, "ROL",  ModeZeroPageX,   instructions.rol, memory.readZeroPageX],
    [0x2E, "ROL",  ModeAbsolute,    instructions.rol, memory.readAbsolute],
    [0x3E, "ROL",  ModeAbsoluteX,   instructions.rol, memory.readAbsoluteX],

    [0x6A, "ROR",  ModeAccumulator, instructions.rorA],
    [0x66, "ROR",  ModeZeroPage,    instructions.ror, memory.readZeroPage],
    [0x76, "ROR",  ModeZeroPageX,   instructions.ror, memory.readZeroPageX],
    [0x6E, "ROR",  ModeAbsolute,    instructions.ror, memory.readAbsolute],
    [0x7E, "ROR",  ModeAbsoluteX,   instructions.ror, memory.readAbsoluteX],

    [0x67, "*RRA", ModeZeroPage,    instructions.rra, memory.readZeroPage],
    [0x77, "*RRA", ModeZeroPageX,   instructions.rra, memory.readZeroPageX],
    [0x6F, "*RRA", ModeAbsolute,    instructions.rra, memory.readAbsolute],
    [0x7F, "*RRA", ModeAbsoluteX,   instructions.rra, memory.readAbsoluteX],
    [0x7B, "*RRA", ModeAbsoluteY,   instructions.rra, memory.readAbsoluteY],
    [0x63, "*RRA", ModeIndirectX,   instructions.rra, memory.readIndirectX],
    [0x73, "*RRA", ModeIndirectY,   instructions.rra, memory.readIndirectY],

    [0x87, "*SAX", ModeZeroPage,    instructions.sax, memory.readZeroPage],
    [0x97, "*SAX", ModeZeroPageY,   instructions.sax, memory.readZeroPageY],
    [0x83, "*SAX", ModeIndirectX,   instructions.sax, memory.readIndirectX],
    [0x8F, "*SAX", ModeAbsolute,    instructions.sax, memory.readAbsolute],

    [0xE9, "SBC", ModeImmediate,    instructions.sbc, memory.readImmediate],
    [0xEB, "*SBC", ModeImmediate,   instructions.sbc, memory.readImmediate],
    [0xE5, "SBC", ModeZeroPage,     instructions.sbc, memory.readZeroPage],
    [0xF5, "SBC", ModeZeroPageX,    instructions.sbc, memory.readZeroPageX],
    [0xED, "SBC", ModeAbsolute,     instructions.sbc, memory.readAbsolute],
    [0xFD, "SBC", ModeAbsoluteX,    instructions.sbc, memory.readAbsoluteXShortenCycle],
    [0xF9, "SBC", ModeAbsoluteY,    instructions.sbc, memory.readAbsoluteYShortenCycle],
    [0xE1, "SBC", ModeIndirectX,    instructions.sbc, memory.readIndirectX],
    [0xF1, "SBC", ModeIndirectY,    instructions.sbc, memory.readIndirectYShortenCycle],

    [0x38, "SEC",  ModeImplied,     instructions.sec],
    [0x78, "SEI",  ModeImplied,     instructions.sei],
    [0xF8, "SED",  ModeImplied,     instructions.sed],

    [0x07, "*SLO", ModeZeroPage,    instructions.slo, memory.readZeroPage],
    [0x17, "*SLO", ModeZeroPageX,   instructions.slo, memory.readZeroPageX],
    [0x0F, "*SLO", ModeAbsolute,    instructions.slo, memory.readAbsolute],
    [0x1F, "*SLO", ModeAbsoluteX,   instructions.slo, memory.readAbsoluteX],
    [0x1B, "*SLO", ModeAbsoluteY,   instructions.slo, memory.readAbsoluteY],
    [0x03, "*SLO", ModeIndirectX,   instructions.slo, memory.readIndirectX],
    [0x13, "*SLO", ModeIndirectY,   instructions.slo, memory.readIndirectY],

    [0x47, "*SRE", ModeZeroPage,    instructions.sre, memory.readZeroPage],
    [0x57, "*SRE", ModeZeroPageX,   instructions.sre, memory.readZeroPageX],
    [0x4F, "*SRE", ModeAbsolute,    instructions.sre, memory.readAbsolute],
    [0x5F, "*SRE", ModeAbsoluteX,   instructions.sre, memory.readAbsoluteX],
    [0x5B, "*SRE", ModeAbsoluteY,   instructions.sre, memory.readAbsoluteY],
    [0x43, "*SRE", ModeIndirectX,   instructions.sre, memory.readIndirectX],
    [0x53, "*SRE", ModeIndirectY,   instructions.sre, memory.readIndirectY],

    [0x85, "STA",  ModeZeroPage,    instructions.sta, memory.readZeroPage],
    [0x95, "STA",  ModeZeroPageX,   instructions.sta, memory.readZeroPageX],
    [0x8D, "STA",  ModeAbsolute,    instructions.sta, memory.readAbsolute],
    [0x9D, "STA",  ModeAbsoluteX,   instructions.sta, memory.readAbsoluteX],
    [0x99, "STA",  ModeAbsoluteY,   instructions.sta, memory.readAbsoluteY],
    [0x81, "STA",  ModeIndirectX,   instructions.sta, memory.readIndirectX],
    [0x91, "STA",  ModeIndirectY,   instructions.sta, memory.readIndirectY],

    [0x86, "STX",  ModeZeroPage,    instructions.stx, memory.readZeroPage],
    [0x96, "STX",  ModeZeroPageY,   instructions.stx, memory.readZeroPageY],
    [0x8E, "STX",  ModeAbsolute,    instructions.stx, memory.readAbsolute],

    [0x84, "STY",  ModeZeroPage,    instructions.sty, memory.readZeroPage],
    [0x94, "STY",  ModeZeroPageX,   instructions.sty, memory.readZeroPageX],
    [0x8C, "STY",  ModeAbsolute,    instructions.sty, memory.readAbsolute],

    [0x00, "BRK",  ModeImplied,     instructions.brk],
    [0x08, "PHP",  ModeImplied,     instructions.php],
    [0x48, "PHA",  ModeImplied,     instructions.pha],
    [0x28, "PLP",  ModeImplied,     instructions.plp],
    [0x40, "RTI",  ModeImplied,     instructions.rti],
    [0x68, "PLA",  ModeImplied,     instructions.pla],
    [0x20, "JSR",  ModeAbsolute,    instructions.jsr],
    [0x60, "RTS",  ModeImplied,     instructions.rts],

    [0x9E, "*SXA", ModeAbsoluteY,   instructions.sxa],
    [0x9C, "*SYA", ModeAbsoluteX,   instructions.sya]
];

export const opcodeMetadata = {};
export const opcodeTable = new Array(256);

_.forEach(opcodes, ([opcode, name, mode, implementation, readFunction]) => {
    opcodeMetadata[opcode] = { name, mode };
    if (readFunction != null) {
        opcodeTable[opcode] = e => implementation(e, readFunction(e));
    } else {
        opcodeTable[opcode] = implementation;
    }
})
