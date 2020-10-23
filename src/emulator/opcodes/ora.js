import {
  readValueAbsolute, readValueAbsoluteXWithPageBoundaryCycle, readValueAbsoluteYWithPageBoundaryCycle,
  readValueImmediate, readValueIndirectX, readValueIndirectYWithPageBoundaryCycle,
  readValueZeroPage,
  readValueZeroPageX,
  setNegative,
  setZero
} from './utils';

export const ora = (state, value) => {
  const result = state.A | value;
  state.A = result;
  setZero(state, result);
  setNegative(state, result);
};

export const registerORA = opcodeHandlers => {
  opcodeHandlers[0x09] = state => ora(state, readValueImmediate(state, 2));
  opcodeHandlers[0x05] = state => ora(state, readValueZeroPage(state, 3)) ;
  opcodeHandlers[0x15] = state => ora(state, readValueZeroPageX(state, 4));
  opcodeHandlers[0x0D] = state => ora(state, readValueAbsolute(state, 4));
  opcodeHandlers[0x1D] = state => ora(state, readValueAbsoluteXWithPageBoundaryCycle(state, 4));
  opcodeHandlers[0x19] = state => ora(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4));
  opcodeHandlers[0x01] = state => ora(state, readValueIndirectX(state, 6));
  opcodeHandlers[0x11] = state => ora(state, readValueIndirectYWithPageBoundaryCycle(state, 5));
}
