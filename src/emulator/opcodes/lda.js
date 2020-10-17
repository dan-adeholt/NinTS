import {
  readAbsolute, readAbsoluteX,
  readAbsoluteY,
  readImmediate, readIndirectX, readIndirectY,
  readZeroPage,
  readZeroPageX,
  setNegative,
  setZero
} from './utils';

export const registerLDA = opcodeHandlers => {
  const lda = (state, value) => {
    state.A = value;
    setZero(state, value);
    setNegative(state, value);
  };

  opcodeHandlers[0xA9] = state => lda(state, readImmediate(state));
  opcodeHandlers[0xA5] = state => lda(state, readZeroPage(state));
  opcodeHandlers[0xB5] = state => lda(state, readZeroPageX(state));
  opcodeHandlers[0xAD] = state => lda(state, readAbsolute(state));
  opcodeHandlers[0xBD] = state => lda(state, readAbsoluteX(state));
  opcodeHandlers[0xB9] = state => lda(state, readAbsoluteY(state));
  opcodeHandlers[0xA1] = state => lda(state, readIndirectX(state));
  opcodeHandlers[0xB1] = state => lda(state, readIndirectY(state));
}
