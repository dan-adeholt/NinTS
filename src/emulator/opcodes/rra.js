import {
  getAddressAbsolute,
  getAddressAbsoluteX,
  getAddressAbsoluteY, getAddressIndirectX, getAddressIndirectY,
  getAddressZeroPage,
  getAddressZeroPageX
} from './utils';

import { ror } from './ror';
import { adc } from './adc';

const rra = (state, address) => {
  const value = ror(state, address);
  adc(state, value);
}

export const registerRRA = opcodeHandlers => {
  opcodeHandlers[0x67] = state => rra(state, getAddressZeroPage(state, 5));
  opcodeHandlers[0x77] = state => rra(state, getAddressZeroPageX(state, 6));
  opcodeHandlers[0x6F] = state => rra(state, getAddressAbsolute(state, 6));
  opcodeHandlers[0x7F] = state => rra(state, getAddressAbsoluteX(state, 7));
  opcodeHandlers[0x7B] = state => rra(state, getAddressAbsoluteY(state, 7));
  opcodeHandlers[0x63] = state => rra(state, getAddressIndirectX(state, 8));
  opcodeHandlers[0x73] = state => rra(state, getAddressIndirectY(state, 8));
}
