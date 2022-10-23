/**
 * Store related functions
 */
import { writeByte } from '../memory';
import EmulatorState from '../EmulatorState';

export const sta = (state : EmulatorState, address: number) => writeByte(state, address, state.A)
export const stx = (state : EmulatorState, address: number) => writeByte(state, address, state.X)
export const sty = (state : EmulatorState, address: number) => writeByte(state, address, state.Y)
