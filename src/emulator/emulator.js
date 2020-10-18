import { hex } from './stateLogging';
import opcodeMetadata from './opcodeMetadata';
import {
  branchOpcode,
  P_MASK_OVERFLOW_AND_NEGATIVE,
  P_REG_BREAK,
  P_REG_CARRY,
  P_REG_NEGATIVE,
  P_REG_OVERFLOW,
  P_REG_ZERO,
  P_REGS_OVERFLOW_AND_NEGATIVE,
  readImmediate2Cycles,
  readZeroPage3Cycles,
  setAlwaysOne,
  setBreak,
  setCarry,
  setDecimal,
  setInterrupt,
  setNegative,
  setNegativeNativeNumber,
  setZero
} from './opcodes/utils';
import { registerLDX } from './opcodes/ldx';
import { registerLDA } from './opcodes/lda';
import { registerBranch } from './opcodes/branch';
import { registerSTA } from './opcodes/sta';
import { registerSTX } from './opcodes/stx';

const opcodeHandlers = new Array(255);

opcodeHandlers[0x4C] = state => { // JMP Absolute
  state.PC = state.readMem(state.PC + 1) + (state.readMem(state.PC + 2) << 8);
  state.CYC += 3;
};

opcodeHandlers[0x29] = state => { // AND Immediate
  state.A = state.A & state.readMem(state.PC + 1);
  setZero(state, state.A);
  setNegative(state, state.A);
  state.PC+=2;
  state.CYC += 2;
};

opcodeHandlers[0xC9] = state => { // CMP Immediate
  const diff = state.A - state.readMem(state.PC + 1);
  setZero(state, diff);
  setNegativeNativeNumber(state, diff);
  setCarry(state, diff >= 0);
  state.PC+=2;
  state.CYC += 2;
};

registerLDX(opcodeHandlers);
registerLDA(opcodeHandlers);
registerSTA(opcodeHandlers);
registerSTX(opcodeHandlers);
registerBranch(opcodeHandlers);

opcodeHandlers[0x20] = state => { // JSR
  const addr = state.PC + 2; // Next instruction - 1
  state.setStack(state.SP, addr >> 8);
  state.setStack(state.SP - 1, addr & 0xFF);
  state.SP -= 2;
  state.PC = state.readMem(state.PC + 1) + (state.readMem(state.PC + 2) << 8);
  state.CYC += 6;
};

opcodeHandlers[0x08] = state => { // PHP
  const pCopy = state.P | P_REG_BREAK;
  state.setStack(state.SP, pCopy);
  state.SP -= 1;
  state.PC += 1;
  state.CYC += 3;
};

opcodeHandlers[0x48] = state => { // PHA
  state.setStack(state.SP, state.A);
  state.SP -= 1;
  state.PC += 1;
  state.CYC += 3;
};

opcodeHandlers[0x28] = state => { // PLP
  state.P = state.readStack(state.SP + 1);
  setBreak(state, false); // See http://wiki.nesdev.com/w/index.php/Status_flags
  setAlwaysOne(state);
  state.SP += 1;
  state.PC += 1;
  state.CYC += 4;
};

opcodeHandlers[0x68] = state => { // PLA
  state.A = state.readStack(state.SP + 1);
  state.SP += 1;
  state.PC += 1;
  setZero(state, state.A);
  setNegative(state, state.A);
  state.CYC += 4;
};

opcodeHandlers[0x60] = state => { // RTS
  const low = state.readStack(state.SP + 1);
  const high = state.readStack(state.SP + 2);
  state.SP += 2;
  state.PC = (low | (high << 8)) + 1;
  state.CYC += 6;
};

opcodeHandlers[0xEA] = state => { // NOP
  state.PC += 1;
  state.CYC += 2;
}

opcodeHandlers[0x38] = state => { // SEC
  setCarry(state, true);
  state.PC += 1;
  state.CYC += 2;
}

opcodeHandlers[0x18] = state => { // CLC
  setCarry(state, false);
  state.PC += 1;
  state.CYC += 2;
}



opcodeHandlers[0xD8] = state => { // CLD
  setDecimal(state, false);
  state.CYC += 2;
  state.PC += 1;
}

opcodeHandlers[0x78] = state => { // SEI
  setInterrupt(state, true);
  state.CYC += 2;
  state.PC += 1;
}

opcodeHandlers[0xF8] = state => { // SED
  setDecimal(state, true);
  state.CYC += 2;
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
  state.CYC += 3;
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
