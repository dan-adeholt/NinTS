import {
  P_REG_CARRY,
  readAbsolute4Cycles, readAbsoluteX4PlusCycles, readAbsoluteY4PlusCycles,
  readImmediate2Cycles, readIndirectX6Cycles, readIndirectY5PlusCycles,
  readZeroPage3Cycles,
  readZeroPageX4Cycles, setCarry,
  setNegative, setOverflow,
  setZero
} from './utils';

export const adc = (state, value) => {
  const result = state.A + value + (state.P & P_REG_CARRY);
  const resultByte = (result & 0xFF);

  setOverflow(state, state.A, value, resultByte);
  state.A = resultByte & 0xFF;
  setCarry(state, result > 0xFF);
  setZero(state, resultByte);
  setNegative(state, resultByte);
};

export const registerADC = opcodeHandlers => {
  opcodeHandlers[0x69] = state => adc(state, readImmediate2Cycles(state));
  opcodeHandlers[0x65] = state => adc(state, readZeroPage3Cycles(state)) ;
  opcodeHandlers[0x75] = state => adc(state, readZeroPageX4Cycles(state));
  opcodeHandlers[0x6D] = state => adc(state, readAbsolute4Cycles(state));
  opcodeHandlers[0x7D] = state => adc(state, readAbsoluteX4PlusCycles(state));
  opcodeHandlers[0x79] = state => adc(state, readAbsoluteY4PlusCycles(state));
  opcodeHandlers[0x61] = state => adc(state, readIndirectX6Cycles(state));
  opcodeHandlers[0x71] = state => adc(state, readIndirectY5PlusCycles(state));
}
