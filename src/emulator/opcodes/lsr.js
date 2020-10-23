import {
  readAddressAbsolute, readAddressAbsoluteX,
  readAddressZeroPage, readAddressZeroPageX,
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

export const lsr = (state, address) => {
  const value = state.readMem(address);
  setCarry(state, value & 0x1);
  const newValue = value >> 1;
  state.setMem(address, newValue);
  setZero(state, newValue);
  setNegative(state, newValue);
  return newValue;
}

export const registerLSR = opcodeHandlers => {
  opcodeHandlers[0x4A] = state => lsrA(state);
  opcodeHandlers[0x46] = state => lsr(state, readAddressZeroPage(state, 5));
  opcodeHandlers[0x56] = state => lsr(state, readAddressZeroPageX(state, 6));
  opcodeHandlers[0x4E] = state => lsr(state, readAddressAbsolute(state, 6));
  opcodeHandlers[0x5E] = state => lsr(state, readAddressAbsoluteX(state, 7));
}
