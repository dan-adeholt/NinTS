/**
 * NOP instructions
 */
import { readByte } from '../memory';
import { dummyReadTick } from '../emulator';

export const nop = (state) => dummyReadTick(state)

export const unofficialNop = (state, address) => readByte(state, address)

