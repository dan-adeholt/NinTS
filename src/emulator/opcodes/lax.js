import {
  readAbsolute4Cycles,
  readAbsoluteY4PlusCycles, readIndirectX6Cycles, readIndirectY5PlusCycles,
  readZeroPage3Cycles,
  readZeroPageY4Cycles,
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
  opcodeHandlers[0xA7] = state => lax(state, readZeroPage3Cycles(state));
  opcodeHandlers[0xB7] = state => lax(state, readZeroPageY4Cycles(state));
  opcodeHandlers[0xAF] = state => lax(state, readAbsolute4Cycles(state))
  opcodeHandlers[0xBF] = state => lax(state, readAbsoluteY4PlusCycles(state))
  opcodeHandlers[0xA3] = state => lax(state, readIndirectX6Cycles(state))
  opcodeHandlers[0xB3] = state => lax(state, readIndirectY5PlusCycles(state))
}
