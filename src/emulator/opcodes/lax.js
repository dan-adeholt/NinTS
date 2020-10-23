import {
  readValueAbsolute,
  readValueAbsoluteYWithPageBoundaryCycle, readValueIndirectX, readValueIndirectYWithPageBoundaryCycle,
  readValueZeroPage,
  readValueZeroPageY,
  setNegative,
  setZero
} from './utils';

const lax = (state, value) => {
  state.X = value;
  state.A = value;
  setNegative(state, value);
  setZero(state, value);
}

export const registerLAX = opcodeHandlers => {
  opcodeHandlers[0xA7] = state => lax(state, readValueZeroPage(state, 3));
  opcodeHandlers[0xB7] = state => lax(state, readValueZeroPageY(state, 4));
  opcodeHandlers[0xAF] = state => lax(state, readValueAbsolute(state, 4))
  opcodeHandlers[0xBF] = state => lax(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4))
  opcodeHandlers[0xA3] = state => lax(state, readValueIndirectX(state, 6))
  opcodeHandlers[0xB3] = state => lax(state, readValueIndirectYWithPageBoundaryCycle(state, 5))
}
