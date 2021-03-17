/**
 * Jump instructions
 */
import { pushStackWord, readByte } from '../memory';
import { tick } from '../emulator';

export const jmp = (state, address) => state.PC = address

export const jsr = state => {
  const low = readByte(state, state.PC);
  tick(state);

  const jumpBackAddress = state.PC + 1; // Next instruction - 1

  pushStackWord(state, jumpBackAddress);
  const high = readByte(state, jumpBackAddress);
  state.PC = low + (high << 8);
}