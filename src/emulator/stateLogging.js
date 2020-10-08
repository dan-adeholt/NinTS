import opcodeMetadata from './opcodeMetadata';

const formatters = {
  Immediate: state => "#$" + hex(state.readMem(state.PC + 1)),
  Absolute: state => "$" + hex(state.readMem(state.PC + 2)) + hex(state.readMem(state.PC + 1)),
  ZeroPage: state => {
    const offset = state.readMem(state.PC + 1);
    return "$" + hex(offset) + " = " + hex(state.memory[offset]);
  },
  Implied: state => "",
  Relative: state => "$" + hex(state.PC + state.readMem(state.PC + 1) + 2)
};

export const hex = num => num.toString(16).toUpperCase().padStart(2, '0');

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
  const PIXELS_PER_SCANLINE = 342;
  const NUM_SCANLINES = 262;
  const scanline = Math.floor((state.CYC * 3) / PIXELS_PER_SCANLINE) % NUM_SCANLINES;
  const pixel = (state.CYC * 3) % PIXELS_PER_SCANLINE;
  str += 'PPU:' + scanline.toString(10).padStart(3, ' ') +',' + pixel.toString(10).padStart(3, ' ') + ' ';
  str += 'CYC:' + state.CYC.toString(10);

  return str;
}
