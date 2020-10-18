import {
  writeAbsolute4Cycles, writeZeroPage3Cycles, writeZeroPageYCycles
} from './utils';

export const registerSTX = opcodeHandlers => {
  opcodeHandlers[0x86] = state => writeZeroPage3Cycles(state, state.X);
  opcodeHandlers[0x96] = state => writeZeroPageYCycles(state, state.X);
  opcodeHandlers[0x8E] = state => writeAbsolute4Cycles(state, state.X);
}
