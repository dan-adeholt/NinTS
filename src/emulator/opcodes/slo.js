import {
  readAddressAbsolute,
  readAddressAbsoluteWithOffset,
  readAddressIndirectX,
  readAddressIndirectY,
  readAddressZeroPage,
  readAddressZeroPageX,
} from './utils';
import { ora } from './ora';
import { asl } from './asl';

const slo = (state, address) => {
  const value = asl(state, address);
  ora(state, value);
};

export const registerSLO = opcodeHandlers => {
  opcodeHandlers[0x07] = state => slo(state, readAddressZeroPage(state, 5));
  opcodeHandlers[0x17] = state => slo(state, readAddressZeroPageX(state, 6));
  opcodeHandlers[0x0F] = state => slo(state, readAddressAbsolute(state, 6));
  opcodeHandlers[0x1F] = state => slo(state, readAddressAbsoluteWithOffset(state, state.X,7));
  opcodeHandlers[0x1B] = state => slo(state, readAddressAbsoluteWithOffset(state, state.Y,7));
  opcodeHandlers[0x03] = state => slo(state, readAddressIndirectX(state, 8));
  opcodeHandlers[0x13] = state => slo(state, readAddressIndirectY(state, 8));
}
