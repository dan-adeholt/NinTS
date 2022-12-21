/**
 *  Read-Modify-Write operations
 */
import { BIT_7, BIT_7_MASK, P_REG_CARRY, setCarry, setZeroNegative } from './util';
import { readByte, writeByte } from '../memory';
import EmulatorState from '../EmulatorState';

export const performRMWA = (state : EmulatorState, value: number) => {
  state.startWriteTick();
  setZeroNegative(state, value);
  state.A = value;
  state.endWriteTick();
}

const performRMW = (state : EmulatorState, address: number, originalValue: number, value: number) => {
  // RMW instructions first writes the original value, applies the operation, and then writes
  // the actual value
  writeByte(state, address, originalValue);
  setZeroNegative(state, value);
  return writeByte(state, address, value);
}

const performASL = (state : EmulatorState, value: number) => {
  setCarry(state, value & BIT_7); // Copy last bit to carry flag
  return (value << 1) & 0xFF;
}

export const performLSR = (state : EmulatorState, value: number) => {
  setCarry(state, value & 0x1);
  return value >> 1;
}

const performROL = (state : EmulatorState, value: number) => {
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, (value & BIT_7) >> 7);
  return ((value << 1) & 0xFF) | oldCarry;
}

const performROR = (state : EmulatorState, value: number) => {
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, value & 0x1);
  return ((value >> 1) & BIT_7_MASK) | (oldCarry << 7);
}

const performINC = (state : EmulatorState, value: number) => (value + 1) & 0xFF;
const performDEC = (state : EmulatorState, value: number) => (value - 1) & 0xFF;

export const aslA = (state : EmulatorState) => performRMWA(state, performASL(state, state.A))
export const lsrA = (state : EmulatorState) => performRMWA(state, performLSR(state, state.A))
export const rolA = (state : EmulatorState) => performRMWA(state, performROL(state, state.A))
export const rorA = (state : EmulatorState) => performRMWA(state, performROR(state, state.A))

export const asl = (state : EmulatorState, address: number) => {
  const value = readByte(state, address)
  return performRMW(state, address, value, performASL(state, value));
}

export const lsr = (state : EmulatorState, address: number) => {
  const value = readByte(state, address);
  return performRMW(state, address, value, performLSR(state, value));
}

export const rol = (state : EmulatorState, address: number) => {
  const value = readByte(state, address);
  return performRMW(state, address, value, performROL(state, value));
}

export const ror = (state : EmulatorState, address: number) => {
  const value = readByte(state, address);
  return performRMW(state, address, value, performROR(state, value));
}

export const inc = (state : EmulatorState, address: number) => {
  const value = readByte(state, address);
  return performRMW(state, address, value, performINC(state, value));
}

export const dec = (state : EmulatorState, address: number) => {
  const value = readByte(state, address);
  return performRMW(state, address, value, performDEC(state, value));
}
