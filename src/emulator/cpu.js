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
    [0x0B, "*AAC", AddressModeImmediate, 2, 2,  e => ins.aac(e, readAddressImmediate(e, 2))],
    [0x2B, "*AAC", AddressModeImmediate, 2, 2,  e => ins.aac(e, readAddressImmediate(e, 2))],

    [0x69, "ADC",  AddressModeImmediate, 2, 2, e => ins.adc(e, readAddressImmediate(e, 2))],
    [0x65, "ADC",  AddressModeZeroPage, 2, 3, e => ins.adc(e, readAddressZeroPage(e, 3)) ],
    [0x75, "ADC",  AddressModeZeroPageX, 2, 4, e => ins.adc(e, readAddressZeroPageX(e, 4))],
    [0x6D, "ADC",  AddressModeAbsolute, 3, 4, e => ins.adc(e, readAddressAbsolute(e, 4))],
    [0x7D, "ADC",  AddressModeAbsoluteX, 3, 4, e => ins.adc(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0x79, "ADC",  AddressModeAbsoluteY, 3, 4, e => ins.adc(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0x61, "ADC",  AddressModeIndirectX, 2, 6, e => ins.adc(e, readAddressIndirectX(e, 6))],
    [0x71, "ADC",  AddressModeIndirectY, 2, 5, e => ins.adc(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0x29, "AND",  AddressModeImmediate, 2, 2, e => ins.and(e, readAddressImmediate(e, 2))],
    [0x25, "AND",  AddressModeZeroPage, 2, 3, e => ins.and(e, readAddressZeroPage(e, 3))],
    [0x35, "AND",  AddressModeZeroPageX, 2, 4, e => ins.and(e, readAddressZeroPageX(e, 4))],
    [0x2D, "AND",  AddressModeAbsolute, 3, 4, e => ins.and(e, readAddressAbsolute(e, 4))],
    [0x3D, "AND",  AddressModeAbsoluteX, 3, 4, e => ins.and(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0x39, "AND",  AddressModeAbsoluteY, 3, 4, e => ins.and(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0x21, "AND",  AddressModeIndirectX, 2, 6, e => ins.and(e, readAddressIndirectX(e, 6))],
    [0x31, "AND",  AddressModeIndirectY, 2, 5, e => ins.and(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0x6B, "*ARR", AddressModeImmediate, 2, 2,  e => ins.arr(e, readAddressImmediate(e, 2))],

    [0x0A, "ASL",  AddressModeAccumulator, 1, null, ins.aslA],
    [0x06, "ASL",  AddressModeZeroPage, 2, 5, e => ins.asl(e, readAddressZeroPage(e, 5))],
    [0x16, "ASL",  AddressModeZeroPageX, 2, 6, e => ins.asl(e, readAddressZeroPageX(e, 6))],
    [0x0E, "ASL",  AddressModeAbsolute, 3, 6, e => ins.asl(e, readAddressAbsolute(e, 6))],
    [0x1E, "ASL",  AddressModeAbsoluteX, 3, 7, e => ins.asl(e, readAddressAbsoluteX(e, 7))],

    [0x4B, "*ASR", AddressModeImmediate, 2, 2,  e => ins.asr(e, readAddressImmediate(e, 2))],

    [0xAB, "*ATX", AddressModeImmediate, 2, 2,  e => ins.atx(e, readAddressImmediate(e, 2))],

    [0xCB, "AXS",  AddressModeImmediate, 2, 2, e => ins.axs(e, readAddressImmediate(e, 2))],

    [0x24, "BIT",  AddressModeZeroPage, 2, 3, e => ins.bit(e, readAddressZeroPage(e, 3))],
    [0x2C, "BIT",  AddressModeAbsolute, 3, 4, e => ins.bit(e, readAddressAbsolute(e, 4))],

    [0x90, "BCC",  AddressModeRelative, 2, null, ins.bcc],
    [0xF0, "BEQ",  AddressModeRelative, 2, null, ins.beq],
    [0xD0, "BNE",  AddressModeRelative, 2, null, ins.bne],
    [0xB0, "BCS",  AddressModeRelative, 2, null, ins.bcs],
    [0x50, "BVC",  AddressModeRelative, 2, null, ins.bvc],
    [0x70, "BVS",  AddressModeRelative, 2, null, ins.bvs],
    [0x10, "BPL",  AddressModeRelative, 2, null, ins.bpl],
    [0x30, "BMI",  AddressModeRelative, 2, null, ins.bmi],

    [0x18, "CLC",  AddressModeImplied, 1, null, ins.clc],
    [0xD8, "CLD",  AddressModeImplied, 1, null, ins.cld],
    [0x58, "CLI",  AddressModeImplied, 1, null, ins.cli],
    [0xB8, "CLV",  AddressModeImplied, 1, null, ins.clv],

    [0xC9, "CMP",  AddressModeImmediate, 2, 2, e => ins.cmp(e, readAddressImmediate(e, 2))],
    [0xC5, "CMP",  AddressModeZeroPage, 2, 3, e => ins.cmp(e, readAddressZeroPage(e, 3))],
    [0xD5, "CMP",  AddressModeZeroPageX, 2, 4, e => ins.cmp(e, readAddressZeroPageX(e, 4))],
    [0xCD, "CMP",  AddressModeAbsolute, 3, 4, e => ins.cmp(e, readAddressAbsolute(e, 4))],
    [0xDD, "CMP",  AddressModeAbsoluteX, 3, 4, e => ins.cmp(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0xD9, "CMP",  AddressModeAbsoluteY, 3, 4, e => ins.cmp(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0xC1, "CMP",  AddressModeIndirectX, 2, 6, e => ins.cmp(e, readAddressIndirectX(e, 6))],
    [0xD1, "CMP",  AddressModeIndirectY, 2, 5, e => ins.cmp(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0xE0, "CPX",  AddressModeImmediate, 2, 2, e => ins.cpx(e, readAddressImmediate(e, 2))],
    [0xE4, "CPX",  AddressModeZeroPage, 2, 3, e => ins.cpx(e, readAddressZeroPage(e, 3))],
    [0xEC, "CPX",  AddressModeAbsolute, 3, 4, e => ins.cpx(e, readAddressAbsolute(e, 4))],

    [0xC0, "CPY",  AddressModeImmediate, 2, 2, e => ins.cpy(e, readAddressImmediate(e, 2))],
    [0xC4, "CPY",  AddressModeZeroPage, 2, 3, e => ins.cpy(e, readAddressZeroPage(e, 3))],
    [0xCC, "CPY",  AddressModeAbsolute, 3, 4, e => ins.cpy(e, readAddressAbsolute(e, 4))],

    [0xC7, "*DCP", AddressModeZeroPage, 2, 5,  e => ins.dcp(e, readAddressZeroPage(e, 5))],
    [0xD7, "*DCP", AddressModeZeroPageX, 2, 6,  e => ins.dcp(e, readAddressZeroPageX(e, 6))],
    [0xCF, "*DCP", AddressModeAbsolute, 3, 6,  e => ins.dcp(e, readAddressAbsolute(e, 6))],
    [0xDF, "*DCP", AddressModeAbsoluteX, 3, 7,  e => ins.dcp(e, readAddressAbsoluteX(e, 7))],
    [0xDB, "*DCP", AddressModeAbsoluteY, 3, 7,  e => ins.dcp(e, readAddressAbsoluteY(e, 7))],
    [0xC3, "*DCP", AddressModeIndirectX, 2, 8,  e => ins.dcp(e, readAddressIndirectX(e, 8))],
    [0xD3, "*DCP", AddressModeIndirectY, 2, 8,  e => ins.dcp(e, readAddressIndirectY(e, 8))],

    [0xC6, "DEC",  AddressModeZeroPage, 2, 5, e => ins.dec(e, readAddressZeroPage(e, 5))],
    [0xD6, "DEC",  AddressModeZeroPageX, 2, 6, e => ins.dec(e, readAddressZeroPageX(e, 6))],
    [0xCE, "DEC",  AddressModeAbsolute, 3, 6, e => ins.dec(e, readAddressAbsolute(e, 6))],
    [0xDE, "DEC",  AddressModeAbsoluteX, 3, 7, e => ins.dec(e, readAddressAbsoluteX(e, 7))],

    [0x49, "EOR",  AddressModeImmediate, 2, 2, e => ins.eor(e, readAddressImmediate(e, 2))],
    [0x45, "EOR",  AddressModeZeroPage, 2, 3, e => ins.eor(e, readAddressZeroPage(e, 3)) ],
    [0x55, "EOR",  AddressModeZeroPageX, 2, 4, e => ins.eor(e, readAddressZeroPageX(e, 4))],
    [0x4D, "EOR",  AddressModeAbsolute, 3, 4, e => ins.eor(e, readAddressAbsolute(e, 4))],
    [0x5D, "EOR",  AddressModeAbsoluteX, 3, 4, e => ins.eor(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0x59, "EOR",  AddressModeAbsoluteY, 3, 4, e => ins.eor(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0x41, "EOR",  AddressModeIndirectX, 2, 6, e => ins.eor(e, readAddressIndirectX(e, 6))],
    [0x51, "EOR",  AddressModeIndirectY, 2, 5, e => ins.eor(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0xE6, "INC",  AddressModeZeroPage, 2, 5, e => ins.inc(e, readAddressZeroPage(e, 5))],
    [0xF6, "INC",  AddressModeZeroPageX, 2, 6, e => ins.inc(e, readAddressZeroPageX(e, 6))],
    [0xEE, "INC",  AddressModeAbsolute, 3, 6, e => ins.inc(e, readAddressAbsolute(e, 6))],
    [0xFE, "INC",  AddressModeAbsoluteX, 3, 7, e => ins.inc(e, readAddressAbsoluteX(e, 7))],

    [0xE7, "*ISB", AddressModeZeroPage, 2, 5,  e => ins.isb(e, readAddressZeroPage(e, 5))],
    [0xF7, "*ISB", AddressModeZeroPageX, 2, 6,  e => ins.isb(e, readAddressZeroPageX(e, 6))],
    [0xEF, "*ISB", AddressModeAbsolute, 3, 6,  e => ins.isb(e, readAddressAbsolute(e, 6))],
    [0xFF, "*ISB", AddressModeAbsoluteX, 3, 7,  e => ins.isb(e, readAddressAbsoluteX(e, 7))],
    [0xFB, "*ISB", AddressModeAbsoluteY, 3, 7,  e => ins.isb(e, readAddressAbsoluteY(e, 7))],
    [0xE3, "*ISB", AddressModeIndirectX, 2, 8,  e => ins.isb(e, readAddressIndirectX(e, 8))],
    [0xF3, "*ISB", AddressModeIndirectY, 2, 8,  e => ins.isb(e, readAddressIndirectY(e, 8))],

    [0x4C, "JMP",  AddressModeAbsolute, 3, null, ins.jmpAbsolute],
    [0x6C, "JMP",  AddressModeIndirect, 3, null, ins.jmpIndirect],

    [0xA7, "*LAX", AddressModeZeroPage, 2, 3,  e => ins.lax(e, readAddressZeroPage(e, 3))],
    [0xB7, "*LAX", AddressModeZeroPageY, 2, 4,  e => ins.lax(e, readAddressZeroPageY(e, 4))],
    [0xAF, "*LAX", AddressModeAbsolute, 3, 4,  e => ins.lax(e, readAddressAbsolute(e, 4))],
    [0xBF, "*LAX", AddressModeAbsoluteY, 3, 4,  e => ins.lax(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0xA3, "*LAX", AddressModeIndirectX, 2, 6,  e => ins.lax(e, readAddressIndirectX(e, 6))],
    [0xB3, "*LAX", AddressModeIndirectY, 2, 5,  e => ins.lax(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0xA9, "LDA",  AddressModeImmediate, 2, 2, e => ins.lda(e, readAddressImmediate(e, 2))],
    [0xA5, "LDA",  AddressModeZeroPage, 2, 3, e => ins.lda(e, readAddressZeroPage(e, 3))],
    [0xB5, "LDA",  AddressModeZeroPageX, 2, 4, e => ins.lda(e, readAddressZeroPageX(e, 4))],
    [0xAD, "LDA",  AddressModeAbsolute, 3, 4, e => ins.lda(e, readAddressAbsolute(e, 4))],
    [0xBD, "LDA",  AddressModeAbsoluteX, 3, 4, e => ins.lda(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0xB9, "LDA",  AddressModeAbsoluteY, 3, 4, e => ins.lda(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0xA1, "LDA",  AddressModeIndirectX, 2, 6, e => ins.lda(e, readAddressIndirectX(e, 6))],
    [0xB1, "LDA",  AddressModeIndirectY, 2, 5, e => ins.lda(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0xA2, "LDX",  AddressModeImmediate, 2, 2, e => ins.ldx(e, readAddressImmediate(e, 2))],
    [0xA6, "LDX",  AddressModeZeroPage, 2, 3, e => ins.ldx(e, readAddressZeroPage(e, 3)) ],
    [0xB6, "LDX",  AddressModeZeroPageY, 2, 4, e => ins.ldx(e, readAddressZeroPageY(e, 4))],
    [0xAE, "LDX",  AddressModeAbsolute, 3, 4, e => ins.ldx(e, readAddressAbsolute(e, 4))],
    [0xBE, "LDX",  AddressModeAbsoluteY, 3, 4, e => ins.ldx(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],

    [0xA0, "LDY",  AddressModeImmediate, 2, 2, e => ins.ldy(e, readAddressImmediate(e, 2))],
    [0xA4, "LDY",  AddressModeZeroPage, 2, 3, e => ins.ldy(e, readAddressZeroPage(e, 3))],
    [0xB4, "LDY",  AddressModeZeroPageX, 2, 4, e => ins.ldy(e, readAddressZeroPageX(e, 4))],
    [0xAC, "LDY",  AddressModeAbsolute, 3, 4, e => ins.ldy(e, readAddressAbsolute(e, 4))],
    [0xBC, "LDY",  AddressModeAbsoluteX, 3, 4, e => ins.ldy(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],

    [0x4A, "LSR",  AddressModeAccumulator, 1, null, ins.lsrA],
    [0x46, "LSR",  AddressModeZeroPage, 2, 5, e => ins.lsr(e, readAddressZeroPage(e, 5))],
    [0x56, "LSR",  AddressModeZeroPageX, 2, 6, e => ins.lsr(e, readAddressZeroPageX(e, 6))],
    [0x4E, "LSR",  AddressModeAbsolute, 3, 6, e => ins.lsr(e, readAddressAbsolute(e, 6))],
    [0x5E, "LSR",  AddressModeAbsoluteX, 3, 7, e => ins.lsr(e, readAddressAbsoluteX(e, 7))],

    [0xEA, "NOP",  AddressModeImplied, 1, null, ins.nop],
    [0x1A, "*NOP", AddressModeImplied, 1, null,  ins.nop],
    [0x3A, "*NOP", AddressModeImplied, 1, null,  ins.nop],
    [0x5A, "*NOP", AddressModeImplied, 1, null,  ins.nop],
    [0x7A, "*NOP", AddressModeImplied, 1, null,  ins.nop],
    [0xDA, "*NOP", AddressModeImplied, 1, null,  ins.nop],
    [0xFA, "*NOP", AddressModeImplied, 1, null,  ins.nop],
    [0x80, "*NOP", AddressModeImmediate, 2, null,  ins.unofficialNopImmediate],
    [0x82, "*NOP", AddressModeImmediate, 2, null,  ins.unofficialNopImmediate],
    [0x89, "*NOP", AddressModeImmediate, 2, null,  ins.unofficialNopImmediate],
    [0xC2, "*NOP", AddressModeImmediate, 2, null,  ins.unofficialNopImmediate],
    [0xE2, "*NOP", AddressModeImmediate, 2, null,  ins.unofficialNopImmediate],
    [0x04, "*NOP", AddressModeZeroPage, 2, null,  ins.unofficialNopZeroPage],
    [0x44, "*NOP", AddressModeZeroPage, 2, null,  ins.unofficialNopZeroPage],
    [0x64, "*NOP", AddressModeZeroPage, 2, null,  ins.unofficialNopZeroPage],
    [0x0C, "*NOP", AddressModeAbsolute, 3, null,  ins.unofficialNopAbsolute],
    [0x14, "*NOP", AddressModeZeroPageX, 2, null,  ins.unofficialNopZeroPageX],
    [0x34, "*NOP", AddressModeZeroPageX, 2, null,  ins.unofficialNopZeroPageX],
    [0x54, "*NOP", AddressModeZeroPageX, 2, null,  ins.unofficialNopZeroPageX],
    [0x74, "*NOP", AddressModeZeroPageX, 2, null,  ins.unofficialNopZeroPageX],
    [0xD4, "*NOP", AddressModeZeroPageX, 2, null,  ins.unofficialNopZeroPageX],
    [0xF4, "*NOP", AddressModeZeroPageX, 2, null,  ins.unofficialNopZeroPageX],

    [0x1C, "*NOP",  AddressModeAbsoluteX, 3, null, ins.unofficialNopAbsoluteX],
    [0x3C, "*NOP",  AddressModeAbsoluteX, 3, null, ins.unofficialNopAbsoluteX],
    [0x5C, "*NOP",  AddressModeAbsoluteX, 3, null, ins.unofficialNopAbsoluteX],
    [0x7C, "*NOP",  AddressModeAbsoluteX, 3, null, ins.unofficialNopAbsoluteX],
    [0xDC, "*NOP",  AddressModeAbsoluteX, 3, null, ins.unofficialNopAbsoluteX],
    [0xFC, "*NOP",  AddressModeAbsoluteX, 3, null, ins.unofficialNopAbsoluteX],

    [0x09, "ORA",  AddressModeImmediate, 2, 2, e => ins.ora(e, readAddressImmediate(e, 2))],
    [0x05, "ORA",  AddressModeZeroPage, 2, 3, e => ins.ora(e, readAddressZeroPage(e, 3))],
    [0x15, "ORA",  AddressModeZeroPageX, 2, 4, e => ins.ora(e, readAddressZeroPageX(e, 4))],
    [0x0D, "ORA",  AddressModeAbsolute, 3, 4, e => ins.ora(e, readAddressAbsolute(e, 4))],
    [0x1D, "ORA",  AddressModeAbsoluteX, 3, 4, e => ins.ora(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0x19, "ORA",  AddressModeAbsoluteY, 3, 4, e => ins.ora(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0x01, "ORA",  AddressModeIndirectX, 2, 6, e => ins.ora(e, readAddressIndirectX(e, 6))],
    [0x11, "ORA",  AddressModeIndirectY, 2, 5, e => ins.ora(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0xC8, "INY",  AddressModeImplied, 1, null, ins.iny],
    [0x88, "DEY",  AddressModeImplied, 1, null, ins.dey],
    [0xA8, "TAY",  AddressModeImplied, 1, null, ins.tay],

    [0xE8, "INX",  AddressModeImplied, 1, null, ins.inx],
    [0xCA, "DEX",  AddressModeImplied, 1, null, ins.dex],

    [0xAA, "TAX",  AddressModeImplied, 1, null, ins.tax],
    [0xBA, "TSX",  AddressModeImplied, 1, null, ins.tsx],
    [0x8A, "TXA",  AddressModeImplied, 1, null, ins.txa],
    [0x98, "TYA",  AddressModeImplied, 1, null, ins.tya],
    [0x9A, "TXS",  AddressModeImplied, 1, null, ins.txs],

    [0x27, "*RLA", AddressModeZeroPage, 2, 5,  e => ins.rla(e, readAddressZeroPage(e, 5))],
    [0x37, "*RLA", AddressModeZeroPageX, 2, 6,  e => ins.rla(e, readAddressZeroPageX(e, 6))],
    [0x2F, "*RLA", AddressModeAbsolute, 3, 6,  e => ins.rla(e, readAddressAbsolute(e, 6))],
    [0x3F, "*RLA", AddressModeAbsoluteX, 3, 7,  e => ins.rla(e, readAddressAbsoluteX(e, 7))],
    [0x3B, "*RLA", AddressModeAbsoluteY, 3, 7,  e => ins.rla(e, readAddressAbsoluteY(e, 7))],
    [0x23, "*RLA", AddressModeIndirectX, 2, 8,  e => ins.rla(e, readAddressIndirectX(e, 8))],
    [0x33, "*RLA", AddressModeIndirectY, 2, 8,  e => ins.rla(e, readAddressIndirectY(e, 8))],

    [0x2A, "ROL",  AddressModeAccumulator, 1, null, e => ins.rolA(e)],
    [0x26, "ROL",  AddressModeZeroPage, 2, 5, e => ins.rol(e, readAddressZeroPage(e, 5))],
    [0x36, "ROL",  AddressModeZeroPageX, 2, 6, e => ins.rol(e, readAddressZeroPageX(e, 6))],
    [0x2E, "ROL",  AddressModeAbsolute, 3, 6, e => ins.rol(e, readAddressAbsolute(e, 6))],
    [0x3E, "ROL",  AddressModeAbsoluteX, 3, 7, e => ins.rol(e, readAddressAbsoluteX(e, 7))],

    [0x6A, "ROR",  AddressModeAccumulator, 1, null, ins.rorA],
    [0x66, "ROR",  AddressModeZeroPage, 2, 5, e => ins.ror(e, readAddressZeroPage(e, 5))],
    [0x76, "ROR",  AddressModeZeroPageX, 2, 6, e => ins.ror(e, readAddressZeroPageX(e, 6))],
    [0x6E, "ROR",  AddressModeAbsolute, 3, 6, e => ins.ror(e, readAddressAbsolute(e, 6))],
    [0x7E, "ROR",  AddressModeAbsoluteX, 3, 7, e => ins.ror(e, readAddressAbsoluteX(e, 7))],

    [0x67, "*RRA", AddressModeZeroPage, 2, 5,  e => ins.rra(e, readAddressZeroPage(e, 5))],
    [0x77, "*RRA", AddressModeZeroPageX, 2, 6,  e => ins.rra(e, readAddressZeroPageX(e, 6))],
    [0x6F, "*RRA", AddressModeAbsolute, 3, 6,  e => ins.rra(e, readAddressAbsolute(e, 6))],
    [0x7F, "*RRA", AddressModeAbsoluteX, 3, 7,  e => ins.rra(e, readAddressAbsoluteX(e, 7))],
    [0x7B, "*RRA", AddressModeAbsoluteY, 3, 7,  e => ins.rra(e, readAddressAbsoluteY(e, 7))],
    [0x63, "*RRA", AddressModeIndirectX, 2, 8,  e => ins.rra(e, readAddressIndirectX(e, 8))],
    [0x73, "*RRA", AddressModeIndirectY, 2, 8,  e => ins.rra(e, readAddressIndirectY(e, 8))],

    [0x87, "*SAX", AddressModeZeroPage, 2, 3,  e => ins.sax(e, readAddressZeroPage(e, 3))],
    [0x97, "*SAX", AddressModeZeroPageY, 2, 4,  e => ins.sax(e, readAddressZeroPageY(e, 4))],
    [0x83, "*SAX", AddressModeIndirectX, 2, 6,  e => ins.sax(e, readAddressIndirectX(e, 6))],
    [0x8F, "*SAX", AddressModeAbsolute, 3, 4,  e => ins.sax(e, readAddressAbsolute(e, 4))],

    [0xE9, "SBC", AddressModeImmediate, 2, 2,  e => ins.sbc(e, readAddressImmediate(e, 2))],
    [0xEB, "*SBC", AddressModeImmediate, 2, 2,  e => ins.sbc(e, readAddressImmediate(e, 2))],
    [0xE5, "SBC", AddressModeZeroPage, 2, 3,  e => ins.sbc(e, readAddressZeroPage(e, 3))],
    [0xF5, "SBC", AddressModeZeroPageX, 2, 4,  e => ins.sbc(e, readAddressZeroPageX(e, 4))],
    [0xED, "SBC", AddressModeAbsolute, 3, 4,  e => ins.sbc(e, readAddressAbsolute(e, 4))],
    [0xFD, "SBC", AddressModeAbsoluteX, 3, 4,  e => ins.sbc(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0xF9, "SBC", AddressModeAbsoluteY, 3, 4,  e => ins.sbc(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0xE1, "SBC", AddressModeIndirectX, 2, 6,  e => ins.sbc(e, readAddressIndirectX(e, 6))],
    [0xF1, "SBC", AddressModeIndirectY, 2, 5,  e => ins.sbc(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0x38, "SEC",  AddressModeImplied, 1, null, ins.sec],
    [0x78, "SEI",  AddressModeImplied, 1, null, ins.sei],
    [0xF8, "SED",  AddressModeImplied, 1, null, ins.sed],

    [0x07, "*SLO", AddressModeZeroPage, 2, 5,  e => ins.slo(e, readAddressZeroPage(e, 5))],
    [0x17, "*SLO", AddressModeZeroPageX, 2, 6,  e => ins.slo(e, readAddressZeroPageX(e, 6))],
    [0x0F, "*SLO", AddressModeAbsolute, 3, 6,  e => ins.slo(e, readAddressAbsolute(e, 6))],
    [0x1F, "*SLO", AddressModeAbsoluteX, 3, 7,  e => ins.slo(e, readAddressAbsoluteX(e, 7))],
    [0x1B, "*SLO", AddressModeAbsoluteY, 3, 7,  e => ins.slo(e, readAddressAbsoluteY(e, 7))],
    [0x03, "*SLO", AddressModeIndirectX, 2, 8,  e => ins.slo(e, readAddressIndirectX(e, 8))],
    [0x13, "*SLO", AddressModeIndirectY, 2, 8,  e => ins.slo(e, readAddressIndirectY(e, 8))],

    [0x47, "*SRE", AddressModeZeroPage, 2, 5,  e => ins.sre(e, readAddressZeroPage(e, 5))],
    [0x57, "*SRE", AddressModeZeroPageX, 2, 6,  e => ins.sre(e, readAddressZeroPageX(e, 6))],
    [0x4F, "*SRE", AddressModeAbsolute, 3, 6,  e => ins.sre(e, readAddressAbsolute(e, 6))],
    [0x5F, "*SRE", AddressModeAbsoluteX, 3, 7,  e => ins.sre(e, readAddressAbsoluteX(e, 7))],
    [0x5B, "*SRE", AddressModeAbsoluteY, 3, 7,  e => ins.sre(e, readAddressAbsoluteY(e, 7))],
    [0x43, "*SRE", AddressModeIndirectX, 2, 8,  e => ins.sre(e, readAddressIndirectX(e, 8))],
    [0x53, "*SRE", AddressModeIndirectY, 2, 8,  e => ins.sre(e, readAddressIndirectY(e, 8))],

    [0x85, "STA",  AddressModeZeroPage, 2, 3, e => ins.sta(e, readAddressZeroPage(e, 3))],
    [0x95, "STA",  AddressModeZeroPageX, 2, 4, e => ins.sta(e, readAddressZeroPageX(e, 4))],
    [0x8D, "STA",  AddressModeAbsolute, 3, 4, e => ins.sta(e, readAddressAbsolute(e, 4))],
    [0x9D, "STA",  AddressModeAbsoluteX, 3, 5, e => ins.sta(e, readAddressAbsoluteX(e, 5))],
    [0x99, "STA",  AddressModeAbsoluteY, 3, 5, e => ins.sta(e, readAddressAbsoluteY(e, 5))],
    [0x81, "STA",  AddressModeIndirectX, 2, 6, e => ins.sta(e, readAddressIndirectX(e, 6))],
    [0x91, "STA",  AddressModeIndirectY, 2, 6, e => ins.sta(e, readAddressIndirectY(e, 6))],

    [0x86, "STX",  AddressModeZeroPage, 2, 3, e => ins.stx(e, readAddressZeroPage(e, 3))],
    [0x96, "STX",  AddressModeZeroPageY, 2, 4, e => ins.stx(e, readAddressZeroPageY(e, 4))],
    [0x8E, "STX",  AddressModeAbsolute, 3, 4, e => ins.stx(e, readAddressAbsolute(e, 4))],

    [0x84, "STY",  AddressModeZeroPage, 2, 3, e => ins.sty(e, readAddressZeroPage(e, 3))],
    [0x94, "STY",  AddressModeZeroPageX, 2, 4, e => ins.sty(e, readAddressZeroPageX(e, 4))],
    [0x8C, "STY",  AddressModeAbsolute, 3, 4, e => ins.sty(e, readAddressAbsolute(e, 4))],

    [0x00, "BRK",  AddressModeImplied, 1, null, ins.brk],
    [0x08, "PHP",  AddressModeImplied, 1, null, ins.php],
    [0x48, "PHA",  AddressModeImplied, 1, null, ins.pha],
    [0x28, "PLP",  AddressModeImplied, 1, null, ins.plp],
    [0x40, "RTI",  AddressModeImplied, 1, null, ins.rti],
    [0x68, "PLA",  AddressModeImplied, 1, null, ins.pla],
    [0x20, "JSR",  AddressModeAbsolute, 3, null, ins.jsr],
    [0x60, "RTS",  AddressModeImplied, 1, null, ins.rts],

    [0x9E, "*SXA", AddressModeAbsoluteY, 3, null,  ins.sxa],
    [0x9C, "*SYA", AddressModeAbsoluteX, 3, null,  ins.sya]
];

export const opcodeMetadata = {};
export const opcodeTable = new Array(256);

_.forEach(opcodes, ([opcode, name, mode, instructionSize, cycles, implementation]) => {
    opcodeMetadata[opcode] = { name, mode, instructionSize };
    opcodeTable[opcode] = implementation;
})
