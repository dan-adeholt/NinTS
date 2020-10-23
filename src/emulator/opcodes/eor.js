import {
  readValueAbsolute, readValueAbsoluteXWithPageBoundaryCycle, readValueAbsoluteYWithPageBoundaryCycle,
  readValueImmediate, readValueIndirectX, readValueIndirectYWithPageBoundaryCycle,
  readValueZeroPage,
  readValueZeroPageX,
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
  opcodeHandlers[0x49] = state => eor(state, readValueImmediate(state, 2));
  opcodeHandlers[0x45] = state => eor(state, readValueZeroPage(state, 3)) ;
  opcodeHandlers[0x55] = state => eor(state, readValueZeroPageX(state, 4));
  opcodeHandlers[0x4D] = state => eor(state, readValueAbsolute(state, 4));
  opcodeHandlers[0x5D] = state => eor(state, readValueAbsoluteXWithPageBoundaryCycle(state, 4));
  opcodeHandlers[0x59] = state => eor(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4));
  opcodeHandlers[0x41] = state => eor(state, readValueIndirectX(state, 6));
  opcodeHandlers[0x51] = state => eor(state, readValueIndirectYWithPageBoundaryCycle(state, 5));
}
