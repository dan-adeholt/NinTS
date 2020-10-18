import {
  readAbsolute4Cycles, readAbsoluteX4PlusCycles, readAbsoluteY4PlusCycles,
  readImmediate2Cycles, readIndirectX6Cycles, readIndirectY5PlusCycles,
  readZeroPage3Cycles,
  readZeroPageX4Cycles,
  setNegative,
  setZero
} from './utils';

const ora = (state, value) => {
  const result = state.A | value;
  state.A = result;
  setZero(state, result);
  setNegative(state, result);
};

export const registerORA = opcodeHandlers => {
  opcodeHandlers[0x09] = state => ora(state, readImmediate2Cycles(state));
  opcodeHandlers[0x05] = state => ora(state, readZeroPage3Cycles(state)) ;
  opcodeHandlers[0x15] = state => ora(state, readZeroPageX4Cycles(state));
  opcodeHandlers[0x0D] = state => ora(state, readAbsolute4Cycles(state));
  opcodeHandlers[0x1D] = state => ora(state, readAbsoluteX4PlusCycles(state));
  opcodeHandlers[0x19] = state => ora(state, readAbsoluteY4PlusCycles(state));
  opcodeHandlers[0x01] = state => ora(state, readIndirectX6Cycles(state));
  opcodeHandlers[0x11] = state => ora(state, readIndirectY5PlusCycles(state));
}