import {
  clampToByte,
  readAddressAbsolute,
  readAddressAbsoluteWithOffset,
  readAddressIndirectX,
  readAddressIndirectY,
  readAddressZeroPage,
  readAddressZeroPageX
} from './utils';
import { sbc } from './sbc';

export const registerISB = (opcodeHandlers) => {
  const isb = (state, address) => {
    let value = state.readMem(address) + 1;
    let valueBytes = clampToByte(value);
    state.setMem(address, valueBytes);
    sbc(state, valueBytes);
  }

  opcodeHandlers[0xE7] = state => isb(state, readAddressZeroPage(state, 5));
  opcodeHandlers[0xF7] = state => isb(state, readAddressZeroPageX(state, 6));
  opcodeHandlers[0xEF] = state => isb(state, readAddressAbsolute(state, 6));
  opcodeHandlers[0xFF] = state => isb(state, readAddressAbsoluteWithOffset(state, state.X, 7));
  opcodeHandlers[0xFB] = state => isb(state, readAddressAbsoluteWithOffset(state, state.Y, 7));
  opcodeHandlers[0xE3] = state => isb(state, readAddressIndirectX(state, 8));
  opcodeHandlers[0xF3] = state => isb(state, readAddressIndirectY(state, 8));
}
