import { readAbsolute, readAbsoluteY, readImmediate, readZeroPage, readZeroPageY, setNegative, setZero } from './utils';

export const registerLDX = opcodeHandlers => {
  const ldx = (state, value) => {
    state.X = value;
    setZero(state, value);
    setNegative(state, value);
  };

  opcodeHandlers[0xA2] = state => ldx(state, readImmediate(state));
  opcodeHandlers[0xA6] = state => ldx(state, readZeroPage(state)) ;
  opcodeHandlers[0xB6] = state => ldx(state, readZeroPageY(state));
  opcodeHandlers[0xAE] = state => ldx(state, readAbsolute(state));
  opcodeHandlers[0xBE] = state => ldx(state, readAbsoluteY(state));
}
