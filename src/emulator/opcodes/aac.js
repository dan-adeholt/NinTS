import {
  isNegative,
  readValueImmediate, setCarry,
  setNegative,
  setZero
} from './utils';

export const aac = (state, value) => {
  const result = state.A & value;
  state.A = result;
  setZero(state, result);
  setNegative(state, result);
  setCarry(state, isNegative(result));
};

export const registerAAC = opcodeHandlers => {
  opcodeHandlers[0x0B] = state => aac(state, readValueImmediate(state, 2));
  opcodeHandlers[0x2B] = state => aac(state, readValueImmediate(state, 2));
}
