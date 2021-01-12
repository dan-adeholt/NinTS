import { getAddressAbsolute, onSamePageBoundary, PAGE_MASK } from './utils';
import { readMem } from '../emulator';

export const registerJump = opcodeHandlers => {
  opcodeHandlers[0x4C] = state => { // JMP Absolute
    state.PC = getAddressAbsolute(state, state.PC);
    state.CYC += 3;
  };

  opcodeHandlers[0x6C] = state => { // JMP Indirect
    const address = getAddressAbsolute(state, state.PC);

    const lo = address;
    let hi = address + 1;

    if (!onSamePageBoundary(lo, hi)) {
      hi = (lo & PAGE_MASK);
    }

    const target = readMem(state, lo) + (readMem(state, hi) << 8);
    state.PC = target;
    state.CYC += 5;
  };
}
