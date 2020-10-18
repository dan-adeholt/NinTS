import { P_MASK_CARRY, P_MASK_DECIMAL, P_MASK_INTERRUPT, P_MASK_OVERFLOW } from './utils';

const clear = (state, mask) => {
  state.P = state.P & mask;
  state.PC += 1;
  state.CYC += 2;
}

export const registerClear = opcodeHandlers => {
  opcodeHandlers[0x18] = state => clear(state, P_MASK_CARRY) // CLC
  opcodeHandlers[0xD8] = state => clear(state, P_MASK_DECIMAL)  // CLD
  opcodeHandlers[0x58] = state => clear(state, P_MASK_INTERRUPT)  // CLI
  opcodeHandlers[0xB8] = state => clear(state, P_MASK_OVERFLOW)  // CLV
}
