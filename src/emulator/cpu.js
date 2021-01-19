import {
    readAddressAbsolute,
    readAddressAbsoluteX, readAddressAbsoluteXWithPageBoundaryCycle,
    readAddressAbsoluteY, readAddressAbsoluteYWithPageBoundaryCycle, readAddressImmediate,
    readAddressIndirectX,
    readAddressIndirectY, readAddressIndirectYWithPageBoundaryCycle,
    readAddressZeroPage,
    readAddressZeroPageX,
    readAddressZeroPageY
} from './instructions/utils';

import _ from 'lodash';
import * as ins from './instructions';

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
    [0x0B, "*AAC", AddressModeImmediate, ins.aac, readAddressImmediate],
    [0x2B, "*AAC", AddressModeImmediate, ins.aac, readAddressImmediate],

    [0x69, "ADC",  AddressModeImmediate, ins.adc, readAddressImmediate],
    [0x65, "ADC",  AddressModeZeroPage, ins.adc, readAddressZeroPage],
    [0x75, "ADC",  AddressModeZeroPageX, ins.adc, readAddressZeroPageX],
    [0x6D, "ADC",  AddressModeAbsolute, ins.adc, readAddressAbsolute],
    [0x7D, "ADC",  AddressModeAbsoluteX, ins.adc, readAddressAbsoluteXWithPageBoundaryCycle],
    [0x79, "ADC",  AddressModeAbsoluteY, ins.adc, readAddressAbsoluteYWithPageBoundaryCycle],
    [0x61, "ADC",  AddressModeIndirectX, ins.adc, readAddressIndirectX],
    [0x71, "ADC",  AddressModeIndirectY, ins.adc, readAddressIndirectYWithPageBoundaryCycle],

    [0x29, "AND",  AddressModeImmediate, ins.and, readAddressImmediate],
    [0x25, "AND",  AddressModeZeroPage, ins.and, readAddressZeroPage],
    [0x35, "AND",  AddressModeZeroPageX, ins.and, readAddressZeroPageX],
    [0x2D, "AND",  AddressModeAbsolute, ins.and, readAddressAbsolute],
    [0x3D, "AND",  AddressModeAbsoluteX, ins.and, readAddressAbsoluteXWithPageBoundaryCycle],
    [0x39, "AND",  AddressModeAbsoluteY, ins.and, readAddressAbsoluteYWithPageBoundaryCycle],
    [0x21, "AND",  AddressModeIndirectX, ins.and, readAddressIndirectX],
    [0x31, "AND",  AddressModeIndirectY, ins.and, readAddressIndirectYWithPageBoundaryCycle],

    [0x6B, "*ARR", AddressModeImmediate, ins.arr, readAddressImmediate],

    [0x0A, "ASL",  AddressModeAccumulator, ins.aslA],
    [0x06, "ASL",  AddressModeZeroPage, ins.asl, readAddressZeroPage],
    [0x16, "ASL",  AddressModeZeroPageX, ins.asl, readAddressZeroPageX],
    [0x0E, "ASL",  AddressModeAbsolute, ins.asl, readAddressAbsolute],
    [0x1E, "ASL",  AddressModeAbsoluteX, ins.asl, readAddressAbsoluteX],

    [0x4B, "*ASR", AddressModeImmediate, ins.asr, readAddressImmediate],

    [0xAB, "*ATX", AddressModeImmediate, ins.atx, readAddressImmediate],

    [0xCB, "AXS",  AddressModeImmediate, ins.axs, readAddressImmediate],

    [0x24, "BIT",  AddressModeZeroPage, ins.bit, readAddressZeroPage],
    [0x2C, "BIT",  AddressModeAbsolute, ins.bit, readAddressAbsolute],

    [0x90, "BCC",  AddressModeRelative, ins.bcc],
    [0xF0, "BEQ",  AddressModeRelative, ins.beq],
    [0xD0, "BNE",  AddressModeRelative, ins.bne],
    [0xB0, "BCS",  AddressModeRelative, ins.bcs],
    [0x50, "BVC",  AddressModeRelative, ins.bvc],
    [0x70, "BVS",  AddressModeRelative, ins.bvs],
    [0x10, "BPL",  AddressModeRelative, ins.bpl],
    [0x30, "BMI",  AddressModeRelative, ins.bmi],

    [0x18, "CLC",  AddressModeImplied, ins.clc],
    [0xD8, "CLD",  AddressModeImplied, ins.cld],
    [0x58, "CLI",  AddressModeImplied, ins.cli],
    [0xB8, "CLV",  AddressModeImplied, ins.clv],

    [0xC9, "CMP",  AddressModeImmediate, ins.cmp, readAddressImmediate],
    [0xC5, "CMP",  AddressModeZeroPage, ins.cmp, readAddressZeroPage],
    [0xD5, "CMP",  AddressModeZeroPageX, ins.cmp, readAddressZeroPageX],
    [0xCD, "CMP",  AddressModeAbsolute, ins.cmp, readAddressAbsolute],
    [0xDD, "CMP",  AddressModeAbsoluteX, ins.cmp, readAddressAbsoluteXWithPageBoundaryCycle],
    [0xD9, "CMP",  AddressModeAbsoluteY, ins.cmp, readAddressAbsoluteYWithPageBoundaryCycle],
    [0xC1, "CMP",  AddressModeIndirectX, ins.cmp, readAddressIndirectX],
    [0xD1, "CMP",  AddressModeIndirectY, ins.cmp, readAddressIndirectYWithPageBoundaryCycle],

    [0xE0, "CPX",  AddressModeImmediate, ins.cpx, readAddressImmediate],
    [0xE4, "CPX",  AddressModeZeroPage, ins.cpx, readAddressZeroPage],
    [0xEC, "CPX",  AddressModeAbsolute, ins.cpx, readAddressAbsolute],

    [0xC0, "CPY",  AddressModeImmediate, ins.cpy, readAddressImmediate],
    [0xC4, "CPY",  AddressModeZeroPage, ins.cpy, readAddressZeroPage],
    [0xCC, "CPY",  AddressModeAbsolute, ins.cpy, readAddressAbsolute],

    [0xC7, "*DCP", AddressModeZeroPage, ins.dcp, readAddressZeroPage],
    [0xD7, "*DCP", AddressModeZeroPageX, ins.dcp, readAddressZeroPageX],
    [0xCF, "*DCP", AddressModeAbsolute, ins.dcp, readAddressAbsolute],
    [0xDF, "*DCP", AddressModeAbsoluteX, ins.dcp, readAddressAbsoluteX],
    [0xDB, "*DCP", AddressModeAbsoluteY, ins.dcp, readAddressAbsoluteY],
    [0xC3, "*DCP", AddressModeIndirectX, ins.dcp, readAddressIndirectX],
    [0xD3, "*DCP", AddressModeIndirectY, ins.dcp, readAddressIndirectY],

    [0xC6, "DEC",  AddressModeZeroPage, ins.dec, readAddressZeroPage],
    [0xD6, "DEC",  AddressModeZeroPageX, ins.dec, readAddressZeroPageX],
    [0xCE, "DEC",  AddressModeAbsolute, ins.dec, readAddressAbsolute],
    [0xDE, "DEC",  AddressModeAbsoluteX, ins.dec, readAddressAbsoluteX],

    [0x49, "EOR",  AddressModeImmediate, ins.eor, readAddressImmediate],
    [0x45, "EOR",  AddressModeZeroPage, ins.eor, readAddressZeroPage ],
    [0x55, "EOR",  AddressModeZeroPageX, ins.eor, readAddressZeroPageX],
    [0x4D, "EOR",  AddressModeAbsolute, ins.eor, readAddressAbsolute],
    [0x5D, "EOR",  AddressModeAbsoluteX, ins.eor, readAddressAbsoluteXWithPageBoundaryCycle],
    [0x59, "EOR",  AddressModeAbsoluteY, ins.eor, readAddressAbsoluteYWithPageBoundaryCycle],
    [0x41, "EOR",  AddressModeIndirectX, ins.eor, readAddressIndirectX],
    [0x51, "EOR",  AddressModeIndirectY, ins.eor, readAddressIndirectYWithPageBoundaryCycle],

    [0xE6, "INC",  AddressModeZeroPage, ins.inc, readAddressZeroPage],
    [0xF6, "INC",  AddressModeZeroPageX, ins.inc, readAddressZeroPageX],
    [0xEE, "INC",  AddressModeAbsolute, ins.inc, readAddressAbsolute],
    [0xFE, "INC",  AddressModeAbsoluteX, ins.inc, readAddressAbsoluteX],

    [0xE7, "*ISB", AddressModeZeroPage, ins.isb, readAddressZeroPage],
    [0xF7, "*ISB", AddressModeZeroPageX, ins.isb, readAddressZeroPageX],
    [0xEF, "*ISB", AddressModeAbsolute, ins.isb, readAddressAbsolute],
    [0xFF, "*ISB", AddressModeAbsoluteX, ins.isb, readAddressAbsoluteX],
    [0xFB, "*ISB", AddressModeAbsoluteY, ins.isb, readAddressAbsoluteY],
    [0xE3, "*ISB", AddressModeIndirectX, ins.isb, readAddressIndirectX],
    [0xF3, "*ISB", AddressModeIndirectY, ins.isb, readAddressIndirectY],

    [0x4C, "JMP",  AddressModeAbsolute, ins.jmpAbsolute],
    [0x6C, "JMP",  AddressModeIndirect, ins.jmpIndirect],

    [0xA7, "*LAX", AddressModeZeroPage, ins.lax, readAddressZeroPage],
    [0xB7, "*LAX", AddressModeZeroPageY, ins.lax, readAddressZeroPageY],
    [0xAF, "*LAX", AddressModeAbsolute, ins.lax, readAddressAbsolute],
    [0xBF, "*LAX", AddressModeAbsoluteY, ins.lax, readAddressAbsoluteYWithPageBoundaryCycle],
    [0xA3, "*LAX", AddressModeIndirectX, ins.lax, readAddressIndirectX],
    [0xB3, "*LAX", AddressModeIndirectY, ins.lax, readAddressIndirectYWithPageBoundaryCycle],

    [0xA9, "LDA",  AddressModeImmediate, ins.lda, readAddressImmediate],
    [0xA5, "LDA",  AddressModeZeroPage, ins.lda, readAddressZeroPage],
    [0xB5, "LDA",  AddressModeZeroPageX, ins.lda, readAddressZeroPageX],
    [0xAD, "LDA",  AddressModeAbsolute, ins.lda, readAddressAbsolute],
    [0xBD, "LDA",  AddressModeAbsoluteX, ins.lda, readAddressAbsoluteXWithPageBoundaryCycle],
    [0xB9, "LDA",  AddressModeAbsoluteY, ins.lda, readAddressAbsoluteYWithPageBoundaryCycle],
    [0xA1, "LDA",  AddressModeIndirectX, ins.lda, readAddressIndirectX],
    [0xB1, "LDA",  AddressModeIndirectY, ins.lda, readAddressIndirectYWithPageBoundaryCycle],

    [0xA2, "LDX",  AddressModeImmediate, ins.ldx, readAddressImmediate],
    [0xA6, "LDX",  AddressModeZeroPage, ins.ldx, readAddressZeroPage ],
    [0xB6, "LDX",  AddressModeZeroPageY, ins.ldx, readAddressZeroPageY],
    [0xAE, "LDX",  AddressModeAbsolute, ins.ldx, readAddressAbsolute],
    [0xBE, "LDX",  AddressModeAbsoluteY, ins.ldx, readAddressAbsoluteYWithPageBoundaryCycle],

    [0xA0, "LDY",  AddressModeImmediate, ins.ldy, readAddressImmediate],
    [0xA4, "LDY",  AddressModeZeroPage, ins.ldy, readAddressZeroPage],
    [0xB4, "LDY",  AddressModeZeroPageX, ins.ldy, readAddressZeroPageX],
    [0xAC, "LDY",  AddressModeAbsolute, ins.ldy, readAddressAbsolute],
    [0xBC, "LDY",  AddressModeAbsoluteX, ins.ldy, readAddressAbsoluteXWithPageBoundaryCycle],

    [0x4A, "LSR",  AddressModeAccumulator, ins.lsrA],
    [0x46, "LSR",  AddressModeZeroPage, ins.lsr, readAddressZeroPage],
    [0x56, "LSR",  AddressModeZeroPageX, ins.lsr, readAddressZeroPageX],
    [0x4E, "LSR",  AddressModeAbsolute, ins.lsr, readAddressAbsolute],
    [0x5E, "LSR",  AddressModeAbsoluteX, ins.lsr, readAddressAbsoluteX],

    [0xEA, "NOP",  AddressModeImplied, ins.nop],
    [0x1A, "*NOP", AddressModeImplied, ins.nop],
    [0x3A, "*NOP", AddressModeImplied, ins.nop],
    [0x5A, "*NOP", AddressModeImplied, ins.nop],
    [0x7A, "*NOP", AddressModeImplied, ins.nop],
    [0xDA, "*NOP", AddressModeImplied, ins.nop],
    [0xFA, "*NOP", AddressModeImplied, ins.nop],
    [0x80, "*NOP", AddressModeImmediate, ins.unofficialNopImmediate],
    [0x82, "*NOP", AddressModeImmediate, ins.unofficialNopImmediate],
    [0x89, "*NOP", AddressModeImmediate, ins.unofficialNopImmediate],
    [0xC2, "*NOP", AddressModeImmediate, ins.unofficialNopImmediate],
    [0xE2, "*NOP", AddressModeImmediate, ins.unofficialNopImmediate],
    [0x04, "*NOP", AddressModeZeroPage, ins.unofficialNopZeroPage],
    [0x44, "*NOP", AddressModeZeroPage, ins.unofficialNopZeroPage],
    [0x64, "*NOP", AddressModeZeroPage, ins.unofficialNopZeroPage],
    [0x0C, "*NOP", AddressModeAbsolute, ins.unofficialNopAbsolute],
    [0x14, "*NOP", AddressModeZeroPageX, ins.unofficialNopZeroPageX],
    [0x34, "*NOP", AddressModeZeroPageX, ins.unofficialNopZeroPageX],
    [0x54, "*NOP", AddressModeZeroPageX, ins.unofficialNopZeroPageX],
    [0x74, "*NOP", AddressModeZeroPageX, ins.unofficialNopZeroPageX],
    [0xD4, "*NOP", AddressModeZeroPageX, ins.unofficialNopZeroPageX],
    [0xF4, "*NOP", AddressModeZeroPageX, ins.unofficialNopZeroPageX],

    [0x1C, "*NOP",  AddressModeAbsoluteX, ins.unofficialNopAbsoluteX],
    [0x3C, "*NOP",  AddressModeAbsoluteX, ins.unofficialNopAbsoluteX],
    [0x5C, "*NOP",  AddressModeAbsoluteX, ins.unofficialNopAbsoluteX],
    [0x7C, "*NOP",  AddressModeAbsoluteX, ins.unofficialNopAbsoluteX],
    [0xDC, "*NOP",  AddressModeAbsoluteX, ins.unofficialNopAbsoluteX],
    [0xFC, "*NOP",  AddressModeAbsoluteX, ins.unofficialNopAbsoluteX],

    [0x09, "ORA",  AddressModeImmediate, ins.ora, readAddressImmediate],
    [0x05, "ORA",  AddressModeZeroPage, ins.ora, readAddressZeroPage],
    [0x15, "ORA",  AddressModeZeroPageX, ins.ora, readAddressZeroPageX],
    [0x0D, "ORA",  AddressModeAbsolute, ins.ora, readAddressAbsolute],
    [0x1D, "ORA",  AddressModeAbsoluteX, ins.ora, readAddressAbsoluteXWithPageBoundaryCycle],
    [0x19, "ORA",  AddressModeAbsoluteY, ins.ora, readAddressAbsoluteYWithPageBoundaryCycle],
    [0x01, "ORA",  AddressModeIndirectX, ins.ora, readAddressIndirectX],
    [0x11, "ORA",  AddressModeIndirectY, ins.ora, readAddressIndirectYWithPageBoundaryCycle],

    [0xC8, "INY",  AddressModeImplied, ins.iny],
    [0x88, "DEY",  AddressModeImplied, ins.dey],
    [0xA8, "TAY",  AddressModeImplied, ins.tay],

    [0xE8, "INX",  AddressModeImplied, ins.inx],
    [0xCA, "DEX",  AddressModeImplied, ins.dex],

    [0xAA, "TAX",  AddressModeImplied, ins.tax],
    [0xBA, "TSX",  AddressModeImplied, ins.tsx],
    [0x8A, "TXA",  AddressModeImplied, ins.txa],
    [0x98, "TYA",  AddressModeImplied, ins.tya],
    [0x9A, "TXS",  AddressModeImplied, ins.txs],

    [0x27, "*RLA", AddressModeZeroPage, ins.rla, readAddressZeroPage],
    [0x37, "*RLA", AddressModeZeroPageX, ins.rla, readAddressZeroPageX],
    [0x2F, "*RLA", AddressModeAbsolute, ins.rla, readAddressAbsolute],
    [0x3F, "*RLA", AddressModeAbsoluteX, ins.rla, readAddressAbsoluteX],
    [0x3B, "*RLA", AddressModeAbsoluteY, ins.rla, readAddressAbsoluteY],
    [0x23, "*RLA", AddressModeIndirectX, ins.rla, readAddressIndirectX],
    [0x33, "*RLA", AddressModeIndirectY, ins.rla, readAddressIndirectY],

    [0x2A, "ROL",  AddressModeAccumulator, ins.rolA],
    [0x26, "ROL",  AddressModeZeroPage, ins.rol, readAddressZeroPage],
    [0x36, "ROL",  AddressModeZeroPageX, ins.rol, readAddressZeroPageX],
    [0x2E, "ROL",  AddressModeAbsolute, ins.rol, readAddressAbsolute],
    [0x3E, "ROL",  AddressModeAbsoluteX, ins.rol, readAddressAbsoluteX],

    [0x6A, "ROR",  AddressModeAccumulator, ins.rorA],
    [0x66, "ROR",  AddressModeZeroPage, ins.ror, readAddressZeroPage],
    [0x76, "ROR",  AddressModeZeroPageX, ins.ror, readAddressZeroPageX],
    [0x6E, "ROR",  AddressModeAbsolute, ins.ror, readAddressAbsolute],
    [0x7E, "ROR",  AddressModeAbsoluteX, ins.ror, readAddressAbsoluteX],

    [0x67, "*RRA", AddressModeZeroPage, ins.rra, readAddressZeroPage],
    [0x77, "*RRA", AddressModeZeroPageX, ins.rra, readAddressZeroPageX],
    [0x6F, "*RRA", AddressModeAbsolute, ins.rra, readAddressAbsolute],
    [0x7F, "*RRA", AddressModeAbsoluteX, ins.rra, readAddressAbsoluteX],
    [0x7B, "*RRA", AddressModeAbsoluteY, ins.rra, readAddressAbsoluteY],
    [0x63, "*RRA", AddressModeIndirectX, ins.rra, readAddressIndirectX],
    [0x73, "*RRA", AddressModeIndirectY, ins.rra, readAddressIndirectY],

    [0x87, "*SAX", AddressModeZeroPage, ins.sax, readAddressZeroPage],
    [0x97, "*SAX", AddressModeZeroPageY, ins.sax, readAddressZeroPageY],
    [0x83, "*SAX", AddressModeIndirectX, ins.sax, readAddressIndirectX],
    [0x8F, "*SAX", AddressModeAbsolute, ins.sax, readAddressAbsolute],

    [0xE9, "SBC", AddressModeImmediate, ins.sbc, readAddressImmediate],
    [0xEB, "*SBC", AddressModeImmediate, ins.sbc, readAddressImmediate],
    [0xE5, "SBC", AddressModeZeroPage, ins.sbc, readAddressZeroPage],
    [0xF5, "SBC", AddressModeZeroPageX, ins.sbc, readAddressZeroPageX],
    [0xED, "SBC", AddressModeAbsolute, ins.sbc, readAddressAbsolute],
    [0xFD, "SBC", AddressModeAbsoluteX, ins.sbc, readAddressAbsoluteXWithPageBoundaryCycle],
    [0xF9, "SBC", AddressModeAbsoluteY, ins.sbc, readAddressAbsoluteYWithPageBoundaryCycle],
    [0xE1, "SBC", AddressModeIndirectX, ins.sbc, readAddressIndirectX],
    [0xF1, "SBC", AddressModeIndirectY, ins.sbc, readAddressIndirectYWithPageBoundaryCycle],

    [0x38, "SEC",  AddressModeImplied, ins.sec],
    [0x78, "SEI",  AddressModeImplied, ins.sei],
    [0xF8, "SED",  AddressModeImplied, ins.sed],

    [0x07, "*SLO", AddressModeZeroPage, ins.slo, readAddressZeroPage],
    [0x17, "*SLO", AddressModeZeroPageX, ins.slo, readAddressZeroPageX],
    [0x0F, "*SLO", AddressModeAbsolute, ins.slo, readAddressAbsolute],
    [0x1F, "*SLO", AddressModeAbsoluteX, ins.slo, readAddressAbsoluteX],
    [0x1B, "*SLO", AddressModeAbsoluteY, ins.slo, readAddressAbsoluteY],
    [0x03, "*SLO", AddressModeIndirectX, ins.slo, readAddressIndirectX],
    [0x13, "*SLO", AddressModeIndirectY, ins.slo, readAddressIndirectY],

    [0x47, "*SRE", AddressModeZeroPage, ins.sre, readAddressZeroPage],
    [0x57, "*SRE", AddressModeZeroPageX, ins.sre, readAddressZeroPageX],
    [0x4F, "*SRE", AddressModeAbsolute, ins.sre, readAddressAbsolute],
    [0x5F, "*SRE", AddressModeAbsoluteX, ins.sre, readAddressAbsoluteX],
    [0x5B, "*SRE", AddressModeAbsoluteY, ins.sre, readAddressAbsoluteY],
    [0x43, "*SRE", AddressModeIndirectX, ins.sre, readAddressIndirectX],
    [0x53, "*SRE", AddressModeIndirectY, ins.sre, readAddressIndirectY],

    [0x85, "STA",  AddressModeZeroPage, ins.sta, readAddressZeroPage],
    [0x95, "STA",  AddressModeZeroPageX, ins.sta, readAddressZeroPageX],
    [0x8D, "STA",  AddressModeAbsolute, ins.sta, readAddressAbsolute],
    [0x9D, "STA",  AddressModeAbsoluteX, ins.sta, readAddressAbsoluteX],
    [0x99, "STA",  AddressModeAbsoluteY, ins.sta, readAddressAbsoluteY],
    [0x81, "STA",  AddressModeIndirectX, ins.sta, readAddressIndirectX],
    [0x91, "STA",  AddressModeIndirectY, ins.sta, readAddressIndirectY],

    [0x86, "STX",  AddressModeZeroPage, ins.stx, readAddressZeroPage],
    [0x96, "STX",  AddressModeZeroPageY, ins.stx, readAddressZeroPageY],
    [0x8E, "STX",  AddressModeAbsolute, ins.stx, readAddressAbsolute],

    [0x84, "STY",  AddressModeZeroPage, ins.sty, readAddressZeroPage],
    [0x94, "STY",  AddressModeZeroPageX, ins.sty, readAddressZeroPageX],
    [0x8C, "STY",  AddressModeAbsolute, ins.sty, readAddressAbsolute],

    [0x00, "BRK",  AddressModeImplied, ins.brk],
    [0x08, "PHP",  AddressModeImplied, ins.php],
    [0x48, "PHA",  AddressModeImplied, ins.pha],
    [0x28, "PLP",  AddressModeImplied, ins.plp],
    [0x40, "RTI",  AddressModeImplied, ins.rti],
    [0x68, "PLA",  AddressModeImplied, ins.pla],
    [0x20, "JSR",  AddressModeAbsolute, ins.jsr],
    [0x60, "RTS",  AddressModeImplied, ins.rts],

    [0x9E, "*SXA", AddressModeAbsoluteY, ins.sxa],
    [0x9C, "*SYA", AddressModeAbsoluteX, ins.sya]
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
