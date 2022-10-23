/**
 * Branch instructions. They are all implemented the same way apart from the condition on which the branch is predicated.
 */
import { P_REG_CARRY, P_REG_NEGATIVE, P_REG_OVERFLOW, P_REG_ZERO } from './util';
import { onSamePageBoundary, readByte } from '../memory';
import EmulatorState from '../EmulatorState';

const branch = (state: EmulatorState, address: number, shouldBranch: number | boolean) => {
  const offset = readByte(state, address);

  if (shouldBranch) {
    const offsetSigned = offset > 0x7F ? offset - 256 : offset;
    const jumpLocation = state.PC + offsetSigned;
    state.dummyReadTick();

    if (!onSamePageBoundary(state.PC, jumpLocation)) {
      state.dummyReadTick();
    }

    state.PC = jumpLocation;
  }
}

export const bcc = (state : EmulatorState, address: number) => branch(state, address, !(state.P & P_REG_CARRY));
export const beq = (state : EmulatorState, address: number) => branch(state, address, state.P & P_REG_ZERO);
export const bne = (state : EmulatorState, address: number) => branch(state, address, !(state.P & P_REG_ZERO));
export const bcs = (state : EmulatorState, address: number) => branch(state, address, state.P & P_REG_CARRY);
export const bvc = (state : EmulatorState, address: number) => branch(state, address, !(state.P & P_REG_OVERFLOW));
export const bvs = (state : EmulatorState, address: number) => branch(state, address, state.P & P_REG_OVERFLOW);
export const bpl = (state : EmulatorState, address: number) => branch(state, address, !(state.P & P_REG_NEGATIVE));
export const bmi = (state : EmulatorState, address: number) => branch(state, address, state.P & P_REG_NEGATIVE);
