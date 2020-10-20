import {
  readAbsolute4Cycles, readAbsoluteX4PlusCycles, readAbsoluteY4PlusCycles,
  readImmediate2Cycles, readIndirectX6Cycles, readIndirectY5PlusCycles,
  readZeroPage3Cycles, readZeroPageX4Cycles,
  setCarry,
  setNegative,
  setZero
} from './utils';

export const registerCMP = (opcodeHandlers) => {
  const cmp = (state, value) => {
    let diff = state.A - value;
    let diffBytes = diff;
    if (diff < 0) {
      diffBytes += 0xFF;
    }

    setZero(state, diffBytes);
    setNegative(state, diffBytes);
    setCarry(state, diff >= 0);
  }

  opcodeHandlers[0xC9] = state => cmp(state, readImmediate2Cycles(state));
  opcodeHandlers[0xC5] = state => cmp(state, readZeroPage3Cycles(state));
  opcodeHandlers[0xD5] = state => cmp(state, readZeroPageX4Cycles(state));
  opcodeHandlers[0xCD] = state => cmp(state, readAbsolute4Cycles(state));
  opcodeHandlers[0xDD] = state => cmp(state, readAbsoluteX4PlusCycles(state));
  opcodeHandlers[0xD9] = state => cmp(state, readAbsoluteY4PlusCycles(state));
  opcodeHandlers[0xC1] = state => cmp(state, readIndirectX6Cycles(state));
  opcodeHandlers[0xD1] = state => cmp(state, readIndirectY5PlusCycles(state));
}
