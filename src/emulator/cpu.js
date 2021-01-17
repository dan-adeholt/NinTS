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

const opcodes = [
    [0x0B, "*AAC", 'Immediate', 2, 2,  e => ins.aac(e, readAddressImmediate(e, 2))],
    [0x2B, "*AAC", 'Immediate', 2, 2,  e => ins.aac(e, readAddressImmediate(e, 2))],

    [0x69, "ADC",  'Immediate', 2, 2, e => ins.adc(e, readAddressImmediate(e, 2))],
    [0x65, "ADC",  'ZeroPage', 2, 3, e => ins.adc(e, readAddressZeroPage(e, 3)) ],
    [0x75, "ADC",  'ZeroPageX', 2, 4, e => ins.adc(e, readAddressZeroPageX(e, 4))],
    [0x6D, "ADC",  'Absolute', 3, 4, e => ins.adc(e, readAddressAbsolute(e, 4))],
    [0x7D, "ADC",  'AbsoluteX', 3, 4, e => ins.adc(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0x79, "ADC",  'AbsoluteY', 3, 4, e => ins.adc(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0x61, "ADC",  'IndirectX', 2, 6, e => ins.adc(e, readAddressIndirectX(e, 6))],
    [0x71, "ADC",  'IndirectY', 2, 5, e => ins.adc(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0x29, "AND",  'Immediate', 2, 2, e => ins.and(e, readAddressImmediate(e, 2))],
    [0x25, "AND",  'ZeroPage', 2, 3, e => ins.and(e, readAddressZeroPage(e, 3))],
    [0x35, "AND",  'ZeroPageX', 2, 4, e => ins.and(e, readAddressZeroPageX(e, 4))],
    [0x2D, "AND",  'Absolute', 3, 4, e => ins.and(e, readAddressAbsolute(e, 4))],
    [0x3D, "AND",  'AbsoluteX', 3, 4, e => ins.and(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0x39, "AND",  'AbsoluteY', 3, 4, e => ins.and(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0x21, "AND",  'IndirectX', 2, 6, e => ins.and(e, readAddressIndirectX(e, 6))],
    [0x31, "AND",  'IndirectY', 2, 5, e => ins.and(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0x6B, "*ARR", 'Immediate', 2, 2,  e => ins.arr(e, readAddressImmediate(e, 2))],

    [0x0A, "ASL",  'Accumulator', 1, null, ins.aslA],
    [0x06, "ASL",  'ZeroPage', 2, 5, e => ins.asl(e, readAddressZeroPage(e, 5))],
    [0x16, "ASL",  'ZeroPageX', 2, 6, e => ins.asl(e, readAddressZeroPageX(e, 6))],
    [0x0E, "ASL",  'Absolute', 3, 6, e => ins.asl(e, readAddressAbsolute(e, 6))],
    [0x1E, "ASL",  'AbsoluteX', 3, 7, e => ins.asl(e, readAddressAbsoluteX(e, 7))],

    [0x4B, "*ASR", 'Immediate', 2, 2,  e => ins.asr(e, readAddressImmediate(e, 2))],

    [0xAB, "*ATX", 'Immediate', 2, 2,  e => ins.atx(e, readAddressImmediate(e, 2))],

    [0xCB, "AXS",  'Immediate', 2, 2, e => ins.axs(e, readAddressImmediate(e, 2))],

    [0x24, "BIT",  'ZeroPage', 2, 3, e => ins.bit(e, readAddressZeroPage(e, 3))],
    [0x2C, "BIT",  'Absolute', 3, 4, e => ins.bit(e, readAddressAbsolute(e, 4))],

    [0x90, "BCC",  'Relative', 2, null, ins.bcc],
    [0xF0, "BEQ",  'Relative', 2, null, ins.beq],
    [0xD0, "BNE",  'Relative', 2, null, ins.bne],
    [0xB0, "BCS",  'Relative', 2, null, ins.bcs],
    [0x50, "BVC",  'Relative', 2, null, ins.bvc],
    [0x70, "BVS",  'Relative', 2, null, ins.bvs],
    [0x10, "BPL",  'Relative', 2, null, ins.bpl],
    [0x30, "BMI",  'Relative', 2, null, ins.bmi],

    [0x18, "CLC",  'Implied', 1, null, ins.clc],
    [0xD8, "CLD",  'Implied', 1, null, ins.cld],
    [0x58, "CLI",  'Implied', 1, null, ins.cli],
    [0xB8, "CLV",  'Implied', 1, null, ins.clv],

    [0xC9, "CMP",  'Immediate', 2, 2, e => ins.cmp(e, readAddressImmediate(e, 2))],
    [0xC5, "CMP",  'ZeroPage', 2, 3, e => ins.cmp(e, readAddressZeroPage(e, 3))],
    [0xD5, "CMP",  'ZeroPageX', 2, 4, e => ins.cmp(e, readAddressZeroPageX(e, 4))],
    [0xCD, "CMP",  'Absolute', 3, 4, e => ins.cmp(e, readAddressAbsolute(e, 4))],
    [0xDD, "CMP",  'AbsoluteX', 3, 4, e => ins.cmp(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0xD9, "CMP",  'AbsoluteY', 3, 4, e => ins.cmp(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0xC1, "CMP",  'IndirectX', 2, 6, e => ins.cmp(e, readAddressIndirectX(e, 6))],
    [0xD1, "CMP",  'IndirectY', 2, 5, e => ins.cmp(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0xE0, "CPX",  'Immediate', 2, 2, e => ins.cpx(e, readAddressImmediate(e, 2))],
    [0xE4, "CPX",  'ZeroPage', 2, 3, e => ins.cpx(e, readAddressZeroPage(e, 3))],
    [0xEC, "CPX",  'Absolute', 3, 4, e => ins.cpx(e, readAddressAbsolute(e, 4))],

    [0xC0, "CPY",  'Immediate', 2, 2, e => ins.cpy(e, readAddressImmediate(e, 2))],
    [0xC4, "CPY",  'ZeroPage', 2, 3, e => ins.cpy(e, readAddressZeroPage(e, 3))],
    [0xCC, "CPY",  'Absolute', 3, 4, e => ins.cpy(e, readAddressAbsolute(e, 4))],

    [0xC7, "*DCP", 'ZeroPage', 2, 5,  e => ins.dcp(e, readAddressZeroPage(e, 5))],
    [0xD7, "*DCP", 'ZeroPageX', 2, 6,  e => ins.dcp(e, readAddressZeroPageX(e, 6))],
    [0xCF, "*DCP", 'Absolute', 3, 6,  e => ins.dcp(e, readAddressAbsolute(e, 6))],
    [0xDF, "*DCP", 'AbsoluteX', 3, 7,  e => ins.dcp(e, readAddressAbsoluteX(e, 7))],
    [0xDB, "*DCP", 'AbsoluteY', 3, 7,  e => ins.dcp(e, readAddressAbsoluteY(e, 7))],
    [0xC3, "*DCP", 'IndirectX', 2, 8,  e => ins.dcp(e, readAddressIndirectX(e, 8))],
    [0xD3, "*DCP", 'IndirectY', 2, 8,  e => ins.dcp(e, readAddressIndirectY(e, 8))],

    [0xC6, "DEC",  'ZeroPage', 2, 5, e => ins.dec(e, readAddressZeroPage(e, 5))],
    [0xD6, "DEC",  'ZeroPageX', 2, 6, e => ins.dec(e, readAddressZeroPageX(e, 6))],
    [0xCE, "DEC",  'Absolute', 3, 6, e => ins.dec(e, readAddressAbsolute(e, 6))],
    [0xDE, "DEC",  'AbsoluteX', 3, 7, e => ins.dec(e, readAddressAbsoluteX(e, 7))],

    [0x49, "EOR",  'Immediate', 2, 2, e => ins.eor(e, readAddressImmediate(e, 2))],
    [0x45, "EOR",  'ZeroPage', 2, 3, e => ins.eor(e, readAddressZeroPage(e, 3)) ],
    [0x55, "EOR",  'ZeroPageX', 2, 4, e => ins.eor(e, readAddressZeroPageX(e, 4))],
    [0x4D, "EOR",  'Absolute', 3, 4, e => ins.eor(e, readAddressAbsolute(e, 4))],
    [0x5D, "EOR",  'AbsoluteX', 3, 4, e => ins.eor(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0x59, "EOR",  'AbsoluteY', 3, 4, e => ins.eor(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0x41, "EOR",  'IndirectX', 2, 6, e => ins.eor(e, readAddressIndirectX(e, 6))],
    [0x51, "EOR",  'IndirectY', 2, 5, e => ins.eor(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0xE6, "INC",  'ZeroPage', 2, 5, e => ins.inc(e, readAddressZeroPage(e, 5))],
    [0xF6, "INC",  'ZeroPageX', 2, 6, e => ins.inc(e, readAddressZeroPageX(e, 6))],
    [0xEE, "INC",  'Absolute', 3, 6, e => ins.inc(e, readAddressAbsolute(e, 6))],
    [0xFE, "INC",  'AbsoluteX', 3, 7, e => ins.inc(e, readAddressAbsoluteX(e, 7))],

    [0xE7, "*ISB", 'ZeroPage', 2, 5,  e => ins.isb(e, readAddressZeroPage(e, 5))],
    [0xF7, "*ISB", 'ZeroPageX', 2, 6,  e => ins.isb(e, readAddressZeroPageX(e, 6))],
    [0xEF, "*ISB", 'Absolute', 3, 6,  e => ins.isb(e, readAddressAbsolute(e, 6))],
    [0xFF, "*ISB", 'AbsoluteX', 3, 7,  e => ins.isb(e, readAddressAbsoluteX(e, 7))],
    [0xFB, "*ISB", 'AbsoluteY', 3, 7,  e => ins.isb(e, readAddressAbsoluteY(e, 7))],
    [0xE3, "*ISB", 'IndirectX', 2, 8,  e => ins.isb(e, readAddressIndirectX(e, 8))],
    [0xF3, "*ISB", 'IndirectY', 2, 8,  e => ins.isb(e, readAddressIndirectY(e, 8))],

    [0x4C, "JMP",  'Absolute', 3, null, ins.jmpAbsolute],
    [0x6C, "JMP",  'Indirect', 3, null, ins.jmpIndirect],

    [0xA7, "*LAX", 'ZeroPage', 2, 3,  e => ins.lax(e, readAddressZeroPage(e, 3))],
    [0xB7, "*LAX", 'ZeroPageY', 2, 4,  e => ins.lax(e, readAddressZeroPageY(e, 4))],
    [0xAF, "*LAX", 'Absolute', 3, 4,  e => ins.lax(e, readAddressAbsolute(e, 4))],
    [0xBF, "*LAX", 'AbsoluteY', 3, 4,  e => ins.lax(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0xA3, "*LAX", 'IndirectX', 2, 6,  e => ins.lax(e, readAddressIndirectX(e, 6))],
    [0xB3, "*LAX", 'IndirectY', 2, 5,  e => ins.lax(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0xA9, "LDA",  'Immediate', 2, 2, e => ins.lda(e, readAddressImmediate(e, 2))],
    [0xA5, "LDA",  'ZeroPage', 2, 3, e => ins.lda(e, readAddressZeroPage(e, 3))],
    [0xB5, "LDA",  'ZeroPageX', 2, 4, e => ins.lda(e, readAddressZeroPageX(e, 4))],
    [0xAD, "LDA",  'Absolute', 3, 4, e => ins.lda(e, readAddressAbsolute(e, 4))],
    [0xBD, "LDA",  'AbsoluteX', 3, 4, e => ins.lda(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0xB9, "LDA",  'AbsoluteY', 3, 4, e => ins.lda(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0xA1, "LDA",  'IndirectX', 2, 6, e => ins.lda(e, readAddressIndirectX(e, 6))],
    [0xB1, "LDA",  'IndirectY', 2, 5, e => ins.lda(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0xA2, "LDX",  'Immediate', 2, 2, e => ins.ldx(e, readAddressImmediate(e, 2))],
    [0xA6, "LDX",  'ZeroPage', 2, 3, e => ins.ldx(e, readAddressZeroPage(e, 3)) ],
    [0xB6, "LDX",  'ZeroPageY', 2, 4, e => ins.ldx(e, readAddressZeroPageY(e, 4))],
    [0xAE, "LDX",  'Absolute', 3, 4, e => ins.ldx(e, readAddressAbsolute(e, 4))],
    [0xBE, "LDX",  'AbsoluteY', 3, 4, e => ins.ldx(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],

    [0xA0, "LDY",  'Immediate', 2, 2, e => ins.ldy(e, readAddressImmediate(e, 2))],
    [0xA4, "LDY",  'ZeroPage', 2, 3, e => ins.ldy(e, readAddressZeroPage(e, 3))],
    [0xB4, "LDY",  'ZeroPageX', 2, 4, e => ins.ldy(e, readAddressZeroPageX(e, 4))],
    [0xAC, "LDY",  'Absolute', 3, 4, e => ins.ldy(e, readAddressAbsolute(e, 4))],
    [0xBC, "LDY",  'AbsoluteX', 3, 4, e => ins.ldy(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],

    [0x4A, "LSR",  'Accumulator', 1, null, ins.lsrA],
    [0x46, "LSR",  'ZeroPage', 2, 5, e => ins.lsr(e, readAddressZeroPage(e, 5))],
    [0x56, "LSR",  'ZeroPageX', 2, 6, e => ins.lsr(e, readAddressZeroPageX(e, 6))],
    [0x4E, "LSR",  'Absolute', 3, 6, e => ins.lsr(e, readAddressAbsolute(e, 6))],
    [0x5E, "LSR",  'AbsoluteX', 3, 7, e => ins.lsr(e, readAddressAbsoluteX(e, 7))],

    [0xEA, "NOP",  'Implied', 1, null, ins.nop],
    [0x1A, "*NOP", 'Implied', 1, null,  ins.nop],
    [0x3A, "*NOP", 'Implied', 1, null,  ins.nop],
    [0x5A, "*NOP", 'Implied', 1, null,  ins.nop],
    [0x7A, "*NOP", 'Implied', 1, null,  ins.nop],
    [0xDA, "*NOP", 'Implied', 1, null,  ins.nop],
    [0xFA, "*NOP", 'Implied', 1, null,  ins.nop],
    [0x80, "*NOP", 'Immediate', 2, null,  ins.unofficialNopImmediate],
    [0x82, "*NOP", 'Immediate', 2, null,  ins.unofficialNopImmediate],
    [0x89, "*NOP", 'Immediate', 2, null,  ins.unofficialNopImmediate],
    [0xC2, "*NOP", 'Immediate', 2, null,  ins.unofficialNopImmediate],
    [0xE2, "*NOP", 'Immediate', 2, null,  ins.unofficialNopImmediate],
    [0x04, "*NOP", 'ZeroPage', 2, null,  ins.unofficialNopZeroPage],
    [0x44, "*NOP", 'ZeroPage', 2, null,  ins.unofficialNopZeroPage],
    [0x64, "*NOP", 'ZeroPage', 2, null,  ins.unofficialNopZeroPage],
    [0x0C, "*NOP", 'Absolute', 3, null,  ins.unofficialNopAbsolute],
    [0x14, "*NOP", 'ZeroPageX', 2, null,  ins.unofficialNopZeroPageX],
    [0x34, "*NOP", 'ZeroPageX', 2, null,  ins.unofficialNopZeroPageX],
    [0x54, "*NOP", 'ZeroPageX', 2, null,  ins.unofficialNopZeroPageX],
    [0x74, "*NOP", 'ZeroPageX', 2, null,  ins.unofficialNopZeroPageX],
    [0xD4, "*NOP", 'ZeroPageX', 2, null,  ins.unofficialNopZeroPageX],
    [0xF4, "*NOP", 'ZeroPageX', 2, null,  ins.unofficialNopZeroPageX],

    [0x1C, "*NOP",  'AbsoluteX', 3, null, ins.unofficialNopAbsoluteX],
    [0x3C, "*NOP",  'AbsoluteX', 3, null, ins.unofficialNopAbsoluteX],
    [0x5C, "*NOP",  'AbsoluteX', 3, null, ins.unofficialNopAbsoluteX],
    [0x7C, "*NOP",  'AbsoluteX', 3, null, ins.unofficialNopAbsoluteX],
    [0xDC, "*NOP",  'AbsoluteX', 3, null, ins.unofficialNopAbsoluteX],
    [0xFC, "*NOP",  'AbsoluteX', 3, null, ins.unofficialNopAbsoluteX],

    [0x09, "ORA",  'Immediate', 2, 2, e => ins.ora(e, readAddressImmediate(e, 2))],
    [0x05, "ORA",  'ZeroPage', 2, 3, e => ins.ora(e, readAddressZeroPage(e, 3))],
    [0x15, "ORA",  'ZeroPageX', 2, 4, e => ins.ora(e, readAddressZeroPageX(e, 4))],
    [0x0D, "ORA",  'Absolute', 3, 4, e => ins.ora(e, readAddressAbsolute(e, 4))],
    [0x1D, "ORA",  'AbsoluteX', 3, 4, e => ins.ora(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0x19, "ORA",  'AbsoluteY', 3, 4, e => ins.ora(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0x01, "ORA",  'IndirectX', 2, 6, e => ins.ora(e, readAddressIndirectX(e, 6))],
    [0x11, "ORA",  'IndirectY', 2, 5, e => ins.ora(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0xC8, "INY",  'Implied', 1, null, ins.iny],
    [0x88, "DEY",  'Implied', 1, null, ins.dey],
    [0xA8, "TAY",  'Implied', 1, null, ins.tay],

    [0xE8, "INX",  'Implied', 1, null, ins.inx],
    [0xCA, "DEX",  'Implied', 1, null, ins.dex],

    [0xAA, "TAX",  'Implied', 1, null, ins.tax],
    [0xBA, "TSX",  'Implied', 1, null, ins.tsx],
    [0x8A, "TXA",  'Implied', 1, null, ins.txa],
    [0x98, "TYA",  'Implied', 1, null, ins.tya],
    [0x9A, "TXS",  'Implied', 1, null, ins.txs],

    [0x27, "*RLA", 'ZeroPage', 2, 5,  e => ins.rla(e, readAddressZeroPage(e, 5))],
    [0x37, "*RLA", 'ZeroPageX', 2, 6,  e => ins.rla(e, readAddressZeroPageX(e, 6))],
    [0x2F, "*RLA", 'Absolute', 3, 6,  e => ins.rla(e, readAddressAbsolute(e, 6))],
    [0x3F, "*RLA", 'AbsoluteX', 3, 7,  e => ins.rla(e, readAddressAbsoluteX(e, 7))],
    [0x3B, "*RLA", 'AbsoluteY', 3, 7,  e => ins.rla(e, readAddressAbsoluteY(e, 7))],
    [0x23, "*RLA", 'IndirectX', 2, 8,  e => ins.rla(e, readAddressIndirectX(e, 8))],
    [0x33, "*RLA", 'IndirectY', 2, 8,  e => ins.rla(e, readAddressIndirectY(e, 8))],

    [0x2A, "ROL",  'Accumulator', 1, null, e => ins.rolA(e)],
    [0x26, "ROL",  'ZeroPage', 2, 5, e => ins.rol(e, readAddressZeroPage(e, 5))],
    [0x36, "ROL",  'ZeroPageX', 2, 6, e => ins.rol(e, readAddressZeroPageX(e, 6))],
    [0x2E, "ROL",  'Absolute', 3, 6, e => ins.rol(e, readAddressAbsolute(e, 6))],
    [0x3E, "ROL",  'AbsoluteX', 3, 7, e => ins.rol(e, readAddressAbsoluteX(e, 7))],

    [0x6A, "ROR",  'Accumulator', 1, null, ins.rorA],
    [0x66, "ROR",  'ZeroPage', 2, 5, e => ins.ror(e, readAddressZeroPage(e, 5))],
    [0x76, "ROR",  'ZeroPageX', 2, 6, e => ins.ror(e, readAddressZeroPageX(e, 6))],
    [0x6E, "ROR",  'Absolute', 3, 6, e => ins.ror(e, readAddressAbsolute(e, 6))],
    [0x7E, "ROR",  'AbsoluteX', 3, 7, e => ins.ror(e, readAddressAbsoluteX(e, 7))],

    [0x67, "*RRA", 'ZeroPage', 2, 5,  e => ins.rra(e, readAddressZeroPage(e, 5))],
    [0x77, "*RRA", 'ZeroPageX', 2, 6,  e => ins.rra(e, readAddressZeroPageX(e, 6))],
    [0x6F, "*RRA", 'Absolute', 3, 6,  e => ins.rra(e, readAddressAbsolute(e, 6))],
    [0x7F, "*RRA", 'AbsoluteX', 3, 7,  e => ins.rra(e, readAddressAbsoluteX(e, 7))],
    [0x7B, "*RRA", 'AbsoluteY', 3, 7,  e => ins.rra(e, readAddressAbsoluteY(e, 7))],
    [0x63, "*RRA", 'IndirectX', 2, 8,  e => ins.rra(e, readAddressIndirectX(e, 8))],
    [0x73, "*RRA", 'IndirectY', 2, 8,  e => ins.rra(e, readAddressIndirectY(e, 8))],

    [0x87, "*SAX", 'ZeroPage', 2, 3,  e => ins.sax(e, readAddressZeroPage(e, 3))],
    [0x97, "*SAX", 'ZeroPageY', 2, 4,  e => ins.sax(e, readAddressZeroPageY(e, 4))],
    [0x83, "*SAX", 'IndirectX', 2, 6,  e => ins.sax(e, readAddressIndirectX(e, 6))],
    [0x8F, "*SAX", 'Absolute', 3, 4,  e => ins.sax(e, readAddressAbsolute(e, 4))],

    [0xE9, "SBC", 'Immediate', 2, 2,  e => ins.sbc(e, readAddressImmediate(e, 2))],
    [0xEB, "*SBC", 'Immediate', 2, 2,  e => ins.sbc(e, readAddressImmediate(e, 2))],
    [0xE5, "SBC", 'ZeroPage', 2, 3,  e => ins.sbc(e, readAddressZeroPage(e, 3))],
    [0xF5, "SBC", 'ZeroPageX', 2, 4,  e => ins.sbc(e, readAddressZeroPageX(e, 4))],
    [0xED, "SBC", 'Absolute', 3, 4,  e => ins.sbc(e, readAddressAbsolute(e, 4))],
    [0xFD, "SBC", 'AbsoluteX', 3, 4,  e => ins.sbc(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0xF9, "SBC", 'AbsoluteY', 3, 4,  e => ins.sbc(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0xE1, "SBC", 'IndirectX', 2, 6,  e => ins.sbc(e, readAddressIndirectX(e, 6))],
    [0xF1, "SBC", 'IndirectY', 2, 5,  e => ins.sbc(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0x38, "SEC",  'Implied', 1, null, ins.sec],
    [0x78, "SEI",  'Implied', 1, null, ins.sei],
    [0xF8, "SED",  'Implied', 1, null, ins.sed],

    [0x07, "*SLO", 'ZeroPage', 2, 5,  e => ins.slo(e, readAddressZeroPage(e, 5))],
    [0x17, "*SLO", 'ZeroPageX', 2, 6,  e => ins.slo(e, readAddressZeroPageX(e, 6))],
    [0x0F, "*SLO", 'Absolute', 3, 6,  e => ins.slo(e, readAddressAbsolute(e, 6))],
    [0x1F, "*SLO", 'AbsoluteX', 3, 7,  e => ins.slo(e, readAddressAbsoluteX(e, 7))],
    [0x1B, "*SLO", 'AbsoluteY', 3, 7,  e => ins.slo(e, readAddressAbsoluteY(e, 7))],
    [0x03, "*SLO", 'IndirectX', 2, 8,  e => ins.slo(e, readAddressIndirectX(e, 8))],
    [0x13, "*SLO", 'IndirectY', 2, 8,  e => ins.slo(e, readAddressIndirectY(e, 8))],

    [0x47, "*SRE", 'ZeroPage', 2, 5,  e => ins.sre(e, readAddressZeroPage(e, 5))],
    [0x57, "*SRE", 'ZeroPageX', 2, 6,  e => ins.sre(e, readAddressZeroPageX(e, 6))],
    [0x4F, "*SRE", 'Absolute', 3, 6,  e => ins.sre(e, readAddressAbsolute(e, 6))],
    [0x5F, "*SRE", 'AbsoluteX', 3, 7,  e => ins.sre(e, readAddressAbsoluteX(e, 7))],
    [0x5B, "*SRE", 'AbsoluteY', 3, 7,  e => ins.sre(e, readAddressAbsoluteY(e, 7))],
    [0x43, "*SRE", 'IndirectX', 2, 8,  e => ins.sre(e, readAddressIndirectX(e, 8))],
    [0x53, "*SRE", 'IndirectY', 2, 8,  e => ins.sre(e, readAddressIndirectY(e, 8))],

    [0x85, "STA",  'ZeroPage', 2, 3, e => ins.sta(e, readAddressZeroPage(e, 3))],
    [0x95, "STA",  'ZeroPageX', 2, 4, e => ins.sta(e, readAddressZeroPageX(e, 4))],
    [0x8D, "STA",  'Absolute', 3, 4, e => ins.sta(e, readAddressAbsolute(e, 4))],
    [0x9D, "STA",  'AbsoluteX', 3, 5, e => ins.sta(e, readAddressAbsoluteX(e, 5))],
    [0x99, "STA",  'AbsoluteY', 3, 5, e => ins.sta(e, readAddressAbsoluteY(e, 5))],
    [0x81, "STA",  'IndirectX', 2, 6, e => ins.sta(e, readAddressIndirectX(e, 6))],
    [0x91, "STA",  'IndirectY', 2, 6, e => ins.sta(e, readAddressIndirectY(e, 6))],

    [0x86, "STX",  'ZeroPage', 2, 3, e => ins.stx(e, readAddressZeroPage(e, 3))],
    [0x96, "STX",  'ZeroPageY', 2, 4, e => ins.stx(e, readAddressZeroPageY(e, 4))],
    [0x8E, "STX",  'Absolute', 3, 4, e => ins.stx(e, readAddressAbsolute(e, 4))],

    [0x84, "STY",  'ZeroPage', 2, 3, e => ins.sty(e, readAddressZeroPage(e, 3))],
    [0x94, "STY",  'ZeroPageX', 2, 4, e => ins.sty(e, readAddressZeroPageX(e, 4))],
    [0x8C, "STY",  'Absolute', 3, 4, e => ins.sty(e, readAddressAbsolute(e, 4))],

    [0x00, "BRK",  'Implied', 1, null, ins.brk],
    [0x08, "PHP",  'Implied', 1, null, ins.php],
    [0x48, "PHA",  'Implied', 1, null, ins.pha],
    [0x28, "PLP",  'Implied', 1, null, ins.plp],
    [0x40, "RTI",  'Implied', 1, null, ins.rti],
    [0x68, "PLA",  'Implied', 1, null, ins.pla],
    [0x20, "JSR",  'Absolute', 3, null, ins.jsr],
    [0x60, "RTS",  'Implied', 1, null, ins.rts],

    [0x9E, "*SXA", 'AbsoluteY', 3, null,  ins.sxa],
    [0x9C, "*SYA", 'AbsoluteX', 3, null,  ins.sya]
];

export const opcodeMetadata = {};
export const opcodeTable = new Array(256);

_.forEach(opcodes, ([opcode, name, mode, instructionSize, cycles, implementation]) => {
    opcodeMetadata[opcode] = { name, mode, instructionSize };
    opcodeTable[opcode] = implementation;
})
