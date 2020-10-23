import {
  readAddressAbsolute,
  readAddressAbsoluteX,
  readAddressAbsoluteY, readAddressIndirectX, readAddressIndirectY,
  readAddressZeroPage,
  readAddressZeroPageX
} from './utils';
import { lsr } from './lsr';
import { eor } from './eor';

const sre = (state, address) => {
  const value = lsr(state, address);
  eor(state, value);
}

export const registerSRE = opcodeHandlers => {
  opcodeHandlers[0x47] = state => sre(state, readAddressZeroPage(state, 5));
  opcodeHandlers[0x57] = state => sre(state, readAddressZeroPageX(state, 6));
  opcodeHandlers[0x4F] = state => sre(state, readAddressAbsolute(state, 6));
  opcodeHandlers[0x5F] = state => sre(state, readAddressAbsoluteX(state, 7));
  opcodeHandlers[0x5B] = state => sre(state, readAddressAbsoluteY(state, 7));
  opcodeHandlers[0x43] = state => sre(state, readAddressIndirectX(state, 8));
  opcodeHandlers[0x53] = state => sre(state, readAddressIndirectY(state, 8));
}
