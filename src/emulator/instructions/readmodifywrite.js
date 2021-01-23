/**
 *  Read-Modify-Write operations
 */
import { BIT_7, BIT_7_MASK, P_REG_CARRY, setCarry, setZeroNegative } from './util';
import { readByte, writeByte } from '../memory';
import { performADC, performAND } from './arithmetic';

export const performLSR = (state, value) => {
  setCarry(state, value & 0x1);
  const newValue = value >> 1;
  setZeroNegative(state, newValue);
  return newValue;
}

const performROL = (state, value) => {
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, (value & BIT_7) >> 7);
  const newValue = ((value << 1) & 0xFF) | oldCarry
  setZeroNegative(state, newValue);
  return newValue;
}

const performINC = (state, value) => {
  const newValue = (value + 1) & 0xFF;
  setZeroNegative(state, newValue);
  return newValue;
}

const performDEC = (state, value) => {
  const newValue = (value - 1) & 0xFF;
  setZeroNegative(state, newValue);
  return newValue;
}

const performROR = (state, value) => {
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, value & 0x1);
  const newValue = ((value >> 1) & BIT_7_MASK) | (oldCarry << 7);
  setZeroNegative(state, newValue);
  return newValue;
}

const performASL = (state, value) => {
  setCarry(state, value & BIT_7); // Copy last bit to carry flag
  const newValue = (value << 1) & 0xFF;
  setZeroNegative(state, newValue);
  return newValue;
}

const rmwA = (state, value) => {
  state.CYC++;
  state.A = value;
}

const rmw = (state, address, value) => {
  state.CYC++;
  return writeByte(state, address, value);
}

export const aslA = (state) => rmwA(state, performASL(state, state.A))
export const lsrA = (state) => rmwA(state, performLSR(state, state.A))
export const rolA = (state) => rmwA(state, performROL(state, state.A))
export const rorA = (state) => rmwA(state, performROR(state, state.A))

export const asl = (state, address) => rmw(state, address, performASL(state, readByte(state, address)));
export const lsr = (state, address) => rmw(state, address, performLSR(state, readByte(state, address)));
export const rol = (state, address) => rmw(state, address, performROL(state, readByte(state, address)));
export const ror = (state, address) => rmw(state, address, performROR(state, readByte(state, address)));
export const inc = (state, address) => rmw(state, address, performINC(state, readByte(state, address)));
export const dec = (state, address) => rmw(state, address, performDEC(state, readByte(state, address)));


// RLA - Illegal instruction. ROL value at address and then AND with result.
export const rla = (state, address) => performAND(state, rol(state, address));

// RRA (illegal instruction) - Perform ROR and then ADC the result
export const rra = (state, address) => performADC(state, ror(state, address));

// ASR (illegal instruction) - AND byte with accumulator then shift bits right one bit in accumulator.
export const asr = (state, address) => state.A = performLSR(state, performAND(state, readByte(state, address)));
