import {
  AddressModeAbsolute,
  AddressModeAbsoluteX,
  AddressModeAbsoluteY,
  AddressModeAccumulator,
  AddressModeImmediate,
  AddressModeImplied,
  AddressModeIndirect, AddressModeIndirectX, AddressModeIndirectY, AddressModeRelative,
  AddressModeZeroPage,
  AddressModeZeroPageX,
  AddressModeZeroPageY,
  opcodeMetadata
} from './cpu';

import {
  onSamePageBoundary,
  P_REG_ALWAYS_1,
  P_REG_BREAK, P_REG_CARRY,
  P_REG_DECIMAL,
  P_REG_INTERRUPT,
  P_REG_NEGATIVE, P_REG_OVERFLOW,
  P_REG_ZERO, PAGE_MASK
} from './instructions/utils';
import { readMem } from './emulator';
import _ from 'lodash';

const branchInstructions = {"JMP": 1, "JSR": 1, "BPL": 1, "BMI": 1, "BVC": 1, "BVS": 1, "BCC": 1, "BCS": 1, "BNE": 1, "BEQ": 1};

const readLogMem = (state, address) => {
  // Don't preview values for MMIO registers ($2000-$401F) - just return 0xFF. Aligns with Nintendulator's debugger,
  // it assumes the value $FF whenever it is told to "preview" the value at any memory address
  // for which a special "Debug" (side-effect-free) read handler has not been assigned.

  if (address >= 0x2000 && address <= 0x401F) {
    return 0xFF;
  } else {
    return readMem(state, address);
  }
}

export const absoluteAddress = (state, pc) => {
  return readMem(state, pc + 1) + (readMem(state, pc + 2) << 8);
}

const logFormatters = {
  [AddressModeAccumulator]: state => "A",
  [AddressModeImmediate]: (state, pc) => "#$" + hex(readMem(state, pc + 1)),
  [AddressModeAbsolute]: (state, pc) => {
    const opcode = readMem(state, pc);
    const { name } = opcodeMetadata[opcode];
    const address = absoluteAddress(state, pc);
    if (name in branchInstructions) {
      return "$" + hex16(address);
    } else {
      const byte = readLogMem(state, address);
      return "$" + hex16(address) + " = " + hex(byte);
    }
  },
  [AddressModeAbsoluteX]: (state, pc) => {
    const base = absoluteAddress(state, pc);
    const address = (base + state.X) & 0xFFFF;
    const byte = readLogMem(state, address);
    return "$" + hex16(base) + ",X @ " + hex16(address) + ' = ' + hex(byte);
  },
  [AddressModeAbsoluteY]: (state, pc) => {
    const base = absoluteAddress(state, pc);
    const address = (base + state.Y) & 0xFFFF;
    const byte = readLogMem(state, address);
    return "$" + hex16(base) + ",Y @ " + hex16(address) + ' = ' + hex(byte);
  },
  [AddressModeZeroPage]: (state, pc) => {
    const offset = readMem(state, pc + 1);
    return "$" + hex(offset) + " = " + hex(readMem(state, offset));
  },
  [AddressModeZeroPageX]: (state, pc) => {
    const base = readMem(state, pc + 1);
    const address = (base + state.X) % 256;
    return "$" + hex(base) + ",X @ " + hex(address) + " = " + hex(readLogMem(state, address));
  },
  [AddressModeZeroPageY]: (state, pc) => {
    const base = readMem(state, pc + 1);
    const address = (base + state.Y) % 256;
    return "$" + hex(base) + ",Y @ " + hex(address) + " = " + hex(readLogMem(state, address));
  },
  [AddressModeImplied]: state => "",
  [AddressModeIndirect]: (state, pc) => {
    const address = absoluteAddress(state, pc);

    const lo = address;
    let hi = address + 1;

    if (!onSamePageBoundary(lo, hi)) {
      hi = (lo & PAGE_MASK);
    }

    const target = readMem(state, lo) + (readMem(state, hi) << 8);
    return "($" + hex16(address) + ") = " + hex16(target);
  },
  [AddressModeIndirectX]: (state, pc) => {
    const offset = readMem(state, pc + 1);
    const addressLocation = (state.X + offset) % 256;

    const address = readMem(state, addressLocation) + (readMem(state, (addressLocation + 1) % 256) << 8);
    const value = readLogMem(state, address);

    return "($" + hex(offset) + ",X) @ " + hex(addressLocation) + " = " + hex16(address) + " = " + hex(value);
  },
  [AddressModeIndirectY]: (state, pc) => {
    const zeroPageAddress = readMem(state, pc + 1);
    const base = readMem(state, zeroPageAddress) + (readMem(state, (zeroPageAddress + 1) % 256) << 8);
    const address = (base + state.Y) & 0xFFFF;

    let value = readLogMem(state, address);
    return "($" + hex(zeroPageAddress) + "),Y = " + hex16(base) + " @ " + hex16(address) + " = " + hex(value);
  },
  [AddressModeRelative]: (state, pc) => {
    let offset = readMem(state, pc + 1);
    if (offset > 0x7F) {
      offset -= 256;
    }

    return "$" + hex(pc + offset + 2)
  }
};


export const hex = num => num.toString(16).toUpperCase().padStart(2, '0');
export const hex16 = num => num.toString(16).toUpperCase().padStart(4, '0');

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

export const stateToString = (state, swapPPU) => {
  let str = hex16(state.PC)
  str += '  ';
  const opcode = readMem(state, state.PC);

  if (opcode == null) {
    return str;
  }

  str += hex(opcode);
  str += ' ';

  if (opcode in opcodeMetadata && opcodeMetadata[opcode] != null) {
    const { instructionSize, name, mode } = opcodeMetadata[opcode];

    for (let i = 0; i < instructionSize - 1; i++) {
      str += hex(readMem(state, state.PC + 1 + i)) + ' ';
    }

    str = str.padEnd(16 + (3 - name.length), ' ');

    if (logFormatters[mode] == null) {
      str += name + ' UNSUPPORTED ' + mode;
    } else {
      str += name + ' ' + logFormatters[mode](state, state.PC) + ' ';
    }
  }

  str = str.padEnd(48, ' ');

  str += 'A:' + hex(state.A) + ' ';
  str += 'X:' + hex(state.X) + ' ';
  str += 'Y:' + hex(state.Y) + ' ';
  str += 'P:' + hex(state.P) + ' ';
  str += 'SP:' + hex(state.SP) + ' ';

  // Figure which PPU state ([scanline, pixel]) by deriving from cycle count
  const PIXELS_PER_SCANLINE = 341;
  const NUM_SCANLINES = 262;

  const scanline = Math.floor((state.ppu.cycle) / PIXELS_PER_SCANLINE) % NUM_SCANLINES;
  const pixel = (state.ppu.cycle) % PIXELS_PER_SCANLINE;

  if (swapPPU) {
    str += 'PPU:' + pixel.toString(10).padStart(3, ' ') +',' + scanline.toString(10).padStart(3, ' ') + ' ';
  } else {
    str += 'PPU:' + scanline.toString(10).padStart(3, ' ') +',' + pixel.toString(10).padStart(3, ' ') + ' ';
  }

  str += 'CYC:' + state.CYC.toString(10);

  return str;
}

const maxInstructionSize = _.max(_.map(opcodeMetadata, 'instructionSize'));

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
      line.push(logFormatters[mode](state, address));
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
      const { instructionSize } = opcodeMetadata[opcode];
      address += instructionSize;
    } else {
      address++;
    }
  }

  return lines;
}
