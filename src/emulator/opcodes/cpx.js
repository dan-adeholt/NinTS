import {
  readValueAbsolute,
  readValueImmediate,
  readValueZeroPage,
  setCarry,
  setNegative,
  setZero
} from './utils';

const cpx = (state, value) => {
  let diff = state.X - value;
  let diffBytes = diff;
  if (diff < 0) {
    diffBytes += 256;
  }

  setZero(state, diffBytes);
  setNegative(state, diffBytes);
  setCarry(state, diff >= 0);
}

export const registerCPX = (opcodeHandlers) => {

  opcodeHandlers[0xE0] = state => cpx(state, readValueImmediate(state, 2));
  opcodeHandlers[0xE4] = state => cpx(state, readValueZeroPage(state, 3));
  opcodeHandlers[0xEC] = state => cpx(state, readValueAbsolute(state, 4));
}
