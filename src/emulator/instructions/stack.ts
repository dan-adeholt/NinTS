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

const innerInterruptHandler = (state: EmulatorState, targetAddress: number) => {
  pushStack(state, state.P | P_REG_ALWAYS_1);
  setInterrupt(state, true);
  state.PC = readWord(state, targetAddress);
}

/**
 * Shared interrupt handler for NMI and IRQ. Needs to be interleaved with each other
 * because the read and write operations at the top can influence whether NMI will override
 * the IRQ interrupt.
 */
export const interruptHandler = (state: EmulatorState) => {
  state.dummyReadTick();
  state.dummyReadTick();

  pushStackWord(state, state.PC);

  // Note that we inspect the pending value here, not value. I am not sure why, it'd
  // make more sense to use the value as it has had time to store. But it is the only way
  // to make the timings correct for cpu_interrupts_v2: nmi_and_irq
  if (state.nmiDelayedFlag.pendingValue) {
    state.nmiDelayedFlag.updateWithNewValue(false);
    innerInterruptHandler(state, 0xFFFA);

    state.lastNMI = state.CYC;
    state.lastNMIOccured = true;
  } else {
    // Note that we do not check the IRQ flag here, in fact it might have been
    // set to false by now. That condition was checked before calling this function,
    // we are really only interested in if NMI has precedence.
    innerInterruptHandler(state, 0xFFFE);
  }
}
