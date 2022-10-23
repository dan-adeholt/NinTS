/**
 * Flag (Processor Status) Instructions
 */

import {
  P_MASK_CARRY,
  P_MASK_DECIMAL,
  P_MASK_INTERRUPT,
  P_MASK_OVERFLOW, P_REG_CARRY, P_REG_DECIMAL, P_REG_INTERRUPT
} from './util';
import EmulatorState from '../EmulatorState';

const setFlags = (state : EmulatorState, p : number) => {
  state.startReadTick();
  state.P = p;
  state.endReadTick();
}

export const clc = (state : EmulatorState) => setFlags(state, state.P & P_MASK_CARRY);
export const cld = (state : EmulatorState) => setFlags(state, state.P & P_MASK_DECIMAL);
export const cli = (state : EmulatorState) => setFlags(state, state.P & P_MASK_INTERRUPT);
export const clv = (state : EmulatorState) => setFlags(state, state.P & P_MASK_OVERFLOW)
export const sed = (state : EmulatorState) => setFlags(state, state.P | P_REG_DECIMAL);
export const sei = (state : EmulatorState) => setFlags(state, state.P | P_REG_INTERRUPT);
export const sec = (state : EmulatorState) => setFlags(state, state.P | P_REG_CARRY);
