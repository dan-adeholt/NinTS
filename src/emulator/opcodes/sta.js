import {
  writeValueAbsolute, writeValueAbsoluteX, writeValueAbsoluteY, writeValueIndirectX, writeValueIndirectY,
  writeValueZeroPage, writeValueZeroPageX
} from './utils';

export const registerSTA = opcodeHandlers => {
  opcodeHandlers[0x85] = state => writeValueZeroPage(state, state.A, 3);
  opcodeHandlers[0x95] = state => writeValueZeroPageX(state, state.A, 4);
  opcodeHandlers[0x8D] = state => writeValueAbsolute(state, state.A, 4);
  opcodeHandlers[0x9D] = state => writeValueAbsoluteX(state, state.A, 5);
  opcodeHandlers[0x99] = state => writeValueAbsoluteY(state, state.A, 5);
  opcodeHandlers[0x81] = state => writeValueIndirectX(state, state.A, 6);
  opcodeHandlers[0x91] = state => writeValueIndirectY(state, state.A, 6);
}
