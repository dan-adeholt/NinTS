/**
 * Jump instructions
 */
import { pushStackWord, readByte } from '../memory';
import EmulatorState from '../EmulatorState';

export const jmp = (state : EmulatorState, address: number) => state.PC = address

export const jsr = (state : EmulatorState) => {
  const low = readByte(state, state.PC);
  state.dummyReadTick();

  const jumpBackAddress = state.PC + 1; // Next instruction - 1

  pushStackWord(state, jumpBackAddress);
  const high = readByte(state, jumpBackAddress);
  state.PC = low + (high << 8);
}
