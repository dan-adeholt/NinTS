import {
  getInstructionSize,
  ModeAbsolute,
  ModeAbsoluteX,
  ModeAbsoluteY,
  ModeAccumulator,
  ModeImmediate,
  ModeImplied,
  ModeIndirect, ModeIndirectX, ModeIndirectY, ModeRelative,
  ModeZeroPage,
  ModeZeroPageX,
  ModeZeroPageY,
  opcodeMetadata
} from './cpu';

import {
  P_REG_ALWAYS_1,
  P_REG_BREAK, P_REG_CARRY,
  P_REG_DECIMAL,
  P_REG_INTERRUPT,
  P_REG_NEGATIVE, P_REG_OVERFLOW,
  P_REG_ZERO,
} from './instructions/util';
import { onSamePageBoundary, PAGE_MASK } from './memory';
import _ from 'lodash';
import EmulatorState from "./EmulatorState";

export const peekMem = (state : EmulatorState, address: number) => {
  if (address !== 0x4015 && address !== 0x4016 && address !== 0x4017 && address > 0x4000 && address < 0x4020) {
    // Mesen does this to fake open bus behavior - instead of just returning 0 on these reads.
    // TODO: Perhaps actually return these values from readMem?
    return address >> 8;
  } else {
    return state.readMem(address, true);
  }
}

export const absoluteAddress = (state : EmulatorState, pc: number) => {
  return state.readMem(pc + 1) + (state.readMem(pc + 2) << 8);
}

const HEX_PREFIX = '$';

const logFormatters: Record<number, (state: EmulatorState, pc: number) => string> = {
  [ModeAccumulator]: (): string => "A",
  [ModeImmediate]: (state: EmulatorState, pc: number): string => "#$" + hex(peekMem(state, pc + 1)),
  [ModeAbsolute]: (state: EmulatorState, pc: number): string => {
    const address = absoluteAddress(state, pc);
    const byte = peekMem(state, address);
    return "$" + hex16(address) + " = " + hex(byte, HEX_PREFIX);
  },
  [ModeAbsoluteX]: (state: EmulatorState, pc: number): string => {
    const base = absoluteAddress(state, pc);
    const address = (base + state.X) & 0xFFFF;
    const byte = peekMem(state, address);
    return "$" + hex16(base) + ",X @ " + hex16(address, HEX_PREFIX) + ' = ' + hex(byte, HEX_PREFIX);
  },
  [ModeAbsoluteY]: (state: EmulatorState, pc: number): string => {
    const base = absoluteAddress(state, pc);
    const address = (base + state.Y) & 0xFFFF;
    const byte = peekMem(state, address);
    return "$" + hex16(base) + ",Y @ " + hex16(address, HEX_PREFIX) + ' = ' + hex(byte, HEX_PREFIX);
  },
  [ModeZeroPage]: (state: EmulatorState, pc: number): string => {
    const offset = peekMem(state, pc + 1);
    return "$" + hex(offset) + " = " + hex(peekMem(state, offset), HEX_PREFIX);
  },
  [ModeZeroPageX]: (state: EmulatorState, pc: number): string => {
    const base = peekMem(state, pc + 1);
    const address = (base + state.X) % 256;
    return "$" + hex(base) + ",X @ " + hex(address, HEX_PREFIX) + " = " + hex(peekMem(state, address), HEX_PREFIX);
  },
  [ModeZeroPageY]: (state: EmulatorState, pc: number): string => {
    const base = peekMem(state, pc + 1);
    const address = (base + state.Y) % 256;
    return "$" + hex(base) + ",Y @ " + hex(address, HEX_PREFIX) + " = " + hex(peekMem(state, address), HEX_PREFIX);
  },
  [ModeImplied]: () => "",
  [ModeIndirect]: (state: EmulatorState, pc: number): string => {
    const address = absoluteAddress(state, pc);

    const lo = address;
    let hi = address + 1;

    if (!onSamePageBoundary(lo, hi)) {
      hi = (lo & PAGE_MASK);
    }

    const target = peekMem(state, lo) + (peekMem(state, hi) << 8);

    const byte = peekMem(state, target);
    return "($" + hex16(address) + ") @ " + hex16(target, HEX_PREFIX) + " = " + hex(byte, HEX_PREFIX);
  },
  [ModeIndirectX]: (state: EmulatorState, pc: number): string => {
    const offset = peekMem(state, pc + 1);
    const addressLocation = (state.X + offset) % 256;

    const address = peekMem(state, addressLocation) + (peekMem(state, (addressLocation + 1) % 256) << 8);
    const value = peekMem(state, address);
    return "($" + hex(offset) + ",X) @ " + hex16(address, HEX_PREFIX) + " = " + hex(value, HEX_PREFIX);
  },
  [ModeIndirectY]: (state: EmulatorState, pc: number): string => {
    const zeroPageAddress = peekMem(state, pc + 1);
    const base = peekMem(state, zeroPageAddress) + (peekMem(state, (zeroPageAddress + 1) % 256) << 8);
    const address = (base + state.Y) & 0xFFFF;

    const value = peekMem(state, address);

    return "($" + hex(zeroPageAddress) + "),Y @ $" + hex16(address) + " = " + hex(value, HEX_PREFIX);
  },
  [ModeRelative]: (state: EmulatorState, pc: number): string => {
    let offset = peekMem(state, pc + 1);
    if (offset > 0x7F) {
      offset -= 256;
    }
    const addr = pc + offset + 2;

    if (addr > state.mapper.cpuMemory.memory.length) {
      return '???';
    }

    return "$" + hex(addr) + ' = ' + hex(peekMem(state, addr) ?? 0, HEX_PREFIX);
  }
};

export const bin8 = (num: number) => num.toString(2).padStart(8, '0');
export const hex = (num: number, prefix = '') => prefix + num.toString(16).toUpperCase().padStart(2, '0');
export const hex16 = (num: number, prefix = '') => prefix + num.toString(16).toUpperCase().padStart(4, '0');

export const procFlagsToString = (P: number) => {
  const toBinary = (flag: number) => (P & flag) ? '1' : '0';

  return hex(P) + ' - ' +
  'NEG:' + toBinary(P_REG_NEGATIVE) + ' ' +
    ' OVFL:' + toBinary(P_REG_OVERFLOW) +
    ' ALW1:' + toBinary(P_REG_ALWAYS_1) +
    ' BRK:' + toBinary(P_REG_BREAK) +
    ' DEC:' + toBinary(P_REG_DECIMAL) +
    ' INTR:' + toBinary(P_REG_INTERRUPT) +
    ' ZERO:' + toBinary(P_REG_ZERO) +
    ' CARR:' + toBinary(P_REG_CARRY);
}

const InstructionLengthTranslation: Record<number, number> = {
  [ModeAbsolute]: 3,
  [ModeAbsoluteX]: 3,
  [ModeAbsoluteY]: 3,
  [ModeAccumulator]: 1,
  [ModeImmediate]: 2,
  [ModeImplied]: 1,
  [ModeIndirect]: 3,
  [ModeIndirectX]: 2,
  [ModeIndirectY]: 2,
  [ModeRelative]: 2,
  [ModeZeroPage]: 2,
  [ModeZeroPageX]: 2,
  [ModeZeroPageY]: 2
};

const appendStateRegisters = (state : EmulatorState, str: string) => {
  str += 'A:' + hex(state.A) + ' ';
  str += 'X:' + hex(state.X) + ' ';
  str += 'Y:' + hex(state.Y) + ' ';
  str += 'P:' + hex(state.P) + ' ';
  str += 'SP:' + hex(state.SP) + ' ';
  return str;
}

export const stateToString = (state : EmulatorState) => {
  let str = hex16(state.PC) + ' ';
  const opcode = state.readMem(state.PC);
  const hexPrefix = '$';
  str += hex(opcode, hexPrefix);
  str += ' ';

  if (opcode in opcodeMetadata && opcodeMetadata[opcode] != null) {
    const { name, mode } = opcodeMetadata[opcode];

    const instructionSize = InstructionLengthTranslation[mode];

    for (let i = 0; i < instructionSize - 1; i++) {
      str += hex(state.readMem(state.PC + 1 + i), hexPrefix) + ' ';
    }

    str = str.padEnd(17, ' ');
    str += name + ' ' + logFormatters[mode](state, state.PC) + ' ';
  }

  let scanline = state.ppu.scanline;
  str = str.padEnd(55, ' ');
  str = appendStateRegisters(state, str);
  scanline = scanline === 261 ? -1 : scanline;

  str += 'CYC:' + state.ppu.scanlineCycle.toString(10).padEnd(3, ' ') +' SL:' + scanline.toString(10).padEnd(3, ' ') + ' ';
  str += 'FC:' + (state.ppu.frameCount+1) + ' ';
  str += 'CPU Cycle:' + (state.CYC).toString(10);

  return str;
}

const maxInstructionSize = _.max(_.map(opcodeMetadata, 'instructionSize'));

export const disassembleLine = (state : EmulatorState, address: number): string[] => {
  const opcode = peekMem(state, address);
  const line = ['0x' + hex16(address)];

  if (opcode != null && opcode in opcodeMetadata && opcodeMetadata[opcode] != null) {
    const { name, mode } = opcodeMetadata[opcode];
    const instructionSize = getInstructionSize(mode);

    if (address + instructionSize >= state.mapper.cpuMemory.memory.length) {
      return [];
    }

    for (let i = 0; i < instructionSize; i++) {
      line.push(hex(peekMem(state, address + i)));
    }

    for (let i = instructionSize; i < maxInstructionSize; i++) {
      line.push('--');
    }

    if (logFormatters[mode] == null) {
      line.push(name);
      line.push(' UNSUPPORTED ' + mode);
    } else {
      line.push(name);
      line.push(logFormatters[mode](state, address));
    }
  } else {
    line.push(hex(peekMem(state, address)));
    line.push('INVALID');
  }
  return line;
}

export type DisassembledLine = {
  address: number
  line: string[]
}

export const disassemble = (state : EmulatorState): DisassembledLine[] => {
  let address = 0x8000;
  const lines: DisassembledLine[] = [];

  while(address < state.mapper.cpuMemory.memory.length) {
    const opcode = peekMem(state, address);
    const line = disassembleLine(state, address);
    lines.push( { address, line });

    if (opcode in opcodeMetadata && opcodeMetadata[opcode] != null) {
      const metadata = opcodeMetadata[opcode];
      const instructionSize = getInstructionSize(metadata.mode);
      address += instructionSize;
    } else {
      address++;
    }
  }

  return lines;
}
