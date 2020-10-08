import { hex } from './stateLogging';
import opcodeMetadata from './opcodeMetadata';

const P_REG_ZERO = 1;
const P_REG_INTERRUPT = 2;
const P_REG_DECIMAL = 3;
const P_REG_BREAK = 4;
const P_REG_ALWAYS_1 = 5;
const P_REG_OVERFLOW = 6;
const P_REG_NEGATIVE = 7;

const setCarry = (state, on) => {
  if (on) {
    state.P = state.P | 1;    // P_REG_CARRY is 0, no need to shift
  } else {
    state.P = state.P & (~(1));
  }
};

const setZero = (state, value) => {
  if (value === 0) {
    state.P = state.P | (1 << P_REG_ZERO);
  } else {
    state.P = state.P & (~(1 << P_REG_ZERO));
  }
};

const setNegative = (state, value) => {
  if (value <= 0x7F) {
    state.P = state.P & (~(1 << P_REG_NEGATIVE));
  } else {
    state.P = state.P | (1 << P_REG_NEGATIVE);
  }
};

const translateAddress = address => {
  // TODO: Handle support for mirroring etc
  return address;
}

const Opcodes = {
  JMP_Abs: 0x4C,
  LDX_Immediate: 0xA2,
  STX_ZeroPage: 0x86,
  JSR: 0x20,
  NOP: 0xEA,
  SEC: 0x38,
  CLC: 0x18,
  BCS: 0xB0,
  BCC: 0x90
};

const PAGE_SIZE = 256;

const onSamePageBoundary = (a1, a2) => {
  return (a1 ^ a2) < PAGE_SIZE;
};

const opcodeHandlers = new Array(255);

opcodeHandlers[Opcodes.JMP_Abs] = state => {
  state.PC = state.readMem(state.PC + 1) + (state.readMem(state.PC + 2) << 8);
  state.CYC += 3;
};

opcodeHandlers[Opcodes.LDX_Immediate] = state => {
  state.X = state.readMem(state.PC + 1);
  setZero(state, state.X);
  setNegative(state, state.X);
  state.PC+=2;
  state.CYC+=2;
};

opcodeHandlers[Opcodes.STX_ZeroPage] = state => {
  state.setMem(state.PC + 1, state.X);
  state.PC+=2;
  state.CYC+=3;
};

opcodeHandlers[Opcodes.JSR] = state => {
  const addr = state.PC + 2; // Next instruction - 1
  state.setMem(state.SP, addr >> 8);
  state.setMem(state.SP - 1, addr & 0xFF);
  state.SP -= 2;
  state.PC = state.readMem(state.PC + 1) + (state.readMem(state.PC + 2) << 8);
  state.CYC+=6;
};

opcodeHandlers[Opcodes.NOP] = state => {
  state.PC += 1;
  state.CYC += 2;
}

opcodeHandlers[Opcodes.SEC] = state => {
  setCarry(state, true);
  state.PC += 1;
  state.CYC += 2;
}

opcodeHandlers[Opcodes.CLC] = state => {
  setCarry(state, false);
  state.PC += 1;
  state.CYC += 2;
}

opcodeHandlers[Opcodes.BCC] = state => {
  const offset = state.readMem(state.PC + 1);
  const nextInstruction = state.PC + 2;
  const jumpInstruction = state.PC + 2 + offset;

  state.CYC += 2;
  if (!(state.P & 0x1 )) { // P_REG_CARRY is bit 0
    state.CYC += 1;

    if (!onSamePageBoundary(nextInstruction, jumpInstruction)) {
      state.CYC += 1;
    }

    state.PC = jumpInstruction;
  } else {
    state.PC = nextInstruction;
  }
}

opcodeHandlers[Opcodes.BCS] = state => {
  const offset = state.readMem(state.PC + 1);
  const nextInstruction = state.PC + 2;
  const jumpInstruction = state.PC + 2 + offset;

  state.CYC += 2;
  if (state.P & 0x1 ) { // P_REG_CARRY is bit 0
    state.CYC += 1;

    if (!onSamePageBoundary(nextInstruction, jumpInstruction)) {
      state.CYC += 1;
    }

    state.PC = jumpInstruction;
  } else {
    state.PC = nextInstruction;
  }
}

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
    readMem: addr => memory[addr],
    setMem: (addr, value) => {
      memory[addr] = value;
    },
    memory,
  };
}

export const step = (state) => {
  const opcode = state.readMem(state.PC);
  if (opcode in opcodeHandlers) {
    opcodeHandlers[opcode](state);
  } else {
    console.error('No handler found for opcode $' + hex(opcode), opcodeMetadata[opcode].name);
  }

};
