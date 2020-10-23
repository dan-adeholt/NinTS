import {
  P_REG_CARRY,
  readValueAbsolute, readValueAbsoluteXWithPageBoundaryCycle, readValueAbsoluteYWithPageBoundaryCycle,
  readValueImmediate, readValueIndirectX, readValueIndirectYWithPageBoundaryCycle,
  readValueZeroPage,
  readValueZeroPageX, setCarry,
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
  opcodeHandlers[0x69] = state => adc(state, readValueImmediate(state, 2));
  opcodeHandlers[0x65] = state => adc(state, readValueZeroPage(state, 3)) ;
  opcodeHandlers[0x75] = state => adc(state, readValueZeroPageX(state, 4));
  opcodeHandlers[0x6D] = state => adc(state, readValueAbsolute(state, 4));
  opcodeHandlers[0x7D] = state => adc(state, readValueAbsoluteXWithPageBoundaryCycle(state, 4));
  opcodeHandlers[0x79] = state => adc(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4));
  opcodeHandlers[0x61] = state => adc(state, readValueIndirectX(state, 6));
  opcodeHandlers[0x71] = state => adc(state, readValueIndirectYWithPageBoundaryCycle(state, 5));
}
