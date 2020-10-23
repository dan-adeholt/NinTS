import {
  readValueAbsolute,
  readValueImmediate,
  readValueZeroPage,
  setCarry,
  setNegative,
  setZero
} from './utils';

export const registerCPY = (opcodeHandlers) => {
  const cpy = (state, value) => {
    let diff = state.Y - value;
    let diffBytes = diff;
    if (diff < 0) {
      diffBytes += 256;
    }

    setZero(state, diffBytes);
    setNegative(state, diffBytes);
    setCarry(state, diff >= 0);
  }

  opcodeHandlers[0xC0] = state => cpy(state, readValueImmediate(state, 2));
  opcodeHandlers[0xC4] = state => cpy(state, readValueZeroPage(state, 3));
  opcodeHandlers[0xCC] = state => cpy(state, readValueAbsolute(state, 4));
}
