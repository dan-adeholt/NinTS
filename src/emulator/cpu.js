
import _ from 'lodash';
import * as instructions from './instructions';
import * as memory from './memory';
export const AddressModeAbsolute = 1;
export const AddressModeAbsoluteX = 2;
export const AddressModeAbsoluteY = 3;
export const AddressModeAccumulator = 4;
export const AddressModeImmediate = 5;
export const AddressModeImplied = 6;
export const AddressModeIndirect = 7;
export const AddressModeIndirectX = 8;
export const AddressModeIndirectY = 9;
export const AddressModeRelative = 10;
export const AddressModeZeroPage = 11;
export const AddressModeZeroPageX = 12;
export const AddressModeZeroPageY = 13;

const opcodes = [
    [0x0B, "*AAC", AddressModeImmediate, instructions.aac, memory.readImmediate],
    [0x2B, "*AAC", AddressModeImmediate, instructions.aac, memory.readImmediate],

    [0x69, "ADC",  AddressModeImmediate, instructions.adc, memory.readImmediate],
    [0x65, "ADC",  AddressModeZeroPage, instructions.adc, memory.readZeroPage],
    [0x75, "ADC",  AddressModeZeroPageX, instructions.adc, memory.readZeroPageX],
    [0x6D, "ADC",  AddressModeAbsolute, instructions.adc, memory.readAbsolute],
    [0x7D, "ADC",  AddressModeAbsoluteX, instructions.adc, memory.readAbsoluteXShortenCycle],
    [0x79, "ADC",  AddressModeAbsoluteY, instructions.adc, memory.readAbsoluteYShortenCycle],
    [0x61, "ADC",  AddressModeIndirectX, instructions.adc, memory.readIndirectX],
    [0x71, "ADC",  AddressModeIndirectY, instructions.adc, memory.readIndirectYShortenCycle],

    [0x29, "AND",  AddressModeImmediate, instructions.and, memory.readImmediate],
    [0x25, "AND",  AddressModeZeroPage, instructions.and, memory.readZeroPage],
    [0x35, "AND",  AddressModeZeroPageX, instructions.and, memory.readZeroPageX],
    [0x2D, "AND",  AddressModeAbsolute, instructions.and, memory.readAbsolute],
    [0x3D, "AND",  AddressModeAbsoluteX, instructions.and, memory.readAbsoluteXShortenCycle],
    [0x39, "AND",  AddressModeAbsoluteY, instructions.and, memory.readAbsoluteYShortenCycle],
    [0x21, "AND",  AddressModeIndirectX, instructions.and, memory.readIndirectX],
    [0x31, "AND",  AddressModeIndirectY, instructions.and, memory.readIndirectYShortenCycle],

    [0x6B, "*ARR", AddressModeImmediate, instructions.arr, memory.readImmediate],

    [0x0A, "ASL",  AddressModeAccumulator, instructions.aslA],
    [0x06, "ASL",  AddressModeZeroPage, instructions.asl, memory.readZeroPage],
    [0x16, "ASL",  AddressModeZeroPageX, instructions.asl, memory.readZeroPageX],
    [0x0E, "ASL",  AddressModeAbsolute, instructions.asl, memory.readAbsolute],
    [0x1E, "ASL",  AddressModeAbsoluteX, instructions.asl, memory.readAbsoluteX],

    [0x4B, "*ASR", AddressModeImmediate, instructions.asr, memory.readImmediate],

    [0xAB, "*ATX", AddressModeImmediate, instructions.atx, memory.readImmediate],

    [0xCB, "AXS",  AddressModeImmediate, instructions.axs, memory.readImmediate],

    [0x24, "BIT",  AddressModeZeroPage, instructions.bit, memory.readZeroPage],
    [0x2C, "BIT",  AddressModeAbsolute, instructions.bit, memory.readAbsolute],

    [0x90, "BCC",  AddressModeRelative, instructions.bcc, memory.readImmediate],
    [0xF0, "BEQ",  AddressModeRelative, instructions.beq, memory.readImmediate],
    [0xD0, "BNE",  AddressModeRelative, instructions.bne, memory.readImmediate],
    [0xB0, "BCS",  AddressModeRelative, instructions.bcs, memory.readImmediate],
    [0x50, "BVC",  AddressModeRelative, instructions.bvc, memory.readImmediate],
    [0x70, "BVS",  AddressModeRelative, instructions.bvs, memory.readImmediate],
    [0x10, "BPL",  AddressModeRelative, instructions.bpl, memory.readImmediate],
    [0x30, "BMI",  AddressModeRelative, instructions.bmi, memory.readImmediate],

    [0x18, "CLC",  AddressModeImplied, instructions.clc],
    [0xD8, "CLD",  AddressModeImplied, instructions.cld],
    [0x58, "CLI",  AddressModeImplied, instructions.cli],
    [0xB8, "CLV",  AddressModeImplied, instructions.clv],

    [0xC9, "CMP",  AddressModeImmediate, instructions.cmp, memory.readImmediate],
    [0xC5, "CMP",  AddressModeZeroPage, instructions.cmp, memory.readZeroPage],
    [0xD5, "CMP",  AddressModeZeroPageX, instructions.cmp, memory.readZeroPageX],
    [0xCD, "CMP",  AddressModeAbsolute, instructions.cmp, memory.readAbsolute],
    [0xDD, "CMP",  AddressModeAbsoluteX, instructions.cmp, memory.readAbsoluteXShortenCycle],
    [0xD9, "CMP",  AddressModeAbsoluteY, instructions.cmp, memory.readAbsoluteYShortenCycle],
    [0xC1, "CMP",  AddressModeIndirectX, instructions.cmp, memory.readIndirectX],
    [0xD1, "CMP",  AddressModeIndirectY, instructions.cmp, memory.readIndirectYShortenCycle],

    [0xE0, "CPX",  AddressModeImmediate, instructions.cpx, memory.readImmediate],
    [0xE4, "CPX",  AddressModeZeroPage, instructions.cpx, memory.readZeroPage],
    [0xEC, "CPX",  AddressModeAbsolute, instructions.cpx, memory.readAbsolute],

    [0xC0, "CPY",  AddressModeImmediate, instructions.cpy, memory.readImmediate],
    [0xC4, "CPY",  AddressModeZeroPage, instructions.cpy, memory.readZeroPage],
    [0xCC, "CPY",  AddressModeAbsolute, instructions.cpy, memory.readAbsolute],

    [0xC7, "*DCP", AddressModeZeroPage, instructions.dcp, memory.readZeroPage],
    [0xD7, "*DCP", AddressModeZeroPageX, instructions.dcp, memory.readZeroPageX],
    [0xCF, "*DCP", AddressModeAbsolute, instructions.dcp, memory.readAbsolute],
    [0xDF, "*DCP", AddressModeAbsoluteX, instructions.dcp, memory.readAbsoluteX],
    [0xDB, "*DCP", AddressModeAbsoluteY, instructions.dcp, memory.readAbsoluteY],
    [0xC3, "*DCP", AddressModeIndirectX, instructions.dcp, memory.readIndirectX],
    [0xD3, "*DCP", AddressModeIndirectY, instructions.dcp, memory.readIndirectY],

    [0xC6, "DEC",  AddressModeZeroPage, instructions.dec, memory.readZeroPage],
    [0xD6, "DEC",  AddressModeZeroPageX, instructions.dec, memory.readZeroPageX],
    [0xCE, "DEC",  AddressModeAbsolute, instructions.dec, memory.readAbsolute],
    [0xDE, "DEC",  AddressModeAbsoluteX, instructions.dec, memory.readAbsoluteX],

    [0x49, "EOR",  AddressModeImmediate, instructions.eor, memory.readImmediate],
    [0x45, "EOR",  AddressModeZeroPage, instructions.eor, memory.readZeroPage ],
    [0x55, "EOR",  AddressModeZeroPageX, instructions.eor, memory.readZeroPageX],
    [0x4D, "EOR",  AddressModeAbsolute, instructions.eor, memory.readAbsolute],
    [0x5D, "EOR",  AddressModeAbsoluteX, instructions.eor, memory.readAbsoluteXShortenCycle],
    [0x59, "EOR",  AddressModeAbsoluteY, instructions.eor, memory.readAbsoluteYShortenCycle],
    [0x41, "EOR",  AddressModeIndirectX, instructions.eor, memory.readIndirectX],
    [0x51, "EOR",  AddressModeIndirectY, instructions.eor, memory.readIndirectYShortenCycle],

    [0xE6, "INC",  AddressModeZeroPage, instructions.inc, memory.readZeroPage],
    [0xF6, "INC",  AddressModeZeroPageX, instructions.inc, memory.readZeroPageX],
    [0xEE, "INC",  AddressModeAbsolute, instructions.inc, memory.readAbsolute],
    [0xFE, "INC",  AddressModeAbsoluteX, instructions.inc, memory.readAbsoluteX],

    [0xE7, "*ISB", AddressModeZeroPage, instructions.isb, memory.readZeroPage],
    [0xF7, "*ISB", AddressModeZeroPageX, instructions.isb, memory.readZeroPageX],
    [0xEF, "*ISB", AddressModeAbsolute, instructions.isb, memory.readAbsolute],
    [0xFF, "*ISB", AddressModeAbsoluteX, instructions.isb, memory.readAbsoluteX],
    [0xFB, "*ISB", AddressModeAbsoluteY, instructions.isb, memory.readAbsoluteY],
    [0xE3, "*ISB", AddressModeIndirectX, instructions.isb, memory.readIndirectX],
    [0xF3, "*ISB", AddressModeIndirectY, instructions.isb, memory.readIndirectY],

    [0x4C, "JMP",  AddressModeAbsolute, instructions.jmpAbsolute, memory.readAbsolute],
    [0x6C, "JMP",  AddressModeIndirect, instructions.jmpIndirect, memory.readAbsolute],

    [0xA7, "*LAX", AddressModeZeroPage, instructions.lax, memory.readZeroPage],
    [0xB7, "*LAX", AddressModeZeroPageY, instructions.lax, memory.readZeroPageY],
    [0xAF, "*LAX", AddressModeAbsolute, instructions.lax, memory.readAbsolute],
    [0xBF, "*LAX", AddressModeAbsoluteY, instructions.lax, memory.readAbsoluteYShortenCycle],
    [0xA3, "*LAX", AddressModeIndirectX, instructions.lax, memory.readIndirectX],
    [0xB3, "*LAX", AddressModeIndirectY, instructions.lax, memory.readIndirectYShortenCycle],

    [0xA9, "LDA",  AddressModeImmediate, instructions.lda, memory.readImmediate],
    [0xA5, "LDA",  AddressModeZeroPage, instructions.lda, memory.readZeroPage],
    [0xB5, "LDA",  AddressModeZeroPageX, instructions.lda, memory.readZeroPageX],
    [0xAD, "LDA",  AddressModeAbsolute, instructions.lda, memory.readAbsolute],
    [0xBD, "LDA",  AddressModeAbsoluteX, instructions.lda, memory.readAbsoluteXShortenCycle],
    [0xB9, "LDA",  AddressModeAbsoluteY, instructions.lda, memory.readAbsoluteYShortenCycle],
    [0xA1, "LDA",  AddressModeIndirectX, instructions.lda, memory.readIndirectX],
    [0xB1, "LDA",  AddressModeIndirectY, instructions.lda, memory.readIndirectYShortenCycle],

    [0xA2, "LDX",  AddressModeImmediate, instructions.ldx, memory.readImmediate],
    [0xA6, "LDX",  AddressModeZeroPage, instructions.ldx, memory.readZeroPage ],
    [0xB6, "LDX",  AddressModeZeroPageY, instructions.ldx, memory.readZeroPageY],
    [0xAE, "LDX",  AddressModeAbsolute, instructions.ldx, memory.readAbsolute],
    [0xBE, "LDX",  AddressModeAbsoluteY, instructions.ldx, memory.readAbsoluteYShortenCycle],

    [0xA0, "LDY",  AddressModeImmediate, instructions.ldy, memory.readImmediate],
    [0xA4, "LDY",  AddressModeZeroPage, instructions.ldy, memory.readZeroPage],
    [0xB4, "LDY",  AddressModeZeroPageX, instructions.ldy, memory.readZeroPageX],
    [0xAC, "LDY",  AddressModeAbsolute, instructions.ldy, memory.readAbsolute],
    [0xBC, "LDY",  AddressModeAbsoluteX, instructions.ldy, memory.readAbsoluteXShortenCycle],

    [0x4A, "LSR",  AddressModeAccumulator, instructions.lsrA],
    [0x46, "LSR",  AddressModeZeroPage, instructions.lsr, memory.readZeroPage],
    [0x56, "LSR",  AddressModeZeroPageX, instructions.lsr, memory.readZeroPageX],
    [0x4E, "LSR",  AddressModeAbsolute, instructions.lsr, memory.readAbsolute],
    [0x5E, "LSR",  AddressModeAbsoluteX, instructions.lsr, memory.readAbsoluteX],

    [0xEA, "NOP",  AddressModeImplied, instructions.nop],
    [0x1A, "*NOP", AddressModeImplied, instructions.nop],
    [0x3A, "*NOP", AddressModeImplied, instructions.nop],
    [0x5A, "*NOP", AddressModeImplied, instructions.nop],
    [0x7A, "*NOP", AddressModeImplied, instructions.nop],
    [0xDA, "*NOP", AddressModeImplied, instructions.nop],
    [0xFA, "*NOP", AddressModeImplied, instructions.nop],
    [0x80, "*NOP", AddressModeImmediate, instructions.unofficialNop, memory.readImmediate],
    [0x82, "*NOP", AddressModeImmediate, instructions.unofficialNop, memory.readImmediate],
    [0x89, "*NOP", AddressModeImmediate, instructions.unofficialNop, memory.readImmediate],
    [0xC2, "*NOP", AddressModeImmediate, instructions.unofficialNop, memory.readImmediate],
    [0xE2, "*NOP", AddressModeImmediate, instructions.unofficialNop, memory.readImmediate],
    [0x04, "*NOP", AddressModeZeroPage, instructions.unofficialNop, memory.readZeroPage],
    [0x44, "*NOP", AddressModeZeroPage, instructions.unofficialNop, memory.readZeroPage],
    [0x64, "*NOP", AddressModeZeroPage, instructions.unofficialNop, memory.readZeroPage],
    [0x0C, "*NOP", AddressModeAbsolute, instructions.unofficialNop, memory.readAbsolute],
    [0x14, "*NOP", AddressModeZeroPageX, instructions.unofficialNop, memory.readZeroPageX],
    [0x34, "*NOP", AddressModeZeroPageX, instructions.unofficialNop, memory.readZeroPageX],
    [0x54, "*NOP", AddressModeZeroPageX, instructions.unofficialNop, memory.readZeroPageX],
    [0x74, "*NOP", AddressModeZeroPageX, instructions.unofficialNop, memory.readZeroPageX],
    [0xD4, "*NOP", AddressModeZeroPageX, instructions.unofficialNop, memory.readZeroPageX],
    [0xF4, "*NOP", AddressModeZeroPageX, instructions.unofficialNop, memory.readZeroPageX],

    [0x1C, "*NOP",  AddressModeAbsoluteX, instructions.unofficialNop, memory.readAbsoluteXShortenCycle],
    [0x3C, "*NOP",  AddressModeAbsoluteX, instructions.unofficialNop, memory.readAbsoluteXShortenCycle],
    [0x5C, "*NOP",  AddressModeAbsoluteX, instructions.unofficialNop, memory.readAbsoluteXShortenCycle],
    [0x7C, "*NOP",  AddressModeAbsoluteX, instructions.unofficialNop, memory.readAbsoluteXShortenCycle],
    [0xDC, "*NOP",  AddressModeAbsoluteX, instructions.unofficialNop, memory.readAbsoluteXShortenCycle],
    [0xFC, "*NOP",  AddressModeAbsoluteX, instructions.unofficialNop, memory.readAbsoluteXShortenCycle],

    [0x09, "ORA",  AddressModeImmediate, instructions.ora, memory.readImmediate],
    [0x05, "ORA",  AddressModeZeroPage, instructions.ora, memory.readZeroPage],
    [0x15, "ORA",  AddressModeZeroPageX, instructions.ora, memory.readZeroPageX],
    [0x0D, "ORA",  AddressModeAbsolute, instructions.ora, memory.readAbsolute],
    [0x1D, "ORA",  AddressModeAbsoluteX, instructions.ora, memory.readAbsoluteXShortenCycle],
    [0x19, "ORA",  AddressModeAbsoluteY, instructions.ora, memory.readAbsoluteYShortenCycle],
    [0x01, "ORA",  AddressModeIndirectX, instructions.ora, memory.readIndirectX],
    [0x11, "ORA",  AddressModeIndirectY, instructions.ora, memory.readIndirectYShortenCycle],

    [0xC8, "INY",  AddressModeImplied, instructions.iny],
    [0x88, "DEY",  AddressModeImplied, instructions.dey],
    [0xA8, "TAY",  AddressModeImplied, instructions.tay],

    [0xE8, "INX",  AddressModeImplied, instructions.inx],
    [0xCA, "DEX",  AddressModeImplied, instructions.dex],

    [0xAA, "TAX",  AddressModeImplied, instructions.tax],
    [0xBA, "TSX",  AddressModeImplied, instructions.tsx],
    [0x8A, "TXA",  AddressModeImplied, instructions.txa],
    [0x98, "TYA",  AddressModeImplied, instructions.tya],
    [0x9A, "TXS",  AddressModeImplied, instructions.txs],

    [0x27, "*RLA", AddressModeZeroPage, instructions.rla, memory.readZeroPage],
    [0x37, "*RLA", AddressModeZeroPageX, instructions.rla, memory.readZeroPageX],
    [0x2F, "*RLA", AddressModeAbsolute, instructions.rla, memory.readAbsolute],
    [0x3F, "*RLA", AddressModeAbsoluteX, instructions.rla, memory.readAbsoluteX],
    [0x3B, "*RLA", AddressModeAbsoluteY, instructions.rla, memory.readAbsoluteY],
    [0x23, "*RLA", AddressModeIndirectX, instructions.rla, memory.readIndirectX],
    [0x33, "*RLA", AddressModeIndirectY, instructions.rla, memory.readIndirectY],

    [0x2A, "ROL",  AddressModeAccumulator, instructions.rolA],
    [0x26, "ROL",  AddressModeZeroPage, instructions.rol, memory.readZeroPage],
    [0x36, "ROL",  AddressModeZeroPageX, instructions.rol, memory.readZeroPageX],
    [0x2E, "ROL",  AddressModeAbsolute, instructions.rol, memory.readAbsolute],
    [0x3E, "ROL",  AddressModeAbsoluteX, instructions.rol, memory.readAbsoluteX],

    [0x6A, "ROR",  AddressModeAccumulator, instructions.rorA],
    [0x66, "ROR",  AddressModeZeroPage, instructions.ror, memory.readZeroPage],
    [0x76, "ROR",  AddressModeZeroPageX, instructions.ror, memory.readZeroPageX],
    [0x6E, "ROR",  AddressModeAbsolute, instructions.ror, memory.readAbsolute],
    [0x7E, "ROR",  AddressModeAbsoluteX, instructions.ror, memory.readAbsoluteX],

    [0x67, "*RRA", AddressModeZeroPage, instructions.rra, memory.readZeroPage],
    [0x77, "*RRA", AddressModeZeroPageX, instructions.rra, memory.readZeroPageX],
    [0x6F, "*RRA", AddressModeAbsolute, instructions.rra, memory.readAbsolute],
    [0x7F, "*RRA", AddressModeAbsoluteX, instructions.rra, memory.readAbsoluteX],
    [0x7B, "*RRA", AddressModeAbsoluteY, instructions.rra, memory.readAbsoluteY],
    [0x63, "*RRA", AddressModeIndirectX, instructions.rra, memory.readIndirectX],
    [0x73, "*RRA", AddressModeIndirectY, instructions.rra, memory.readIndirectY],

    [0x87, "*SAX", AddressModeZeroPage, instructions.sax, memory.readZeroPage],
    [0x97, "*SAX", AddressModeZeroPageY, instructions.sax, memory.readZeroPageY],
    [0x83, "*SAX", AddressModeIndirectX, instructions.sax, memory.readIndirectX],
    [0x8F, "*SAX", AddressModeAbsolute, instructions.sax, memory.readAbsolute],

    [0xE9, "SBC", AddressModeImmediate, instructions.sbc, memory.readImmediate],
    [0xEB, "*SBC", AddressModeImmediate, instructions.sbc, memory.readImmediate],
    [0xE5, "SBC", AddressModeZeroPage, instructions.sbc, memory.readZeroPage],
    [0xF5, "SBC", AddressModeZeroPageX, instructions.sbc, memory.readZeroPageX],
    [0xED, "SBC", AddressModeAbsolute, instructions.sbc, memory.readAbsolute],
    [0xFD, "SBC", AddressModeAbsoluteX, instructions.sbc, memory.readAbsoluteXShortenCycle],
    [0xF9, "SBC", AddressModeAbsoluteY, instructions.sbc, memory.readAbsoluteYShortenCycle],
    [0xE1, "SBC", AddressModeIndirectX, instructions.sbc, memory.readIndirectX],
    [0xF1, "SBC", AddressModeIndirectY, instructions.sbc, memory.readIndirectYShortenCycle],

    [0x38, "SEC",  AddressModeImplied, instructions.sec],
    [0x78, "SEI",  AddressModeImplied, instructions.sei],
    [0xF8, "SED",  AddressModeImplied, instructions.sed],

    [0x07, "*SLO", AddressModeZeroPage, instructions.slo, memory.readZeroPage],
    [0x17, "*SLO", AddressModeZeroPageX, instructions.slo, memory.readZeroPageX],
    [0x0F, "*SLO", AddressModeAbsolute, instructions.slo, memory.readAbsolute],
    [0x1F, "*SLO", AddressModeAbsoluteX, instructions.slo, memory.readAbsoluteX],
    [0x1B, "*SLO", AddressModeAbsoluteY, instructions.slo, memory.readAbsoluteY],
    [0x03, "*SLO", AddressModeIndirectX, instructions.slo, memory.readIndirectX],
    [0x13, "*SLO", AddressModeIndirectY, instructions.slo, memory.readIndirectY],

    [0x47, "*SRE", AddressModeZeroPage, instructions.sre, memory.readZeroPage],
    [0x57, "*SRE", AddressModeZeroPageX, instructions.sre, memory.readZeroPageX],
    [0x4F, "*SRE", AddressModeAbsolute, instructions.sre, memory.readAbsolute],
    [0x5F, "*SRE", AddressModeAbsoluteX, instructions.sre, memory.readAbsoluteX],
    [0x5B, "*SRE", AddressModeAbsoluteY, instructions.sre, memory.readAbsoluteY],
    [0x43, "*SRE", AddressModeIndirectX, instructions.sre, memory.readIndirectX],
    [0x53, "*SRE", AddressModeIndirectY, instructions.sre, memory.readIndirectY],

    [0x85, "STA",  AddressModeZeroPage, instructions.sta, memory.readZeroPage],
    [0x95, "STA",  AddressModeZeroPageX, instructions.sta, memory.readZeroPageX],
    [0x8D, "STA",  AddressModeAbsolute, instructions.sta, memory.readAbsolute],
    [0x9D, "STA",  AddressModeAbsoluteX, instructions.sta, memory.readAbsoluteX],
    [0x99, "STA",  AddressModeAbsoluteY, instructions.sta, memory.readAbsoluteY],
    [0x81, "STA",  AddressModeIndirectX, instructions.sta, memory.readIndirectX],
    [0x91, "STA",  AddressModeIndirectY, instructions.sta, memory.readIndirectY],

    [0x86, "STX",  AddressModeZeroPage, instructions.stx, memory.readZeroPage],
    [0x96, "STX",  AddressModeZeroPageY, instructions.stx, memory.readZeroPageY],
    [0x8E, "STX",  AddressModeAbsolute, instructions.stx, memory.readAbsolute],

    [0x84, "STY",  AddressModeZeroPage, instructions.sty, memory.readZeroPage],
    [0x94, "STY",  AddressModeZeroPageX, instructions.sty, memory.readZeroPageX],
    [0x8C, "STY",  AddressModeAbsolute, instructions.sty, memory.readAbsolute],

    [0x00, "BRK",  AddressModeImplied, instructions.brk],
    [0x08, "PHP",  AddressModeImplied, instructions.php],
    [0x48, "PHA",  AddressModeImplied, instructions.pha],
    [0x28, "PLP",  AddressModeImplied, instructions.plp],
    [0x40, "RTI",  AddressModeImplied, instructions.rti],
    [0x68, "PLA",  AddressModeImplied, instructions.pla],
    [0x20, "JSR",  AddressModeAbsolute, instructions.jsr],
    [0x60, "RTS",  AddressModeImplied, instructions.rts],

    [0x9E, "*SXA", AddressModeAbsoluteY, instructions.sxa],
    [0x9C, "*SYA", AddressModeAbsoluteX, instructions.sya]
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
