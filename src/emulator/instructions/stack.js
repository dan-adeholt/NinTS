import {
  P_MASK_DISCARD_AFTER_PULL,
  P_REG_ALWAYS_1,
  P_REG_BREAK,
  setInterrupt,
  setZeroNegative
} from './util';
import { popStack, pushStack, pushStackWord, readWord } from '../memory';
import { tick } from '../emulator';

/**
 * Stack functions
 */

export const pla = state => {
  tick(state);
  tick(state);
  state.A = popStack(state);
  setZeroNegative(state, state.A);
}

export const plp = state => {
  tick(state);
  tick(state);
  state.P = popStack(state) & P_MASK_DISCARD_AFTER_PULL;
};

export const pha = state => {
  tick(state);
  pushStack(state, state.A);
};

export const php = state => {
  tick(state);
  pushStack(state, state.P | P_REG_BREAK | P_REG_ALWAYS_1);
}

export const rti = state => {
  tick(state);
  tick(state);
  state.P = popStack(state) & P_MASK_DISCARD_AFTER_PULL;
  const low = popStack(state);
  const high = popStack(state);
  state.PC = (low | (high << 8));
}

export const rts = state => {
  tick(state);
  tick(state);
  const low = popStack(state);
  const high = popStack(state);
  tick(state);
  state.PC = (low | (high << 8)) + 1;
}

export const brk = state => {
  tick(state);
  pushStackWord(state, state.PC + 1);
  pushStack(state, state.P | P_REG_BREAK | P_REG_ALWAYS_1);
  setInterrupt(state, true);
  state.PC = readWord(state, 0xFFFE);
}

export const nmi = state => {
  tick(state);
  tick(state);
  pushStackWord(state, state.PC);
  pushStack(state, state.P | P_REG_ALWAYS_1);
  state.PC = readWord(state, 0xFFFA);
}
