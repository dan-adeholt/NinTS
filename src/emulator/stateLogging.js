import opcodeMetadata from './opcodeMetadata';
import {
  getAddressAbsolute,
  onSamePageBoundary,
  P_REG_ALWAYS_1,
  P_REG_BREAK, P_REG_CARRY,
  P_REG_DECIMAL,
  P_REG_INTERRUPT,
  P_REG_NEGATIVE, P_REG_OVERFLOW,
  P_REG_ZERO, PAGE_MASK
} from './opcodes/utils';

const branchInstructions = {"JMP": 1, "JSR": 1, "BPL": 1, "BMI": 1, "BVC": 1, "BVS": 1, "BCC": 1, "BCS": 1, "BNE": 1, "BEQ": 1};

const formatters = {
  Accumulator: state => "A",
  Immediate: state => "#$" + hex(state.readMem(state.PC + 1)),
  Absolute: state => {
    const opcode = state.readMem(state.PC);
    const { name } = opcodeMetadata[opcode];
    const address = getAddressAbsolute(state);
    if (name in branchInstructions) {
      return "$" + hex16(address);
    } else {
      const byte = state.readMem(address);
      return "$" + hex16(address) + " = " + hex(byte);
    }
  },
  AbsoluteX: state => {
    const base = getAddressAbsolute(state);
    const address = (base + state.X) & 0xFFFF;
    const byte = state.readMem(address);
    return "$" + hex16(base) + ",X @ " + hex16(address) + ' = ' + hex(byte);
  },
  AbsoluteY: state => {
    const base = getAddressAbsolute(state);
    const address = (base + state.Y) & 0xFFFF;
    const byte = state.readMem(address);
    return "$" + hex16(base) + ",Y @ " + hex16(address) + ' = ' + hex(byte);
  },
  ZeroPage: state => {
    const offset = state.readMem(state.PC + 1);
    return "$" + hex(offset) + " = " + hex(state.readMem(offset));
  },
  ZeroPageX: state => {
    const base = state.readMem(state.PC + 1);
    const address = (base + state.X) % 256;
    return "$" + hex(base) + ",X @ " + hex(address) + " = " + hex(state.readMem(address));
  },
  ZeroPageY: state => {
    const base = state.readMem(state.PC + 1);
    const address = (base + state.Y) % 256;
    return "$" + hex(base) + ",Y @ " + hex(address) + " = " + hex(state.readMem(address));
  },
  Implied: state => "",
  Indirect: state => {
    const address = getAddressAbsolute(state);

    const lo = address;
    let hi = address + 1;

    if (!onSamePageBoundary(lo, hi)) {
      hi = (lo & PAGE_MASK);
    }

    const target = state.readMem(lo) + (state.readMem(hi) << 8);
    return "($" + hex16(address) + ") = " + hex16(target);
  },
  IndirectX: state => {
    const offset = state.readMem(state.PC + 1);
    const addressLocation = (state.X + offset) % 256;

    const address = state.readMem(addressLocation) + (state.readMem((addressLocation + 1) % 256) << 8);
    const value = state.readMem(address);

    return "($" + hex(offset) + ",X) @ " + hex(addressLocation) + " = " + hex16(address) + " = " + hex(value);
  },
  IndirectY: state => {
    const zeroPageAddress = state.readMem(state.PC + 1);
    const base = state.readMem(zeroPageAddress) + (state.readMem((zeroPageAddress + 1) % 256) << 8);
    const address = (base + state.Y) & 0xFFFF;

    let value = state.readMem(address);
    return "($" + hex(zeroPageAddress) + "),Y = " + hex16(base) + " @ " + hex16(address) + " = " + hex(value);
  },
  Relative: state => {
    let offset = state.readMem(state.PC + 1);
    if (offset > 0x7F) {
      offset -= 256;
    }

    return "$" + hex(state.PC + offset + 2)
  }
};

export const bin = num => num.toString(2).padStart(8, '0');
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

export const stateToString = (state) => {
  let str = hex16(state.PC)
  str += '  ';
  const opcode = state.readMem(state.PC);

  if (opcode == null) {
    return str;
  }

  str += hex(opcode);
  str += ' ';

  if (opcode in opcodeMetadata && opcodeMetadata[opcode] != null) {
    const { instructionSize, name, mode } = opcodeMetadata[opcode];

    for (let i = 0; i < instructionSize - 1; i++) {
      str += hex(state.readMem(state.PC + 1 + i)) + ' ';
    }

    str = str.padEnd(16 + (3 - name.length), ' ');

    if (formatters[mode] == null) {
      str += name + ' UNSUPPORTED ' + mode;
    } else {
      str += name + ' ' + formatters[mode](state) + ' ';
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
  const scanline = Math.floor((state.CYC * 3) / PIXELS_PER_SCANLINE) % NUM_SCANLINES;
  const pixel = (state.CYC * 3) % PIXELS_PER_SCANLINE;
  str += 'PPU:' + scanline.toString(10).padStart(3, ' ') +',' + pixel.toString(10).padStart(3, ' ') + ' ';
  str += 'CYC:' + state.CYC.toString(10);

  return str;
}
