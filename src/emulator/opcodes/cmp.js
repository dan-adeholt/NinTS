import {
  readValueAbsolute, readValueAbsoluteXWithPageBoundaryCycle, readValueAbsoluteYWithPageBoundaryCycle,
  readValueImmediate, readValueIndirectX, readValueIndirectYWithPageBoundaryCycle,
  readValueZeroPage, readValueZeroPageX,
  setCarry,
  setNegative,
  setZero
} from './utils';

export const cmp = (state, value) => {
  let diff = state.A + (value ^ 0xFF) + 1;
  const diffByte = (diff & 0xFF);
  setCarry(state, diff > 0xFF);
  setZero(state, diffByte);
  setNegative(state, diffByte);
}

export const registerCMP = (opcodeHandlers) => {

  opcodeHandlers[0xC9] = state => cmp(state, readValueImmediate(state, 2));
  opcodeHandlers[0xC5] = state => cmp(state, readValueZeroPage(state, 3));
  opcodeHandlers[0xD5] = state => cmp(state, readValueZeroPageX(state, 4));
  opcodeHandlers[0xCD] = state => cmp(state, readValueAbsolute(state, 4));
  opcodeHandlers[0xDD] = state => cmp(state, readValueAbsoluteXWithPageBoundaryCycle(state, 4));
  opcodeHandlers[0xD9] = state => cmp(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4));
  opcodeHandlers[0xC1] = state => cmp(state, readValueIndirectX(state, 6));
  opcodeHandlers[0xD1] = state => cmp(state, readValueIndirectYWithPageBoundaryCycle(state, 5));
}
