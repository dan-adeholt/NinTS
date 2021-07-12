/**
 * Flag (Processor Status) Instructions
 */

import {
  P_MASK_CARRY,
  P_MASK_DECIMAL,
  P_MASK_INTERRUPT,
  P_MASK_OVERFLOW, P_REG_CARRY, P_REG_DECIMAL, P_REG_INTERRUPT
} from './util';
import { endReadTick, startReadTick } from '../emulator';

const setFlags = (state, p) => {
  startReadTick(state);
  state.P = p;
  endReadTick(state);
}

export const clc = state => setFlags(state, state.P & P_MASK_CARRY);
export const cld = state => setFlags(state, state.P & P_MASK_DECIMAL);
export const cli = state => setFlags(state, state.P & P_MASK_INTERRUPT);
export const clv = state => setFlags(state, state.P & P_MASK_OVERFLOW)
export const sed = state => setFlags(state, state.P | P_REG_DECIMAL);
export const sei = state => setFlags(state, state.P | P_REG_INTERRUPT);
export const sec = state => setFlags(state, state.P | P_REG_CARRY);
