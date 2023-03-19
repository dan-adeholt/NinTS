import * as branch from './instructions/branch';
import * as stack from './instructions/stack';
import * as readmodifywrite from './instructions/readmodifywrite';
import * as compare from './instructions/compare';
import * as register from './instructions/register';
import * as jump from './instructions/jump';
import * as flags from './instructions/flags';
import * as arithmetic from './instructions/arithmetic';
import * as store from './instructions/store';
import * as load from './instructions/load';
import * as nop from './instructions/nop';
import * as illegal from './instructions/illegal';
import * as memory from './memory';
import EmulatorState from './EmulatorState';

export const OAM_DMA = 0x4014;

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

export const MaxInstructionSize = 3;

export const getInstructionSize = (mode : number) => {
    switch (mode) {
        case ModeIndirect:
        case ModeAbsolute:
        case ModeAbsoluteX:
        case ModeAbsoluteY:
            return 3;
        case ModeIndirectX:
        case ModeIndirectY:
        case ModeImmediate:
        case ModeZeroPageY:
        case ModeZeroPageX:
        case ModeZeroPage:
        case ModeRelative:
            return 2;
        case ModeImplied:
        case ModeAccumulator:
            return 1;
        default:
            console.error('Invalid mode passed to getInstructionSize');
            return 1;
    }
};

type OpcodeEntry = [number, string, number]

const opcodes: OpcodeEntry[] = [
  [0x69, "ADC",  ModeImmediate],
  [0x65, "ADC",  ModeZeroPage],
  [0x75, "ADC",  ModeZeroPageX],
  [0x6D, "ADC",  ModeAbsolute],
  [0x7D, "ADC",  ModeAbsoluteX],
  [0x79, "ADC",  ModeAbsoluteY],
  [0x61, "ADC",  ModeIndirectX],
  [0x71, "ADC",  ModeIndirectY],
  [0x29, "AND",  ModeImmediate],
  [0x25, "AND",  ModeZeroPage],
  [0x35, "AND",  ModeZeroPageX],
  [0x2D, "AND",  ModeAbsolute],
  [0x3D, "AND",  ModeAbsoluteX],
  [0x39, "AND",  ModeAbsoluteY],
  [0x21, "AND",  ModeIndirectX],
  [0x31, "AND",  ModeIndirectY],
  [0x24, "BIT",  ModeZeroPage],
  [0x2C, "BIT",  ModeAbsolute],
  [0x49, "EOR",  ModeImmediate],
  [0x45, "EOR",  ModeZeroPage],
  [0x55, "EOR",  ModeZeroPageX],
  [0x4D, "EOR",  ModeAbsolute],
  [0x5D, "EOR",  ModeAbsoluteX],
  [0x59, "EOR",  ModeAbsoluteY],
  [0x41, "EOR",  ModeIndirectX],
  [0x51, "EOR",  ModeIndirectY],
  [0x09, "ORA",  ModeImmediate],
  [0x05, "ORA",  ModeZeroPage],
  [0x15, "ORA",  ModeZeroPageX],
  [0x0D, "ORA",  ModeAbsolute],
  [0x1D, "ORA",  ModeAbsoluteX],
  [0x19, "ORA",  ModeAbsoluteY],
  [0x01, "ORA",  ModeIndirectX],
  [0x11, "ORA",  ModeIndirectY],
  [0xE9, "SBC",  ModeImmediate],
  [0xEB, "SBC*", ModeImmediate],
  [0xE5, "SBC",  ModeZeroPage],
  [0xF5, "SBC",  ModeZeroPageX],
  [0xED, "SBC",  ModeAbsolute],
  [0xFD, "SBC",  ModeAbsoluteX],
  [0xF9, "SBC",  ModeAbsoluteY],
  [0xE1, "SBC",  ModeIndirectX],
  [0xF1, "SBC",  ModeIndirectY],

  [0x90, "BCC",  ModeRelative],
  [0xF0, "BEQ",  ModeRelative],
  [0xD0, "BNE",  ModeRelative],
  [0xB0, "BCS",  ModeRelative],
  [0x50, "BVC",  ModeRelative],
  [0x70, "BVS",  ModeRelative],
  [0x10, "BPL",  ModeRelative],
  [0x30, "BMI",  ModeRelative],

  [0x18, "CLC",  ModeImplied],
  [0xD8, "CLD",  ModeImplied],
  [0x58, "CLI",  ModeImplied],
  [0xB8, "CLV",  ModeImplied],
  [0x38, "SEC",  ModeImplied],
  [0x78, "SEI",  ModeImplied],
  [0xF8, "SED",  ModeImplied],

  [0xC9, "CMP",  ModeImmediate],
  [0xC5, "CMP",  ModeZeroPage],
  [0xD5, "CMP",  ModeZeroPageX],
  [0xCD, "CMP",  ModeAbsolute],
  [0xDD, "CMP",  ModeAbsoluteX],
  [0xD9, "CMP",  ModeAbsoluteY],
  [0xC1, "CMP",  ModeIndirectX],
  [0xD1, "CMP",  ModeIndirectY],
  [0xE0, "CPX",  ModeImmediate],
  [0xE4, "CPX",  ModeZeroPage],
  [0xEC, "CPX",  ModeAbsolute],
  [0xC0, "CPY",  ModeImmediate],
  [0xC4, "CPY",  ModeZeroPage],
  [0xCC, "CPY",  ModeAbsolute],

  [0x4C, "JMP",  ModeAbsolute],
  [0x6C, "JMP",  ModeIndirect],
  [0x20, "JSR",  ModeAbsolute],

  [0xA7, "LAX*", ModeZeroPage],
  [0xB7, "LAX*", ModeZeroPageY],
  [0xAF, "LAX*", ModeAbsolute],
  [0xBF, "LAX*", ModeAbsoluteY],
  [0xA3, "LAX*", ModeIndirectX],
  [0xB3, "LAX*", ModeIndirectY],
  [0xA9, "LDA",  ModeImmediate],
  [0xA5, "LDA",  ModeZeroPage],
  [0xB5, "LDA",  ModeZeroPageX],
  [0xAD, "LDA",  ModeAbsolute],
  [0xBD, "LDA",  ModeAbsoluteX],
  [0xB9, "LDA",  ModeAbsoluteY],
  [0xA1, "LDA",  ModeIndirectX],
  [0xB1, "LDA",  ModeIndirectY],
  [0xA2, "LDX",  ModeImmediate],
  [0xA6, "LDX",  ModeZeroPage],
  [0xB6, "LDX",  ModeZeroPageY],
  [0xAE, "LDX",  ModeAbsolute],
  [0xBE, "LDX",  ModeAbsoluteY],
  [0xA0, "LDY",  ModeImmediate],
  [0xA4, "LDY",  ModeZeroPage],
  [0xB4, "LDY",  ModeZeroPageX],
  [0xAC, "LDY",  ModeAbsolute],
  [0xBC, "LDY",  ModeAbsoluteX],

  [0xEA, "NOP",  ModeImplied],
  [0x1A, "NOP*", ModeImplied],
  [0x3A, "NOP*", ModeImplied],
  [0x5A, "NOP*", ModeImplied],
  [0x7A, "NOP*", ModeImplied],
  [0xDA, "NOP*", ModeImplied],
  [0xFA, "NOP*", ModeImplied],
  [0x80, "NOP*", ModeImmediate],
  [0x82, "NOP*", ModeImmediate],
  [0x89, "NOP*", ModeImmediate],
  [0xC2, "NOP*", ModeImmediate],
  [0xE2, "NOP*", ModeImmediate],
  [0x04, "NOP*", ModeZeroPage],
  [0x44, "NOP*", ModeZeroPage],
  [0x64, "NOP*", ModeZeroPage],
  [0x0C, "NOP*", ModeAbsolute],
  [0x14, "NOP*", ModeZeroPageX],
  [0x34, "NOP*", ModeZeroPageX],
  [0x54, "NOP*", ModeZeroPageX],
  [0x74, "NOP*", ModeZeroPageX],
  [0xD4, "NOP*", ModeZeroPageX],
  [0xF4, "NOP*", ModeZeroPageX],
  [0x1C, "NOP*",  ModeAbsoluteX],
  [0x3C, "NOP*",  ModeAbsoluteX],
  [0x5C, "NOP*",  ModeAbsoluteX],
  [0x7C, "NOP*",  ModeAbsoluteX],
  [0xDC, "NOP*",  ModeAbsoluteX],
  [0xFC, "NOP*",  ModeAbsoluteX],

  [0xC8, "INY",  ModeImplied],
  [0x88, "DEY",  ModeImplied],
  [0xA8, "TAY",  ModeImplied],
  [0xE8, "INX",  ModeImplied],
  [0xCA, "DEX",  ModeImplied],
  [0xAA, "TAX",  ModeImplied],
  [0xBA, "TSX",  ModeImplied],
  [0x8A, "TXA",  ModeImplied],
  [0x98, "TYA",  ModeImplied],
  [0x9A, "TXS",  ModeImplied],

  [0x0A, "ASL",  ModeAccumulator],
  [0x06, "ASL",  ModeZeroPage],
  [0x16, "ASL",  ModeZeroPageX],
  [0x0E, "ASL",  ModeAbsolute],
  [0x1E, "ASL",  ModeAbsoluteX],
  [0xE6, "INC",  ModeZeroPage],
  [0xF6, "INC",  ModeZeroPageX],
  [0xEE, "INC",  ModeAbsolute],
  [0xFE, "INC",  ModeAbsoluteX],
  [0x4A, "LSR",  ModeAccumulator],
  [0x46, "LSR",  ModeZeroPage],
  [0x56, "LSR",  ModeZeroPageX],
  [0x4E, "LSR",  ModeAbsolute],
  [0x5E, "LSR",  ModeAbsoluteX],
  [0xC6, "DEC",  ModeZeroPage],
  [0xD6, "DEC",  ModeZeroPageX],
  [0xCE, "DEC",  ModeAbsolute],
  [0xDE, "DEC",  ModeAbsoluteX],
  [0x2A, "ROL",  ModeAccumulator],
  [0x26, "ROL",  ModeZeroPage],
  [0x36, "ROL",  ModeZeroPageX],
  [0x2E, "ROL",  ModeAbsolute],
  [0x3E, "ROL",  ModeAbsoluteX],
  [0x6A, "ROR",  ModeAccumulator],
  [0x66, "ROR",  ModeZeroPage],
  [0x76, "ROR",  ModeZeroPageX],
  [0x6E, "ROR",  ModeAbsolute],
  [0x7E, "ROR",  ModeAbsoluteX],

  [0x85, "STA",  ModeZeroPage],
  [0x95, "STA",  ModeZeroPageX],
  [0x8D, "STA",  ModeAbsolute],
  [0x9D, "STA",  ModeAbsoluteX],
  [0x99, "STA",  ModeAbsoluteY],
  [0x81, "STA",  ModeIndirectX],
  [0x91, "STA",  ModeIndirectY],
  [0x86, "STX",  ModeZeroPage],
  [0x96, "STX",  ModeZeroPageY],
  [0x8E, "STX",  ModeAbsolute],
  [0x84, "STY",  ModeZeroPage],
  [0x94, "STY",  ModeZeroPageX],
  [0x8C, "STY",  ModeAbsolute],

  [0x08, "PHP",  ModeImplied],
  [0x48, "PHA",  ModeImplied],
  [0x28, "PLP",  ModeImplied],
  [0x68, "PLA",  ModeImplied],
  [0x00, "BRK",  ModeImplied],
  [0x40, "RTI",  ModeImplied],
  [0x60, "RTS",  ModeImplied],

  [0x0B, "AAC*", ModeImmediate],
  [0x2B, "AAC*", ModeImmediate],
  [0x6B, "ARR*", ModeImmediate],
  [0x4B, "ASR*", ModeImmediate],
  [0xAB, "ATX*", ModeImmediate],
  [0xCB, "AXS*", ModeImmediate],
  [0xC7, "DCP*", ModeZeroPage],
  [0xD7, "DCP*", ModeZeroPageX],
  [0xCF, "DCP*", ModeAbsolute],
  [0xDF, "DCP*", ModeAbsoluteX],
  [0xDB, "DCP*", ModeAbsoluteY],
  [0xC3, "DCP*", ModeIndirectX],
  [0xD3, "DCP*", ModeIndirectY],
  [0xE7, "ISC*", ModeZeroPage],
  [0xF7, "ISC*", ModeZeroPageX],
  [0xEF, "ISC*", ModeAbsolute],
  [0xFF, "ISC*", ModeAbsoluteX],
  [0xFB, "ISC*", ModeAbsoluteY],
  [0xE3, "ISC*", ModeIndirectX],
  [0xF3, "ISC*", ModeIndirectY],
  [0x27, "RLA*", ModeZeroPage],
  [0x37, "RLA*", ModeZeroPageX],
  [0x2F, "RLA*", ModeAbsolute],
  [0x3F, "RLA*", ModeAbsoluteX],
  [0x3B, "RLA*", ModeAbsoluteY],
  [0x23, "RLA*", ModeIndirectX],
  [0x33, "RLA*", ModeIndirectY],
  [0x67, "RRA*", ModeZeroPage],
  [0x77, "RRA*", ModeZeroPageX],
  [0x6F, "RRA*", ModeAbsolute],
  [0x7F, "RRA*", ModeAbsoluteX],
  [0x7B, "RRA*", ModeAbsoluteY],
  [0x63, "RRA*", ModeIndirectX],
  [0x73, "RRA*", ModeIndirectY],
  [0x87, "SAX*", ModeZeroPage],
  [0x97, "SAX*", ModeZeroPageY],
  [0x83, "SAX*", ModeIndirectX],
  [0x8F, "SAX*", ModeAbsolute],
  [0x07, "SLO*", ModeZeroPage],
  [0x17, "SLO*", ModeZeroPageX],
  [0x0F, "SLO*", ModeAbsolute],
  [0x1F, "SLO*", ModeAbsoluteX],
  [0x1B, "SLO*", ModeAbsoluteY],
  [0x03, "SLO*", ModeIndirectX],
  [0x13, "SLO*", ModeIndirectY],
  [0x47, "SRE*", ModeZeroPage],
  [0x57, "SRE*", ModeZeroPageX],
  [0x4F, "SRE*", ModeAbsolute],
  [0x5F, "SRE*", ModeAbsoluteX],
  [0x5B, "SRE*", ModeAbsoluteY],
  [0x43, "SRE*", ModeIndirectX],
  [0x53, "SRE*", ModeIndirectY],
  [0x9B, "TAS*", ModeAbsoluteY],
  [0xBB, "LAS*", ModeAbsoluteY],
  [0x9E, "SXA*", ModeAbsoluteY],
  [0x9C, "SYA*", ModeAbsoluteX],
  [0x9F, "AXA*", ModeAbsoluteY],
  [0x93, "AXA*", ModeIndirectY],
  [0x8b, "ANE*", ModeImmediate]
];

export function execOpcode(state : EmulatorState, opcode: number) {
  switch (opcode) {
    case 0x69: arithmetic.adc(state, memory.readImmediate(state)); break;
    case 0x65: arithmetic.adc(state, memory.readZeroPage(state)); break;
    case 0x75: arithmetic.adc(state, memory.readZeroPageX(state)); break;
    case 0x6D: arithmetic.adc(state, memory.readAbsolute(state)); break;
    case 0x7D: arithmetic.adc(state, memory.readAbsoluteXShortenCycle(state)); break;
    case 0x79: arithmetic.adc(state, memory.readAbsoluteYShortenCycle(state)); break;
    case 0x61: arithmetic.adc(state, memory.readIndirectX(state)); break;
    case 0x71: arithmetic.adc(state, memory.readIndirectYShortenCycle(state)); break;
    case 0x29: arithmetic.and(state, memory.readImmediate(state)); break;
    case 0x25: arithmetic.and(state, memory.readZeroPage(state)); break;
    case 0x35: arithmetic.and(state, memory.readZeroPageX(state)); break;
    case 0x2D: arithmetic.and(state, memory.readAbsolute(state)); break;
    case 0x3D: arithmetic.and(state, memory.readAbsoluteXShortenCycle(state)); break;
    case 0x39: arithmetic.and(state, memory.readAbsoluteYShortenCycle(state)); break;
    case 0x21: arithmetic.and(state, memory.readIndirectX(state)); break;
    case 0x31: arithmetic.and(state, memory.readIndirectYShortenCycle(state)); break;
    case 0x24: arithmetic.bit(state, memory.readZeroPage(state)); break;
    case 0x2C: arithmetic.bit(state, memory.readAbsolute(state)); break;
    case 0x49: arithmetic.eor(state, memory.readImmediate(state)); break;
    case 0x45: arithmetic.eor(state, memory.readZeroPage(state)); break;
    case 0x55: arithmetic.eor(state, memory.readZeroPageX(state)); break;
    case 0x4D: arithmetic.eor(state, memory.readAbsolute(state)); break;
    case 0x5D: arithmetic.eor(state, memory.readAbsoluteXShortenCycle(state)); break;
    case 0x59: arithmetic.eor(state, memory.readAbsoluteYShortenCycle(state)); break;
    case 0x41: arithmetic.eor(state, memory.readIndirectX(state)); break;
    case 0x51: arithmetic.eor(state, memory.readIndirectYShortenCycle(state)); break;
    case 0x09: arithmetic.ora(state, memory.readImmediate(state)); break;
    case 0x05: arithmetic.ora(state, memory.readZeroPage(state)); break;
    case 0x15: arithmetic.ora(state, memory.readZeroPageX(state)); break;
    case 0x0D: arithmetic.ora(state, memory.readAbsolute(state)); break;
    case 0x1D: arithmetic.ora(state, memory.readAbsoluteXShortenCycle(state)); break;
    case 0x19: arithmetic.ora(state, memory.readAbsoluteYShortenCycle(state)); break;
    case 0x01: arithmetic.ora(state, memory.readIndirectX(state)); break;
    case 0x11: arithmetic.ora(state, memory.readIndirectYShortenCycle(state)); break;
    case 0xE9: arithmetic.sbc(state, memory.readImmediate(state)); break;
    case 0xEB: arithmetic.sbc(state, memory.readImmediate(state)); break;
    case 0xE5: arithmetic.sbc(state, memory.readZeroPage(state)); break;
    case 0xF5: arithmetic.sbc(state, memory.readZeroPageX(state)); break;
    case 0xED: arithmetic.sbc(state, memory.readAbsolute(state)); break;
    case 0xFD: arithmetic.sbc(state, memory.readAbsoluteXShortenCycle(state)); break;
    case 0xF9: arithmetic.sbc(state, memory.readAbsoluteYShortenCycle(state)); break;
    case 0xE1: arithmetic.sbc(state, memory.readIndirectX(state)); break;
    case 0xF1: arithmetic.sbc(state, memory.readIndirectYShortenCycle(state)); break;

    case 0x90: branch.bcc(state, memory.readImmediate(state)); break;
    case 0xF0: branch.beq(state, memory.readImmediate(state)); break;
    case 0xD0: branch.bne(state, memory.readImmediate(state)); break;
    case 0xB0: branch.bcs(state, memory.readImmediate(state)); break;
    case 0x50: branch.bvc(state, memory.readImmediate(state)); break;
    case 0x70: branch.bvs(state, memory.readImmediate(state)); break;
    case 0x10: branch.bpl(state, memory.readImmediate(state)); break;
    case 0x30: branch.bmi(state, memory.readImmediate(state)); break;

    case 0x18: flags.clc(state); break;
    case 0xD8: flags.cld(state); break;
    case 0x58: flags.cli(state); break;
    case 0xB8: flags.clv(state); break;
    case 0x38: flags.sec(state); break;
    case 0x78: flags.sei(state); break;
    case 0xF8: flags.sed(state); break;

    case 0xC9: compare.cmp(state, memory.readImmediate(state)); break;
    case 0xC5: compare.cmp(state, memory.readZeroPage(state)); break;
    case 0xD5: compare.cmp(state, memory.readZeroPageX(state)); break;
    case 0xCD: compare.cmp(state, memory.readAbsolute(state)); break;
    case 0xDD: compare.cmp(state, memory.readAbsoluteXShortenCycle(state)); break;
    case 0xD9: compare.cmp(state, memory.readAbsoluteYShortenCycle(state)); break;
    case 0xC1: compare.cmp(state, memory.readIndirectX(state)); break;
    case 0xD1: compare.cmp(state, memory.readIndirectYShortenCycle(state)); break;
    case 0xE0: compare.cpx(state, memory.readImmediate(state)); break;
    case 0xE4: compare.cpx(state, memory.readZeroPage(state)); break;
    case 0xEC: compare.cpx(state, memory.readAbsolute(state)); break;
    case 0xC0: compare.cpy(state, memory.readImmediate(state)); break;
    case 0xC4: compare.cpy(state, memory.readZeroPage(state)); break;
    case 0xCC: compare.cpy(state, memory.readAbsolute(state)); break;

    case 0x4C: jump.jmp(state, memory.readAbsolute(state)); break;
    case 0x6C: jump.jmp(state, memory.readIndirect(state)); break;
    case 0x20: jump.jsr(state); break;

    case 0xA7: load.lax(state, memory.readZeroPage(state)); break;
    case 0xB7: load.lax(state, memory.readZeroPageY(state)); break;
    case 0xAF: load.lax(state, memory.readAbsolute(state)); break;
    case 0xBF: load.lax(state, memory.readAbsoluteYShortenCycle(state)); break;
    case 0xA3: load.lax(state, memory.readIndirectX(state)); break;
    case 0xB3: load.lax(state, memory.readIndirectYShortenCycle(state)); break;
    case 0xA9: load.lda(state, memory.readImmediate(state)); break;
    case 0xA5: load.lda(state, memory.readZeroPage(state)); break;
    case 0xB5: load.lda(state, memory.readZeroPageX(state)); break;
    case 0xAD: load.lda(state, memory.readAbsolute(state)); break;
    case 0xBD: load.lda(state, memory.readAbsoluteXShortenCycle(state)); break;
    case 0xB9: load.lda(state, memory.readAbsoluteYShortenCycle(state)); break;
    case 0xA1: load.lda(state, memory.readIndirectX(state)); break;
    case 0xB1: load.lda(state, memory.readIndirectYShortenCycle(state)); break;
    case 0xA2: load.ldx(state, memory.readImmediate(state)); break;
    case 0xA6: load.ldx(state, memory.readZeroPage(state)); break;
    case 0xB6: load.ldx(state, memory.readZeroPageY(state)); break;
    case 0xAE: load.ldx(state, memory.readAbsolute(state)); break;
    case 0xBE: load.ldx(state, memory.readAbsoluteYShortenCycle(state)); break;
    case 0xA0: load.ldy(state, memory.readImmediate(state)); break;
    case 0xA4: load.ldy(state, memory.readZeroPage(state)); break;
    case 0xB4: load.ldy(state, memory.readZeroPageX(state)); break;
    case 0xAC: load.ldy(state, memory.readAbsolute(state)); break;
    case 0xBC: load.ldy(state, memory.readAbsoluteXShortenCycle(state)); break;

    case 0xEA: nop.nop(state); break;
    case 0x1A: nop.nop(state); break;
    case 0x3A: nop.nop(state); break;
    case 0x5A: nop.nop(state); break;
    case 0x7A: nop.nop(state); break;
    case 0xDA: nop.nop(state); break;
    case 0xFA: nop.nop(state); break;
    case 0x80: nop.unofficialNop(state, memory.readImmediate(state)); break;
    case 0x82: nop.unofficialNop(state, memory.readImmediate(state)); break;
    case 0x89: nop.unofficialNop(state, memory.readImmediate(state)); break;
    case 0xC2: nop.unofficialNop(state, memory.readImmediate(state)); break;
    case 0xE2: nop.unofficialNop(state, memory.readImmediate(state)); break;
    case 0x04: nop.unofficialNop(state, memory.readZeroPage(state)); break;
    case 0x44: nop.unofficialNop(state, memory.readZeroPage(state)); break;
    case 0x64: nop.unofficialNop(state, memory.readZeroPage(state)); break;
    case 0x0C: nop.unofficialNop(state, memory.readAbsolute(state)); break;
    case 0x14: nop.unofficialNop(state, memory.readZeroPageX(state)); break;
    case 0x34: nop.unofficialNop(state, memory.readZeroPageX(state)); break;
    case 0x54: nop.unofficialNop(state, memory.readZeroPageX(state)); break;
    case 0x74: nop.unofficialNop(state, memory.readZeroPageX(state)); break;
    case 0xD4: nop.unofficialNop(state, memory.readZeroPageX(state)); break;
    case 0xF4: nop.unofficialNop(state, memory.readZeroPageX(state)); break;
    case 0x1C: nop.unofficialNop(state, memory.readAbsoluteXShortenCycle(state)); break;
    case 0x3C: nop.unofficialNop(state, memory.readAbsoluteXShortenCycle(state)); break;
    case 0x5C: nop.unofficialNop(state, memory.readAbsoluteXShortenCycle(state)); break;
    case 0x7C: nop.unofficialNop(state, memory.readAbsoluteXShortenCycle(state)); break;
    case 0xDC: nop.unofficialNop(state, memory.readAbsoluteXShortenCycle(state)); break;
    case 0xFC: nop.unofficialNop(state, memory.readAbsoluteXShortenCycle(state)); break;

    case 0xC8: register.iny(state); break;
    case 0x88: register.dey(state); break;
    case 0xA8: register.tay(state); break;
    case 0xE8: register.inx(state); break;
    case 0xCA: register.dex(state); break;
    case 0xAA: register.tax(state); break;
    case 0xBA: register.tsx(state); break;
    case 0x8A: register.txa(state); break;
    case 0x98: register.tya(state); break;
    case 0x9A: register.txs(state); break;

    case 0x0A: readmodifywrite.aslA(state); break;
    case 0x06: readmodifywrite.asl(state, memory.readZeroPage(state)); break;
    case 0x16: readmodifywrite.asl(state, memory.readZeroPageX(state)); break;
    case 0x0E: readmodifywrite.asl(state, memory.readAbsolute(state)); break;
    case 0x1E: readmodifywrite.asl(state, memory.readAbsoluteX(state)); break;
    case 0xE6: readmodifywrite.inc(state, memory.readZeroPage(state)); break;
    case 0xF6: readmodifywrite.inc(state, memory.readZeroPageX(state)); break;
    case 0xEE: readmodifywrite.inc(state, memory.readAbsolute(state)); break;
    case 0xFE: readmodifywrite.inc(state, memory.readAbsoluteX(state)); break;
    case 0x4A: readmodifywrite.lsrA(state); break;
    case 0x46: readmodifywrite.lsr(state, memory.readZeroPage(state)); break;
    case 0x56: readmodifywrite.lsr(state, memory.readZeroPageX(state)); break;
    case 0x4E: readmodifywrite.lsr(state, memory.readAbsolute(state)); break;
    case 0x5E: readmodifywrite.lsr(state, memory.readAbsoluteX(state)); break;
    case 0xC6: readmodifywrite.dec(state, memory.readZeroPage(state)); break;
    case 0xD6: readmodifywrite.dec(state, memory.readZeroPageX(state)); break;
    case 0xCE: readmodifywrite.dec(state, memory.readAbsolute(state)); break;
    case 0xDE: readmodifywrite.dec(state, memory.readAbsoluteX(state)); break;
    case 0x2A: readmodifywrite.rolA(state); break;
    case 0x26: readmodifywrite.rol(state, memory.readZeroPage(state)); break;
    case 0x36: readmodifywrite.rol(state, memory.readZeroPageX(state)); break;
    case 0x2E: readmodifywrite.rol(state, memory.readAbsolute(state)); break;
    case 0x3E: readmodifywrite.rol(state, memory.readAbsoluteX(state)); break;
    case 0x6A: readmodifywrite.rorA(state); break;
    case 0x66: readmodifywrite.ror(state, memory.readZeroPage(state)); break;
    case 0x76: readmodifywrite.ror(state, memory.readZeroPageX(state)); break;
    case 0x6E: readmodifywrite.ror(state, memory.readAbsolute(state)); break;
    case 0x7E: readmodifywrite.ror(state, memory.readAbsoluteX(state)); break;

    case 0x85: store.sta(state, memory.readZeroPage(state)); break;
    case 0x95: store.sta(state, memory.readZeroPageX(state)); break;
    case 0x8D: store.sta(state, memory.readAbsolute(state)); break;
    case 0x9D: store.sta(state, memory.readAbsoluteX(state)); break;
    case 0x99: store.sta(state, memory.readAbsoluteY(state)); break;
    case 0x81: store.sta(state, memory.readIndirectX(state)); break;
    case 0x91: store.sta(state, memory.readIndirectY(state)); break;
    case 0x86: store.stx(state, memory.readZeroPage(state)); break;
    case 0x96: store.stx(state, memory.readZeroPageY(state)); break;
    case 0x8E: store.stx(state, memory.readAbsolute(state)); break;
    case 0x84: store.sty(state, memory.readZeroPage(state)); break;
    case 0x94: store.sty(state, memory.readZeroPageX(state)); break;
    case 0x8C: store.sty(state, memory.readAbsolute(state)); break;

    case 0x08: stack.php(state); break;
    case 0x48: stack.pha(state); break;
    case 0x28: stack.plp(state); break;
    case 0x68: stack.pla(state); break;
    case 0x00: stack.brk(state); break;
    case 0x40: stack.rti(state); break;
    case 0x60: stack.rts(state); break;

    case 0x0B: illegal.aac(state, memory.readImmediate(state)); break;
    case 0x2B: illegal.aac(state, memory.readImmediate(state)); break;
    case 0x6B: illegal.arr(state, memory.readImmediate(state)); break;
    case 0x4B: illegal.asr(state, memory.readImmediate(state)); break;
    case 0xAB: illegal.atx(state, memory.readImmediate(state)); break;
    case 0xCB: illegal.axs(state, memory.readImmediate(state)); break;
    case 0xC7: illegal.dcp(state, memory.readZeroPage(state)); break;
    case 0xD7: illegal.dcp(state, memory.readZeroPageX(state)); break;
    case 0xCF: illegal.dcp(state, memory.readAbsolute(state)); break;
    case 0xDF: illegal.dcp(state, memory.readAbsoluteX(state)); break;
    case 0xDB: illegal.dcp(state, memory.readAbsoluteY(state)); break;
    case 0xC3: illegal.dcp(state, memory.readIndirectX(state)); break;
    case 0xD3: illegal.dcp(state, memory.readIndirectY(state)); break;
    case 0xE7: illegal.isb(state, memory.readZeroPage(state)); break;
    case 0xF7: illegal.isb(state, memory.readZeroPageX(state)); break;
    case 0xEF: illegal.isb(state, memory.readAbsolute(state)); break;
    case 0xFF: illegal.isb(state, memory.readAbsoluteX(state)); break;
    case 0xFB: illegal.isb(state, memory.readAbsoluteY(state)); break;
    case 0xE3: illegal.isb(state, memory.readIndirectX(state)); break;
    case 0xF3: illegal.isb(state, memory.readIndirectY(state)); break;
    case 0x27: illegal.rla(state, memory.readZeroPage(state)); break;
    case 0x37: illegal.rla(state, memory.readZeroPageX(state)); break;
    case 0x2F: illegal.rla(state, memory.readAbsolute(state)); break;
    case 0x3F: illegal.rla(state, memory.readAbsoluteX(state)); break;
    case 0x3B: illegal.rla(state, memory.readAbsoluteY(state)); break;
    case 0x23: illegal.rla(state, memory.readIndirectX(state)); break;
    case 0x33: illegal.rla(state, memory.readIndirectY(state)); break;
    case 0x67: illegal.rra(state, memory.readZeroPage(state)); break;
    case 0x77: illegal.rra(state, memory.readZeroPageX(state)); break;
    case 0x6F: illegal.rra(state, memory.readAbsolute(state)); break;
    case 0x7F: illegal.rra(state, memory.readAbsoluteX(state)); break;
    case 0x7B: illegal.rra(state, memory.readAbsoluteY(state)); break;
    case 0x63: illegal.rra(state, memory.readIndirectX(state)); break;
    case 0x73: illegal.rra(state, memory.readIndirectY(state)); break;
    case 0x87: illegal.sax(state, memory.readZeroPage(state)); break;
    case 0x97: illegal.sax(state, memory.readZeroPageY(state)); break;
    case 0x83: illegal.sax(state, memory.readIndirectX(state)); break;
    case 0x8F: illegal.sax(state, memory.readAbsolute(state)); break;
    case 0x07: illegal.slo(state, memory.readZeroPage(state)); break;
    case 0x17: illegal.slo(state, memory.readZeroPageX(state)); break;
    case 0x0F: illegal.slo(state, memory.readAbsolute(state)); break;
    case 0x1F: illegal.slo(state, memory.readAbsoluteX(state)); break;
    case 0x1B: illegal.slo(state, memory.readAbsoluteY(state)); break;
    case 0x03: illegal.slo(state, memory.readIndirectX(state)); break;
    case 0x13: illegal.slo(state, memory.readIndirectY(state)); break;
    case 0x47: illegal.sre(state, memory.readZeroPage(state)); break;
    case 0x57: illegal.sre(state, memory.readZeroPageX(state)); break;
    case 0x4F: illegal.sre(state, memory.readAbsolute(state)); break;
    case 0x5F: illegal.sre(state, memory.readAbsoluteX(state)); break;
    case 0x5B: illegal.sre(state, memory.readAbsoluteY(state)); break;
    case 0x43: illegal.sre(state, memory.readIndirectX(state)); break;
    case 0x53: illegal.sre(state, memory.readIndirectY(state)); break;
    case 0x9B: illegal.tas(state, memory.readAbsoluteY(state)); break;
    case 0xBB: illegal.las(state, memory.readAbsoluteYShortenCycle(state)); break;
    case 0x9E: illegal.sxa(state); break;
    case 0x9C: illegal.sya(state); break;
    case 0x9F: illegal.axa(state, memory.readAbsoluteY(state)); break;
    case 0x93: illegal.axa(state, memory.readIndirectY(state)); break;
    case 0x8b: illegal.empty(state, memory.readImmediate(state)); break;
  }
}

type OpcodeMetadataEntry = {
    name: string
    mode: number
}

export const opcodeMetadata: (Record<number, OpcodeMetadataEntry>) = {};

opcodes.forEach(entry => {
    const [opcode, name, mode] = entry;
    opcodeMetadata[opcode] = { name, mode };
})
