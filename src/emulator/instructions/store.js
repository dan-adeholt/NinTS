/**
 * Store related functions
 */
import { writeByte } from '../memory';

export const sta = (state, address) => writeByte(state, address, state.A)
export const stx = (state, address) => writeByte(state, address, state.X)
export const sty = (state, address) => writeByte(state, address, state.Y)
