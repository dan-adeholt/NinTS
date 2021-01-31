/**
 * Arithmetic and bitwise operations
 */
import {
  P_MASK_OVERFLOW_AND_NEGATIVE,
  P_REG_CARRY,
  P_REGS_OVERFLOW_AND_NEGATIVE,
  setCarry,
  setOverflow, setZero, setZeroNegative
} from './util';

import { readByte } from '../memory';

const updateAccumulator = (state, value) => {
  state.A = value;
  setZeroNegative(state, state.A);
  return value;
}

export const performADC = (state, value) => {
  const result = state.A + value + (state.P & P_REG_CARRY);
  const resultByte = (result & 0xFF);
  setOverflow(state, state.A, value, resultByte);
  setCarry(state, result > 0xFF);
  return updateAccumulator(state, resultByte);
}

export const performEOR = (state, value) => updateAccumulator(state, state.A ^ value);
export const performORA = (state, value) => updateAccumulator(state, state.A | value);
export const performAND = (state, value) => updateAccumulator(state, state.A & value);
export const performSBC = (state, value) => performADC(state, value ^ 0xFF)

export const eor = (state, address) => performEOR(state, readByte(state, address))
export const ora = (state, address) => performORA(state, readByte(state, address));
export const adc = (state, address) => performADC(state, readByte(state, address))
export const sbc = (state, address) => performSBC(state, readByte(state, address));
export const and = (state, address) => performAND(state, readByte(state, address));

export const bit = (state, address) => {
  const value = readByte(state, address);
  setZero(state, value & state.A);
  const upperBits = value & P_REGS_OVERFLOW_AND_NEGATIVE;
  const lowerBits = state.P & P_MASK_OVERFLOW_AND_NEGATIVE;
  state.P = upperBits | lowerBits;
}

