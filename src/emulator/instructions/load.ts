/**
 *  Load instructions - load value from memory into registers.
 */
import { readByte } from '../memory';
import { setA, setAX, setX, setY, setZeroNegative } from './util';

const ld = (state, address, setter) => setZeroNegative(state, setter(state, readByte(state, address)));

export const lax = (state, address) => ld(state, address, setAX)
export const lda = (state, address) => ld(state, address, setA)
export const ldx = (state, address) => ld(state, address, setX)
export const ldy = (state, address) => ld(state, address, setY)
