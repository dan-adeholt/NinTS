import opcodeMetadata from './opcodeMetadata';
import {
  P_REG_ALWAYS_1,
  P_REG_BREAK, P_REG_CARRY,
  P_REG_DECIMAL,
  P_REG_INTERRUPT,
  P_REG_NEGATIVE, P_REG_OVERFLOW,
  P_REG_ZERO
} from './opcodes/utils';

const branchInstructions = {"JMP": 1, "JSR": 1, "BPL": 1, "BMI": 1, "BVC": 1, "BVS": 1, "BCC": 1, "BCS": 1, "BNE": 1, "BEQ": 1};

const formatters = {
  Accumulator: state => "A",
  Immediate: state => "#$" + hex(state.readMem(state.PC + 1)),
  Absolute: state => {
    const opcode = state.readMem(state.PC);
    const { name } = opcodeMetadata[opcode];
    const address = state.readMem(state.PC + 1) + (state.readMem(state.PC + 2) << 8);
    if (name in branchInstructions) {
      return "$" + hex16(address);
    } else {
      const byte = state.readMem(address);
      return "$" + hex16(address) + " = " + hex(byte);
    }
  },
  ZeroPage: state => {
    const offset = state.readMem(state.PC + 1);
    return "$" + hex(offset) + " = " + hex(state.memory[offset]);
  },
  Implied: state => "",
  Relative: state => "$" + hex(state.PC + state.readMem(state.PC + 1) + 2)
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

export const stateToString = (state) => {

  let str = state.PC.toString(16).toUpperCase();
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

    str = str.padEnd(16, ' ');

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
