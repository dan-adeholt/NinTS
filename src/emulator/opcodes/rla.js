import {
  readAddressAbsolute, readAddressAbsoluteWithOffset, readAddressIndirectX, readAddressIndirectY,
  readAddressZeroPage, readAddressZeroPageX
} from './utils';
import { rol } from './rol';
import { and } from './and';

const rla = (state, address) => {
  const val = rol(state, address);
  and(state, val);
}

export const registerRLA = opcodeHandlers => {
  opcodeHandlers[0x27] = state => rla(state, readAddressZeroPage(state, 5));
  opcodeHandlers[0x37] = state => rla(state, readAddressZeroPageX(state, 6));
  opcodeHandlers[0x2F] = state => rla(state, readAddressAbsolute(state, 6));
  opcodeHandlers[0x3F] = state => rla(state, readAddressAbsoluteWithOffset(state, state.X,7));
  opcodeHandlers[0x3B] = state => rla(state, readAddressAbsoluteWithOffset(state, state.Y,7));
  opcodeHandlers[0x23] = state => rla(state, readAddressIndirectX(state, 8));
  opcodeHandlers[0x33] = state => rla(state, readAddressIndirectY(state, 8));
}
