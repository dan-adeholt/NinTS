import {
  P_REG_CARRY,
  readValueImmediate, setCarry,
  setNegative, setOverflow,
  setZero
} from './utils';

export const axs = (state, value) => {
  let andResult = state.A & state.X;
  const result = andResult + (value ^ 0xFF) + 1;
  const resultByte = (result & 0xFF);
  state.X = result;
  setCarry(state, result > 0xFF);
  setZero(state, resultByte);
  setNegative(state, resultByte);
};

export const registerAXS = opcodeHandlers => {
  opcodeHandlers[0xCB] = state => axs(state, readValueImmediate(state, 2));
}
