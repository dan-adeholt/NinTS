import {
  readAddressAbsolute,
  readAddressAbsoluteX, readAddressAbsoluteY,
  readAddressIndirectX,
  readAddressIndirectY,
  readAddressZeroPage,
  readAddressZeroPageX
} from './utils';
import { cmp } from './cmp';
import { dec } from './dec';

export const registerDCP = (opcodeHandlers) => {
  const dcp = (state, address) => {
    cmp(state, dec(state, address));
  }

  opcodeHandlers[0xC7] = state => dcp(state, readAddressZeroPage(state, 5));
  opcodeHandlers[0xD7] = state => dcp(state, readAddressZeroPageX(state, 6));
  opcodeHandlers[0xCF] = state => dcp(state, readAddressAbsolute(state, 6));
  opcodeHandlers[0xDF] = state => dcp(state, readAddressAbsoluteX(state, 7));
  opcodeHandlers[0xDB] = state => dcp(state, readAddressAbsoluteY(state, 7));
  opcodeHandlers[0xC3] = state => dcp(state, readAddressIndirectX(state, 8));
  opcodeHandlers[0xD3] = state => dcp(state, readAddressIndirectY(state, 8));
}
