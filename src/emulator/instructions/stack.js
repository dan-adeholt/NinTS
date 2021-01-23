import { P_REG_BREAK, setAlwaysOne, setBreak, setInterrupt, setZeroNegative } from './util';
import { popStack, pushStack, pushStackWord, readWord } from '../memory';

/**
 * Stack functions
 */

export const pla = state => {
  state.CYC++;
  state.CYC++;
  state.A = popStack(state);
  setZeroNegative(state, state.A);
}

export const plp = state => {
  state.CYC++;
  state.CYC++;
  state.P = popStack(state);
  setBreak(state, false); // See http://wiki.nesdev.com/w/index.php/Status_flags
  setAlwaysOne(state);
};

export const pha = state => {
  state.CYC++;
  pushStack(state, state.A);
};

export const php = state => {
  state.CYC++;
  pushStack(state, state.P | P_REG_BREAK);
}

export const rti = state => {
  state.CYC++;
  state.CYC++;
  state.P = popStack(state);
  setBreak(state, false); // See http://wiki.nesdev.com/w/index.php/Status_flags
  setAlwaysOne(state);
  const low = popStack(state);
  const high = popStack(state);
  state.PC = (low | (high << 8));
}

export const rts = state => {
  state.CYC++;
  state.CYC++;
  const low = popStack(state);
  const high = popStack(state);
  state.CYC++;
  state.PC = (low | (high << 8)) + 1;
}

export const brk = state => {
  state.CYC++;
  pushStackWord(state, state.PC + 1);
  pushStack(state, state.P | P_REG_BREAK);
  setInterrupt(state, true);
  state.PC = readWord(state, 0xFFFE);
}
