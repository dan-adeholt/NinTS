import {
  P_MASK_DISCARD_AFTER_PULL,
  P_REG_ALWAYS_1,
  P_REG_BREAK,
  setInterrupt,
  setZeroNegative
} from './util';
import { popStack, pushStack, pushStackWord, readByte, readWord } from '../memory';
import EmulatorState from '../EmulatorState';

/**
 * Stack functions
 */

export const pla = (state : EmulatorState) => {
  state.dummyReadTick();
  state.dummyReadTick();
  state.A = popStack(state);
  setZeroNegative(state, state.A);
}

export const plp = (state : EmulatorState) => {
  state.dummyReadTick();
  state.dummyReadTick();
  state.P = popStack(state) & P_MASK_DISCARD_AFTER_PULL;
};

export const pha = (state : EmulatorState) => {
  state.dummyReadTick();
  pushStack(state, state.A);
};

export const php = (state : EmulatorState) => {
  state.dummyReadTick();
  pushStack(state, state.P | P_REG_BREAK | P_REG_ALWAYS_1);
}

export const rti = (state : EmulatorState) => {
  readByte(state, state.PC);
  state.dummyReadTick();
  state.P = popStack(state) & P_MASK_DISCARD_AFTER_PULL;
  const low = popStack(state);
  const high = popStack(state);
  state.PC = (low | (high << 8));
}

export const rts = (state : EmulatorState) => {
  readByte(state, state.PC);
  state.dummyReadTick();
  const low = popStack(state);
  const high = popStack(state);
  state.dummyReadTick();
  state.PC = ((low | (high << 8)) + 1) & 0xFFFF;
}

export const brk = (state : EmulatorState) => {
  readByte(state, state.PC);
  pushStackWord(state, (state.PC + 1) & 0xFFFF);
  pushStack(state, state.P | P_REG_BREAK | P_REG_ALWAYS_1);
  setInterrupt(state, true);

  // NMI Hijacks BRK instruction:

  // "But the MOS 6502 and by extension the 2A03/2A07 has a quirk that can cause an interrupt to use the wrong vector if two different interrupts occur very close to one another.
  // For example, if NMI is asserted during the first four ticks of a BRK instruction, the BRK instruction will execute normally at first (PC increments will occur and the status word will be pushed with the B flag set), but execution will branch to the NMI vector instead of the IRQ/BRK vector:
  if (state.nmiDelayedFlag.value) {
    state.PC = readWord(state, 0xFFFA);
  } else {
    state.PC = readWord(state, 0xFFFE);
  }

  // Do not trigger NMI immediately after, wait 1 cycle to propagate
  state.nmiDelayedFlag.resetActiveValue();
}

const interruptHandler = (state: EmulatorState, targetAddress: number) => {
  state.dummyReadTick();
  readByte(state, state.PC);
  pushStackWord(state, state.PC);
  pushStack(state, state.P | P_REG_ALWAYS_1);
  setInterrupt(state, true);
  state.PC = readWord(state, targetAddress);
}

export const nmi = (state : EmulatorState) => {
  interruptHandler(state, 0xFFFA);
}

export const irq = (state : EmulatorState) => {
  interruptHandler(state, 0xFFFE);
}
