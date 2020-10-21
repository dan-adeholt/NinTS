import {
  getAddressAbsolute, getAddressAbsoluteWithOffset,
  getAddressZeroPage, getAddressZeroPageX,
  setCarry,
  setNegative,
  setZero
} from './utils';

const BIT_7 = 1 << 7;

const aslA = (state) => {
  setCarry(state, state.A & BIT_7);
  state.A = (state.A << 1) & 0xFF;
  setZero(state, state.A);
  setNegative(state, state.A);
  state.CYC += 2;
  state.PC += 1;
}

const asl = (state, address) => {
  const value = state.readMem(address);
  setCarry(state, value & BIT_7);
  const newValue = (value << 1) & 0xFF;
  state.setMem(address, newValue);
  setZero(state, newValue);
  setNegative(state, newValue);
}

export const registerASL = opcodeHandlers => {
  opcodeHandlers[0x0A] = state => aslA(state);
  opcodeHandlers[0x06] = state => asl(state, getAddressZeroPage(state, 5));
  opcodeHandlers[0x16] = state => asl(state, getAddressZeroPageX(state, 6));
  opcodeHandlers[0x0E] = state => asl(state, getAddressAbsolute(state, 6));
  opcodeHandlers[0x1E] = state => asl(state, getAddressAbsoluteWithOffset(state, state.X, 7));
}
