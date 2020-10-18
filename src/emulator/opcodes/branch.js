import { onSamePageBoundary, P_REG_CARRY, P_REG_NEGATIVE, P_REG_OVERFLOW, P_REG_ZERO } from './utils';

const branch = (state, shouldBranch) => {
  const offset = state.readMem(state.PC + 1);
  const nextInstruction = state.PC + 2;
  const jumpInstruction = state.PC + 2 + offset;

  state.CYC += 2;

  if (shouldBranch) {
    state.CYC += 1;

    if (!onSamePageBoundary(nextInstruction, jumpInstruction)) {
      state.CYC += 1;
    }

    state.PC = jumpInstruction;
  } else {
    state.PC = nextInstruction;
  }
}

export const registerBranch = opcodeHandlers => {
  opcodeHandlers[0x90] = state => branch(state, !(state.P & P_REG_CARRY )); // BCC
  opcodeHandlers[0xF0] = state => branch(state, state.P & P_REG_ZERO); // BEQ
  opcodeHandlers[0xD0] = state => branch(state, !(state.P & P_REG_ZERO)); // BNE
  opcodeHandlers[0xB0] = state => branch(state, state.P & P_REG_CARRY); // BCS
  opcodeHandlers[0x50] = state => branch(state, !(state.P & P_REG_OVERFLOW)) // BVC
  opcodeHandlers[0x70] = state => branch(state, state.P & P_REG_OVERFLOW); // BVS
  opcodeHandlers[0x10] = state => branch(state, !(state.P & P_REG_NEGATIVE)); // BPL
  opcodeHandlers[0x30] = state => branch(state, state.P & P_REG_NEGATIVE); // BMI
}
