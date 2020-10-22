import {
  BIT_7,
  getAddressAbsolute,
  getAddressAbsoluteWithOffset,
  getAddressIndirectX,
  getAddressIndirectY,
  getAddressZeroPage,
  getAddressZeroPageX,
  readAbsolute,
  readAbsoluteX,
  readAbsoluteY,
  readIndirectX,
  readIndirectY,
  readZeroPage,
  readZeroPageX,
  setCarry,
  setNegative,
  setZero
} from './utils';
import { ora } from './ora';
import { asl } from './asl';

const slo = (state, address) => {
  const value = asl(state, address);
  ora(state, value);
};

export const registerSLO = opcodeHandlers => {
  opcodeHandlers[0x07] = state => slo(state, getAddressZeroPage(state, 5));
  opcodeHandlers[0x17] = state => slo(state, getAddressZeroPageX(state, 6));
  opcodeHandlers[0x0F] = state => slo(state, getAddressAbsolute(state, 6));
  opcodeHandlers[0x1F] = state => slo(state, getAddressAbsoluteWithOffset(state, state.X,7));
  opcodeHandlers[0x1B] = state => slo(state, getAddressAbsoluteWithOffset(state, state.Y,7));
  opcodeHandlers[0x03] = state => slo(state, getAddressIndirectX(state, 8));
  opcodeHandlers[0x13] = state => slo(state, getAddressIndirectY(state, 8));
}
