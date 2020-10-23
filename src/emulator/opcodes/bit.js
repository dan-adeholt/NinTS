import {
  P_MASK_OVERFLOW_AND_NEGATIVE,
  P_REGS_OVERFLOW_AND_NEGATIVE,
  readValueAbsolute,
  readValueZeroPage,
  setZero
} from './utils';

const bit = (state, memoryValue) => {
  if (memoryValue & state.A) {
    setZero(state, 1);
  } else {
    setZero(state, 0);
  }

  const upperBits = memoryValue & P_REGS_OVERFLOW_AND_NEGATIVE;
  const lowerBits = state.P & P_MASK_OVERFLOW_AND_NEGATIVE;
  state.P = upperBits | lowerBits;
}


export const registerBIT = opcodeHandlers => {
  opcodeHandlers[0x24] = state => bit(state, readValueZeroPage(state, 3))
  opcodeHandlers[0x2C] = state => bit(state, readValueAbsolute(state, 4))
}
