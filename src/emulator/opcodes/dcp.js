import {
  clampToByte,
  readAddressAbsolute,
  readAddressAbsoluteX, readAddressAbsoluteY,
  readAddressIndirectX,
  readAddressIndirectY,
  readAddressZeroPage,
  readAddressZeroPageX,
  setCarry,
  setNegative,
  setZero
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

  opcodeHandlers[0xC7] = state => dcp(state, readAddressZeroPage(state, 5));
  opcodeHandlers[0xD7] = state => dcp(state, readAddressZeroPageX(state, 6));
  opcodeHandlers[0xCF] = state => dcp(state, readAddressAbsolute(state, 6));
  opcodeHandlers[0xDF] = state => dcp(state, readAddressAbsoluteX(state, 7));
  opcodeHandlers[0xDB] = state => dcp(state, readAddressAbsoluteY(state, 7));
  opcodeHandlers[0xC3] = state => dcp(state, readAddressIndirectX(state, 8));
  opcodeHandlers[0xD3] = state => dcp(state, readAddressIndirectY(state, 8));
}
