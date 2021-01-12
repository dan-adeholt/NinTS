import {
  clampToByte,
  readAddressAbsolute,
  readAddressAbsoluteX, readAddressAbsoluteY,
  readAddressIndirectX,
  readAddressIndirectY,
  readAddressZeroPage,
  readAddressZeroPageX
} from './utils';
import { sbc } from './sbc';
import { readMem, setMem } from '../emulator';

export const registerISB = (opcodeHandlers) => {
  const isb = (state, address) => {
    let value = readMem(state, address) + 1;
    let valueBytes = clampToByte(value);
    setMem(state, address, valueBytes);
    sbc(state, valueBytes);
  }

  opcodeHandlers[0xE7] = state => isb(state, readAddressZeroPage(state, 5));
  opcodeHandlers[0xF7] = state => isb(state, readAddressZeroPageX(state, 6));
  opcodeHandlers[0xEF] = state => isb(state, readAddressAbsolute(state, 6));
  opcodeHandlers[0xFF] = state => isb(state, readAddressAbsoluteX(state, 7));
  opcodeHandlers[0xFB] = state => isb(state, readAddressAbsoluteY(state, 7));
  opcodeHandlers[0xE3] = state => isb(state, readAddressIndirectX(state, 8));
  opcodeHandlers[0xF3] = state => isb(state, readAddressIndirectY(state, 8));
}
