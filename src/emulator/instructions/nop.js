/**
 * NOP instructions
 */
import { readByte } from '../memory';

export const nop = (state) => state.CYC++;
export const unofficialNop = (state, address) => readByte(state, address)

