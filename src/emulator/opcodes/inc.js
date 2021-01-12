 import {
  readAddressAbsolute, readAddressAbsoluteX,
  readAddressZeroPage, readAddressZeroPageX,
  setNegative, setZero
} from './utils';
 import { readMem, setMem } from '../emulator';

const inc = (state, address) => {
  const value = (readMem(state, address) + 1) & 0xFF;
  setMem(state, address, value);
  setZero(state, value);
  setNegative(state, value);
}

export const registerINC = opcodeHandlers => {
  opcodeHandlers[0xE6] = state => inc(state, readAddressZeroPage(state, 5));
  opcodeHandlers[0xF6] = state => inc(state, readAddressZeroPageX(state, 6));
  opcodeHandlers[0xEE] = state => inc(state, readAddressAbsolute(state, 6));
  opcodeHandlers[0xFE] = state => inc(state, readAddressAbsoluteX(state, 7));
}
