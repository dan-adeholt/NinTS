import { getAbsoluteAddress, onSamePageBoundary, PAGE_MASK } from './utils';

export const registerJump = opcodeHandlers => {
  opcodeHandlers[0x4C] = state => { // JMP Absolute
    state.PC = getAbsoluteAddress(state);
    state.CYC += 3;
  };

  opcodeHandlers[0x6C] = state => { // JMP Indirect
    const address = getAbsoluteAddress(state);

    const lo = address;
    let hi = address + 1;

    if (!onSamePageBoundary(lo, hi)) {
      hi = (lo & PAGE_MASK);
    }

    const target = state.readMem(lo) + (state.readMem(hi) << 8);
    state.PC = target;
    state.CYC += 5;
  };
}
