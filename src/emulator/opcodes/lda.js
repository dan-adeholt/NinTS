import {
  readValueAbsolute, readValueAbsoluteXWithPageBoundaryCycle,
  readValueAbsoluteYWithPageBoundaryCycle,
  readValueImmediate, readValueIndirectX, readValueIndirectYWithPageBoundaryCycle,
  readValueZeroPage,
  readValueZeroPageX,
  setNegative,
  setZero
} from './utils';

const lda = (state, value) => {
  state.A = value;
  setZero(state, value);
  setNegative(state, value);
};

export const registerLDA = opcodeHandlers => {
  opcodeHandlers[0xA9] = state => lda(state, readValueImmediate(state, 2));
  opcodeHandlers[0xA5] = state => lda(state, readValueZeroPage(state, 3));
  opcodeHandlers[0xB5] = state => lda(state, readValueZeroPageX(state, 4));
  opcodeHandlers[0xAD] = state => lda(state, readValueAbsolute(state, 4));
  opcodeHandlers[0xBD] = state => lda(state, readValueAbsoluteXWithPageBoundaryCycle(state, 4));
  opcodeHandlers[0xB9] = state => lda(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4));
  opcodeHandlers[0xA1] = state => lda(state, readValueIndirectX(state, 6));
  opcodeHandlers[0xB1] = state => lda(state, readValueIndirectYWithPageBoundaryCycle(state, 5));
}
