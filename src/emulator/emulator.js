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

const setFlag = (state, flag, mask, on) => {
  if (on) {
    state.P = state.P | flag;
  } else {
    state.P = state.P & mask;
  }
}

const setCarry = (state, on) => setFlag(state, P_REG_CARRY, P_MASK_CARRY, on);
const setZero = (state, value) => setFlag(state, P_REG_ZERO, P_MASK_ZERO, value === 0);
const setNegative = (state, value) => setFlag(state, P_REG_NEGATIVE, P_MASK_NEGATIVE, value > 0x7F);
const setNegativeNativeNumber = (state, value) => setFlag(state, P_REG_NEGATIVE, P_MASK_NEGATIVE, value < 0);
const setInterrupt = (state, on) => setFlag(state, P_REG_INTERRUPT, P_MASK_INTERRUPT, on);
const setDecimal = (state, on) => setFlag(state, P_REG_DECIMAL, P_MASK_DECIMAL, on);
const setBreak = (state, on) => setFlag(state, P_REG_BREAK, P_MASK_BREAK, on);
const setAlwaysOne = (state) => setFlag(state, P_REG_ALWAYS_1, P_MASK_ALWAYS_1, true);

const readZeroPage = (state, addr) => state.readMem(state.readMem(addr));
const readZeroPageY = (state, addr) => (state.readMem(addr) + state.Y) % 256

const PAGE_SIZE = 256;

const onSamePageBoundary = (a1, a2) => {
  return (a1 ^ a2) < PAGE_SIZE;
};

const opcodeHandlers = new Array(255);

opcodeHandlers[0x4C] = state => { // JMP Absolute
  state.PC = state.readMem(state.PC + 1) + (state.readMem(state.PC + 2) << 8);
  addCycles(state, 3);
};

opcodeHandlers[0x29] = state => { // AND Immediate
  state.A = state.A & state.readMem(state.PC + 1);
  setZero(state, state.A);
  setNegative(state, state.A);
  state.PC+=2;
  addCycles(state, 2);
};

opcodeHandlers[0xC9] = state => { // CMP Immediate
  const diff = state.A - state.readMem(state.PC + 1);
  setZero(state, diff);
  setNegativeNativeNumber(state, diff);
  setCarry(state, diff >= 0);
  state.PC+=2;
  addCycles(state, 2);
};

opcodeHandlers[0xA2] = state => { // LDX Immediate
  state.X = state.readMem(state.PC + 1);
  setZero(state, state.X);
  setNegative(state, state.X);
  state.PC+=2;
  addCycles(state, 2);
};

opcodeHandlers[0xA9] = state => { // LDA Immediate
  state.A = state.readMem(state.PC + 1);
  setZero(state, state.A);
  setNegative(state, state.A);
  state.PC+=2;
  addCycles(state, 2);
};

opcodeHandlers[0x86] = state => { // STX Zero Page
  const address = state.readMem(state.PC + 1);
  state.setMem(address, state.X);
  state.PC+=2;
  addCycles(state, 3);
};


opcodeHandlers[0x85] = state => { // STA Zero Page
  const address = state.readMem(state.PC + 1);
  state.setMem(address, state.A);
  state.PC+=2;
  addCycles(state, 3);
};


opcodeHandlers[0x20] = state => { // JSR
  const addr = state.PC + 2; // Next instruction - 1
  state.setStack(state.SP, addr >> 8);
  state.setStack(state.SP - 1, addr & 0xFF);
  state.SP -= 2;
  state.PC = state.readMem(state.PC + 1) + (state.readMem(state.PC + 2) << 8);
  addCycles(state, 6);
};

opcodeHandlers[0x08] = state => { // PHP
  const pCopy = state.P | P_REG_BREAK;
  state.setStack(state.SP, pCopy);
  state.SP -= 1;
  state.PC += 1;
  addCycles(state, 3);
};

opcodeHandlers[0x48] = state => { // PHA
  state.setStack(state.SP, state.A);
  state.SP -= 1;
  state.PC += 1;
  addCycles(state, 3);
};

opcodeHandlers[0x28] = state => { // PLP
  state.P = state.readStack(state.SP + 1);
  setBreak(state, false); // See http://wiki.nesdev.com/w/index.php/Status_flags
  setAlwaysOne(state);
  state.SP += 1;
  state.PC += 1;
  addCycles(state, 4);
};

opcodeHandlers[0x68] = state => { // PLA
  state.A = state.readStack(state.SP + 1);
  state.SP += 1;
  state.PC += 1;
  setZero(state, state.A);
  setNegative(state, state.A);
  addCycles(state, 4);
};

opcodeHandlers[0x60] = state => { // RTS
  const low = state.readStack(state.SP + 1);
  const high = state.readStack(state.SP + 2);
  state.SP += 2;
  state.PC = (low | (high << 8)) + 1;
  addCycles(state, 6);
};

opcodeHandlers[0xEA] = state => { // NOP
  state.PC += 1;
  addCycles(state, 2);
}

opcodeHandlers[0x38] = state => { // SEC
  setCarry(state, true);
  state.PC += 1;
  addCycles(state, 2);
}

opcodeHandlers[0x18] = state => { // CLC
  setCarry(state, false);
  state.PC += 1;
  addCycles(state, 2);
}

opcodeHandlers[0x90] = state => branchOpcode(state, !(state.P & P_REG_CARRY )); // BCC
opcodeHandlers[0xF0] = state => branchOpcode(state, state.P & P_REG_ZERO); // BEQ
opcodeHandlers[0xD0] = state => branchOpcode(state, !(state.P & P_REG_ZERO)); // BNE
opcodeHandlers[0xB0] = state => branchOpcode(state, state.P & P_REG_CARRY); // BCS
opcodeHandlers[0x50] = state => branchOpcode(state, !(state.P & P_REG_OVERFLOW)) // BVC
opcodeHandlers[0x70] = state => branchOpcode(state, state.P & P_REG_OVERFLOW); // BVS
opcodeHandlers[0x10] = state => branchOpcode(state, !(state.P & P_REG_NEGATIVE)); // BPL
opcodeHandlers[0x30] = state => branchOpcode(state, state.P & P_REG_NEGATIVE); // BMI

opcodeHandlers[0xD8] = state => { // CLD
  setDecimal(state, false);
  addCycles(state, 2);
  state.PC += 1;
}

opcodeHandlers[0x78] = state => { // SEI
  setInterrupt(state, true);
  addCycles(state, 2);
  state.PC += 1;
}

opcodeHandlers[0xF8] = state => { // SED
  setDecimal(state, true);
  addCycles(state, 2);
  state.PC += 1;
}

opcodeHandlers[0x24] = state => { // BIT ZeroPage
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
    readStack: sp => memory[0x100 + sp],
    setStack: (sp, value) => {
      memory[0x100 + sp] = value;
    },
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
