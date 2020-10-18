import { readAbsolute4Cycles, readAbsoluteY4PlusCycles, readImmediate2Cycles, readZeroPage3Cycles, readZeroPageY4Cycles, setNegative, setZero } from './utils';

const ldx = (state, value) => {
  state.X = value;
  setZero(state, value);
  setNegative(state, value);
};

export const registerLDX = opcodeHandlers => {
  opcodeHandlers[0xA2] = state => ldx(state, readImmediate2Cycles(state));
  opcodeHandlers[0xA6] = state => ldx(state, readZeroPage3Cycles(state)) ;
  opcodeHandlers[0xB6] = state => ldx(state, readZeroPageY4Cycles(state));
  opcodeHandlers[0xAE] = state => ldx(state, readAbsolute4Cycles(state));
  opcodeHandlers[0xBE] = state => ldx(state, readAbsoluteY4PlusCycles(state));
}
