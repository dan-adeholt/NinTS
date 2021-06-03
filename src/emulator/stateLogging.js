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
import { readMem } from './emulator';
import _ from 'lodash';

const branchInstructions = {"JMP": 1, "JSR": 1, "BPL": 1, "BMI": 1, "BVC": 1, "BVS": 1, "BCC": 1, "BCS": 1, "BNE": 1, "BEQ": 1};

const readMesenLogMem = (state, address) => {
  if (address !== 0x4015 && address !== 0x4016 && address !== 0x4017 && address > 0x4000 && address < 0x4020) {
    // Mesen does this to fake open bus behavior - instead of just returning 0 on these reads.
    // TODO: Perhaps actually return these values from readMem?
    return address >> 8;
  } else {
    return readMem(state, address, true);
  }
}

const readNintendulatorLogMem = (state, address) => {
  // Don't preview values for MMIO registers ($2000-$401F) - just return 0xFF. Aligns with Nintendulator's debugger,
  // it assumes the value $FF whenever it is told to "preview" the value at any memory address
  // for which a special "Debug" (side-effect-free) read handler has not been assigned.

  if (address >= 0x2000 && address <= 0x401F) {
    return 0xFF;
  } else {
    return readMem(state, address, true);
  }
}

export const absoluteAddress = (state, pc) => {
  return readMem(state, pc + 1) + (readMem(state, pc + 2) << 8);
}

const logFormatters = {
  [ModeAccumulator]: state => "A",
  [ModeImmediate]: (state, pc, reader) => "#$" + hex(reader(state, pc + 1)),
  [ModeAbsolute]: (state, pc, reader, prefix, mesenCompatible) => {
    const opcode = reader(state, pc);
    const { name } = opcodeMetadata[opcode];
    const address = absoluteAddress(state, pc);
    if (name in branchInstructions && !mesenCompatible) {
      return "$" + hex16(address);
    } else {
      const byte = reader(state, address);
      return "$" + hex16(address) + " = " + hex(byte, prefix);
    }
  },
  [ModeAbsoluteX]: (state, pc, reader, prefix) => {
    const base = absoluteAddress(state, pc);
    const address = (base + state.X) & 0xFFFF;
    const byte = reader(state, address);
    return "$" + hex16(base) + ",X @ " + hex16(address, prefix) + ' = ' + hex(byte, prefix);
  },
  [ModeAbsoluteY]: (state, pc, reader, prefix) => {
    const base = absoluteAddress(state, pc);
    const address = (base + state.Y) & 0xFFFF;
    const byte = reader(state, address);
    return "$" + hex16(base) + ",Y @ " + hex16(address) + ' = ' + hex(byte, prefix);
  },
  [ModeZeroPage]: (state, pc, reader, prefix) => {
    const offset = reader(state, pc + 1);
    return "$" + hex(offset) + " = " + hex(reader(state, offset), prefix);
  },
  [ModeZeroPageX]: (state, pc, reader, prefix) => {
    const base = reader(state, pc + 1);
    const address = (base + state.X) % 256;
    return "$" + hex(base) + ",X @ " + hex(address, prefix) + " = " + hex(reader(state, address), prefix);
  },
  [ModeZeroPageY]: (state, pc, reader, prefix) => {
    const base = reader(state, pc + 1);
    const address = (base + state.Y) % 256;
    return "$" + hex(base) + ",Y @ " + hex(address) + " = " + hex(reader(state, address), prefix);
  },
  [ModeImplied]: state => "",
  [ModeIndirect]: (state, pc, reader) => {
    const address = absoluteAddress(state, pc);

    const lo = address;
    let hi = address + 1;

    if (!onSamePageBoundary(lo, hi)) {
      hi = (lo & PAGE_MASK);
    }

    const target = reader(state, lo) + (reader(state, hi) << 8);
    return "($" + hex16(address) + ") = " + hex16(target);
  },
  [ModeIndirectX]: (state, pc, reader, prefix) => {
    const offset = reader(state, pc + 1);
    const addressLocation = (state.X + offset) % 256;

    const address = reader(state, addressLocation) + (reader(state, (addressLocation + 1) % 256) << 8);
    const value = reader(state, address);
    return "($" + hex(offset) + ",X) @ " + hex(addressLocation) + " = " + hex16(address, prefix) + " = " + hex(value, prefix);
  },
  [ModeIndirectY]: (state, pc, reader, prefix, mesenCompatible) => {
    const zeroPageAddress = reader(state, pc + 1);
    const base = reader(state, zeroPageAddress) + (reader(state, (zeroPageAddress + 1) % 256) << 8);
    const address = (base + state.Y) & 0xFFFF;

    let value = reader(state, address);

    if (mesenCompatible) {
      return "($" + hex(zeroPageAddress) + "),Y @ $" + hex16(address) + " = " + hex(value, prefix);
    } else {
      return "($" + hex(zeroPageAddress) + "),Y = " + hex16(base) + " @ " + hex16(address) + " = " + hex(value, prefix);
    }
  },
  [ModeRelative]: (state, pc, reader, prefix, mesenCompatible) => {
    let offset = reader(state, pc + 1);
    if (offset > 0x7F) {
      offset -= 256;
    }
    const addr = pc + offset + 2;

    if (mesenCompatible) {
      return "$" + hex(addr) + ' = ' + hex(reader(state, addr) ?? 0, prefix);
    } else {
      return "$" + hex(addr);
    }
  }
};


export const bin8 = num => num.toString(2).padStart(8, '0');
export const hex = (num, prefix = '') => prefix + num.toString(16).toUpperCase().padStart(2, '0');
export const hex16 = (num, prefix = '') => prefix + num.toString(16).toUpperCase().padStart(4, '0');

export const procFlagsToString = (P) => {
  const toBinary = (flag) => (P & flag) ? '1' : '0';

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

const InstructionLengthTranslation = {
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

const appendStateRegisters = (state, str) => {
  str += 'A:' + hex(state.A) + ' ';
  str += 'X:' + hex(state.X) + ' ';
  str += 'Y:' + hex(state.Y) + ' ';
  str += 'P:' + hex(state.P) + ' ';
  str += 'SP:' + hex(state.SP) + ' ';
  return str;
}

export const stateToString = (state, swapPPU) => {
  let str = hex16(state.PC) + '  ';
  const opcode = readMem(state, state.PC);
  str += hex(opcode);
  str += ' ';

  if (opcode in opcodeMetadata && opcodeMetadata[opcode] != null) {
    const { name, mode } = opcodeMetadata[opcode];

    const instructionSize = InstructionLengthTranslation[mode];

    for (let i = 0; i < instructionSize - 1; i++) {
      str += hex(readMem(state, state.PC + 1 + i)) + ' ';
    }

    str = str.padEnd(16 + (3 - name.length), ' ');
    str += name + ' ' + logFormatters[mode](state, state.PC, readNintendulatorLogMem, '', false) + ' ';
  }

  str = str.padEnd(48, ' ');
  str = appendStateRegisters(state, str);

  // Figure which PPU state ([scanline, pixel]) by deriving from cycle count
  const PIXELS_PER_SCANLINE = 341;
  const pixel = (state.ppu.cycle) % PIXELS_PER_SCANLINE;
  const NUM_SCANLINES = 262;
  const scanline = Math.floor((state.ppu.cycle) / PIXELS_PER_SCANLINE) % NUM_SCANLINES;

  if (swapPPU) {
    str += 'PPU:' + pixel.toString(10).padStart(3, ' ') +',' + scanline.toString(10).padStart(3, ' ') + ' ';
  } else {
    str += 'PPU:' + scanline.toString(10).padStart(3, ' ') +',' + pixel.toString(10).padStart(3, ' ') + ' ';
  }

  str += 'CYC:' + state.CYC.toString(10);

  return str;
}

export const stateToStringMesen = (state, swapPPU) => {
  let str = hex16(state.PC) + ' ';
  const opcode = readMem(state, state.PC);
  let hexPrefix = '$';
  str += hex(opcode, hexPrefix);
  str += ' ';

  if (opcode in opcodeMetadata && opcodeMetadata[opcode] != null) {
    const { name, mode } = opcodeMetadata[opcode];

    const instructionSize = InstructionLengthTranslation[mode];

    for (let i = 0; i < instructionSize - 1; i++) {
      str += hex(readMem(state, state.PC + 1 + i), hexPrefix) + ' ';
    }

    str = str.padEnd(17 + (3 - name.length), ' ');
    str += name + ' ' + logFormatters[mode](state, state.PC, readMesenLogMem, '$', true) + ' ';
  }

  str = str.padEnd(55, ' ');
  str = appendStateRegisters(state, str);
  let scanline = state.ppu.scanline;
  scanline = scanline === 261 ? -1 : scanline;

  str += 'CYC:' + state.ppu.scanlineCycle.toString(10).padEnd(3, ' ') +' SL:' + scanline.toString(10).padEnd(3, ' ') + ' ';
  str += 'CPU Cycle:' + state.CYC.toString(10);

  return str;
}

const maxInstructionSize = _.max(_.map(opcodeMetadata, 'instructionSize'));

const peekMem = (state, addr) => {
  return readMem(state, addr, true);
};

export const disassembleLine = (state, address) => {
  const opcode = state.memory[address];
  let line = ['0x' + hex16(address)];

  if (opcode in opcodeMetadata && opcodeMetadata[opcode] != null) {
    const { instructionSize, name, mode } = opcodeMetadata[opcode];

    for (let i = 0; i < instructionSize; i++) {
      line.push(hex(state.memory[address + i]));
    }

    for (let i = instructionSize; i < maxInstructionSize; i++) {
      line.push('--');
    }

    if (logFormatters[mode] == null) {
      line.push(name);
      line.push(' UNSUPPORTED ' + mode);
    } else {
      line.push(name);
      line.push(logFormatters[mode](state, address, peekMem, '', false));
    }
  } else {
    line.push(hex(state.memory[address]));
    line.push('INVALID');
  }
  return line;
}

export const disassemble = (state) => {
  let address = 0x8000;
  let lines = [];

  while(address < state.memory.length) {
    const opcode = state.memory[address];
    let line = disassembleLine(state, address);
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
