/**
 * Flag (Processor Status) Instructions
 */

import {
  P_MASK_CARRY,
  P_MASK_DECIMAL,
  P_MASK_INTERRUPT,
  P_MASK_OVERFLOW, setCarry,
  setDecimal,
  setInterrupt
} from './util';
import { tick } from '../emulator';

const writeFlag = (state, flagFunction, on) => {
  flagFunction(state, on);
  tick(state);
}

const clearFlag = (state, mask) => {
  state.P = state.P & mask;
  tick(state);
}

export const clc = state => clearFlag(state, P_MASK_CARRY);
export const cld = state => clearFlag(state, P_MASK_DECIMAL);
export const cli = state => clearFlag(state, P_MASK_INTERRUPT);
export const clv = state => clearFlag(state, P_MASK_OVERFLOW)
export const sed = state => writeFlag(state, setDecimal, true)
export const sei = state => writeFlag(state, setInterrupt, true)
export const sec = state => writeFlag(state, setCarry, true)
