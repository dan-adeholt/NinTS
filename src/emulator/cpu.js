
import _ from 'lodash';
import * as instructions from './instructions';

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
    [0x0B, "*AAC", AddressModeImmediate, instructions.aac, instructions.readAddressImmediate],
    [0x2B, "*AAC", AddressModeImmediate, instructions.aac, instructions.readAddressImmediate],

    [0x69, "ADC",  AddressModeImmediate, instructions.adc, instructions.readAddressImmediate],
    [0x65, "ADC",  AddressModeZeroPage, instructions.adc, instructions.readAddressZeroPage],
    [0x75, "ADC",  AddressModeZeroPageX, instructions.adc, instructions.readAddressZeroPageX],
    [0x6D, "ADC",  AddressModeAbsolute, instructions.adc, instructions.readAddressAbsolute],
    [0x7D, "ADC",  AddressModeAbsoluteX, instructions.adc, instructions.readAddressAbsoluteXWithPageBoundaryCycle],
    [0x79, "ADC",  AddressModeAbsoluteY, instructions.adc, instructions.readAddressAbsoluteYWithPageBoundaryCycle],
    [0x61, "ADC",  AddressModeIndirectX, instructions.adc, instructions.readAddressIndirectX],
    [0x71, "ADC",  AddressModeIndirectY, instructions.adc, instructions.readAddressIndirectYWithPageBoundaryCycle],

    [0x29, "AND",  AddressModeImmediate, instructions.and, instructions.readAddressImmediate],
    [0x25, "AND",  AddressModeZeroPage, instructions.and, instructions.readAddressZeroPage],
    [0x35, "AND",  AddressModeZeroPageX, instructions.and, instructions.readAddressZeroPageX],
    [0x2D, "AND",  AddressModeAbsolute, instructions.and, instructions.readAddressAbsolute],
    [0x3D, "AND",  AddressModeAbsoluteX, instructions.and, instructions.readAddressAbsoluteXWithPageBoundaryCycle],
    [0x39, "AND",  AddressModeAbsoluteY, instructions.and, instructions.readAddressAbsoluteYWithPageBoundaryCycle],
    [0x21, "AND",  AddressModeIndirectX, instructions.and, instructions.readAddressIndirectX],
    [0x31, "AND",  AddressModeIndirectY, instructions.and, instructions.readAddressIndirectYWithPageBoundaryCycle],

    [0x6B, "*ARR", AddressModeImmediate, instructions.arr, instructions.readAddressImmediate],

    [0x0A, "ASL",  AddressModeAccumulator, instructions.aslA],
    [0x06, "ASL",  AddressModeZeroPage, instructions.asl, instructions.readAddressZeroPage],
    [0x16, "ASL",  AddressModeZeroPageX, instructions.asl, instructions.readAddressZeroPageX],
    [0x0E, "ASL",  AddressModeAbsolute, instructions.asl, instructions.readAddressAbsolute],
    [0x1E, "ASL",  AddressModeAbsoluteX, instructions.asl, instructions.readAddressAbsoluteX],

    [0x4B, "*ASR", AddressModeImmediate, instructions.asr, instructions.readAddressImmediate],

    [0xAB, "*ATX", AddressModeImmediate, instructions.atx, instructions.readAddressImmediate],

    [0xCB, "AXS",  AddressModeImmediate, instructions.axs, instructions.readAddressImmediate],

    [0x24, "BIT",  AddressModeZeroPage, instructions.bit, instructions.readAddressZeroPage],
    [0x2C, "BIT",  AddressModeAbsolute, instructions.bit, instructions.readAddressAbsolute],

    [0x90, "BCC",  AddressModeRelative, instructions.bcc],
    [0xF0, "BEQ",  AddressModeRelative, instructions.beq],
    [0xD0, "BNE",  AddressModeRelative, instructions.bne],
    [0xB0, "BCS",  AddressModeRelative, instructions.bcs],
    [0x50, "BVC",  AddressModeRelative, instructions.bvc],
    [0x70, "BVS",  AddressModeRelative, instructions.bvs],
    [0x10, "BPL",  AddressModeRelative, instructions.bpl],
    [0x30, "BMI",  AddressModeRelative, instructions.bmi],

    [0x18, "CLC",  AddressModeImplied, instructions.clc],
    [0xD8, "CLD",  AddressModeImplied, instructions.cld],
    [0x58, "CLI",  AddressModeImplied, instructions.cli],
    [0xB8, "CLV",  AddressModeImplied, instructions.clv],

    [0xC9, "CMP",  AddressModeImmediate, instructions.cmp, instructions.readAddressImmediate],
    [0xC5, "CMP",  AddressModeZeroPage, instructions.cmp, instructions.readAddressZeroPage],
    [0xD5, "CMP",  AddressModeZeroPageX, instructions.cmp, instructions.readAddressZeroPageX],
    [0xCD, "CMP",  AddressModeAbsolute, instructions.cmp, instructions.readAddressAbsolute],
    [0xDD, "CMP",  AddressModeAbsoluteX, instructions.cmp, instructions.readAddressAbsoluteXWithPageBoundaryCycle],
    [0xD9, "CMP",  AddressModeAbsoluteY, instructions.cmp, instructions.readAddressAbsoluteYWithPageBoundaryCycle],
    [0xC1, "CMP",  AddressModeIndirectX, instructions.cmp, instructions.readAddressIndirectX],
    [0xD1, "CMP",  AddressModeIndirectY, instructions.cmp, instructions.readAddressIndirectYWithPageBoundaryCycle],

    [0xE0, "CPX",  AddressModeImmediate, instructions.cpx, instructions.readAddressImmediate],
    [0xE4, "CPX",  AddressModeZeroPage, instructions.cpx, instructions.readAddressZeroPage],
    [0xEC, "CPX",  AddressModeAbsolute, instructions.cpx, instructions.readAddressAbsolute],

    [0xC0, "CPY",  AddressModeImmediate, instructions.cpy, instructions.readAddressImmediate],
    [0xC4, "CPY",  AddressModeZeroPage, instructions.cpy, instructions.readAddressZeroPage],
    [0xCC, "CPY",  AddressModeAbsolute, instructions.cpy, instructions.readAddressAbsolute],

    [0xC7, "*DCP", AddressModeZeroPage, instructions.dcp, instructions.readAddressZeroPage],
    [0xD7, "*DCP", AddressModeZeroPageX, instructions.dcp, instructions.readAddressZeroPageX],
    [0xCF, "*DCP", AddressModeAbsolute, instructions.dcp, instructions.readAddressAbsolute],
    [0xDF, "*DCP", AddressModeAbsoluteX, instructions.dcp, instructions.readAddressAbsoluteX],
    [0xDB, "*DCP", AddressModeAbsoluteY, instructions.dcp, instructions.readAddressAbsoluteY],
    [0xC3, "*DCP", AddressModeIndirectX, instructions.dcp, instructions.readAddressIndirectX],
    [0xD3, "*DCP", AddressModeIndirectY, instructions.dcp, instructions.readAddressIndirectY],

    [0xC6, "DEC",  AddressModeZeroPage, instructions.dec, instructions.readAddressZeroPage],
    [0xD6, "DEC",  AddressModeZeroPageX, instructions.dec, instructions.readAddressZeroPageX],
    [0xCE, "DEC",  AddressModeAbsolute, instructions.dec, instructions.readAddressAbsolute],
    [0xDE, "DEC",  AddressModeAbsoluteX, instructions.dec, instructions.readAddressAbsoluteX],

    [0x49, "EOR",  AddressModeImmediate, instructions.eor, instructions.readAddressImmediate],
    [0x45, "EOR",  AddressModeZeroPage, instructions.eor, instructions.readAddressZeroPage ],
    [0x55, "EOR",  AddressModeZeroPageX, instructions.eor, instructions.readAddressZeroPageX],
    [0x4D, "EOR",  AddressModeAbsolute, instructions.eor, instructions.readAddressAbsolute],
    [0x5D, "EOR",  AddressModeAbsoluteX, instructions.eor, instructions.readAddressAbsoluteXWithPageBoundaryCycle],
    [0x59, "EOR",  AddressModeAbsoluteY, instructions.eor, instructions.readAddressAbsoluteYWithPageBoundaryCycle],
    [0x41, "EOR",  AddressModeIndirectX, instructions.eor, instructions.readAddressIndirectX],
    [0x51, "EOR",  AddressModeIndirectY, instructions.eor, instructions.readAddressIndirectYWithPageBoundaryCycle],

    [0xE6, "INC",  AddressModeZeroPage, instructions.inc, instructions.readAddressZeroPage],
    [0xF6, "INC",  AddressModeZeroPageX, instructions.inc, instructions.readAddressZeroPageX],
    [0xEE, "INC",  AddressModeAbsolute, instructions.inc, instructions.readAddressAbsolute],
    [0xFE, "INC",  AddressModeAbsoluteX, instructions.inc, instructions.readAddressAbsoluteX],

    [0xE7, "*ISB", AddressModeZeroPage, instructions.isb, instructions.readAddressZeroPage],
    [0xF7, "*ISB", AddressModeZeroPageX, instructions.isb, instructions.readAddressZeroPageX],
    [0xEF, "*ISB", AddressModeAbsolute, instructions.isb, instructions.readAddressAbsolute],
    [0xFF, "*ISB", AddressModeAbsoluteX, instructions.isb, instructions.readAddressAbsoluteX],
    [0xFB, "*ISB", AddressModeAbsoluteY, instructions.isb, instructions.readAddressAbsoluteY],
    [0xE3, "*ISB", AddressModeIndirectX, instructions.isb, instructions.readAddressIndirectX],
    [0xF3, "*ISB", AddressModeIndirectY, instructions.isb, instructions.readAddressIndirectY],

    [0x4C, "JMP",  AddressModeAbsolute, instructions.jmpAbsolute],
    [0x6C, "JMP",  AddressModeIndirect, instructions.jmpIndirect],

    [0xA7, "*LAX", AddressModeZeroPage, instructions.lax, instructions.readAddressZeroPage],
    [0xB7, "*LAX", AddressModeZeroPageY, instructions.lax, instructions.readAddressZeroPageY],
    [0xAF, "*LAX", AddressModeAbsolute, instructions.lax, instructions.readAddressAbsolute],
    [0xBF, "*LAX", AddressModeAbsoluteY, instructions.lax, instructions.readAddressAbsoluteYWithPageBoundaryCycle],
    [0xA3, "*LAX", AddressModeIndirectX, instructions.lax, instructions.readAddressIndirectX],
    [0xB3, "*LAX", AddressModeIndirectY, instructions.lax, instructions.readAddressIndirectYWithPageBoundaryCycle],

    [0xA9, "LDA",  AddressModeImmediate, instructions.lda, instructions.readAddressImmediate],
    [0xA5, "LDA",  AddressModeZeroPage, instructions.lda, instructions.readAddressZeroPage],
    [0xB5, "LDA",  AddressModeZeroPageX, instructions.lda, instructions.readAddressZeroPageX],
    [0xAD, "LDA",  AddressModeAbsolute, instructions.lda, instructions.readAddressAbsolute],
    [0xBD, "LDA",  AddressModeAbsoluteX, instructions.lda, instructions.readAddressAbsoluteXWithPageBoundaryCycle],
    [0xB9, "LDA",  AddressModeAbsoluteY, instructions.lda, instructions.readAddressAbsoluteYWithPageBoundaryCycle],
    [0xA1, "LDA",  AddressModeIndirectX, instructions.lda, instructions.readAddressIndirectX],
    [0xB1, "LDA",  AddressModeIndirectY, instructions.lda, instructions.readAddressIndirectYWithPageBoundaryCycle],

    [0xA2, "LDX",  AddressModeImmediate, instructions.ldx, instructions.readAddressImmediate],
    [0xA6, "LDX",  AddressModeZeroPage, instructions.ldx, instructions.readAddressZeroPage ],
    [0xB6, "LDX",  AddressModeZeroPageY, instructions.ldx, instructions.readAddressZeroPageY],
    [0xAE, "LDX",  AddressModeAbsolute, instructions.ldx, instructions.readAddressAbsolute],
    [0xBE, "LDX",  AddressModeAbsoluteY, instructions.ldx, instructions.readAddressAbsoluteYWithPageBoundaryCycle],

    [0xA0, "LDY",  AddressModeImmediate, instructions.ldy, instructions.readAddressImmediate],
    [0xA4, "LDY",  AddressModeZeroPage, instructions.ldy, instructions.readAddressZeroPage],
    [0xB4, "LDY",  AddressModeZeroPageX, instructions.ldy, instructions.readAddressZeroPageX],
    [0xAC, "LDY",  AddressModeAbsolute, instructions.ldy, instructions.readAddressAbsolute],
    [0xBC, "LDY",  AddressModeAbsoluteX, instructions.ldy, instructions.readAddressAbsoluteXWithPageBoundaryCycle],

    [0x4A, "LSR",  AddressModeAccumulator, instructions.lsrA],
    [0x46, "LSR",  AddressModeZeroPage, instructions.lsr, instructions.readAddressZeroPage],
    [0x56, "LSR",  AddressModeZeroPageX, instructions.lsr, instructions.readAddressZeroPageX],
    [0x4E, "LSR",  AddressModeAbsolute, instructions.lsr, instructions.readAddressAbsolute],
    [0x5E, "LSR",  AddressModeAbsoluteX, instructions.lsr, instructions.readAddressAbsoluteX],

    [0xEA, "NOP",  AddressModeImplied, instructions.nop],
    [0x1A, "*NOP", AddressModeImplied, instructions.nop],
    [0x3A, "*NOP", AddressModeImplied, instructions.nop],
    [0x5A, "*NOP", AddressModeImplied, instructions.nop],
    [0x7A, "*NOP", AddressModeImplied, instructions.nop],
    [0xDA, "*NOP", AddressModeImplied, instructions.nop],
    [0xFA, "*NOP", AddressModeImplied, instructions.nop],
    [0x80, "*NOP", AddressModeImmediate, instructions.unofficialNopImmediate],
    [0x82, "*NOP", AddressModeImmediate, instructions.unofficialNopImmediate],
    [0x89, "*NOP", AddressModeImmediate, instructions.unofficialNopImmediate],
    [0xC2, "*NOP", AddressModeImmediate, instructions.unofficialNopImmediate],
    [0xE2, "*NOP", AddressModeImmediate, instructions.unofficialNopImmediate],
    [0x04, "*NOP", AddressModeZeroPage, instructions.unofficialNopZeroPage],
    [0x44, "*NOP", AddressModeZeroPage, instructions.unofficialNopZeroPage],
    [0x64, "*NOP", AddressModeZeroPage, instructions.unofficialNopZeroPage],
    [0x0C, "*NOP", AddressModeAbsolute, instructions.unofficialNopAbsolute],
    [0x14, "*NOP", AddressModeZeroPageX, instructions.unofficialNopZeroPageX],
    [0x34, "*NOP", AddressModeZeroPageX, instructions.unofficialNopZeroPageX],
    [0x54, "*NOP", AddressModeZeroPageX, instructions.unofficialNopZeroPageX],
    [0x74, "*NOP", AddressModeZeroPageX, instructions.unofficialNopZeroPageX],
    [0xD4, "*NOP", AddressModeZeroPageX, instructions.unofficialNopZeroPageX],
    [0xF4, "*NOP", AddressModeZeroPageX, instructions.unofficialNopZeroPageX],

    [0x1C, "*NOP",  AddressModeAbsoluteX, instructions.unofficialNopAbsoluteX],
    [0x3C, "*NOP",  AddressModeAbsoluteX, instructions.unofficialNopAbsoluteX],
    [0x5C, "*NOP",  AddressModeAbsoluteX, instructions.unofficialNopAbsoluteX],
    [0x7C, "*NOP",  AddressModeAbsoluteX, instructions.unofficialNopAbsoluteX],
    [0xDC, "*NOP",  AddressModeAbsoluteX, instructions.unofficialNopAbsoluteX],
    [0xFC, "*NOP",  AddressModeAbsoluteX, instructions.unofficialNopAbsoluteX],

    [0x09, "ORA",  AddressModeImmediate, instructions.ora, instructions.readAddressImmediate],
    [0x05, "ORA",  AddressModeZeroPage, instructions.ora, instructions.readAddressZeroPage],
    [0x15, "ORA",  AddressModeZeroPageX, instructions.ora, instructions.readAddressZeroPageX],
    [0x0D, "ORA",  AddressModeAbsolute, instructions.ora, instructions.readAddressAbsolute],
    [0x1D, "ORA",  AddressModeAbsoluteX, instructions.ora, instructions.readAddressAbsoluteXWithPageBoundaryCycle],
    [0x19, "ORA",  AddressModeAbsoluteY, instructions.ora, instructions.readAddressAbsoluteYWithPageBoundaryCycle],
    [0x01, "ORA",  AddressModeIndirectX, instructions.ora, instructions.readAddressIndirectX],
    [0x11, "ORA",  AddressModeIndirectY, instructions.ora, instructions.readAddressIndirectYWithPageBoundaryCycle],

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

    [0x27, "*RLA", AddressModeZeroPage, instructions.rla, instructions.readAddressZeroPage],
    [0x37, "*RLA", AddressModeZeroPageX, instructions.rla, instructions.readAddressZeroPageX],
    [0x2F, "*RLA", AddressModeAbsolute, instructions.rla, instructions.readAddressAbsolute],
    [0x3F, "*RLA", AddressModeAbsoluteX, instructions.rla, instructions.readAddressAbsoluteX],
    [0x3B, "*RLA", AddressModeAbsoluteY, instructions.rla, instructions.readAddressAbsoluteY],
    [0x23, "*RLA", AddressModeIndirectX, instructions.rla, instructions.readAddressIndirectX],
    [0x33, "*RLA", AddressModeIndirectY, instructions.rla, instructions.readAddressIndirectY],

    [0x2A, "ROL",  AddressModeAccumulator, instructions.rolA],
    [0x26, "ROL",  AddressModeZeroPage, instructions.rol, instructions.readAddressZeroPage],
    [0x36, "ROL",  AddressModeZeroPageX, instructions.rol, instructions.readAddressZeroPageX],
    [0x2E, "ROL",  AddressModeAbsolute, instructions.rol, instructions.readAddressAbsolute],
    [0x3E, "ROL",  AddressModeAbsoluteX, instructions.rol, instructions.readAddressAbsoluteX],

    [0x6A, "ROR",  AddressModeAccumulator, instructions.rorA],
    [0x66, "ROR",  AddressModeZeroPage, instructions.ror, instructions.readAddressZeroPage],
    [0x76, "ROR",  AddressModeZeroPageX, instructions.ror, instructions.readAddressZeroPageX],
    [0x6E, "ROR",  AddressModeAbsolute, instructions.ror, instructions.readAddressAbsolute],
    [0x7E, "ROR",  AddressModeAbsoluteX, instructions.ror, instructions.readAddressAbsoluteX],

    [0x67, "*RRA", AddressModeZeroPage, instructions.rra, instructions.readAddressZeroPage],
    [0x77, "*RRA", AddressModeZeroPageX, instructions.rra, instructions.readAddressZeroPageX],
    [0x6F, "*RRA", AddressModeAbsolute, instructions.rra, instructions.readAddressAbsolute],
    [0x7F, "*RRA", AddressModeAbsoluteX, instructions.rra, instructions.readAddressAbsoluteX],
    [0x7B, "*RRA", AddressModeAbsoluteY, instructions.rra, instructions.readAddressAbsoluteY],
    [0x63, "*RRA", AddressModeIndirectX, instructions.rra, instructions.readAddressIndirectX],
    [0x73, "*RRA", AddressModeIndirectY, instructions.rra, instructions.readAddressIndirectY],

    [0x87, "*SAX", AddressModeZeroPage, instructions.sax, instructions.readAddressZeroPage],
    [0x97, "*SAX", AddressModeZeroPageY, instructions.sax, instructions.readAddressZeroPageY],
    [0x83, "*SAX", AddressModeIndirectX, instructions.sax, instructions.readAddressIndirectX],
    [0x8F, "*SAX", AddressModeAbsolute, instructions.sax, instructions.readAddressAbsolute],

    [0xE9, "SBC", AddressModeImmediate, instructions.sbc, instructions.readAddressImmediate],
    [0xEB, "*SBC", AddressModeImmediate, instructions.sbc, instructions.readAddressImmediate],
    [0xE5, "SBC", AddressModeZeroPage, instructions.sbc, instructions.readAddressZeroPage],
    [0xF5, "SBC", AddressModeZeroPageX, instructions.sbc, instructions.readAddressZeroPageX],
    [0xED, "SBC", AddressModeAbsolute, instructions.sbc, instructions.readAddressAbsolute],
    [0xFD, "SBC", AddressModeAbsoluteX, instructions.sbc, instructions.readAddressAbsoluteXWithPageBoundaryCycle],
    [0xF9, "SBC", AddressModeAbsoluteY, instructions.sbc, instructions.readAddressAbsoluteYWithPageBoundaryCycle],
    [0xE1, "SBC", AddressModeIndirectX, instructions.sbc, instructions.readAddressIndirectX],
    [0xF1, "SBC", AddressModeIndirectY, instructions.sbc, instructions.readAddressIndirectYWithPageBoundaryCycle],

    [0x38, "SEC",  AddressModeImplied, instructions.sec],
    [0x78, "SEI",  AddressModeImplied, instructions.sei],
    [0xF8, "SED",  AddressModeImplied, instructions.sed],

    [0x07, "*SLO", AddressModeZeroPage, instructions.slo, instructions.readAddressZeroPage],
    [0x17, "*SLO", AddressModeZeroPageX, instructions.slo, instructions.readAddressZeroPageX],
    [0x0F, "*SLO", AddressModeAbsolute, instructions.slo, instructions.readAddressAbsolute],
    [0x1F, "*SLO", AddressModeAbsoluteX, instructions.slo, instructions.readAddressAbsoluteX],
    [0x1B, "*SLO", AddressModeAbsoluteY, instructions.slo, instructions.readAddressAbsoluteY],
    [0x03, "*SLO", AddressModeIndirectX, instructions.slo, instructions.readAddressIndirectX],
    [0x13, "*SLO", AddressModeIndirectY, instructions.slo, instructions.readAddressIndirectY],

    [0x47, "*SRE", AddressModeZeroPage, instructions.sre, instructions.readAddressZeroPage],
    [0x57, "*SRE", AddressModeZeroPageX, instructions.sre, instructions.readAddressZeroPageX],
    [0x4F, "*SRE", AddressModeAbsolute, instructions.sre, instructions.readAddressAbsolute],
    [0x5F, "*SRE", AddressModeAbsoluteX, instructions.sre, instructions.readAddressAbsoluteX],
    [0x5B, "*SRE", AddressModeAbsoluteY, instructions.sre, instructions.readAddressAbsoluteY],
    [0x43, "*SRE", AddressModeIndirectX, instructions.sre, instructions.readAddressIndirectX],
    [0x53, "*SRE", AddressModeIndirectY, instructions.sre, instructions.readAddressIndirectY],

    [0x85, "STA",  AddressModeZeroPage, instructions.sta, instructions.readAddressZeroPage],
    [0x95, "STA",  AddressModeZeroPageX, instructions.sta, instructions.readAddressZeroPageX],
    [0x8D, "STA",  AddressModeAbsolute, instructions.sta, instructions.readAddressAbsolute],
    [0x9D, "STA",  AddressModeAbsoluteX, instructions.sta, instructions.readAddressAbsoluteX],
    [0x99, "STA",  AddressModeAbsoluteY, instructions.sta, instructions.readAddressAbsoluteY],
    [0x81, "STA",  AddressModeIndirectX, instructions.sta, instructions.readAddressIndirectX],
    [0x91, "STA",  AddressModeIndirectY, instructions.sta, instructions.readAddressIndirectY],

    [0x86, "STX",  AddressModeZeroPage, instructions.stx, instructions.readAddressZeroPage],
    [0x96, "STX",  AddressModeZeroPageY, instructions.stx, instructions.readAddressZeroPageY],
    [0x8E, "STX",  AddressModeAbsolute, instructions.stx, instructions.readAddressAbsolute],

    [0x84, "STY",  AddressModeZeroPage, instructions.sty, instructions.readAddressZeroPage],
    [0x94, "STY",  AddressModeZeroPageX, instructions.sty, instructions.readAddressZeroPageX],
    [0x8C, "STY",  AddressModeAbsolute, instructions.sty, instructions.readAddressAbsolute],

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
