import {
  readValueAbsolute,
  readValueAbsoluteXWithPageBoundaryCycle,
  readValueImmediate,
  readValueZeroPage, readValueZeroPageX,
  setNegative,
  setZero
} from './utils';

const ldy = (state, value) => {
  state.Y = value;
  setZero(state, value);
  setNegative(state, value);
};

export const registerLDY = opcodeHandlers => {
  opcodeHandlers[0xA0] = state => ldy(state, readValueImmediate(state, 2));
  opcodeHandlers[0xA4] = state => ldy(state, readValueZeroPage(state, 3)) ;
  opcodeHandlers[0xB4] = state => ldy(state, readValueZeroPageX(state, 4));
  opcodeHandlers[0xAC] = state => ldy(state, readValueAbsolute(state, 4));
  opcodeHandlers[0xBC] = state => ldy(state, readValueAbsoluteXWithPageBoundaryCycle(state, 4));
}
