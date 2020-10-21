import { setCarry, setDecimal, setInterrupt } from './utils';

export const registerSet = opcodeHandlers => {
  opcodeHandlers[0x38] = state => { // SEC
    setCarry(state, true);
    state.PC += 1;
    state.CYC += 2;
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
}
