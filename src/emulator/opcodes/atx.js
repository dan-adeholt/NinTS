import {
  readValueImmediate,
  setNegative,
  setZero
} from './utils';

// Some sites claims this opcode AND:s the value in A before transferring it to A and X.
// However, blarggs instruction tests simply set the values. We match that behavior.
export const atx = (state, value) => {
  state.A = value;
  state.X = value;
  setZero(state, value);
  setNegative(state, value);
};

export const registerATX = opcodeHandlers => {
  opcodeHandlers[0xAB] = state => atx(state, readValueImmediate(state, 2));
}
