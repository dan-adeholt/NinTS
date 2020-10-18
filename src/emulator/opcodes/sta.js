import {
  writeAbsolute4Cycles, writeAbsoluteX5Cycles, writeAbsoluteY5Cycles, writeIndirectX6Cycles,
  writeZeroPage3Cycles, writeZeroPageX4Cycles
} from './utils';

export const registerSTA = opcodeHandlers => {
  opcodeHandlers[0x85] = state => writeZeroPage3Cycles(state, state.A);
  opcodeHandlers[0x95] = state => writeZeroPageX4Cycles(state, state.A);
  opcodeHandlers[0x8D] = state => writeAbsolute4Cycles(state, state.A);
  opcodeHandlers[0x9D] = state => writeAbsoluteX5Cycles(state, state.A);
  opcodeHandlers[0x99] = state => writeAbsoluteY5Cycles(state, state.A);
  opcodeHandlers[0x81] = state => writeIndirectX6Cycles(state, state.A);
  opcodeHandlers[0x91] = state => writeIndirectY6Cycles(state, state.A);
}
