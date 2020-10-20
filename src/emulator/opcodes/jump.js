export const registerJump = opcodeHandlers => {
  opcodeHandlers[0x4C] = state => { // JMP Absolute
    state.PC = state.readMem(state.PC + 1) + (state.readMem(state.PC + 2) << 8);
    state.CYC += 3;
  };
}
