import {
  BIT_7_MASK,
  readAddressAbsolute,
  readAddressZeroPage, readAddressZeroPageX, P_REG_CARRY,
  setCarry,
  setNegative,
  setZero, readAddressAbsoluteX
} from './utils';

const rorA = (state) => {
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, state.A & 0x1);
  state.A = ((state.A >> 1) & BIT_7_MASK) | (oldCarry << 7);
  setZero(state, state.A);
  setNegative(state, state.A);
  state.CYC += 2;
  state.PC += 1;
}

export const ror = (state, address) => {
  const value = state.readMem(address);
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, value & 0x1);
  const newValue = ((value >> 1) & BIT_7_MASK) | (oldCarry << 7);
  state.setMem(address, newValue);
  setZero(state, newValue);
  setNegative(state, newValue);
  return newValue;
}

export const registerROR = opcodeHandlers => {
  opcodeHandlers[0x6A] = state => rorA(state);
  opcodeHandlers[0x66] = state => ror(state, readAddressZeroPage(state, 5));
  opcodeHandlers[0x76] = state => ror(state, readAddressZeroPageX(state, 6));
  opcodeHandlers[0x6E] = state => ror(state, readAddressAbsolute(state, 6));
  opcodeHandlers[0x7E] = state => ror(state, readAddressAbsoluteX(state, 7));
}
