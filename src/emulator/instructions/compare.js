/**
 * Compare instructions
 */
import { setCarry, setZeroNegative } from './util';
import { readByte } from '../memory';

export const performCompare = (state, value, register) => {
  const diff = register + (value ^ 0xFF) + 1;
  setCarry(state, diff > 0xFF);
  setZeroNegative(state, diff & 0xFF);
}

export const cmp = (state, address) => performCompare(state, readByte(state, address), state.A)
export const cpx = (state, address) => performCompare(state, readByte(state, address), state.X)
export const cpy = (state, address) => performCompare(state, readByte(state, address), state.Y)

