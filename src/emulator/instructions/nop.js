/**
 * NOP instructions
 */
import { readByte } from '../memory';
import { tick } from '../emulator';

export const nop = (state) => tick(state);
export const unofficialNop = (state, address) => readByte(state, address)

