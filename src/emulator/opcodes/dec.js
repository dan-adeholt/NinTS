import {
  readAddressAbsolute, readAddressAbsoluteX,
  readAddressZeroPage, readAddressZeroPageX,
  setNegative, setZero
} from './utils';

export const dec = (state, address) => {
  let value = (state.readMem(address) - 1);

  if (value < 0) {
    value = 0xFF;
  }

  state.setMem(address, value);
  setZero(state, value);
  setNegative(state, value);
  return value;
}

export const registerDEC = opcodeHandlers => {
  opcodeHandlers[0xC6] = state => dec(state, readAddressZeroPage(state, 5));
  opcodeHandlers[0xD6] = state => dec(state, readAddressZeroPageX(state, 6));
  opcodeHandlers[0xCE] = state => dec(state, readAddressAbsolute(state, 6));
  opcodeHandlers[0xDE] = state => dec(state, readAddressAbsoluteX(state, 7));
}
