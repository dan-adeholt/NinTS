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
    [0x0B, "*AAC", AddressModeImmediate, e => ins.aac(e, readAddressImmediate(e))],
    [0x2B, "*AAC", AddressModeImmediate, e => ins.aac(e, readAddressImmediate(e))],

    [0x69, "ADC",  AddressModeImmediate, e => ins.adc(e, readAddressImmediate(e))],
    [0x65, "ADC",  AddressModeZeroPage, e => ins.adc(e, readAddressZeroPage(e)) ],
    [0x75, "ADC",  AddressModeZeroPageX, e => ins.adc(e, readAddressZeroPageX(e))],
    [0x6D, "ADC",  AddressModeAbsolute, e => ins.adc(e, readAddressAbsolute(e))],
    [0x7D, "ADC",  AddressModeAbsoluteX, e => ins.adc(e, readAddressAbsoluteXWithPageBoundaryCycle(e))],
    [0x79, "ADC",  AddressModeAbsoluteY, e => ins.adc(e, readAddressAbsoluteYWithPageBoundaryCycle(e))],
    [0x61, "ADC",  AddressModeIndirectX, e => ins.adc(e, readAddressIndirectX(e))],
    [0x71, "ADC",  AddressModeIndirectY, e => ins.adc(e, readAddressIndirectYWithPageBoundaryCycle(e))],

    [0x29, "AND",  AddressModeImmediate, e => ins.and(e, readAddressImmediate(e))],
    [0x25, "AND",  AddressModeZeroPage, e => ins.and(e, readAddressZeroPage(e))],
    [0x35, "AND",  AddressModeZeroPageX, e => ins.and(e, readAddressZeroPageX(e))],
    [0x2D, "AND",  AddressModeAbsolute, e => ins.and(e, readAddressAbsolute(e))],
    [0x3D, "AND",  AddressModeAbsoluteX, e => ins.and(e, readAddressAbsoluteXWithPageBoundaryCycle(e))],
    [0x39, "AND",  AddressModeAbsoluteY, e => ins.and(e, readAddressAbsoluteYWithPageBoundaryCycle(e))],
    [0x21, "AND",  AddressModeIndirectX, e => ins.and(e, readAddressIndirectX(e))],
    [0x31, "AND",  AddressModeIndirectY, e => ins.and(e, readAddressIndirectYWithPageBoundaryCycle(e))],

    [0x6B, "*ARR", AddressModeImmediate, e => ins.arr(e, readAddressImmediate(e))],

    [0x0A, "ASL",  AddressModeAccumulator, ins.aslA],
    [0x06, "ASL",  AddressModeZeroPage, e => ins.asl(e, readAddressZeroPage(e))],
    [0x16, "ASL",  AddressModeZeroPageX, e => ins.asl(e, readAddressZeroPageX(e))],
    [0x0E, "ASL",  AddressModeAbsolute, e => ins.asl(e, readAddressAbsolute(e))],
    [0x1E, "ASL",  AddressModeAbsoluteX, e => ins.asl(e, readAddressAbsoluteX(e))],

    [0x4B, "*ASR", AddressModeImmediate, e => ins.asr(e, readAddressImmediate(e))],

    [0xAB, "*ATX", AddressModeImmediate, e => ins.atx(e, readAddressImmediate(e))],

    [0xCB, "AXS",  AddressModeImmediate, e => ins.axs(e, readAddressImmediate(e))],

    [0x24, "BIT",  AddressModeZeroPage, e => ins.bit(e, readAddressZeroPage(e))],
    [0x2C, "BIT",  AddressModeAbsolute, e => ins.bit(e, readAddressAbsolute(e))],

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

    [0xC9, "CMP",  AddressModeImmediate, e => ins.cmp(e, readAddressImmediate(e))],
    [0xC5, "CMP",  AddressModeZeroPage, e => ins.cmp(e, readAddressZeroPage(e))],
    [0xD5, "CMP",  AddressModeZeroPageX, e => ins.cmp(e, readAddressZeroPageX(e))],
    [0xCD, "CMP",  AddressModeAbsolute, e => ins.cmp(e, readAddressAbsolute(e))],
    [0xDD, "CMP",  AddressModeAbsoluteX, e => ins.cmp(e, readAddressAbsoluteXWithPageBoundaryCycle(e))],
    [0xD9, "CMP",  AddressModeAbsoluteY, e => ins.cmp(e, readAddressAbsoluteYWithPageBoundaryCycle(e))],
    [0xC1, "CMP",  AddressModeIndirectX, e => ins.cmp(e, readAddressIndirectX(e))],
    [0xD1, "CMP",  AddressModeIndirectY, e => ins.cmp(e, readAddressIndirectYWithPageBoundaryCycle(e))],

    [0xE0, "CPX",  AddressModeImmediate, e => ins.cpx(e, readAddressImmediate(e))],
    [0xE4, "CPX",  AddressModeZeroPage, e => ins.cpx(e, readAddressZeroPage(e))],
    [0xEC, "CPX",  AddressModeAbsolute, e => ins.cpx(e, readAddressAbsolute(e))],

    [0xC0, "CPY",  AddressModeImmediate, e => ins.cpy(e, readAddressImmediate(e))],
    [0xC4, "CPY",  AddressModeZeroPage, e => ins.cpy(e, readAddressZeroPage(e))],
    [0xCC, "CPY",  AddressModeAbsolute, e => ins.cpy(e, readAddressAbsolute(e))],

    [0xC7, "*DCP", AddressModeZeroPage, e => ins.dcp(e, readAddressZeroPage(e))],
    [0xD7, "*DCP", AddressModeZeroPageX, e => ins.dcp(e, readAddressZeroPageX(e))],
    [0xCF, "*DCP", AddressModeAbsolute, e => ins.dcp(e, readAddressAbsolute(e))],
    [0xDF, "*DCP", AddressModeAbsoluteX, e => ins.dcp(e, readAddressAbsoluteX(e))],
    [0xDB, "*DCP", AddressModeAbsoluteY, e => ins.dcp(e, readAddressAbsoluteY(e))],
    [0xC3, "*DCP", AddressModeIndirectX, e => ins.dcp(e, readAddressIndirectX(e))],
    [0xD3, "*DCP", AddressModeIndirectY, e => ins.dcp(e, readAddressIndirectY(e))],

    [0xC6, "DEC",  AddressModeZeroPage, e => ins.dec(e, readAddressZeroPage(e))],
    [0xD6, "DEC",  AddressModeZeroPageX, e => ins.dec(e, readAddressZeroPageX(e))],
    [0xCE, "DEC",  AddressModeAbsolute, e => ins.dec(e, readAddressAbsolute(e))],
    [0xDE, "DEC",  AddressModeAbsoluteX, e => ins.dec(e, readAddressAbsoluteX(e))],

    [0x49, "EOR",  AddressModeImmediate, e => ins.eor(e, readAddressImmediate(e))],
    [0x45, "EOR",  AddressModeZeroPage, e => ins.eor(e, readAddressZeroPage(e)) ],
    [0x55, "EOR",  AddressModeZeroPageX, e => ins.eor(e, readAddressZeroPageX(e))],
    [0x4D, "EOR",  AddressModeAbsolute, e => ins.eor(e, readAddressAbsolute(e))],
    [0x5D, "EOR",  AddressModeAbsoluteX, e => ins.eor(e, readAddressAbsoluteXWithPageBoundaryCycle(e))],
    [0x59, "EOR",  AddressModeAbsoluteY, e => ins.eor(e, readAddressAbsoluteYWithPageBoundaryCycle(e))],
    [0x41, "EOR",  AddressModeIndirectX, e => ins.eor(e, readAddressIndirectX(e))],
    [0x51, "EOR",  AddressModeIndirectY, e => ins.eor(e, readAddressIndirectYWithPageBoundaryCycle(e))],

    [0xE6, "INC",  AddressModeZeroPage, e => ins.inc(e, readAddressZeroPage(e))],
    [0xF6, "INC",  AddressModeZeroPageX, e => ins.inc(e, readAddressZeroPageX(e))],
    [0xEE, "INC",  AddressModeAbsolute, e => ins.inc(e, readAddressAbsolute(e))],
    [0xFE, "INC",  AddressModeAbsoluteX, e => ins.inc(e, readAddressAbsoluteX(e))],

    [0xE7, "*ISB", AddressModeZeroPage, e => ins.isb(e, readAddressZeroPage(e))],
    [0xF7, "*ISB", AddressModeZeroPageX, e => ins.isb(e, readAddressZeroPageX(e))],
    [0xEF, "*ISB", AddressModeAbsolute, e => ins.isb(e, readAddressAbsolute(e))],
    [0xFF, "*ISB", AddressModeAbsoluteX, e => ins.isb(e, readAddressAbsoluteX(e))],
    [0xFB, "*ISB", AddressModeAbsoluteY, e => ins.isb(e, readAddressAbsoluteY(e))],
    [0xE3, "*ISB", AddressModeIndirectX, e => ins.isb(e, readAddressIndirectX(e))],
    [0xF3, "*ISB", AddressModeIndirectY, e => ins.isb(e, readAddressIndirectY(e))],

    [0x4C, "JMP",  AddressModeAbsolute, ins.jmpAbsolute],
    [0x6C, "JMP",  AddressModeIndirect, ins.jmpIndirect],

    [0xA7, "*LAX", AddressModeZeroPage, e => ins.lax(e, readAddressZeroPage(e))],
    [0xB7, "*LAX", AddressModeZeroPageY, e => ins.lax(e, readAddressZeroPageY(e))],
    [0xAF, "*LAX", AddressModeAbsolute, e => ins.lax(e, readAddressAbsolute(e))],
    [0xBF, "*LAX", AddressModeAbsoluteY, e => ins.lax(e, readAddressAbsoluteYWithPageBoundaryCycle(e))],
    [0xA3, "*LAX", AddressModeIndirectX, e => ins.lax(e, readAddressIndirectX(e))],
    [0xB3, "*LAX", AddressModeIndirectY, e => ins.lax(e, readAddressIndirectYWithPageBoundaryCycle(e))],

    [0xA9, "LDA",  AddressModeImmediate, e => ins.lda(e, readAddressImmediate(e))],
    [0xA5, "LDA",  AddressModeZeroPage, e => ins.lda(e, readAddressZeroPage(e))],
    [0xB5, "LDA",  AddressModeZeroPageX, e => ins.lda(e, readAddressZeroPageX(e))],
    [0xAD, "LDA",  AddressModeAbsolute, e => ins.lda(e, readAddressAbsolute(e))],
    [0xBD, "LDA",  AddressModeAbsoluteX, e => ins.lda(e, readAddressAbsoluteXWithPageBoundaryCycle(e))],
    [0xB9, "LDA",  AddressModeAbsoluteY, e => ins.lda(e, readAddressAbsoluteYWithPageBoundaryCycle(e))],
    [0xA1, "LDA",  AddressModeIndirectX, e => ins.lda(e, readAddressIndirectX(e))],
    [0xB1, "LDA",  AddressModeIndirectY, e => ins.lda(e, readAddressIndirectYWithPageBoundaryCycle(e))],

    [0xA2, "LDX",  AddressModeImmediate, e => ins.ldx(e, readAddressImmediate(e))],
    [0xA6, "LDX",  AddressModeZeroPage, e => ins.ldx(e, readAddressZeroPage(e)) ],
    [0xB6, "LDX",  AddressModeZeroPageY, e => ins.ldx(e, readAddressZeroPageY(e))],
    [0xAE, "LDX",  AddressModeAbsolute, e => ins.ldx(e, readAddressAbsolute(e))],
    [0xBE, "LDX",  AddressModeAbsoluteY, e => ins.ldx(e, readAddressAbsoluteYWithPageBoundaryCycle(e))],

    [0xA0, "LDY",  AddressModeImmediate, e => ins.ldy(e, readAddressImmediate(e))],
    [0xA4, "LDY",  AddressModeZeroPage, e => ins.ldy(e, readAddressZeroPage(e))],
    [0xB4, "LDY",  AddressModeZeroPageX, e => ins.ldy(e, readAddressZeroPageX(e))],
    [0xAC, "LDY",  AddressModeAbsolute, e => ins.ldy(e, readAddressAbsolute(e))],
    [0xBC, "LDY",  AddressModeAbsoluteX, e => ins.ldy(e, readAddressAbsoluteXWithPageBoundaryCycle(e))],

    [0x4A, "LSR",  AddressModeAccumulator, ins.lsrA],
    [0x46, "LSR",  AddressModeZeroPage, e => ins.lsr(e, readAddressZeroPage(e))],
    [0x56, "LSR",  AddressModeZeroPageX, e => ins.lsr(e, readAddressZeroPageX(e))],
    [0x4E, "LSR",  AddressModeAbsolute, e => ins.lsr(e, readAddressAbsolute(e))],
    [0x5E, "LSR",  AddressModeAbsoluteX, e => ins.lsr(e, readAddressAbsoluteX(e))],

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

    [0x09, "ORA",  AddressModeImmediate, e => ins.ora(e, readAddressImmediate(e))],
    [0x05, "ORA",  AddressModeZeroPage, e => ins.ora(e, readAddressZeroPage(e))],
    [0x15, "ORA",  AddressModeZeroPageX, e => ins.ora(e, readAddressZeroPageX(e))],
    [0x0D, "ORA",  AddressModeAbsolute, e => ins.ora(e, readAddressAbsolute(e))],
    [0x1D, "ORA",  AddressModeAbsoluteX, e => ins.ora(e, readAddressAbsoluteXWithPageBoundaryCycle(e))],
    [0x19, "ORA",  AddressModeAbsoluteY, e => ins.ora(e, readAddressAbsoluteYWithPageBoundaryCycle(e))],
    [0x01, "ORA",  AddressModeIndirectX, e => ins.ora(e, readAddressIndirectX(e))],
    [0x11, "ORA",  AddressModeIndirectY, e => ins.ora(e, readAddressIndirectYWithPageBoundaryCycle(e))],

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

    [0x27, "*RLA", AddressModeZeroPage, e => ins.rla(e, readAddressZeroPage(e))],
    [0x37, "*RLA", AddressModeZeroPageX, e => ins.rla(e, readAddressZeroPageX(e))],
    [0x2F, "*RLA", AddressModeAbsolute, e => ins.rla(e, readAddressAbsolute(e))],
    [0x3F, "*RLA", AddressModeAbsoluteX, e => ins.rla(e, readAddressAbsoluteX(e))],
    [0x3B, "*RLA", AddressModeAbsoluteY, e => ins.rla(e, readAddressAbsoluteY(e))],
    [0x23, "*RLA", AddressModeIndirectX, e => ins.rla(e, readAddressIndirectX(e))],
    [0x33, "*RLA", AddressModeIndirectY, e => ins.rla(e, readAddressIndirectY(e))],

    [0x2A, "ROL",  AddressModeAccumulator, e => ins.rolA(e)],
    [0x26, "ROL",  AddressModeZeroPage, e => ins.rol(e, readAddressZeroPage(e))],
    [0x36, "ROL",  AddressModeZeroPageX, e => ins.rol(e, readAddressZeroPageX(e))],
    [0x2E, "ROL",  AddressModeAbsolute, e => ins.rol(e, readAddressAbsolute(e))],
    [0x3E, "ROL",  AddressModeAbsoluteX, e => ins.rol(e, readAddressAbsoluteX(e))],

    [0x6A, "ROR",  AddressModeAccumulator, ins.rorA],
    [0x66, "ROR",  AddressModeZeroPage, e => ins.ror(e, readAddressZeroPage(e))],
    [0x76, "ROR",  AddressModeZeroPageX, e => ins.ror(e, readAddressZeroPageX(e))],
    [0x6E, "ROR",  AddressModeAbsolute, e => ins.ror(e, readAddressAbsolute(e))],
    [0x7E, "ROR",  AddressModeAbsoluteX, e => ins.ror(e, readAddressAbsoluteX(e))],

    [0x67, "*RRA", AddressModeZeroPage, e => ins.rra(e, readAddressZeroPage(e))],
    [0x77, "*RRA", AddressModeZeroPageX, e => ins.rra(e, readAddressZeroPageX(e))],
    [0x6F, "*RRA", AddressModeAbsolute, e => ins.rra(e, readAddressAbsolute(e))],
    [0x7F, "*RRA", AddressModeAbsoluteX, e => ins.rra(e, readAddressAbsoluteX(e))],
    [0x7B, "*RRA", AddressModeAbsoluteY, e => ins.rra(e, readAddressAbsoluteY(e))],
    [0x63, "*RRA", AddressModeIndirectX, e => ins.rra(e, readAddressIndirectX(e))],
    [0x73, "*RRA", AddressModeIndirectY, e => ins.rra(e, readAddressIndirectY(e))],

    [0x87, "*SAX", AddressModeZeroPage, e => ins.sax(e, readAddressZeroPage(e))],
    [0x97, "*SAX", AddressModeZeroPageY, e => ins.sax(e, readAddressZeroPageY(e))],
    [0x83, "*SAX", AddressModeIndirectX, e => ins.sax(e, readAddressIndirectX(e))],
    [0x8F, "*SAX", AddressModeAbsolute, e => ins.sax(e, readAddressAbsolute(e))],

    [0xE9, "SBC", AddressModeImmediate, e => ins.sbc(e, readAddressImmediate(e))],
    [0xEB, "*SBC", AddressModeImmediate, e => ins.sbc(e, readAddressImmediate(e))],
    [0xE5, "SBC", AddressModeZeroPage, e => ins.sbc(e, readAddressZeroPage(e))],
    [0xF5, "SBC", AddressModeZeroPageX, e => ins.sbc(e, readAddressZeroPageX(e))],
    [0xED, "SBC", AddressModeAbsolute, e => ins.sbc(e, readAddressAbsolute(e))],
    [0xFD, "SBC", AddressModeAbsoluteX, e => ins.sbc(e, readAddressAbsoluteXWithPageBoundaryCycle(e))],
    [0xF9, "SBC", AddressModeAbsoluteY, e => ins.sbc(e, readAddressAbsoluteYWithPageBoundaryCycle(e))],
    [0xE1, "SBC", AddressModeIndirectX, e => ins.sbc(e, readAddressIndirectX(e))],
    [0xF1, "SBC", AddressModeIndirectY, e => ins.sbc(e, readAddressIndirectYWithPageBoundaryCycle(e))],

    [0x38, "SEC",  AddressModeImplied, ins.sec],
    [0x78, "SEI",  AddressModeImplied, ins.sei],
    [0xF8, "SED",  AddressModeImplied, ins.sed],

    [0x07, "*SLO", AddressModeZeroPage, e => ins.slo(e, readAddressZeroPage(e))],
    [0x17, "*SLO", AddressModeZeroPageX, e => ins.slo(e, readAddressZeroPageX(e))],
    [0x0F, "*SLO", AddressModeAbsolute, e => ins.slo(e, readAddressAbsolute(e))],
    [0x1F, "*SLO", AddressModeAbsoluteX, e => ins.slo(e, readAddressAbsoluteX(e))],
    [0x1B, "*SLO", AddressModeAbsoluteY, e => ins.slo(e, readAddressAbsoluteY(e))],
    [0x03, "*SLO", AddressModeIndirectX, e => ins.slo(e, readAddressIndirectX(e))],
    [0x13, "*SLO", AddressModeIndirectY, e => ins.slo(e, readAddressIndirectY(e))],

    [0x47, "*SRE", AddressModeZeroPage, e => ins.sre(e, readAddressZeroPage(e))],
    [0x57, "*SRE", AddressModeZeroPageX, e => ins.sre(e, readAddressZeroPageX(e))],
    [0x4F, "*SRE", AddressModeAbsolute, e => ins.sre(e, readAddressAbsolute(e))],
    [0x5F, "*SRE", AddressModeAbsoluteX, e => ins.sre(e, readAddressAbsoluteX(e))],
    [0x5B, "*SRE", AddressModeAbsoluteY, e => ins.sre(e, readAddressAbsoluteY(e))],
    [0x43, "*SRE", AddressModeIndirectX, e => ins.sre(e, readAddressIndirectX(e))],
    [0x53, "*SRE", AddressModeIndirectY, e => ins.sre(e, readAddressIndirectY(e))],

    [0x85, "STA",  AddressModeZeroPage, e => ins.sta(e, readAddressZeroPage(e))],
    [0x95, "STA",  AddressModeZeroPageX, e => ins.sta(e, readAddressZeroPageX(e))],
    [0x8D, "STA",  AddressModeAbsolute, e => ins.sta(e, readAddressAbsolute(e))],
    [0x9D, "STA",  AddressModeAbsoluteX, e => ins.sta(e, readAddressAbsoluteX(e))],
    [0x99, "STA",  AddressModeAbsoluteY, e => ins.sta(e, readAddressAbsoluteY(e))],
    [0x81, "STA",  AddressModeIndirectX, e => ins.sta(e, readAddressIndirectX(e))],
    [0x91, "STA",  AddressModeIndirectY, e => ins.sta(e, readAddressIndirectY(e))],

    [0x86, "STX",  AddressModeZeroPage, e => ins.stx(e, readAddressZeroPage(e))],
    [0x96, "STX",  AddressModeZeroPageY, e => ins.stx(e, readAddressZeroPageY(e))],
    [0x8E, "STX",  AddressModeAbsolute, e => ins.stx(e, readAddressAbsolute(e))],

    [0x84, "STY",  AddressModeZeroPage, e => ins.sty(e, readAddressZeroPage(e))],
    [0x94, "STY",  AddressModeZeroPageX, e => ins.sty(e, readAddressZeroPageX(e))],
    [0x8C, "STY",  AddressModeAbsolute, e => ins.sty(e, readAddressAbsolute(e))],

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

_.forEach(opcodes, ([opcode, name, mode, implementation]) => {
    opcodeMetadata[opcode] = { name, mode };
    opcodeTable[opcode] = implementation;
})
