import {
  readAbsolute4Cycles, readAbsoluteX4PlusCycles, readAbsoluteY4PlusCycles,
  readImmediate2Cycles, readIndirectX6Cycles, readIndirectY5PlusCycles,
  readZeroPage3Cycles, readZeroPageX4Cycles,
  setCarry,
  setNegative,
  setZero
} from './utils';

const cpx = (state, value) => {
  let diff = state.X - value;
  let diffBytes = diff;
  if (diff < 0) {
    diffBytes += 0xFF;
  }

  setZero(state, diffBytes);
  setNegative(state, diffBytes);
  setCarry(state, diff >= 0);
}

export const registerCPX = (opcodeHandlers) => {

  opcodeHandlers[0xE0] = state => cpx(state, readImmediate2Cycles(state));
  opcodeHandlers[0xE4] = state => cpx(state, readZeroPage3Cycles(state));
  opcodeHandlers[0xEC] = state => cpx(state, readAbsolute4Cycles(state));
}
