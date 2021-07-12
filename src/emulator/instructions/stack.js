import {
  P_MASK_DISCARD_AFTER_PULL,
  P_REG_ALWAYS_1,
  P_REG_BREAK,
  setInterrupt,
  setZeroNegative
} from './util';
import { popStack, pushStack, pushStackWord, readWord } from '../memory';
import { dummyReadTick } from '../emulator';

/**
 * Stack functions
 */

export const pla = state => {
  dummyReadTick(state);
  dummyReadTick(state);
  state.A = popStack(state);
  setZeroNegative(state, state.A);
}

export const plp = state => {
  dummyReadTick(state);
  dummyReadTick(state);
  state.P = popStack(state) & P_MASK_DISCARD_AFTER_PULL;
};

export const pha = state => {
  dummyReadTick(state);
  pushStack(state, state.A);
};

export const php = state => {
  dummyReadTick(state);
  pushStack(state, state.P | P_REG_BREAK | P_REG_ALWAYS_1);
}

export const rti = state => {
  dummyReadTick(state);
  dummyReadTick(state);
  state.P = popStack(state) & P_MASK_DISCARD_AFTER_PULL;
  const low = popStack(state);
  const high = popStack(state);
  state.PC = (low | (high << 8));
}

export const rts = state => {
  dummyReadTick(state);
  dummyReadTick(state);
  const low = popStack(state);
  const high = popStack(state);
  dummyReadTick(state);
  state.PC = (low | (high << 8)) + 1;
}

export const brk = state => {
  dummyReadTick(state);
  pushStackWord(state, state.PC + 1);
  pushStack(state, state.P | P_REG_BREAK | P_REG_ALWAYS_1);
  setInterrupt(state, true);
  state.PC = readWord(state, 0xFFFE);
}

export const nmi = state => {
  dummyReadTick(state);
  dummyReadTick(state);
  pushStackWord(state, state.PC);
  pushStack(state, state.P | P_REG_ALWAYS_1);
  state.PC = readWord(state, 0xFFFA);
}
