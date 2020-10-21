import {
  getAddressAbsolute, getAddressAbsoluteWithOffset,
  getAddressZeroPage, getAddressZeroPageX, P_REG_CARRY,
  setCarry,
  setNegative,
  setZero
} from './utils';

const BIT_7 = 1 << 7;
const BIT_7_MASK = ~BIT_7;

const rorA = (state) => {
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, state.A & 0x1);
  state.A = ((state.A >> 1) & BIT_7_MASK) | (oldCarry << 7);
  setZero(state, state.A);
  setNegative(state, state.A);
  state.CYC += 2;
  state.PC += 1;
}

const ror = (state, address) => {
  const value = state.readMem(address);
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, value & 0x1);
  const newValue = ((value >> 1) & BIT_7_MASK) | (oldCarry << 7);
  state.setMem(address, newValue);
  setZero(state, newValue);
  setNegative(state, newValue);
}

export const registerROR = opcodeHandlers => {
  opcodeHandlers[0x6A] = state => rorA(state);
  opcodeHandlers[0x66] = state => ror(state, getAddressZeroPage(state, 5));
  opcodeHandlers[0x76] = state => ror(state, getAddressZeroPageX(state, 6));
  opcodeHandlers[0x6E] = state => ror(state, getAddressAbsolute(state, 6));
  opcodeHandlers[0x7E] = state => ror(state, getAddressAbsoluteWithOffset(state, state.X, 7));
}
