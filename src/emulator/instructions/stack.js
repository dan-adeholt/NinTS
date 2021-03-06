import { P_MASK_BREAK, P_REG_BREAK, setAlwaysOne, setBreak, setInterrupt, setZeroNegative } from './util';
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
  state.P = popStack(state);
  setBreak(state, false); // See http://wiki.nesdev.com/w/index.php/Status_flags
  setAlwaysOne(state);
};

export const pha = state => {
  tick(state);
  pushStack(state, state.A);
};

export const php = state => {
  tick(state);
  pushStack(state, state.P | P_REG_BREAK);
}

export const rti = state => {
  tick(state);
  tick(state);
  state.P = popStack(state);
  setBreak(state, false); // See http://wiki.nesdev.com/w/index.php/Status_flags
  setAlwaysOne(state);
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
  pushStack(state, state.P | P_REG_BREAK);
  setInterrupt(state, true);
  state.PC = readWord(state, 0xFFFE);
}

export const nmi = state => {
  tick(state);
  tick(state);
  pushStackWord(state, state.PC);
  pushStack(state, state.P & P_MASK_BREAK);
  state.PC = readWord(state, 0xFFFA);
}
