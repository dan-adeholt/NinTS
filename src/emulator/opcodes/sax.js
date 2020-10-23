import {
  readAddressAbsolute, readAddressIndirectX,
  readAddressZeroPage, readAddressZeroPageY
} from './utils';

const sax = (state, address) => {
  state.setMem(address, state.X & state.A);
}

export const registerSAX = opcodeHandlers => {
  opcodeHandlers[0x87] = state => sax(state, readAddressZeroPage(state, 3));
  opcodeHandlers[0x97] = state => sax(state, readAddressZeroPageY(state, 4));
  opcodeHandlers[0x83] = state => sax(state, readAddressIndirectX(state, 6))
  opcodeHandlers[0x8F] = state => sax(state, readAddressAbsolute(state, 4))
}
