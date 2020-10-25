import {
  readValueAbsolute, readValueAbsoluteXWithPageBoundaryCycle, readValueAbsoluteYWithPageBoundaryCycle,
  readValueImmediate, readValueIndirectX, readValueIndirectYWithPageBoundaryCycle,
  readValueZeroPage,
  readValueZeroPageX,
  setNegative,
  setZero
} from './utils';

export const and = (state, value) => {
  const result = state.A & value;
  state.A = result;
  setZero(state, result);
  setNegative(state, result);
  return result;
};

export const registerAND = opcodeHandlers => {
  opcodeHandlers[0x29] = state => and(state, readValueImmediate(state, 2));
  opcodeHandlers[0x25] = state => and(state, readValueZeroPage(state, 3)) ;
  opcodeHandlers[0x35] = state => and(state, readValueZeroPageX(state, 4));
  opcodeHandlers[0x2D] = state => and(state, readValueAbsolute(state, 4));
  opcodeHandlers[0x3D] = state => and(state, readValueAbsoluteXWithPageBoundaryCycle(state, 4));
  opcodeHandlers[0x39] = state => and(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4));
  opcodeHandlers[0x21] = state => and(state, readValueIndirectX(state, 6));
  opcodeHandlers[0x31] = state => and(state, readValueIndirectYWithPageBoundaryCycle(state, 5));
}
