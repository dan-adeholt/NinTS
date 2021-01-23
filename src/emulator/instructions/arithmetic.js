/**
 * Arithmetic and bitwise operations
 */
import {
  BIT_7_MASK,
  isNegative,
  P_MASK_OVERFLOW_AND_NEGATIVE,
  P_REG_CARRY,
  P_REGS_OVERFLOW_AND_NEGATIVE,
  setCarry,
  setOverflow, setOverflowValue, setZero, setZeroNegative
} from './util';

import { readByte, writeByte } from '../memory';
import { asl } from './readmodifywrite';
import { tick } from '../emulator';

export const bit = (state, address) => {
  const value = readByte(state, address);
  setZero(state, value & state.A);
  const upperBits = value & P_REGS_OVERFLOW_AND_NEGATIVE;
  const lowerBits = state.P & P_MASK_OVERFLOW_AND_NEGATIVE;
  state.P = upperBits | lowerBits;
}

export const performADC = (state, value) => {
  const result = state.A + value + (state.P & P_REG_CARRY);
  const resultByte = (result & 0xFF);

  setOverflow(state, state.A, value, resultByte);
  state.A = resultByte;
  setCarry(state, result > 0xFF);
  setZeroNegative(state, state.A);
}

export const performEOR = (state, value) => setZeroNegative(state, state.A ^= value);
const performSBC = (state, value) => performADC(state, value ^ 0xFF)
const performORA = (state, value) => setZeroNegative(state, state.A |= value)
export const performAND = (state, value) => setZeroNegative(state, state.A &= value);

export const eor = (state, address) => performEOR(state, readByte(state, address))
export const ora = (state, address) => performORA(state, readByte(state, address));
export const adc = (state, address) => performADC(state, readByte(state, address))
export const sbc = (state, address) => performSBC(state, readByte(state, address));
export const and = (state, address) => performAND(state, readByte(state, address));
export const slo = (state, address) => performORA(state, asl(state, address));

// Illegal instruction. AND:s byte with accumulator. If the result is negative then carry is set.
export const aac = (state, address) => {
  state.A &= readByte(state, address);
  setZeroNegative(state, state.A);
  setCarry(state, isNegative(state.A));
};

// ARR - Illegal instruction - AND:s byte with accumulator, then rotates one bit right in accumulator and updates C/V based on bits 5 and 6.
export const arr = (state, address) => {
  const oldCarry = state.P & P_REG_CARRY;
  const result = state.A & readByte(state, address);
  state.A = ((result >> 1) & BIT_7_MASK) | (oldCarry << 7);
  setZeroNegative(state, state.A);
  const bit5 = (state.A & 0b00100000) >> 5;
  const bit6 = (state.A & 0b01000000) >> 6;
  setCarry(state, bit6);
  setOverflowValue(state, bit5 ^ bit6);
}

// ISB - Illegal instruction
export const isb = (state, address) => {
  let value = (readByte(state, address) + 1) & 0xFF;
  tick(state);
  writeByte(state, address, value);
  performSBC(state, value);
}


// ATX - illegal instruction. Some sites claims this instruction AND:s the value in A before copying it to A and X.
// However, blarggs instruction tests simply set the values. We match that behavior.
export const atx = (state, address) => {
  state.A = state.X = readByte(state, address);
  setZeroNegative(state, state.A);
};

// AXS - illegal instruction. AND:s X register with the accumulator and stores result in X register, then
// subtracts read byte from memory from the X register - without borrow.
export const axs = (state, address) => {
  const value = readByte(state, address);
  let andResult = state.A & state.X;
  const result = andResult + (value ^ 0xFF) + 1;
  state.X = result & 0xFF;
  setCarry(state, result > 0xFF);
  setZeroNegative(state, state.X);
};
