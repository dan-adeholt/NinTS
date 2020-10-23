import { readValueAbsolute, readValueAbsoluteYWithPageBoundaryCycle, readValueImmediate, readValueZeroPage, readValueZeroPageY, setNegative, setZero } from './utils';

const ldx = (state, value) => {
  state.X = value;
  setZero(state, value);
  setNegative(state, value);
};

export const registerLDX = opcodeHandlers => {
  opcodeHandlers[0xA2] = state => ldx(state, readValueImmediate(state, 2));
  opcodeHandlers[0xA6] = state => ldx(state, readValueZeroPage(state, 3)) ;
  opcodeHandlers[0xB6] = state => ldx(state, readValueZeroPageY(state, 4));
  opcodeHandlers[0xAE] = state => ldx(state, readValueAbsolute(state, 4));
  opcodeHandlers[0xBE] = state => ldx(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4));
}
