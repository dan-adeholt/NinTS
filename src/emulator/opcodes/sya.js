import { getAddressAbsolute, onSamePageBoundary } from './utils';
import { setMem } from '../emulator';

export const s_a = (state, offset, register) => {
  const base = getAddressAbsolute(state, state.PC);
  const address = (base + offset) & 0xFFFF;

  if (onSamePageBoundary(base, address)) {
    let hi = (address & 0xFF00) >> 8;
    hi = (hi + 1) & 0xFF;
    const result = register & hi;
    setMem(state, address, result);
  }

  state.CYC += 5;
  state.PC += 3;
}

const sya = (state) => s_a(state, state.X, state.Y)

export const registerSYA = opcodeHandlers => {
  opcodeHandlers[0x9C] = state => sya(state);
}
