import {
  readAddressAbsolute,
  readAddressAbsoluteX,
  readAddressAbsoluteY,
  readAddressIndirectX,
  readAddressIndirectY,
  readAddressZeroPage,
  readAddressZeroPageX,
  readAddressZeroPageY,
  readValueAbsolute,
  readValueAbsoluteXWithPageBoundaryCycle,
  readValueAbsoluteYWithPageBoundaryCycle,
  readValueImmediate,
  readValueIndirectX,
  readValueIndirectYWithPageBoundaryCycle,
  readValueZeroPage,
  readValueZeroPageX,
  readValueZeroPageY
} from './instructions/utils';

import * as instructions from './instructions'

const opcodeHandlers = [];

opcodeHandlers[0x0B] = state => instructions.aac(state, readValueImmediate(state, 2));
opcodeHandlers[0x2B] = state => instructions.aac(state, readValueImmediate(state, 2));

opcodeHandlers[0x69] = state => instructions.adc(state, readValueImmediate(state, 2));
opcodeHandlers[0x65] = state => instructions.adc(state, readValueZeroPage(state, 3)) ;
opcodeHandlers[0x75] = state => instructions.adc(state, readValueZeroPageX(state, 4));
opcodeHandlers[0x6D] = state => instructions.adc(state, readValueAbsolute(state, 4));
opcodeHandlers[0x7D] = state => instructions.adc(state, readValueAbsoluteXWithPageBoundaryCycle(state, 4));
opcodeHandlers[0x79] = state => instructions.adc(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4));
opcodeHandlers[0x61] = state => instructions.adc(state, readValueIndirectX(state, 6));
opcodeHandlers[0x71] = state => instructions.adc(state, readValueIndirectYWithPageBoundaryCycle(state, 5));


opcodeHandlers[0x29] = state => instructions.and(state, readValueImmediate(state, 2));
opcodeHandlers[0x25] = state => instructions.and(state, readValueZeroPage(state, 3)) ;
opcodeHandlers[0x35] = state => instructions.and(state, readValueZeroPageX(state, 4));
opcodeHandlers[0x2D] = state => instructions.and(state, readValueAbsolute(state, 4));
opcodeHandlers[0x3D] = state => instructions.and(state, readValueAbsoluteXWithPageBoundaryCycle(state, 4));
opcodeHandlers[0x39] = state => instructions.and(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4));
opcodeHandlers[0x21] = state => instructions.and(state, readValueIndirectX(state, 6));
opcodeHandlers[0x31] = state => instructions.and(state, readValueIndirectYWithPageBoundaryCycle(state, 5));


opcodeHandlers[0x6B] = state => instructions.arr(state, readValueImmediate(state, 2));



opcodeHandlers[0x0A] = instructions.aslA;
opcodeHandlers[0x06] = state => instructions.asl(state, readAddressZeroPage(state, 5));
opcodeHandlers[0x16] = state => instructions.asl(state, readAddressZeroPageX(state, 6));
opcodeHandlers[0x0E] = state => instructions.asl(state, readAddressAbsolute(state, 6));
opcodeHandlers[0x1E] = state => instructions.asl(state, readAddressAbsoluteX(state, 7));


opcodeHandlers[0x4B] = state => instructions.asr(state, readValueImmediate(state, 2));


opcodeHandlers[0xAB] = state => instructions.atx(state, readValueImmediate(state, 2));


opcodeHandlers[0xCB] = state => instructions.axs(state, readValueImmediate(state, 2));


opcodeHandlers[0x24] = state => instructions.bit(state, readValueZeroPage(state, 3))
opcodeHandlers[0x2C] = state => instructions.bit(state, readValueAbsolute(state, 4))

opcodeHandlers[0x90] = instructions.bcc;
opcodeHandlers[0xF0] = instructions.beq;
opcodeHandlers[0xD0] = instructions.bne;
opcodeHandlers[0xB0] = instructions.bcs;
opcodeHandlers[0x50] = instructions.bvc;
opcodeHandlers[0x70] = instructions.bvs;
opcodeHandlers[0x10] = instructions.bpl;
opcodeHandlers[0x30] = instructions.bmi;


opcodeHandlers[0x18] = instructions.clc;
opcodeHandlers[0xD8] = instructions.cld;
opcodeHandlers[0x58] = instructions.cli;
opcodeHandlers[0xB8] = instructions.clv;



opcodeHandlers[0xC9] = state => instructions.cmp(state, readValueImmediate(state, 2));
opcodeHandlers[0xC5] = state => instructions.cmp(state, readValueZeroPage(state, 3));
opcodeHandlers[0xD5] = state => instructions.cmp(state, readValueZeroPageX(state, 4));
opcodeHandlers[0xCD] = state => instructions.cmp(state, readValueAbsolute(state, 4));
opcodeHandlers[0xDD] = state => instructions.cmp(state, readValueAbsoluteXWithPageBoundaryCycle(state, 4));
opcodeHandlers[0xD9] = state => instructions.cmp(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4));
opcodeHandlers[0xC1] = state => instructions.cmp(state, readValueIndirectX(state, 6));
opcodeHandlers[0xD1] = state => instructions.cmp(state, readValueIndirectYWithPageBoundaryCycle(state, 5));


opcodeHandlers[0xE0] = state => instructions.cpx(state, readValueImmediate(state, 2));
opcodeHandlers[0xE4] = state => instructions.cpx(state, readValueZeroPage(state, 3));
opcodeHandlers[0xEC] = state => instructions.cpx(state, readValueAbsolute(state, 4));

opcodeHandlers[0xC0] = state => instructions.cpy(state, readValueImmediate(state, 2));
opcodeHandlers[0xC4] = state => instructions.cpy(state, readValueZeroPage(state, 3));
opcodeHandlers[0xCC] = state => instructions.cpy(state, readValueAbsolute(state, 4));


opcodeHandlers[0xC7] = state => instructions.dcp(state, readAddressZeroPage(state, 5));
opcodeHandlers[0xD7] = state => instructions.dcp(state, readAddressZeroPageX(state, 6));
opcodeHandlers[0xCF] = state => instructions.dcp(state, readAddressAbsolute(state, 6));
opcodeHandlers[0xDF] = state => instructions.dcp(state, readAddressAbsoluteX(state, 7));
opcodeHandlers[0xDB] = state => instructions.dcp(state, readAddressAbsoluteY(state, 7));
opcodeHandlers[0xC3] = state => instructions.dcp(state, readAddressIndirectX(state, 8));
opcodeHandlers[0xD3] = state => instructions.dcp(state, readAddressIndirectY(state, 8));


opcodeHandlers[0xC6] = state => instructions.dec(state, readAddressZeroPage(state, 5));
opcodeHandlers[0xD6] = state => instructions.dec(state, readAddressZeroPageX(state, 6));
opcodeHandlers[0xCE] = state => instructions.dec(state, readAddressAbsolute(state, 6));
opcodeHandlers[0xDE] = state => instructions.dec(state, readAddressAbsoluteX(state, 7));

opcodeHandlers[0x49] = state => instructions.eor(state, readValueImmediate(state, 2));
opcodeHandlers[0x45] = state => instructions.eor(state, readValueZeroPage(state, 3)) ;
opcodeHandlers[0x55] = state => instructions.eor(state, readValueZeroPageX(state, 4));
opcodeHandlers[0x4D] = state => instructions.eor(state, readValueAbsolute(state, 4));
opcodeHandlers[0x5D] = state => instructions.eor(state, readValueAbsoluteXWithPageBoundaryCycle(state, 4));
opcodeHandlers[0x59] = state => instructions.eor(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4));
opcodeHandlers[0x41] = state => instructions.eor(state, readValueIndirectX(state, 6));
opcodeHandlers[0x51] = state => instructions.eor(state, readValueIndirectYWithPageBoundaryCycle(state, 5));

opcodeHandlers[0xE6] = state => instructions.inc(state, readAddressZeroPage(state, 5));
opcodeHandlers[0xF6] = state => instructions.inc(state, readAddressZeroPageX(state, 6));
opcodeHandlers[0xEE] = state => instructions.inc(state, readAddressAbsolute(state, 6));
opcodeHandlers[0xFE] = state => instructions.inc(state, readAddressAbsoluteX(state, 7));




opcodeHandlers[0xE7] = state => instructions.isb(state, readAddressZeroPage(state, 5));
opcodeHandlers[0xF7] = state => instructions.isb(state, readAddressZeroPageX(state, 6));
opcodeHandlers[0xEF] = state => instructions.isb(state, readAddressAbsolute(state, 6));
opcodeHandlers[0xFF] = state => instructions.isb(state, readAddressAbsoluteX(state, 7));
opcodeHandlers[0xFB] = state => instructions.isb(state, readAddressAbsoluteY(state, 7));
opcodeHandlers[0xE3] = state => instructions.isb(state, readAddressIndirectX(state, 8));
opcodeHandlers[0xF3] = state => instructions.isb(state, readAddressIndirectY(state, 8));


opcodeHandlers[0x4C] = instructions.jmpAbsolute;
opcodeHandlers[0x6C] = instructions.jmpIndirect;


opcodeHandlers[0xA7] = state => instructions.lax(state, readValueZeroPage(state, 3));
opcodeHandlers[0xB7] = state => instructions.lax(state, readValueZeroPageY(state, 4));
opcodeHandlers[0xAF] = state => instructions.lax(state, readValueAbsolute(state, 4))
opcodeHandlers[0xBF] = state => instructions.lax(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4))
opcodeHandlers[0xA3] = state => instructions.lax(state, readValueIndirectX(state, 6))
opcodeHandlers[0xB3] = state => instructions.lax(state, readValueIndirectYWithPageBoundaryCycle(state, 5))


opcodeHandlers[0xA9] = state => instructions.lda(state, readValueImmediate(state, 2));
opcodeHandlers[0xA5] = state => instructions.lda(state, readValueZeroPage(state, 3));
opcodeHandlers[0xB5] = state => instructions.lda(state, readValueZeroPageX(state, 4));
opcodeHandlers[0xAD] = state => instructions.lda(state, readValueAbsolute(state, 4));
opcodeHandlers[0xBD] = state => instructions.lda(state, readValueAbsoluteXWithPageBoundaryCycle(state, 4));
opcodeHandlers[0xB9] = state => instructions.lda(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4));
opcodeHandlers[0xA1] = state => instructions.lda(state, readValueIndirectX(state, 6));
opcodeHandlers[0xB1] = state => instructions.lda(state, readValueIndirectYWithPageBoundaryCycle(state, 5));



opcodeHandlers[0xA2] = state => instructions.ldx(state, readValueImmediate(state, 2));
opcodeHandlers[0xA6] = state => instructions.ldx(state, readValueZeroPage(state, 3)) ;
opcodeHandlers[0xB6] = state => instructions.ldx(state, readValueZeroPageY(state, 4));
opcodeHandlers[0xAE] = state => instructions.ldx(state, readValueAbsolute(state, 4));
opcodeHandlers[0xBE] = state => instructions.ldx(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4));

opcodeHandlers[0xA0] = state => instructions.ldy(state, readValueImmediate(state, 2));
opcodeHandlers[0xA4] = state => instructions.ldy(state, readValueZeroPage(state, 3)) ;
opcodeHandlers[0xB4] = state => instructions.ldy(state, readValueZeroPageX(state, 4));
opcodeHandlers[0xAC] = state => instructions.ldy(state, readValueAbsolute(state, 4));
opcodeHandlers[0xBC] = state => instructions.ldy(state, readValueAbsoluteXWithPageBoundaryCycle(state, 4));


opcodeHandlers[0x4A] = instructions.lsrA;
opcodeHandlers[0x46] = state => instructions.lsr(state, readAddressZeroPage(state, 5));
opcodeHandlers[0x56] = state => instructions.lsr(state, readAddressZeroPageX(state, 6));
opcodeHandlers[0x4E] = state => instructions.lsr(state, readAddressAbsolute(state, 6));
opcodeHandlers[0x5E] = state => instructions.lsr(state, readAddressAbsoluteX(state, 7));

opcodeHandlers[0xEA] = instructions.nop;
opcodeHandlers[0x1A] = instructions.nop;
opcodeHandlers[0x3A] = instructions.nop;
opcodeHandlers[0x5A] = instructions.nop;
opcodeHandlers[0x7A] = instructions.nop;
opcodeHandlers[0xDA] = instructions.nop;
opcodeHandlers[0xFA] = instructions.nop;
opcodeHandlers[0x80] = instructions.unofficialNopImmediate;
opcodeHandlers[0x82] = instructions.unofficialNopImmediate;
opcodeHandlers[0x89] = instructions.unofficialNopImmediate;
opcodeHandlers[0xC2] = instructions.unofficialNopImmediate;
opcodeHandlers[0xE2] = instructions.unofficialNopImmediate;
opcodeHandlers[0x04] = instructions.unofficialNopZeroPage;
opcodeHandlers[0x44] = instructions.unofficialNopZeroPage;
opcodeHandlers[0x64] = instructions.unofficialNopZeroPage;
opcodeHandlers[0x0C] = instructions.unofficialNopAbsolute;
opcodeHandlers[0x14] = instructions.unofficialNopZeroPageX;
opcodeHandlers[0x34] = instructions.unofficialNopZeroPageX;
opcodeHandlers[0x54] = instructions.unofficialNopZeroPageX;
opcodeHandlers[0x74] = instructions.unofficialNopZeroPageX;
opcodeHandlers[0xD4] = instructions.unofficialNopZeroPageX;
opcodeHandlers[0xF4] = instructions.unofficialNopZeroPageX;

opcodeHandlers[0x1C] = instructions.unofficialNopAbsoluteX;
opcodeHandlers[0x3C] = instructions.unofficialNopAbsoluteX;
opcodeHandlers[0x5C] = instructions.unofficialNopAbsoluteX;
opcodeHandlers[0x7C] = instructions.unofficialNopAbsoluteX;
opcodeHandlers[0xDC] = instructions.unofficialNopAbsoluteX;
opcodeHandlers[0xFC] = instructions.unofficialNopAbsoluteX;

opcodeHandlers[0x09] = state => instructions.ora(state, readValueImmediate(state, 2));
opcodeHandlers[0x05] = state => instructions.ora(state, readValueZeroPage(state, 3)) ;
opcodeHandlers[0x15] = state => instructions.ora(state, readValueZeroPageX(state, 4));
opcodeHandlers[0x0D] = state => instructions.ora(state, readValueAbsolute(state, 4));
opcodeHandlers[0x1D] = state => instructions.ora(state, readValueAbsoluteXWithPageBoundaryCycle(state, 4));
opcodeHandlers[0x19] = state => instructions.ora(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4));
opcodeHandlers[0x01] = state => instructions.ora(state, readValueIndirectX(state, 6));
opcodeHandlers[0x11] = state => instructions.ora(state, readValueIndirectYWithPageBoundaryCycle(state, 5));

opcodeHandlers[0xC8] = instructions.iny;
opcodeHandlers[0x88] = instructions.dey;
opcodeHandlers[0xA8] = instructions.tay;

opcodeHandlers[0xE8] = instructions.inx;
opcodeHandlers[0xCA] = instructions.dex;

opcodeHandlers[0xAA] = instructions.tax;
opcodeHandlers[0xBA] = instructions.tsx;
opcodeHandlers[0x8A] = instructions.txa;
opcodeHandlers[0x98] = instructions.tya;
opcodeHandlers[0x9A] = instructions.txs;

opcodeHandlers[0x27] = state => instructions.rla(state, readAddressZeroPage(state, 5));
opcodeHandlers[0x37] = state => instructions.rla(state, readAddressZeroPageX(state, 6));
opcodeHandlers[0x2F] = state => instructions.rla(state, readAddressAbsolute(state, 6));
opcodeHandlers[0x3F] = state => instructions.rla(state, readAddressAbsoluteX(state, 7));
opcodeHandlers[0x3B] = state => instructions.rla(state, readAddressAbsoluteY(state, 7));
opcodeHandlers[0x23] = state => instructions.rla(state, readAddressIndirectX(state, 8));
opcodeHandlers[0x33] = state => instructions.rla(state, readAddressIndirectY(state, 8));


opcodeHandlers[0x2A] = state => instructions.rolA(state);
opcodeHandlers[0x26] = state => instructions.rol(state, readAddressZeroPage(state, 5));
opcodeHandlers[0x36] = state => instructions.rol(state, readAddressZeroPageX(state, 6));
opcodeHandlers[0x2E] = state => instructions.rol(state, readAddressAbsolute(state, 6));
opcodeHandlers[0x3E] = state => instructions.rol(state, readAddressAbsoluteX(state, 7));



opcodeHandlers[0x6A] = instructions.rorA;
opcodeHandlers[0x66] = state => instructions.ror(state, readAddressZeroPage(state, 5));
opcodeHandlers[0x76] = state => instructions.ror(state, readAddressZeroPageX(state, 6));
opcodeHandlers[0x6E] = state => instructions.ror(state, readAddressAbsolute(state, 6));
opcodeHandlers[0x7E] = state => instructions.ror(state, readAddressAbsoluteX(state, 7));


opcodeHandlers[0x67] = state => instructions.rra(state, readAddressZeroPage(state, 5));
opcodeHandlers[0x77] = state => instructions.rra(state, readAddressZeroPageX(state, 6));
opcodeHandlers[0x6F] = state => instructions.rra(state, readAddressAbsolute(state, 6));
opcodeHandlers[0x7F] = state => instructions.rra(state, readAddressAbsoluteX(state, 7));
opcodeHandlers[0x7B] = state => instructions.rra(state, readAddressAbsoluteY(state, 7));
opcodeHandlers[0x63] = state => instructions.rra(state, readAddressIndirectX(state, 8));
opcodeHandlers[0x73] = state => instructions.rra(state, readAddressIndirectY(state, 8));


opcodeHandlers[0x87] = state => instructions.sax(state, readAddressZeroPage(state, 3));
opcodeHandlers[0x97] = state => instructions.sax(state, readAddressZeroPageY(state, 4));
opcodeHandlers[0x83] = state => instructions.sax(state, readAddressIndirectX(state, 6))
opcodeHandlers[0x8F] = state => instructions.sax(state, readAddressAbsolute(state, 4))


opcodeHandlers[0xE9] = state => instructions.sbc(state, readValueImmediate(state, 2));
opcodeHandlers[0xEB] = state => instructions.sbc(state, readValueImmediate(state, 2)); // *SBC

opcodeHandlers[0xE5] = state => instructions.sbc(state, readValueZeroPage(state, 3)) ;
opcodeHandlers[0xF5] = state => instructions.sbc(state, readValueZeroPageX(state, 4));
opcodeHandlers[0xED] = state => instructions.sbc(state, readValueAbsolute(state, 4));
opcodeHandlers[0xFD] = state => instructions.sbc(state, readValueAbsoluteXWithPageBoundaryCycle(state, 4));
opcodeHandlers[0xF9] = state => instructions.sbc(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4));
opcodeHandlers[0xE1] = state => instructions.sbc(state, readValueIndirectX(state, 6));
opcodeHandlers[0xF1] = state => instructions.sbc(state, readValueIndirectYWithPageBoundaryCycle(state, 5));

opcodeHandlers[0x38] = instructions.sec;
opcodeHandlers[0x78] = instructions.sei;
opcodeHandlers[0xF8] = instructions.sed;


opcodeHandlers[0x07] = state => instructions.slo(state, readAddressZeroPage(state, 5));
opcodeHandlers[0x17] = state => instructions.slo(state, readAddressZeroPageX(state, 6));
opcodeHandlers[0x0F] = state => instructions.slo(state, readAddressAbsolute(state, 6));
opcodeHandlers[0x1F] = state => instructions.slo(state, readAddressAbsoluteX(state, 7));
opcodeHandlers[0x1B] = state => instructions.slo(state, readAddressAbsoluteY(state, 7));
opcodeHandlers[0x03] = state => instructions.slo(state, readAddressIndirectX(state, 8));
opcodeHandlers[0x13] = state => instructions.slo(state, readAddressIndirectY(state, 8));


opcodeHandlers[0x47] = state => instructions.sre(state, readAddressZeroPage(state, 5));
opcodeHandlers[0x57] = state => instructions.sre(state, readAddressZeroPageX(state, 6));
opcodeHandlers[0x4F] = state => instructions.sre(state, readAddressAbsolute(state, 6));
opcodeHandlers[0x5F] = state => instructions.sre(state, readAddressAbsoluteX(state, 7));
opcodeHandlers[0x5B] = state => instructions.sre(state, readAddressAbsoluteY(state, 7));
opcodeHandlers[0x43] = state => instructions.sre(state, readAddressIndirectX(state, 8));
opcodeHandlers[0x53] = state => instructions.sre(state, readAddressIndirectY(state, 8));

// STA
opcodeHandlers[0x85] = state => instructions.sta(state, readAddressZeroPage(state, 3));
opcodeHandlers[0x95] = state => instructions.sta(state, readAddressZeroPageX(state, 4));
opcodeHandlers[0x8D] = state => instructions.sta(state, readAddressAbsolute(state, 4));
opcodeHandlers[0x9D] = state => instructions.sta(state, readAddressAbsoluteX(state, 5));
opcodeHandlers[0x99] = state => instructions.sta(state, readAddressAbsoluteY(state, 5));
opcodeHandlers[0x81] = state => instructions.sta(state, readAddressIndirectX(state, 6));
opcodeHandlers[0x91] = state => instructions.sta(state, readAddressIndirectY(state, 6));


// STX
opcodeHandlers[0x86] = state => instructions.stx(state, readAddressZeroPage(state, 3));
opcodeHandlers[0x96] = state => instructions.stx(state, readAddressZeroPageY(state, 4));
opcodeHandlers[0x8E] = state => instructions.stx(state, readAddressAbsolute(state, 4));

// STY
opcodeHandlers[0x84] = state => instructions.sty(state, readAddressZeroPage(state, 3));
opcodeHandlers[0x94] = state => instructions.sty(state, readAddressZeroPageX(state, 4));
opcodeHandlers[0x8C] = state => instructions.sty(state, readAddressAbsolute(state, 4));


opcodeHandlers[0x0] = instructions.brk;
opcodeHandlers[0x08] = instructions.php;
opcodeHandlers[0x48] = instructions.pha;
opcodeHandlers[0x28] = instructions.plp;
opcodeHandlers[0x40] = instructions.rti;
opcodeHandlers[0x68] = instructions.pla;
opcodeHandlers[0x20] = instructions.jsr;
opcodeHandlers[0x60] = instructions.rts;

opcodeHandlers[0x9E] = instructions.sxa;

// SYA
opcodeHandlers[0x9C] = instructions.sya;

export default opcodeHandlers;
