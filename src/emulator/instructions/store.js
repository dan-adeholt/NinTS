/**
 * Store related functions
 */
import { onSamePageBoundary, readWord, writeByte } from '../memory';
import { performEOR } from './arithmetic';
import { lsr } from './readmodifywrite';
import { tick } from '../emulator';

export const sta = (state, address) => writeByte(state, address, state.A)
export const stx = (state, address) => writeByte(state, address, state.X)
export const sty = (state, address) => writeByte(state, address, state.Y)

// Used for illegal instruction SXA and SYA. Making the write only if base and address is on same page
// is the way to make blargg tests pass.
const s_a = (state, offset, register) => {
  const base = readWord(state, state.PC);
  const address = (base + offset) & 0xFFFF;

  if (onSamePageBoundary(base, address)) {
    let hi = (address & 0xFF00) >> 8;
    hi = (hi + 1) & 0xFF;
    writeByte(state, address, register & hi);
  } else {
    tick(state);
  }

  state.PC += 2;
}

export const sxa = state => s_a(state, state.Y, state.X)
export const sya = state => s_a(state, state.X, state.Y)

// Illegal instruction. AND X and A and store to memory
export const sax = (state, address) => writeByte(state, address, state.X & state.A);
// Illegal instruction. LSR value at address and then EOR result.
export const sre = (state, address) => performEOR(state, lsr(state, address));
