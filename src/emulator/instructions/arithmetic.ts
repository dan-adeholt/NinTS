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
import EmulatorState from '../EmulatorState';

const updateAccumulator = (state : EmulatorState, value : number) => {
  state.A = value;
  setZeroNegative(state, state.A);
  return value;
}

export const performADC = (state : EmulatorState, value : number) => {
  const result = state.A + value + (state.P & P_REG_CARRY);
  const resultByte = (result & 0xFF);
  setOverflow(state, state.A, value, resultByte);
  setCarry(state, result > 0xFF);
  return updateAccumulator(state, resultByte);
}

export const performEOR = (state : EmulatorState, value : number) => updateAccumulator(state, state.A ^ value);
export const performORA = (state : EmulatorState, value : number) => updateAccumulator(state, state.A | value);
export const performAND = (state : EmulatorState, value : number) => updateAccumulator(state, state.A & value);
export const performSBC = (state : EmulatorState, value : number) => performADC(state, value ^ 0xFF)

export const eor = (state : EmulatorState, address: number) => performEOR(state, readByte(state, address))
export const ora = (state : EmulatorState, address: number) => performORA(state, readByte(state, address));
export const adc = (state : EmulatorState, address: number) => performADC(state, readByte(state, address))
export const sbc = (state : EmulatorState, address: number) => performSBC(state, readByte(state, address));
export const and = (state : EmulatorState, address: number) => performAND(state, readByte(state, address));

export const bit = (state : EmulatorState, address: number) => {
  const value = readByte(state, address);
  setZero(state, value & state.A);
  const upperBits = value & P_REGS_OVERFLOW_AND_NEGATIVE;
  const lowerBits = state.P & P_MASK_OVERFLOW_AND_NEGATIVE;
  state.P = upperBits | lowerBits;
}

