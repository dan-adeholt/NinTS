import {
  clampToByte,
  getAddressAbsolute,
  getAddressAbsoluteWithOffset,
  getAddressIndirectX,
  getAddressIndirectY,
  getAddressZeroPage,
  getAddressZeroPageX,
  setCarry,
  setNegative,
  setZero, sub
} from './utils';

export const registerDCP = (opcodeHandlers) => {
  const dcp = (state, address) => {
    let value = state.readMem(address) - 1;
    let valueBytes = clampToByte(value);
    state.setMem(address, valueBytes);

    let diff = state.A - value;
    let diffBytes = clampToByte(diff);

    setZero(state, diffBytes);
    setNegative(state, diffBytes);
    setCarry(state, diff >= 0);
  }

  opcodeHandlers[0xC7] = state => dcp(state, getAddressZeroPage(state, 5));
  opcodeHandlers[0xD7] = state => dcp(state, getAddressZeroPageX(state, 6));
  opcodeHandlers[0xCF] = state => dcp(state, getAddressAbsolute(state, 6));
  opcodeHandlers[0xDF] = state => dcp(state, getAddressAbsoluteWithOffset(state, state.X, 7));
  opcodeHandlers[0xDB] = state => dcp(state, getAddressAbsoluteWithOffset(state, state.Y, 7));
  opcodeHandlers[0xC3] = state => dcp(state, getAddressIndirectX(state, 8));
  opcodeHandlers[0xD3] = state => dcp(state, getAddressIndirectY(state, 8));
}
