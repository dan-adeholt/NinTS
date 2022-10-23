/**
 * Compare instructions
 */
import { setCarry, setZeroNegative } from './util';
import { readByte } from '../memory';
import EmulatorState from '../EmulatorState';

export const performCompare = (state : EmulatorState, value : number, register : number) => {
  const diff = register + (value ^ 0xFF) + 1;
  setCarry(state, diff > 0xFF);
  setZeroNegative(state, diff & 0xFF);
}

export const cmp = (state : EmulatorState, address: number) => performCompare(state, readByte(state, address), state.A)
export const cpx = (state : EmulatorState, address: number) => performCompare(state, readByte(state, address), state.X)
export const cpy = (state : EmulatorState, address: number) => performCompare(state, readByte(state, address), state.Y)

