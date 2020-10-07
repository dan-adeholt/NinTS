import { hex } from './stateLogging';
import opcodeMetadata from './opcodeMetadata';

const P_REG_CARRY = 0;
const P_REG_ZERO = 1;
const P_REG_INTERRUPT = 2;
const P_REG_DECIMAL = 3;
const P_REG_BREAK = 4;
const P_REG_ALWAYS_1 = 5;
const P_REG_OVERFLOW = 6;
const P_REG_NEGATIVE = 7;

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
  NOP: 0xEA
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
