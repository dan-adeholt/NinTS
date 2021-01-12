import {
  BIT_7,
  readAddressAbsolute,
  readAddressZeroPage, readAddressZeroPageX, P_REG_CARRY,
  setCarry,
  setNegative,
  setZero, readAddressAbsoluteX
} from './utils';
import { readMem, setMem } from '../emulator';

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
  const value = readMem(state, address);
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, (value & BIT_7) >> 7);
  const newValue = ((value << 1) & 0xFF) | oldCarry;
  setMem(state, address, newValue);
  setZero(state, newValue);
  setNegative(state, newValue);
  return newValue;
}

export const registerROL = opcodeHandlers => {
  opcodeHandlers[0x2A] = state => rolA(state);
  opcodeHandlers[0x26] = state => rol(state, readAddressZeroPage(state, 5));
  opcodeHandlers[0x36] = state => rol(state, readAddressZeroPageX(state, 6));
  opcodeHandlers[0x2E] = state => rol(state, readAddressAbsolute(state, 6));
  opcodeHandlers[0x3E] = state => rol(state, readAddressAbsoluteX(state, 7));
}
