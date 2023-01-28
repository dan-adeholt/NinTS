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


type OpcodeWithRead = (state: EmulatorState, value : number) => (void | number)
type OpcodeWithoutRead = (state: EmulatorState) => (void | number)
type ReadFunction = (state: EmulatorState) => number
type OpcodeEntry = [number, string, number, OpcodeWithRead | OpcodeWithoutRead, ReadFunction | null]

const opcodes: OpcodeEntry[] = [
    [0x69, "ADC",  ModeImmediate,   arithmetic.adc, memory.readImmediate],
    [0x65, "ADC",  ModeZeroPage,    arithmetic.adc, memory.readZeroPage],
    [0x75, "ADC",  ModeZeroPageX,   arithmetic.adc, memory.readZeroPageX],
    [0x6D, "ADC",  ModeAbsolute,    arithmetic.adc, memory.readAbsolute],
    [0x7D, "ADC",  ModeAbsoluteX,   arithmetic.adc, memory.readAbsoluteXShortenCycle],
    [0x79, "ADC",  ModeAbsoluteY,   arithmetic.adc, memory.readAbsoluteYShortenCycle],
    [0x61, "ADC",  ModeIndirectX,   arithmetic.adc, memory.readIndirectX],
    [0x71, "ADC",  ModeIndirectY,   arithmetic.adc, memory.readIndirectYShortenCycle],
    [0x29, "AND",  ModeImmediate,   arithmetic.and, memory.readImmediate],
    [0x25, "AND",  ModeZeroPage,    arithmetic.and, memory.readZeroPage],
    [0x35, "AND",  ModeZeroPageX,   arithmetic.and, memory.readZeroPageX],
    [0x2D, "AND",  ModeAbsolute,    arithmetic.and, memory.readAbsolute],
    [0x3D, "AND",  ModeAbsoluteX,   arithmetic.and, memory.readAbsoluteXShortenCycle],
    [0x39, "AND",  ModeAbsoluteY,   arithmetic.and, memory.readAbsoluteYShortenCycle],
    [0x21, "AND",  ModeIndirectX,   arithmetic.and, memory.readIndirectX],
    [0x31, "AND",  ModeIndirectY,   arithmetic.and, memory.readIndirectYShortenCycle],
    [0x24, "BIT",  ModeZeroPage,    arithmetic.bit, memory.readZeroPage],
    [0x2C, "BIT",  ModeAbsolute,    arithmetic.bit, memory.readAbsolute],
    [0x49, "EOR",  ModeImmediate,   arithmetic.eor, memory.readImmediate],
    [0x45, "EOR",  ModeZeroPage,    arithmetic.eor, memory.readZeroPage ],
    [0x55, "EOR",  ModeZeroPageX,   arithmetic.eor, memory.readZeroPageX],
    [0x4D, "EOR",  ModeAbsolute,    arithmetic.eor, memory.readAbsolute],
    [0x5D, "EOR",  ModeAbsoluteX,   arithmetic.eor, memory.readAbsoluteXShortenCycle],
    [0x59, "EOR",  ModeAbsoluteY,   arithmetic.eor, memory.readAbsoluteYShortenCycle],
    [0x41, "EOR",  ModeIndirectX,   arithmetic.eor, memory.readIndirectX],
    [0x51, "EOR",  ModeIndirectY,   arithmetic.eor, memory.readIndirectYShortenCycle],
    [0x09, "ORA",  ModeImmediate,   arithmetic.ora, memory.readImmediate],
    [0x05, "ORA",  ModeZeroPage,    arithmetic.ora, memory.readZeroPage],
    [0x15, "ORA",  ModeZeroPageX,   arithmetic.ora, memory.readZeroPageX],
    [0x0D, "ORA",  ModeAbsolute,    arithmetic.ora, memory.readAbsolute],
    [0x1D, "ORA",  ModeAbsoluteX,   arithmetic.ora, memory.readAbsoluteXShortenCycle],
    [0x19, "ORA",  ModeAbsoluteY,   arithmetic.ora, memory.readAbsoluteYShortenCycle],
    [0x01, "ORA",  ModeIndirectX,   arithmetic.ora, memory.readIndirectX],
    [0x11, "ORA",  ModeIndirectY,   arithmetic.ora, memory.readIndirectYShortenCycle],
    [0xE9, "SBC",  ModeImmediate,    arithmetic.sbc, memory.readImmediate],
    [0xEB, "SBC*", ModeImmediate,   arithmetic.sbc, memory.readImmediate],
    [0xE5, "SBC",  ModeZeroPage,     arithmetic.sbc, memory.readZeroPage],
    [0xF5, "SBC",  ModeZeroPageX,    arithmetic.sbc, memory.readZeroPageX],
    [0xED, "SBC",  ModeAbsolute,     arithmetic.sbc, memory.readAbsolute],
    [0xFD, "SBC",  ModeAbsoluteX,    arithmetic.sbc, memory.readAbsoluteXShortenCycle],
    [0xF9, "SBC",  ModeAbsoluteY,    arithmetic.sbc, memory.readAbsoluteYShortenCycle],
    [0xE1, "SBC",  ModeIndirectX,    arithmetic.sbc, memory.readIndirectX],
    [0xF1, "SBC",  ModeIndirectY,    arithmetic.sbc, memory.readIndirectYShortenCycle],

    [0x90, "BCC",  ModeRelative,    branch.bcc, memory.readImmediate],
    [0xF0, "BEQ",  ModeRelative,    branch.beq, memory.readImmediate],
    [0xD0, "BNE",  ModeRelative,    branch.bne, memory.readImmediate],
    [0xB0, "BCS",  ModeRelative,    branch.bcs, memory.readImmediate],
    [0x50, "BVC",  ModeRelative,    branch.bvc, memory.readImmediate],
    [0x70, "BVS",  ModeRelative,    branch.bvs, memory.readImmediate],
    [0x10, "BPL",  ModeRelative,    branch.bpl, memory.readImmediate],
    [0x30, "BMI",  ModeRelative,    branch.bmi, memory.readImmediate],

    [0x18, "CLC",  ModeImplied,     flags.clc, null],
    [0xD8, "CLD",  ModeImplied,     flags.cld, null],
    [0x58, "CLI",  ModeImplied,     flags.cli, null],
    [0xB8, "CLV",  ModeImplied,     flags.clv, null],
    [0x38, "SEC",  ModeImplied,     flags.sec, null],
    [0x78, "SEI",  ModeImplied,     flags.sei, null],
    [0xF8, "SED",  ModeImplied,     flags.sed, null],

    [0xC9, "CMP",  ModeImmediate,   compare.cmp, memory.readImmediate],
    [0xC5, "CMP",  ModeZeroPage,    compare.cmp, memory.readZeroPage],
    [0xD5, "CMP",  ModeZeroPageX,   compare.cmp, memory.readZeroPageX],
    [0xCD, "CMP",  ModeAbsolute,    compare.cmp, memory.readAbsolute],
    [0xDD, "CMP",  ModeAbsoluteX,   compare.cmp, memory.readAbsoluteXShortenCycle],
    [0xD9, "CMP",  ModeAbsoluteY,   compare.cmp, memory.readAbsoluteYShortenCycle],
    [0xC1, "CMP",  ModeIndirectX,   compare.cmp, memory.readIndirectX],
    [0xD1, "CMP",  ModeIndirectY,   compare.cmp, memory.readIndirectYShortenCycle],
    [0xE0, "CPX",  ModeImmediate,   compare.cpx, memory.readImmediate],
    [0xE4, "CPX",  ModeZeroPage,    compare.cpx, memory.readZeroPage],
    [0xEC, "CPX",  ModeAbsolute,    compare.cpx, memory.readAbsolute],
    [0xC0, "CPY",  ModeImmediate,   compare.cpy, memory.readImmediate],
    [0xC4, "CPY",  ModeZeroPage,    compare.cpy, memory.readZeroPage],
    [0xCC, "CPY",  ModeAbsolute,    compare.cpy, memory.readAbsolute],

    [0x4C, "JMP",  ModeAbsolute,    jump.jmp, memory.readAbsolute],
    [0x6C, "JMP",  ModeIndirect,    jump.jmp, memory.readIndirect],
    [0x20, "JSR",  ModeAbsolute,    jump.jsr, null],

    [0xA7, "LAX*", ModeZeroPage,    load.lax, memory.readZeroPage],
    [0xB7, "LAX*", ModeZeroPageY,   load.lax, memory.readZeroPageY],
    [0xAF, "LAX*", ModeAbsolute,    load.lax, memory.readAbsolute],
    [0xBF, "LAX*", ModeAbsoluteY,   load.lax, memory.readAbsoluteYShortenCycle],
    [0xA3, "LAX*", ModeIndirectX,   load.lax, memory.readIndirectX],
    [0xB3, "LAX*", ModeIndirectY,   load.lax, memory.readIndirectYShortenCycle],
    [0xA9, "LDA",  ModeImmediate,   load.lda, memory.readImmediate],
    [0xA5, "LDA",  ModeZeroPage,    load.lda, memory.readZeroPage],
    [0xB5, "LDA",  ModeZeroPageX,   load.lda, memory.readZeroPageX],
    [0xAD, "LDA",  ModeAbsolute,    load.lda, memory.readAbsolute],
    [0xBD, "LDA",  ModeAbsoluteX,   load.lda, memory.readAbsoluteXShortenCycle],
    [0xB9, "LDA",  ModeAbsoluteY,   load.lda, memory.readAbsoluteYShortenCycle],
    [0xA1, "LDA",  ModeIndirectX,   load.lda, memory.readIndirectX],
    [0xB1, "LDA",  ModeIndirectY,   load.lda, memory.readIndirectYShortenCycle],
    [0xA2, "LDX",  ModeImmediate,   load.ldx, memory.readImmediate],
    [0xA6, "LDX",  ModeZeroPage,    load.ldx, memory.readZeroPage ],
    [0xB6, "LDX",  ModeZeroPageY,   load.ldx, memory.readZeroPageY],
    [0xAE, "LDX",  ModeAbsolute,    load.ldx, memory.readAbsolute],
    [0xBE, "LDX",  ModeAbsoluteY,   load.ldx, memory.readAbsoluteYShortenCycle],
    [0xA0, "LDY",  ModeImmediate,   load.ldy, memory.readImmediate],
    [0xA4, "LDY",  ModeZeroPage,    load.ldy, memory.readZeroPage],
    [0xB4, "LDY",  ModeZeroPageX,   load.ldy, memory.readZeroPageX],
    [0xAC, "LDY",  ModeAbsolute,    load.ldy, memory.readAbsolute],
    [0xBC, "LDY",  ModeAbsoluteX,   load.ldy, memory.readAbsoluteXShortenCycle],

    [0xEA, "NOP",  ModeImplied,     nop.nop, null],
    [0x1A, "NOP*", ModeImplied,     nop.nop, null],
    [0x3A, "NOP*", ModeImplied,     nop.nop, null],
    [0x5A, "NOP*", ModeImplied,     nop.nop, null],
    [0x7A, "NOP*", ModeImplied,     nop.nop, null],
    [0xDA, "NOP*", ModeImplied,     nop.nop, null],
    [0xFA, "NOP*", ModeImplied,     nop.nop, null],
    [0x80, "NOP*", ModeImmediate,   nop.unofficialNop, memory.readImmediate],
    [0x82, "NOP*", ModeImmediate,   nop.unofficialNop, memory.readImmediate],
    [0x89, "NOP*", ModeImmediate,   nop.unofficialNop, memory.readImmediate],
    [0xC2, "NOP*", ModeImmediate,   nop.unofficialNop, memory.readImmediate],
    [0xE2, "NOP*", ModeImmediate,   nop.unofficialNop, memory.readImmediate],
    [0x04, "NOP*", ModeZeroPage,    nop.unofficialNop, memory.readZeroPage],
    [0x44, "NOP*", ModeZeroPage,    nop.unofficialNop, memory.readZeroPage],
    [0x64, "NOP*", ModeZeroPage,    nop.unofficialNop, memory.readZeroPage],
    [0x0C, "NOP*", ModeAbsolute,    nop.unofficialNop, memory.readAbsolute],
    [0x14, "NOP*", ModeZeroPageX,   nop.unofficialNop, memory.readZeroPageX],
    [0x34, "NOP*", ModeZeroPageX,   nop.unofficialNop, memory.readZeroPageX],
    [0x54, "NOP*", ModeZeroPageX,   nop.unofficialNop, memory.readZeroPageX],
    [0x74, "NOP*", ModeZeroPageX,   nop.unofficialNop, memory.readZeroPageX],
    [0xD4, "NOP*", ModeZeroPageX,   nop.unofficialNop, memory.readZeroPageX],
    [0xF4, "NOP*", ModeZeroPageX,   nop.unofficialNop, memory.readZeroPageX],
    [0x1C, "NOP*",  ModeAbsoluteX,  nop.unofficialNop, memory.readAbsoluteXShortenCycle],
    [0x3C, "NOP*",  ModeAbsoluteX,  nop.unofficialNop, memory.readAbsoluteXShortenCycle],
    [0x5C, "NOP*",  ModeAbsoluteX,  nop.unofficialNop, memory.readAbsoluteXShortenCycle],
    [0x7C, "NOP*",  ModeAbsoluteX,  nop.unofficialNop, memory.readAbsoluteXShortenCycle],
    [0xDC, "NOP*",  ModeAbsoluteX,  nop.unofficialNop, memory.readAbsoluteXShortenCycle],
    [0xFC, "NOP*",  ModeAbsoluteX,  nop.unofficialNop, memory.readAbsoluteXShortenCycle],

    [0xC8, "INY",  ModeImplied,     register.iny, null],
    [0x88, "DEY",  ModeImplied,     register.dey, null],
    [0xA8, "TAY",  ModeImplied,     register.tay, null],
    [0xE8, "INX",  ModeImplied,     register.inx, null],
    [0xCA, "DEX",  ModeImplied,     register.dex, null],
    [0xAA, "TAX",  ModeImplied,     register.tax, null],
    [0xBA, "TSX",  ModeImplied,     register.tsx, null],
    [0x8A, "TXA",  ModeImplied,     register.txa, null],
    [0x98, "TYA",  ModeImplied,     register.tya, null],
    [0x9A, "TXS",  ModeImplied,     register.txs, null],

    [0x0A, "ASL",  ModeAccumulator, readmodifywrite.aslA, null],
    [0x06, "ASL",  ModeZeroPage,    readmodifywrite.asl, memory.readZeroPage],
    [0x16, "ASL",  ModeZeroPageX,   readmodifywrite.asl, memory.readZeroPageX],
    [0x0E, "ASL",  ModeAbsolute,    readmodifywrite.asl, memory.readAbsolute],
    [0x1E, "ASL",  ModeAbsoluteX,   readmodifywrite.asl, memory.readAbsoluteX],
    [0xE6, "INC",  ModeZeroPage,    readmodifywrite.inc, memory.readZeroPage],
    [0xF6, "INC",  ModeZeroPageX,   readmodifywrite.inc, memory.readZeroPageX],
    [0xEE, "INC",  ModeAbsolute,    readmodifywrite.inc, memory.readAbsolute],
    [0xFE, "INC",  ModeAbsoluteX,   readmodifywrite.inc, memory.readAbsoluteX],
    [0x4A, "LSR",  ModeAccumulator, readmodifywrite.lsrA, null],
    [0x46, "LSR",  ModeZeroPage,    readmodifywrite.lsr, memory.readZeroPage],
    [0x56, "LSR",  ModeZeroPageX,   readmodifywrite.lsr, memory.readZeroPageX],
    [0x4E, "LSR",  ModeAbsolute,    readmodifywrite.lsr, memory.readAbsolute],
    [0x5E, "LSR",  ModeAbsoluteX,   readmodifywrite.lsr, memory.readAbsoluteX],
    [0xC6, "DEC",  ModeZeroPage,    readmodifywrite.dec, memory.readZeroPage],
    [0xD6, "DEC",  ModeZeroPageX,   readmodifywrite.dec, memory.readZeroPageX],
    [0xCE, "DEC",  ModeAbsolute,    readmodifywrite.dec, memory.readAbsolute],
    [0xDE, "DEC",  ModeAbsoluteX,   readmodifywrite.dec, memory.readAbsoluteX],
    [0x2A, "ROL",  ModeAccumulator, readmodifywrite.rolA, null],
    [0x26, "ROL",  ModeZeroPage,    readmodifywrite.rol, memory.readZeroPage],
    [0x36, "ROL",  ModeZeroPageX,   readmodifywrite.rol, memory.readZeroPageX],
    [0x2E, "ROL",  ModeAbsolute,    readmodifywrite.rol, memory.readAbsolute],
    [0x3E, "ROL",  ModeAbsoluteX,   readmodifywrite.rol, memory.readAbsoluteX],
    [0x6A, "ROR",  ModeAccumulator, readmodifywrite.rorA, null],
    [0x66, "ROR",  ModeZeroPage,    readmodifywrite.ror, memory.readZeroPage],
    [0x76, "ROR",  ModeZeroPageX,   readmodifywrite.ror, memory.readZeroPageX],
    [0x6E, "ROR",  ModeAbsolute,    readmodifywrite.ror, memory.readAbsolute],
    [0x7E, "ROR",  ModeAbsoluteX,   readmodifywrite.ror, memory.readAbsoluteX],

    [0x85, "STA",  ModeZeroPage,    store.sta, memory.readZeroPage],
    [0x95, "STA",  ModeZeroPageX,   store.sta, memory.readZeroPageX],
    [0x8D, "STA",  ModeAbsolute,    store.sta, memory.readAbsolute],
    [0x9D, "STA",  ModeAbsoluteX,   store.sta, memory.readAbsoluteX],
    [0x99, "STA",  ModeAbsoluteY,   store.sta, memory.readAbsoluteY],
    [0x81, "STA",  ModeIndirectX,   store.sta, memory.readIndirectX],
    [0x91, "STA",  ModeIndirectY,   store.sta, memory.readIndirectY],
    [0x86, "STX",  ModeZeroPage,    store.stx, memory.readZeroPage],
    [0x96, "STX",  ModeZeroPageY,   store.stx, memory.readZeroPageY],
    [0x8E, "STX",  ModeAbsolute,    store.stx, memory.readAbsolute],
    [0x84, "STY",  ModeZeroPage,    store.sty, memory.readZeroPage],
    [0x94, "STY",  ModeZeroPageX,   store.sty, memory.readZeroPageX],
    [0x8C, "STY",  ModeAbsolute,    store.sty, memory.readAbsolute],

    [0x08, "PHP",  ModeImplied,     stack.php, null],
    [0x48, "PHA",  ModeImplied,     stack.pha, null],
    [0x28, "PLP",  ModeImplied,     stack.plp, null],
    [0x68, "PLA",  ModeImplied,     stack.pla, null],
    [0x00, "BRK",  ModeImplied,     stack.brk, null],
    [0x40, "RTI",  ModeImplied,     stack.rti, null],
    [0x60, "RTS",  ModeImplied,     stack.rts, null],

    [0x0B, "AAC*", ModeImmediate,   illegal.aac, memory.readImmediate],
    [0x2B, "AAC*", ModeImmediate,   illegal.aac, memory.readImmediate],
    [0x6B, "ARR*", ModeImmediate,   illegal.arr, memory.readImmediate],
    [0x4B, "ASR*", ModeImmediate,   illegal.asr, memory.readImmediate],
    [0xAB, "ATX*", ModeImmediate,   illegal.atx, memory.readImmediate],
    [0xCB, "AXS*", ModeImmediate,   illegal.axs, memory.readImmediate],
    [0xC7, "DCP*", ModeZeroPage,    illegal.dcp, memory.readZeroPage],
    [0xD7, "DCP*", ModeZeroPageX,   illegal.dcp, memory.readZeroPageX],
    [0xCF, "DCP*", ModeAbsolute,    illegal.dcp, memory.readAbsolute],
    [0xDF, "DCP*", ModeAbsoluteX,   illegal.dcp, memory.readAbsoluteX],
    [0xDB, "DCP*", ModeAbsoluteY,   illegal.dcp, memory.readAbsoluteY],
    [0xC3, "DCP*", ModeIndirectX,   illegal.dcp, memory.readIndirectX],
    [0xD3, "DCP*", ModeIndirectY,   illegal.dcp, memory.readIndirectY],
    [0xE7, "ISC*", ModeZeroPage,    illegal.isb, memory.readZeroPage],
    [0xF7, "ISC*", ModeZeroPageX,   illegal.isb, memory.readZeroPageX],
    [0xEF, "ISC*", ModeAbsolute,    illegal.isb, memory.readAbsolute],
    [0xFF, "ISC*", ModeAbsoluteX,   illegal.isb, memory.readAbsoluteX],
    [0xFB, "ISC*", ModeAbsoluteY,   illegal.isb, memory.readAbsoluteY],
    [0xE3, "ISC*", ModeIndirectX,   illegal.isb, memory.readIndirectX],
    [0xF3, "ISC*", ModeIndirectY,   illegal.isb, memory.readIndirectY],
    [0x27, "RLA*", ModeZeroPage,    illegal.rla, memory.readZeroPage],
    [0x37, "RLA*", ModeZeroPageX,   illegal.rla, memory.readZeroPageX],
    [0x2F, "RLA*", ModeAbsolute,    illegal.rla, memory.readAbsolute],
    [0x3F, "RLA*", ModeAbsoluteX,   illegal.rla, memory.readAbsoluteX],
    [0x3B, "RLA*", ModeAbsoluteY,   illegal.rla, memory.readAbsoluteY],
    [0x23, "RLA*", ModeIndirectX,   illegal.rla, memory.readIndirectX],
    [0x33, "RLA*", ModeIndirectY,   illegal.rla, memory.readIndirectY],
    [0x67, "RRA*", ModeZeroPage,    illegal.rra, memory.readZeroPage],
    [0x77, "RRA*", ModeZeroPageX,   illegal.rra, memory.readZeroPageX],
    [0x6F, "RRA*", ModeAbsolute,    illegal.rra, memory.readAbsolute],
    [0x7F, "RRA*", ModeAbsoluteX,   illegal.rra, memory.readAbsoluteX],
    [0x7B, "RRA*", ModeAbsoluteY,   illegal.rra, memory.readAbsoluteY],
    [0x63, "RRA*", ModeIndirectX,   illegal.rra, memory.readIndirectX],
    [0x73, "RRA*", ModeIndirectY,   illegal.rra, memory.readIndirectY],
    [0x87, "SAX*", ModeZeroPage,    illegal.sax, memory.readZeroPage],
    [0x97, "SAX*", ModeZeroPageY,   illegal.sax, memory.readZeroPageY],
    [0x83, "SAX*", ModeIndirectX,   illegal.sax, memory.readIndirectX],
    [0x8F, "SAX*", ModeAbsolute,    illegal.sax, memory.readAbsolute],
    [0x07, "SLO*", ModeZeroPage,    illegal.slo, memory.readZeroPage],
    [0x17, "SLO*", ModeZeroPageX,   illegal.slo, memory.readZeroPageX],
    [0x0F, "SLO*", ModeAbsolute,    illegal.slo, memory.readAbsolute],
    [0x1F, "SLO*", ModeAbsoluteX,   illegal.slo, memory.readAbsoluteX],
    [0x1B, "SLO*", ModeAbsoluteY,   illegal.slo, memory.readAbsoluteY],
    [0x03, "SLO*", ModeIndirectX,   illegal.slo, memory.readIndirectX],
    [0x13, "SLO*", ModeIndirectY,   illegal.slo, memory.readIndirectY],
    [0x47, "SRE*", ModeZeroPage,    illegal.sre, memory.readZeroPage],
    [0x57, "SRE*", ModeZeroPageX,   illegal.sre, memory.readZeroPageX],
    [0x4F, "SRE*", ModeAbsolute,    illegal.sre, memory.readAbsolute],
    [0x5F, "SRE*", ModeAbsoluteX,   illegal.sre, memory.readAbsoluteX],
    [0x5B, "SRE*", ModeAbsoluteY,   illegal.sre, memory.readAbsoluteY],
    [0x43, "SRE*", ModeIndirectX,   illegal.sre, memory.readIndirectX],
    [0x53, "SRE*", ModeIndirectY,   illegal.sre, memory.readIndirectY],
    [0x9B, "TAS*", ModeAbsoluteY,   illegal.tas, memory.readAbsoluteY],
    [0xBB, "LAS*", ModeAbsoluteY,   illegal.las, memory.readAbsoluteYShortenCycle],
    [0x9E, "SXA*", ModeAbsoluteY,   illegal.sxa, null],
    [0x9C, "SYA*", ModeAbsoluteX,   illegal.sya, null],
    [0x9F, "AXA*", ModeAbsoluteY,   illegal.axa, memory.readAbsoluteY],
    [0x93, "AXA*", ModeIndirectY,   illegal.axa, memory.readIndirectY],
    [0x8b, "ANE*", ModeImmediate,   illegal.empty, memory.readImmediate]
];

type OpcodeMetadataEntry = {
    name: string
    mode: number
}

export const opcodeMetadata: (Record<number, OpcodeMetadataEntry>) = {};
export const opcodeTable = new Array(256);

opcodes.forEach(entry => {
    const [opcode, name, mode, implementation, readFunction] = entry;

    opcodeMetadata[opcode] = { name, mode };
    if (readFunction != null) {
        opcodeTable[opcode] = (state : EmulatorState) => implementation(state, readFunction(state));
    } else {
        opcodeTable[opcode] = implementation;
    }
})
