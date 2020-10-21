import {
  getAddressAbsolute, getAddressAbsoluteWithOffset,
  getAddressZeroPage, getAddressZeroPageX,
  setCarry,
  setNegative,
  setZero
} from './utils';

const lsrA = (state) => {
  setCarry(state, state.A & 0x1);
  state.A = (state.A >> 1);
  setZero(state, state.A);
  setNegative(state, state.A);
  state.CYC += 2;
  state.PC += 1;
}

const lsr = (state, address) => {
  const value = state.readMem(address);
  setCarry(state, value & 0x1);
  const newValue = value >> 1;
  state.setMem(address, newValue);
  setZero(state, newValue);
  setNegative(state, newValue);
}

export const registerLSR = opcodeHandlers => {
  opcodeHandlers[0x4A] = state => lsrA(state);
  opcodeHandlers[0x46] = state => lsr(state, getAddressZeroPage(state, 5));
  opcodeHandlers[0x56] = state => lsr(state, getAddressZeroPageX(state, 6));
  opcodeHandlers[0x4E] = state => lsr(state, getAddressAbsolute(state, 6));
  opcodeHandlers[0x5E] = state => lsr(state, getAddressAbsoluteWithOffset(state, state.X, 7));
}
