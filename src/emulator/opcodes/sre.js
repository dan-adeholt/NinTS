import {
  getAddressAbsolute,
  getAddressAbsoluteX,
  getAddressAbsoluteY, getAddressIndirectX, getAddressIndirectY,
  getAddressZeroPage,
  getAddressZeroPageX
} from './utils';
import { lsr } from './lsr';
import { eor } from './eor';

const sre = (state, address) => {
  const value = lsr(state, address);
  eor(state, value);
}

export const registerSRE = opcodeHandlers => {
  opcodeHandlers[0x47] = state => sre(state, getAddressZeroPage(state, 5));
  opcodeHandlers[0x57] = state => sre(state, getAddressZeroPageX(state, 6));
  opcodeHandlers[0x4F] = state => sre(state, getAddressAbsolute(state, 6));
  opcodeHandlers[0x5F] = state => sre(state, getAddressAbsoluteX(state, 7));
  opcodeHandlers[0x5B] = state => sre(state, getAddressAbsoluteY(state, 7));
  opcodeHandlers[0x43] = state => sre(state, getAddressIndirectX(state, 8));
  opcodeHandlers[0x53] = state => sre(state, getAddressIndirectY(state, 8));
}
