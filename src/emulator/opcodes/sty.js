import {
  writeAbsolute4Cycles, writeZeroPage3Cycles, writeZeroPageX4Cycles
} from './utils';

export const registerSTY = opcodeHandlers => {
  opcodeHandlers[0x84] = state => writeZeroPage3Cycles(state, state.Y);
  opcodeHandlers[0x94] = state => writeZeroPageX4Cycles(state, state.Y);
  opcodeHandlers[0x8C] = state => writeAbsolute4Cycles(state, state.Y);
}
