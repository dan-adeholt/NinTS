import {
  readAbsolute4Cycles,
  readAbsoluteX4PlusCycles,
  readImmediate2Cycles,
  readZeroPage3Cycles, readZeroPageX4Cycles,
  setNegative,
  setZero
} from './utils';

export const registerLDY = opcodeHandlers => {
  const ldy = (state, value) => {
    state.Y = value;
    setZero(state, value);
    setNegative(state, value);
  };

  opcodeHandlers[0xA0] = state => ldy(state, readImmediate2Cycles(state));
  opcodeHandlers[0xA4] = state => ldy(state, readZeroPage3Cycles(state)) ;
  opcodeHandlers[0xB4] = state => ldy(state, readZeroPageX4Cycles(state));
  opcodeHandlers[0xAC] = state => ldy(state, readAbsolute4Cycles(state));
  opcodeHandlers[0xBC] = state => ldy(state, readAbsoluteX4PlusCycles(state));
}
