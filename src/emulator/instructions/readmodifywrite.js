/**
 *  Read-Modify-Write operations
 */
import { BIT_7, BIT_7_MASK, P_REG_CARRY, setCarry, setZeroNegative } from './util';
import { readByte, writeByte } from '../memory';
import { performADC, performAND } from './arithmetic';
import { tick } from '../emulator';

const performRMWA = (state, value) => {
  setZeroNegative(state, value);
  tick(state);
  state.A = value;
}

const performRMW = (state, address, value) => {
  setZeroNegative(state, value);
  tick(state);
  return writeByte(state, address, value);
}

const performLSR = (state, value) => {
  setCarry(state, value & 0x1);
  return value >> 1;
}

const performROL = (state, value) => {
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, (value & BIT_7) >> 7);
  return ((value << 1) & 0xFF) | oldCarry;
}

const performINC = (state, value) => (value + 1) & 0xFF;
const performDEC = (state, value) => (value - 1) & 0xFF;

const performROR = (state, value) => {
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, value & 0x1);
  return ((value >> 1) & BIT_7_MASK) | (oldCarry << 7);
}

const performASL = (state, value) => {
  setCarry(state, value & BIT_7); // Copy last bit to carry flag
  return (value << 1) & 0xFF;
}

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

// RLA - Illegal instruction. ROL value at address and then AND with result.
export const rla = (state, address) => performAND(state, rol(state, address));

// RRA (illegal instruction) - Perform ROR and then ADC the result
export const rra = (state, address) => performADC(state, ror(state, address));

// ASR (illegal instruction) - AND byte with accumulator then shift bits right one bit in accumulator.
export const asr = (state, address) => performRMWA(state, performLSR(state, performAND(state, readByte(state, address))));

