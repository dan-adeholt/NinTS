import {
  BIT_7,
  getAddressAbsolute, getAddressAbsoluteWithOffset,
  getAddressZeroPage, getAddressZeroPageX, P_REG_CARRY,
  setCarry,
  setNegative,
  setZero
} from './utils';
import { hex } from '../stateLogging';


const rolA = (state) => {
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, (state.A & BIT_7) >> 7);
  state.A = ((state.A << 1) & 0xFF) | oldCarry;
  setZero(state, state.A);
  setNegative(state, state.A);
  state.CYC += 2;
  state.PC += 1;
}

export const rol = (state, address) => {
  const value = state.readMem(address);
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, (state.A & BIT_7) >> 7);
  const newValue = ((value << 1) & 0xFF) | oldCarry;
  state.setMem(address, newValue);
  setZero(state, newValue);
  setNegative(state, newValue);
  return newValue;
}

export const registerROL = opcodeHandlers => {
  opcodeHandlers[0x2A] = state => rolA(state);
  opcodeHandlers[0x26] = state => rol(state, getAddressZeroPage(state, 5));
  opcodeHandlers[0x36] = state => rol(state, getAddressZeroPageX(state, 6));
  opcodeHandlers[0x2E] = state => rol(state, getAddressAbsolute(state, 6));
  opcodeHandlers[0x3E] = state => rol(state, getAddressAbsoluteWithOffset(state, state.X, 7));
}
