import {
  readAbsolute4Cycles, readAbsoluteX4PlusCycles, readAbsoluteY4PlusCycles,
  readImmediate2Cycles, readIndirectX6Cycles, readIndirectY5PlusCycles,
  readZeroPage3Cycles,
  readZeroPageX4Cycles,
  setNegative,
  setZero
} from './utils';

const and = (state, value) => {
  const result = state.A & value;
  state.A = result;
  setZero(state, result);
  setNegative(state, result);
};

export const registerAND = opcodeHandlers => {
  opcodeHandlers[0x29] = state => and(state, readImmediate2Cycles(state));
  opcodeHandlers[0x25] = state => and(state, readZeroPage3Cycles(state)) ;
  opcodeHandlers[0x35] = state => and(state, readZeroPageX4Cycles(state));
  opcodeHandlers[0x2D] = state => and(state, readAbsolute4Cycles(state));
  opcodeHandlers[0x3D] = state => and(state, readAbsoluteX4PlusCycles(state));
  opcodeHandlers[0x39] = state => and(state, readAbsoluteY4PlusCycles(state));
  opcodeHandlers[0x21] = state => and(state, readIndirectX6Cycles(state));
  opcodeHandlers[0x31] = state => and(state, readIndirectY5PlusCycles(state));
}
