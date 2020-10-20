import { P_REG_BREAK, setAlwaysOne, setBreak, setNegative, setZero } from './utils';

export const registerStack = opcodeHandlers => {
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

  opcodeHandlers[0x40] = state => { // RTI
    state.P = state.readStack(state.SP + 1);
    setBreak(state, false); // See http://wiki.nesdev.com/w/index.php/Status_flags
    setAlwaysOne(state);
    const low = state.readStack(state.SP + 2);
    const high = state.readStack(state.SP + 3);
    state.SP += 3;
    state.PC = (low | (high << 8));
    state.CYC += 6;
  }

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

}
