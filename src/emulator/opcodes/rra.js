import {
  readAddressAbsolute,
  readAddressAbsoluteX,
  readAddressAbsoluteY, readAddressIndirectX, readAddressIndirectY,
  readAddressZeroPage,
  readAddressZeroPageX
} from './utils';

import { ror } from './ror';
import { adc } from './adc';

const rra = (state, address) => {
  const value = ror(state, address);
  adc(state, value);
}

export const registerRRA = opcodeHandlers => {
  opcodeHandlers[0x67] = state => rra(state, readAddressZeroPage(state, 5));
  opcodeHandlers[0x77] = state => rra(state, readAddressZeroPageX(state, 6));
  opcodeHandlers[0x6F] = state => rra(state, readAddressAbsolute(state, 6));
  opcodeHandlers[0x7F] = state => rra(state, readAddressAbsoluteX(state, 7));
  opcodeHandlers[0x7B] = state => rra(state, readAddressAbsoluteY(state, 7));
  opcodeHandlers[0x63] = state => rra(state, readAddressIndirectX(state, 8));
  opcodeHandlers[0x73] = state => rra(state, readAddressIndirectY(state, 8));
}
