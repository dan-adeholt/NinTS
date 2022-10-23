/**
 *  Load instructions - load value from memory into registers.
 */
import { readByte } from '../memory';
import { setA, setAX, Setter, setX, setY, setZeroNegative } from './util';
import EmulatorState from '../EmulatorState';

const ld = (state : EmulatorState, address: number, setter : Setter) => setZeroNegative(state, setter(state, readByte(state, address)));

export const lax = (state : EmulatorState, address: number) => ld(state, address, setAX)
export const lda = (state : EmulatorState, address: number) => ld(state, address, setA)
export const ldx = (state : EmulatorState, address: number) => ld(state, address, setX)
export const ldy = (state : EmulatorState, address: number) => ld(state, address, setY)
