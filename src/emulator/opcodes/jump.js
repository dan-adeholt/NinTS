export const registerJump = opcodeHandlers => {
  opcodeHandlers[0x4C] = state => { // JMP Absolute
    state.PC = state.readMem(state.PC + 1) + (state.readMem(state.PC + 2) << 8);
    state.CYC += 3;
  };

  opcodeHandlers[0x20] = state => { // JSR
    const addr = state.PC + 2; // Next instruction - 1
    state.setStack(state.SP, addr >> 8);
    state.setStack(state.SP - 1, addr & 0xFF);
    state.SP -= 2;
    state.PC = state.readMem(state.PC + 1) + (state.readMem(state.PC + 2) << 8);
    state.CYC += 6;
  };
}