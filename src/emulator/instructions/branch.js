/**
 * Branch instructions. They are all implemented the same way apart from the condition on which the branch is predicated.
 */
import { P_REG_CARRY, P_REG_NEGATIVE, P_REG_OVERFLOW, P_REG_ZERO } from './util';
import { onSamePageBoundary, readByte } from '../memory';
import { dummyReadTick } from '../emulator';

const branch = (state, address, shouldBranch) => {
  let offset = readByte(state, address);

  if (shouldBranch) {
    let offsetSigned = offset > 0x7F ? offset - 256 : offset;
    const jumpLocation = state.PC + offsetSigned;
    dummyReadTick(state);

    if (!onSamePageBoundary(state.PC, jumpLocation)) {
      dummyReadTick(state);
    }

    state.PC = jumpLocation;
  }
}

export const bcc = (state, address) => branch(state, address, !(state.P & P_REG_CARRY));
export const beq = (state, address) => branch(state, address, state.P & P_REG_ZERO);
export const bne = (state, address) => branch(state, address, !(state.P & P_REG_ZERO));
export const bcs = (state, address) => branch(state, address, state.P & P_REG_CARRY);
export const bvc = (state, address) => branch(state, address, !(state.P & P_REG_OVERFLOW));
export const bvs = (state, address) => branch(state, address, state.P & P_REG_OVERFLOW);
export const bpl = (state, address) => branch(state, address, !(state.P & P_REG_NEGATIVE));
export const bmi = (state, address) => branch(state, address, state.P & P_REG_NEGATIVE);
