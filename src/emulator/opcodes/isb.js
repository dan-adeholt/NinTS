import {
  clampToByte,
  getAddressAbsolute,
  getAddressAbsoluteWithOffset,
  getAddressIndirectX,
  getAddressIndirectY,
  getAddressZeroPage,
  getAddressZeroPageX
} from './utils';
import { sbc } from './sbc';

export const registerISB = (opcodeHandlers) => {
  const isb = (state, address) => {
    let value = state.readMem(address) + 1;
    let valueBytes = clampToByte(value);
    state.setMem(address, valueBytes);
    sbc(state, valueBytes);
  }

  opcodeHandlers[0xE7] = state => isb(state, getAddressZeroPage(state, 5));
  opcodeHandlers[0xF7] = state => isb(state, getAddressZeroPageX(state, 6));
  opcodeHandlers[0xEF] = state => isb(state, getAddressAbsolute(state, 6));
  opcodeHandlers[0xFF] = state => isb(state, getAddressAbsoluteWithOffset(state, state.X, 7));
  opcodeHandlers[0xFB] = state => isb(state, getAddressAbsoluteWithOffset(state, state.Y, 7));
  opcodeHandlers[0xE3] = state => isb(state, getAddressIndirectX(state, 8));
  opcodeHandlers[0xF3] = state => isb(state, getAddressIndirectY(state, 8));
}
