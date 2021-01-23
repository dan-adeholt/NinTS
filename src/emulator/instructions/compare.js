/**
 * Compare instructions
 */
import { setCarry, setZeroNegative } from './util';
import { readByte } from '../memory';
import { dec } from './readmodifywrite';

const performCompare = (state, value, register) => {
  let diff = register + (value ^ 0xFF) + 1;
  setCarry(state, diff > 0xFF);
  setZeroNegative(state, diff & 0xFF);
}

export const cmp = (state, address) => performCompare(state, readByte(state, address), state.A)
export const cpx = (state, address) => performCompare(state, readByte(state, address), state.X)
export const cpy = (state, address) => performCompare(state, readByte(state, address), state.Y)

// DCP - illegal instruction. Decrement value at memory and then compare.
export const dcp = (state, address) => performCompare(state, dec(state, address), state.A);
