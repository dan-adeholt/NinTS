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
    [0x0B, "*AAC", e => ins.aac(e, readAddressImmediate(e, 2))],
    [0x2B, "*AAC", e => ins.aac(e, readAddressImmediate(e, 2))],

    [0x69, "ADC", e => ins.adc(e, readAddressImmediate(e, 2))],
    [0x65, "ADC", e => ins.adc(e, readAddressZeroPage(e, 3)) ],
    [0x75, "ADC", e => ins.adc(e, readAddressZeroPageX(e, 4))],
    [0x6D, "ADC", e => ins.adc(e, readAddressAbsolute(e, 4))],
    [0x7D, "ADC", e => ins.adc(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0x79, "ADC", e => ins.adc(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0x61, "ADC", e => ins.adc(e, readAddressIndirectX(e, 6))],
    [0x71, "ADC", e => ins.adc(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0x29, "AND", e => ins.and(e, readAddressImmediate(e, 2))],
    [0x25, "AND", e => ins.and(e, readAddressZeroPage(e, 3)) ],
    [0x35, "AND", e => ins.and(e, readAddressZeroPageX(e, 4))],
    [0x2D, "AND", e => ins.and(e, readAddressAbsolute(e, 4))],
    [0x3D, "AND", e => ins.and(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0x39, "AND", e => ins.and(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0x21, "AND", e => ins.and(e, readAddressIndirectX(e, 6))],
    [0x31, "AND", e => ins.and(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0x6B, "*ARR", e => ins.arr(e, readAddressImmediate(e, 2))],

    [0x0A, "ASL", ins.aslA],
    [0x06, "ASL", e => ins.asl(e, readAddressZeroPage(e, 5))],
    [0x16, "ASL", e => ins.asl(e, readAddressZeroPageX(e, 6))],
    [0x0E, "ASL", e => ins.asl(e, readAddressAbsolute(e, 6))],
    [0x1E, "ASL", e => ins.asl(e, readAddressAbsoluteX(e, 7))],

    [0x4B, "*ASR", e => ins.asr(e, readAddressImmediate(e, 2))],

    [0xAB, "*ATX", e => ins.atx(e, readAddressImmediate(e, 2))],

    [0xCB, "AXS", e => ins.axs(e, readAddressImmediate(e, 2))],

    [0x24, "BIT", e => ins.bit(e, readAddressZeroPage(e, 3))],
    [0x2C, "BIT", e => ins.bit(e, readAddressAbsolute(e, 4))],

    [0x90, "BCC", ins.bcc],
    [0xF0, "BEQ", ins.beq],
    [0xD0, "BNE", ins.bne],
    [0xB0, "BCS", ins.bcs],
    [0x50, "BVC", ins.bvc],
    [0x70, "BVS", ins.bvs],
    [0x10, "BPL", ins.bpl],
    [0x30, "BMI", ins.bmi],

    [0x18, "CLC", ins.clc],
    [0xD8, "CLD", ins.cld],
    [0x58, "CLI", ins.cli],
    [0xB8, "CLV", ins.clv],

    [0xC9, "CMP", e => ins.cmp(e, readAddressImmediate(e, 2))],
    [0xC5, "CMP", e => ins.cmp(e, readAddressZeroPage(e, 3))],
    [0xD5, "CMP", e => ins.cmp(e, readAddressZeroPageX(e, 4))],
    [0xCD, "CMP", e => ins.cmp(e, readAddressAbsolute(e, 4))],
    [0xDD, "CMP", e => ins.cmp(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0xD9, "CMP", e => ins.cmp(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0xC1, "CMP", e => ins.cmp(e, readAddressIndirectX(e, 6))],
    [0xD1, "CMP", e => ins.cmp(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0xE0, "CPX", e => ins.cpx(e, readAddressImmediate(e, 2))],
    [0xE4, "CPX", e => ins.cpx(e, readAddressZeroPage(e, 3))],
    [0xEC, "CPX", e => ins.cpx(e, readAddressAbsolute(e, 4))],

    [0xC0, "CPY", e => ins.cpy(e, readAddressImmediate(e, 2))],
    [0xC4, "CPY", e => ins.cpy(e, readAddressZeroPage(e, 3))],
    [0xCC, "CPY", e => ins.cpy(e, readAddressAbsolute(e, 4))],

    [0xC7, "*DCP", e => ins.dcp(e, readAddressZeroPage(e, 5))],
    [0xD7, "*DCP", e => ins.dcp(e, readAddressZeroPageX(e, 6))],
    [0xCF, "*DCP", e => ins.dcp(e, readAddressAbsolute(e, 6))],
    [0xDF, "*DCP", e => ins.dcp(e, readAddressAbsoluteX(e, 7))],
    [0xDB, "*DCP", e => ins.dcp(e, readAddressAbsoluteY(e, 7))],
    [0xC3, "*DCP", e => ins.dcp(e, readAddressIndirectX(e, 8))],
    [0xD3, "*DCP", e => ins.dcp(e, readAddressIndirectY(e, 8))],

    [0xC6, "DEC", e => ins.dec(e, readAddressZeroPage(e, 5))],
    [0xD6, "DEC", e => ins.dec(e, readAddressZeroPageX(e, 6))],
    [0xCE, "DEC", e => ins.dec(e, readAddressAbsolute(e, 6))],
    [0xDE, "DEC", e => ins.dec(e, readAddressAbsoluteX(e, 7))],

    [0x49, "EOR", e => ins.eor(e, readAddressImmediate(e, 2))],
    [0x45, "EOR", e => ins.eor(e, readAddressZeroPage(e, 3)) ],
    [0x55, "EOR", e => ins.eor(e, readAddressZeroPageX(e, 4))],
    [0x4D, "EOR", e => ins.eor(e, readAddressAbsolute(e, 4))],
    [0x5D, "EOR", e => ins.eor(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0x59, "EOR", e => ins.eor(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0x41, "EOR", e => ins.eor(e, readAddressIndirectX(e, 6))],
    [0x51, "EOR", e => ins.eor(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0xE6, "INC", e => ins.inc(e, readAddressZeroPage(e, 5))],
    [0xF6, "INC", e => ins.inc(e, readAddressZeroPageX(e, 6))],
    [0xEE, "INC", e => ins.inc(e, readAddressAbsolute(e, 6))],
    [0xFE, "INC", e => ins.inc(e, readAddressAbsoluteX(e, 7))],

    [0xE7, "*ISB", e => ins.isb(e, readAddressZeroPage(e, 5))],
    [0xF7, "*ISB", e => ins.isb(e, readAddressZeroPageX(e, 6))],
    [0xEF, "*ISB", e => ins.isb(e, readAddressAbsolute(e, 6))],
    [0xFF, "*ISB", e => ins.isb(e, readAddressAbsoluteX(e, 7))],
    [0xFB, "*ISB", e => ins.isb(e, readAddressAbsoluteY(e, 7))],
    [0xE3, "*ISB", e => ins.isb(e, readAddressIndirectX(e, 8))],
    [0xF3, "*ISB", e => ins.isb(e, readAddressIndirectY(e, 8))],

    [0x4C, "JMP", ins.jmpAbsolute],
    [0x6C, "JMP", ins.jmpIndirect],

    [0xA7, "*LAX", e => ins.lax(e, readAddressZeroPage(e, 3))],
    [0xB7, "*LAX", e => ins.lax(e, readAddressZeroPageY(e, 4))],
    [0xAF, "*LAX", e => ins.lax(e, readAddressAbsolute(e, 4))],
    [0xBF, "*LAX", e => ins.lax(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0xA3, "*LAX", e => ins.lax(e, readAddressIndirectX(e, 6))],
    [0xB3, "*LAX", e => ins.lax(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0xA9, "LDA", e => ins.lda(e, readAddressImmediate(e, 2))],
    [0xA5, "LDA", e => ins.lda(e, readAddressZeroPage(e, 3))],
    [0xB5, "LDA", e => ins.lda(e, readAddressZeroPageX(e, 4))],
    [0xAD, "LDA", e => ins.lda(e, readAddressAbsolute(e, 4))],
    [0xBD, "LDA", e => ins.lda(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0xB9, "LDA", e => ins.lda(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0xA1, "LDA", e => ins.lda(e, readAddressIndirectX(e, 6))],
    [0xB1, "LDA", e => ins.lda(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0xA2, "LDX", e => ins.ldx(e, readAddressImmediate(e, 2))],
    [0xA6, "LDX", e => ins.ldx(e, readAddressZeroPage(e, 3)) ],
    [0xB6, "LDX", e => ins.ldx(e, readAddressZeroPageY(e, 4))],
    [0xAE, "LDX", e => ins.ldx(e, readAddressAbsolute(e, 4))],
    [0xBE, "LDX", e => ins.ldx(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],

    [0xA0, "LDY", e => ins.ldy(e, readAddressImmediate(e, 2))],
    [0xA4, "LDY", e => ins.ldy(e, readAddressZeroPage(e, 3)) ],
    [0xB4, "LDY", e => ins.ldy(e, readAddressZeroPageX(e, 4))],
    [0xAC, "LDY", e => ins.ldy(e, readAddressAbsolute(e, 4))],
    [0xBC, "LDY", e => ins.ldy(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],

    [0x4A, "LSR", ins.lsrA],
    [0x46, "LSR", e => ins.lsr(e, readAddressZeroPage(e, 5))],
    [0x56, "LSR", e => ins.lsr(e, readAddressZeroPageX(e, 6))],
    [0x4E, "LSR", e => ins.lsr(e, readAddressAbsolute(e, 6))],
    [0x5E, "LSR", e => ins.lsr(e, readAddressAbsoluteX(e, 7))],

    [0xEA, "NOP", ins.nop],
    [0x1A, "*NOP", ins.nop],
    [0x3A, "*NOP", ins.nop],
    [0x5A, "*NOP", ins.nop],
    [0x7A, "*NOP", ins.nop],
    [0xDA, "*NOP", ins.nop],
    [0xFA, "*NOP", ins.nop],
    [0x80, "*NOP", ins.unofficialNopImmediate],
    [0x82, "*NOP", ins.unofficialNopImmediate],
    [0x89, "*NOP", ins.unofficialNopImmediate],
    [0xC2, "*NOP", ins.unofficialNopImmediate],
    [0xE2, "*NOP", ins.unofficialNopImmediate],
    [0x04, "*NOP", ins.unofficialNopZeroPage],
    [0x44, "*NOP", ins.unofficialNopZeroPage],
    [0x64, "*NOP", ins.unofficialNopZeroPage],
    [0x0C, "*NOP", ins.unofficialNopAbsolute],
    [0x14, "*NOP", ins.unofficialNopZeroPageX],
    [0x34, "*NOP", ins.unofficialNopZeroPageX],
    [0x54, "*NOP", ins.unofficialNopZeroPageX],
    [0x74, "*NOP", ins.unofficialNopZeroPageX],
    [0xD4, "*NOP", ins.unofficialNopZeroPageX],
    [0xF4, "*NOP", ins.unofficialNopZeroPageX],

    [0x1C, "NOP", ins.unofficialNopAbsoluteX],
    [0x3C, "NOP", ins.unofficialNopAbsoluteX],
    [0x5C, "NOP", ins.unofficialNopAbsoluteX],
    [0x7C, "NOP", ins.unofficialNopAbsoluteX],
    [0xDC, "NOP", ins.unofficialNopAbsoluteX],
    [0xFC, "NOP", ins.unofficialNopAbsoluteX],

    [0x09, "ORA", e => ins.ora(e, readAddressImmediate(e, 2))],
    [0x05, "ORA", e => ins.ora(e, readAddressZeroPage(e, 3)) ],
    [0x15, "ORA", e => ins.ora(e, readAddressZeroPageX(e, 4))],
    [0x0D, "ORA", e => ins.ora(e, readAddressAbsolute(e, 4))],
    [0x1D, "ORA", e => ins.ora(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0x19, "ORA", e => ins.ora(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0x01, "ORA", e => ins.ora(e, readAddressIndirectX(e, 6))],
    [0x11, "ORA", e => ins.ora(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0xC8, "INY", ins.iny],
    [0x88, "DEY", ins.dey],
    [0xA8, "TAY", ins.tay],

    [0xE8, "INX", ins.inx],
    [0xCA, "DEX", ins.dex],

    [0xAA, "TAX", ins.tax],
    [0xBA, "TSX", ins.tsx],
    [0x8A, "TXA", ins.txa],
    [0x98, "TYA", ins.tya],
    [0x9A, "TXS", ins.txs],

    [0x27, "*RLA", e => ins.rla(e, readAddressZeroPage(e, 5))],
    [0x37, "*RLA", e => ins.rla(e, readAddressZeroPageX(e, 6))],
    [0x2F, "*RLA", e => ins.rla(e, readAddressAbsolute(e, 6))],
    [0x3F, "*RLA", e => ins.rla(e, readAddressAbsoluteX(e, 7))],
    [0x3B, "*RLA", e => ins.rla(e, readAddressAbsoluteY(e, 7))],
    [0x23, "*RLA", e => ins.rla(e, readAddressIndirectX(e, 8))],
    [0x33, "*RLA", e => ins.rla(e, readAddressIndirectY(e, 8))],

    [0x2A, "ROL", e => ins.rolA(e)],
    [0x26, "ROL", e => ins.rol(e, readAddressZeroPage(e, 5))],
    [0x36, "ROL", e => ins.rol(e, readAddressZeroPageX(e, 6))],
    [0x2E, "ROL", e => ins.rol(e, readAddressAbsolute(e, 6))],
    [0x3E, "ROL", e => ins.rol(e, readAddressAbsoluteX(e, 7))],

    [0x6A, "ROR", ins.rorA],
    [0x66, "ROR", e => ins.ror(e, readAddressZeroPage(e, 5))],
    [0x76, "ROR", e => ins.ror(e, readAddressZeroPageX(e, 6))],
    [0x6E, "ROR", e => ins.ror(e, readAddressAbsolute(e, 6))],
    [0x7E, "ROR", e => ins.ror(e, readAddressAbsoluteX(e, 7))],

    [0x67, "*RRA", e => ins.rra(e, readAddressZeroPage(e, 5))],
    [0x77, "*RRA", e => ins.rra(e, readAddressZeroPageX(e, 6))],
    [0x6F, "*RRA", e => ins.rra(e, readAddressAbsolute(e, 6))],
    [0x7F, "*RRA", e => ins.rra(e, readAddressAbsoluteX(e, 7))],
    [0x7B, "*RRA", e => ins.rra(e, readAddressAbsoluteY(e, 7))],
    [0x63, "*RRA", e => ins.rra(e, readAddressIndirectX(e, 8))],
    [0x73, "*RRA", e => ins.rra(e, readAddressIndirectY(e, 8))],

    [0x87, "*SAX", e => ins.sax(e, readAddressZeroPage(e, 3))],
    [0x97, "*SAX", e => ins.sax(e, readAddressZeroPageY(e, 4))],
    [0x83, "*SAX", e => ins.sax(e, readAddressIndirectX(e, 6))],
    [0x8F, "*SAX", e => ins.sax(e, readAddressAbsolute(e, 4))],

    [0xE9, "*SBC", e => ins.sbc(e, readAddressImmediate(e, 2))],
    [0xEB, "*SBC", e => ins.sbc(e, readAddressImmediate(e, 2))],
    [0xE5, "*SBC", e => ins.sbc(e, readAddressZeroPage(e, 3)) ],
    [0xF5, "*SBC", e => ins.sbc(e, readAddressZeroPageX(e, 4))],
    [0xED, "*SBC", e => ins.sbc(e, readAddressAbsolute(e, 4))],
    [0xFD, "*SBC", e => ins.sbc(e, readAddressAbsoluteXWithPageBoundaryCycle(e, 4))],
    [0xF9, "*SBC", e => ins.sbc(e, readAddressAbsoluteYWithPageBoundaryCycle(e, 4))],
    [0xE1, "*SBC", e => ins.sbc(e, readAddressIndirectX(e, 6))],
    [0xF1, "*SBC", e => ins.sbc(e, readAddressIndirectYWithPageBoundaryCycle(e, 5))],

    [0x38, "SEC", ins.sec],
    [0x78, "SEI", ins.sei],
    [0xF8, "SED", ins.sed],

    [0x07, "*SLO", e => ins.slo(e, readAddressZeroPage(e, 5))],
    [0x17, "*SLO", e => ins.slo(e, readAddressZeroPageX(e, 6))],
    [0x0F, "*SLO", e => ins.slo(e, readAddressAbsolute(e, 6))],
    [0x1F, "*SLO", e => ins.slo(e, readAddressAbsoluteX(e, 7))],
    [0x1B, "*SLO", e => ins.slo(e, readAddressAbsoluteY(e, 7))],
    [0x03, "*SLO", e => ins.slo(e, readAddressIndirectX(e, 8))],
    [0x13, "*SLO", e => ins.slo(e, readAddressIndirectY(e, 8))],

    [0x47, "*SRE", e => ins.sre(e, readAddressZeroPage(e, 5))],
    [0x57, "*SRE", e => ins.sre(e, readAddressZeroPageX(e, 6))],
    [0x4F, "*SRE", e => ins.sre(e, readAddressAbsolute(e, 6))],
    [0x5F, "*SRE", e => ins.sre(e, readAddressAbsoluteX(e, 7))],
    [0x5B, "*SRE", e => ins.sre(e, readAddressAbsoluteY(e, 7))],
    [0x43, "*SRE", e => ins.sre(e, readAddressIndirectX(e, 8))],
    [0x53, "*SRE", e => ins.sre(e, readAddressIndirectY(e, 8))],

    [0x85, "STA", e => ins.sta(e, readAddressZeroPage(e, 3))],
    [0x95, "STA", e => ins.sta(e, readAddressZeroPageX(e, 4))],
    [0x8D, "STA", e => ins.sta(e, readAddressAbsolute(e, 4))],
    [0x9D, "STA", e => ins.sta(e, readAddressAbsoluteX(e, 5))],
    [0x99, "STA", e => ins.sta(e, readAddressAbsoluteY(e, 5))],
    [0x81, "STA", e => ins.sta(e, readAddressIndirectX(e, 6))],
    [0x91, "STA", e => ins.sta(e, readAddressIndirectY(e, 6))],

    [0x86, "STX", e => ins.stx(e, readAddressZeroPage(e, 3))],
    [0x96, "STX", e => ins.stx(e, readAddressZeroPageY(e, 4))],
    [0x8E, "STX", e => ins.stx(e, readAddressAbsolute(e, 4))],

    [0x84, "STY", e => ins.sty(e, readAddressZeroPage(e, 3))],
    [0x94, "STY", e => ins.sty(e, readAddressZeroPageX(e, 4))],
    [0x8C, "STY", e => ins.sty(e, readAddressAbsolute(e, 4))],

    [0x0, "BRK", ins.brk],
    [0x08, "PHP", ins.php],
    [0x48, "PHA", ins.pha],
    [0x28, "PLP", ins.plp],
    [0x40, "RTI", ins.rti],
    [0x68, "PLA", ins.pla],
    [0x20, "JSR", ins.jsr],
    [0x60, "RTS", ins.rts],

    [0x9E, "*SXA", ins.sxa],
    [0x9C, "*SYA", ins.sya]
];

export const opcodeTable = new Array(256);

_.forEach(opcodes, ([opcode, name, implementation]) => {
    opcodeTable[opcode] = implementation;
})
