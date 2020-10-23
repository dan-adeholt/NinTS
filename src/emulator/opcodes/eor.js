import {
  readAbsolute4Cycles, readAbsoluteX4PlusCycles, readAbsoluteY4PlusCycles,
  readImmediate2Cycles, readIndirectX6Cycles, readIndirectY5PlusCycles,
  readZeroPage3Cycles,
  readZeroPageX4Cycles,
  setNegative,
  setZero
} from './utils';

export const eor = (state, value) => {
  const result = state.A ^ value;
  state.A = result;
  setZero(state, result);
  setNegative(state, result);
};

export const registerEOR = opcodeHandlers => {
  opcodeHandlers[0x49] = state => eor(state, readImmediate2Cycles(state));
  opcodeHandlers[0x45] = state => eor(state, readZeroPage3Cycles(state)) ;
  opcodeHandlers[0x55] = state => eor(state, readZeroPageX4Cycles(state));
  opcodeHandlers[0x4D] = state => eor(state, readAbsolute4Cycles(state));
  opcodeHandlers[0x5D] = state => eor(state, readAbsoluteX4PlusCycles(state));
  opcodeHandlers[0x59] = state => eor(state, readAbsoluteY4PlusCycles(state));
  opcodeHandlers[0x41] = state => eor(state, readIndirectX6Cycles(state));
  opcodeHandlers[0x51] = state => eor(state, readIndirectY5PlusCycles(state));
}
