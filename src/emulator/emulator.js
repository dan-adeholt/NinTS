import { hex } from './stateLogging';
import opcodeMetadata from './opcodeMetadata';

const P_REG_CARRY = 1;
const P_REG_ZERO = 1 << 1;
const P_REG_INTERRUPT = 1 << 2;
const P_REG_DECIMAL = 1 << 3;
const P_REG_BREAK = 1 << 4;
const P_REG_ALWAYS_1 = 1 << 5;
const P_REG_OVERFLOW = 1 << 6;
const P_REG_NEGATIVE = 1 << 7;

const P_REGS_OVERFLOW_AND_NEGATIVE = P_REG_NEGATIVE | P_REG_OVERFLOW;
const P_MASK_OVERFLOW_AND_NEGATIVE = ~P_REGS_OVERFLOW_AND_NEGATIVE;

const P_MASK_CARRY = ~P_REG_CARRY;
const P_MASK_ZERO = ~P_REG_ZERO;
const P_MASK_INTERRUPT = ~P_REG_INTERRUPT;
const P_MASK_DECIMAL = ~P_REG_DECIMAL;
const P_MASK_BREAK = ~P_REG_BREAK;
const P_MASK_ALWAYS_1 = ~P_REG_ALWAYS_1;
const P_MASK_OVERFLOW = ~P_REG_OVERFLOW;
const P_MASK_NEGATIVE = ~P_REG_NEGATIVE;

export const addCycles = (state, cycles) => {
  state.CYC += cycles;
}

const setCarry = (state, on) => {
  if (on) {
    state.P = state.P | P_REG_CARRY;
  } else {
    state.P = state.P & P_MASK_CARRY;
  }
};

const setZero = (state, value) => {
  if (value === 0) {
    state.P = state.P | P_REG_ZERO;
  } else {
    state.P = state.P & P_MASK_ZERO;
  }
};

const setNegative = (state, value) => {
  if (value <= 0x7F) {
    state.P = state.P & P_MASK_NEGATIVE;
  } else {
    state.P = state.P | P_REG_NEGATIVE;
  }
};

const translateAddress = address => {
  // TODO: Handle support for mirroring etc
  return address;
}

const Opcodes = {
  JMP_Abs: 0x4C,
  LDX_Immediate: 0xA2,
  LDA_Immediate: 0xA9,
  STX_ZeroPage: 0x86,
  STA_ZeroPage: 0x85,
  JSR: 0x20,
  NOP: 0xEA,
  SEC: 0x38,
  CLC: 0x18,
  BCS: 0xB0,
  BCC: 0x90,
  BEQ: 0xF0,
  BNE: 0xD0,
  BIT_ZeroPage: 0x24,
  BVS: 0x70,
  BVC: 0x50,
  BPL: 0x10,
  BMI: 0x30,
  RTS: 0x60
};

const PAGE_SIZE = 256;

const onSamePageBoundary = (a1, a2) => {
  return (a1 ^ a2) < PAGE_SIZE;
};

const opcodeHandlers = new Array(255);

opcodeHandlers[Opcodes.JMP_Abs] = state => {
  state.PC = state.readMem(state.PC + 1) + (state.readMem(state.PC + 2) << 8);
  addCycles(state, 3);
};

opcodeHandlers[Opcodes.LDX_Immediate] = state => {
  state.X = state.readMem(state.PC + 1);
  setZero(state, state.X);
  setNegative(state, state.X);
  state.PC+=2;
  addCycles(state, 2);
};

opcodeHandlers[Opcodes.LDA_Immediate] = state => {
  state.A = state.readMem(state.PC + 1);
  setZero(state, state.A);
  setNegative(state, state.A);
  state.PC+=2;
  addCycles(state, 2);
};

opcodeHandlers[Opcodes.STX_ZeroPage] = state => {
  const address = state.readMem(state.PC + 1);
  state.setMem(address, state.X);
  state.PC+=2;
  addCycles(state, 3);
};


opcodeHandlers[Opcodes.STA_ZeroPage] = state => {
  const address = state.readMem(state.PC + 1);
  state.setMem(address, state.A);
  state.PC+=2;
  addCycles(state, 3);
};


opcodeHandlers[Opcodes.JSR] = state => {
  const addr = state.PC + 2; // Next instruction - 1
  state.setMem(state.SP, addr >> 8);
  state.setMem(state.SP - 1, addr & 0xFF);
  state.SP -= 2;
  state.PC = state.readMem(state.PC + 1) + (state.readMem(state.PC + 2) << 8);
  addCycles(state, 6);
};

opcodeHandlers[Opcodes.RTS] = state => {
  const low = state.readMem(state.SP + 1);
  const high = state.readMem(state.SP + 2);
  state.SP += 2;
  state.PC = (low | (high << 8)) + 1;
  addCycles(state, 6);
};

opcodeHandlers[Opcodes.NOP] = state => {
  state.PC += 1;
  addCycles(state, 2);
}

opcodeHandlers[Opcodes.SEC] = state => {
  setCarry(state, true);
  state.PC += 1;
  addCycles(state, 2);
}

opcodeHandlers[Opcodes.CLC] = state => {
  setCarry(state, false);
  state.PC += 1;
  addCycles(state, 2);
}

opcodeHandlers[Opcodes.BCC] = state => {
  branchOpcode(state, !(state.P & P_REG_CARRY ));
}

opcodeHandlers[Opcodes.BEQ] = state => {
  branchOpcode(state, state.P & P_REG_ZERO);
}

opcodeHandlers[Opcodes.BNE] = state => {
  branchOpcode(state, !(state.P & P_REG_ZERO));
}

opcodeHandlers[Opcodes.BCS] = state => {
  branchOpcode(state, state.P & P_REG_CARRY);
}

opcodeHandlers[Opcodes.BVC] = state => {
  branchOpcode(state, !(state.P & P_REG_OVERFLOW));
}

opcodeHandlers[Opcodes.BVS] = state => {
  branchOpcode(state, state.P & P_REG_OVERFLOW);
}

opcodeHandlers[Opcodes.BPL] = state => {
  branchOpcode(state, !(state.P & P_REG_NEGATIVE));
}

opcodeHandlers[Opcodes.BMI] = state => {
  branchOpcode(state, state.P & P_REG_NEGATIVE);
}

opcodeHandlers[Opcodes.BIT_ZeroPage] = state => {
  const memoryValue = state.readMem(state.readMem(state.PC + 1));

  if (memoryValue & state.A) {
    setZero(state, 1);
  } else {
    setZero(state, 0);
  }

  const upperBits = memoryValue & P_REGS_OVERFLOW_AND_NEGATIVE;
  const lowerBits = state.P & P_MASK_OVERFLOW_AND_NEGATIVE;
  state.P = upperBits | lowerBits;

  state.PC += 2;
  addCycles(state, 3);
}


const branchOpcode = (state, shouldBranch) => {
  const offset = state.readMem(state.PC + 1);
  const nextInstruction = state.PC + 2;
  const jumpInstruction = state.PC + 2 + offset;

  addCycles(state, 2);
  if (shouldBranch) {
    addCycles(state, 1);

    if (!onSamePageBoundary(nextInstruction, jumpInstruction)) {
      addCycles(state, 1);
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
    // console.log('Executing $' + hex(opcode));
    opcodeHandlers[opcode](state);
  } else {
    console.error('No handler found for opcode $' + hex(opcode), opcodeMetadata[opcode].name);
  }

};
