import {
  readAbsolute4Cycles, readAbsoluteX4PlusCycles, readAbsoluteY4PlusCycles,
  readImmediate2Cycles, readIndirectX6Cycles, readIndirectY5PlusCycles,
  readZeroPage3Cycles, readZeroPageX4Cycles,
  setCarry,
  setNegative,
  setZero
} from './utils';

export const registerCPY = (opcodeHandlers) => {
  const cpy = (state, value) => {
    let diff = state.Y - value;
    let diffBytes = diff;
    if (diff < 0) {
      diffBytes += 0xFF;
    }

    setZero(state, diffBytes);
    setNegative(state, diffBytes);
    setCarry(state, diff >= 0);
  }

  opcodeHandlers[0xC0] = state => cpy(state, readImmediate2Cycles(state));
  opcodeHandlers[0xC4] = state => cpy(state, readZeroPage3Cycles(state));
  opcodeHandlers[0xCC] = state => cpy(state, readAbsolute4Cycles(state));
}
