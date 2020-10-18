import {
  readAbsolute4Cycles, readAbsoluteX4PlusCycles,
  readAbsoluteY4PlusCycles,
  readImmediate2Cycles, readIndirectX6Cycles, readIndirectY5PlusCycles,
  readZeroPage3Cycles,
  readZeroPageX4Cycles,
  setNegative,
  setZero
} from './utils';

const lda = (state, value) => {
  state.A = value;
  setZero(state, value);
  setNegative(state, value);
};

export const registerLDA = opcodeHandlers => {
  opcodeHandlers[0xA9] = state => lda(state, readImmediate2Cycles(state));
  opcodeHandlers[0xA5] = state => lda(state, readZeroPage3Cycles(state));
  opcodeHandlers[0xB5] = state => lda(state, readZeroPageX4Cycles(state));
  opcodeHandlers[0xAD] = state => lda(state, readAbsolute4Cycles(state));
  opcodeHandlers[0xBD] = state => lda(state, readAbsoluteX4PlusCycles(state));
  opcodeHandlers[0xB9] = state => lda(state, readAbsoluteY4PlusCycles(state));
  opcodeHandlers[0xA1] = state => lda(state, readIndirectX6Cycles(state));
  opcodeHandlers[0xB1] = state => lda(state, readIndirectY5PlusCycles(state));
}
