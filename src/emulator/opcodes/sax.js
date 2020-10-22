import {
  getAddressAbsolute, getAddressIndirectX,
  getAddressZeroPage, getAddressZeroPageY
} from './utils';

const sax = (state, address) => {
  state.setMem(address, state.X & state.A);
}

export const registerSAX = opcodeHandlers => {
  opcodeHandlers[0x87] = state => sax(state, getAddressZeroPage(state, 3));
  opcodeHandlers[0x97] = state => sax(state, getAddressZeroPageY(state, 4));
  opcodeHandlers[0x83] = state => sax(state, getAddressIndirectX(state, 6))
  opcodeHandlers[0x8F] = state => sax(state, getAddressAbsolute(state, 4))
}
