export const initMachine = (rom) => {
  let memory = new Uint8Array(1 << 16);
  memory.set(rom.prgData, 0x8000);

  if (rom.prgData.length <= 0x4000) {
    memory.set(rom.prgData, 0xC000);
  }

  return {
    A: 0,
    X: 0,
    Y: 0,
    P: 0x24,
    PC: 0,
    SP: 0xFD,
    CYC: 0,
    CHR: rom.chrData,
    settings: rom.settings,
    memory,
  };
}

export const stateToString = (state) => {
  const hex = num => num.toString(16).toUpperCase().padStart(2, '0');
  let str = state.PC.toString(16).toUpperCase();
  str += '  ';
  const opcode = state.memory[state.PC];

  if (opcode == null) {
    return str;
  }

  str += hex(opcode);
  str += ' ';

  const opcodeMetadata = {
    0x4c: [args => 'JMP $' + hex(args[1]) + hex(args[0]), 2],
  }

  if (opcode in opcodeMetadata) {
    const [label, numberOfArgs] = opcodeMetadata[opcode];
    let args = state.memory.slice(state.PC + 1, state.PC + 1 + numberOfArgs);

    for (let arg of args) {
      str += hex(arg) + ' ';
    }

    str = str.padEnd(16, ' ');
    str += label(args) + ' ';
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


export const step = (state) => {
  const opcode = state.memory[state.PC];
  const opcodes = new Array(255);

  opcodes[0x4C] = (state) => { // JMP Absolute
    state.PC = state.memory[state.PC + 1] + (state.memory[state.PC + 2] << 8);
    state.CYC += 3;
  };

  opcodes[opcode](state);
};
