import {
  getAddressAbsolute, getAddressAbsoluteWithOffset, getAddressIndirectX, getAddressIndirectY,
  getAddressZeroPage, getAddressZeroPageX,
  readIndirectX,
  readIndirectY,
} from './utils';
import { rol } from './rol';
import { and } from './and';

const rla = (state, address) => {
  const val = rol(state, address);
  and(state, val);
}

export const registerRLA = opcodeHandlers => {
  opcodeHandlers[0x27] = state => rla(state, getAddressZeroPage(state, 5));
  opcodeHandlers[0x37] = state => rla(state, getAddressZeroPageX(state, 6));
  opcodeHandlers[0x2F] = state => rla(state, getAddressAbsolute(state, 6));
  opcodeHandlers[0x3F] = state => rla(state, getAddressAbsoluteWithOffset(state, state.X,7));
  opcodeHandlers[0x3B] = state => rla(state, getAddressAbsoluteWithOffset(state, state.Y,7));
  opcodeHandlers[0x23] = state => rla(state, getAddressIndirectX(state, 8));
  opcodeHandlers[0x33] = state => rla(state, getAddressIndirectY(state, 8));
}
