/**
 * NOP instructions
 */
import { readByte } from '../memory';
import EmulatorState from '../EmulatorState';

export const nop = (state : EmulatorState) => state.dummyReadTick()

export const unofficialNop = (state : EmulatorState, address: number) => readByte(state, address)

