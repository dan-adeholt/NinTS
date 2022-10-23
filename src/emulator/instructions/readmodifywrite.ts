/**
 *  Read-Modify-Write operations
 */
import { BIT_7, BIT_7_MASK, P_REG_CARRY, setCarry, setZeroNegative } from './util';
import { readByte, writeByte } from '../memory';

export const performRMWA = (state, value) => {
  state.startReadTick();
  setZeroNegative(state, value);
  state.A = value;
  state.endReadTick();
}

const performRMW = (state, address, value) => {
  state.startReadTick();
  setZeroNegative(state, value);
  state.endReadTick();
  return writeByte(state, address, value);
}

const performASL = (state, value) => {
  setCarry(state, value & BIT_7); // Copy last bit to carry flag
  return (value << 1) & 0xFF;
}

export const performLSR = (state, value) => {
  setCarry(state, value & 0x1);
  return value >> 1;
}

const performROL = (state, value) => {
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, (value & BIT_7) >> 7);
  return ((value << 1) & 0xFF) | oldCarry;
}

const performROR = (state, value) => {
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, value & 0x1);
  return ((value >> 1) & BIT_7_MASK) | (oldCarry << 7);
}

const performINC = (state, value) => (value + 1) & 0xFF;
const performDEC = (state, value) => (value - 1) & 0xFF;

export const aslA = (state) => performRMWA(state, performASL(state, state.A))
export const lsrA = (state) => performRMWA(state, performLSR(state, state.A))
export const rolA = (state) => performRMWA(state, performROL(state, state.A))
export const rorA = (state) => performRMWA(state, performROR(state, state.A))

export const asl = (state, address) => performRMW(state, address, performASL(state, readByte(state, address)));
export const lsr = (state, address) => performRMW(state, address, performLSR(state, readByte(state, address)));
export const rol = (state, address) => performRMW(state, address, performROL(state, readByte(state, address)));
export const ror = (state, address) => performRMW(state, address, performROR(state, readByte(state, address)));
export const inc = (state, address) => performRMW(state, address, performINC(state, readByte(state, address)));
export const dec = (state, address) => performRMW(state, address, performDEC(state, readByte(state, address)));
