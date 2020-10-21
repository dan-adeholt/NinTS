import {
  getAddressAbsolute, getAddressAbsoluteWithOffset,
  getAddressZeroPage, getAddressZeroPageX,
  setNegative, setZero
} from './utils';

const dec = (state, address) => {
  let value = (state.readMem(address) - 1);

  if (value < 0) {
    value = 0xFF;
  }

  state.setMem(address, value);
  setZero(state, value);
  setNegative(state, value);
}

export const registerDEC = opcodeHandlers => {
  opcodeHandlers[0xC6] = state => dec(state, getAddressZeroPage(state, 5));
  opcodeHandlers[0xD6] = state => dec(state, getAddressZeroPageX(state, 6));
  opcodeHandlers[0xCE] = state => dec(state, getAddressAbsolute(state, 6));
  opcodeHandlers[0xDE] = state => dec(state, getAddressAbsoluteWithOffset(state, state.X, 7));
}
