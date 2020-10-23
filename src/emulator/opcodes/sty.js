import {
  writeValueAbsolute, writeValueZeroPage, writeValueZeroPageX
} from './utils';

export const registerSTY = opcodeHandlers => {
  opcodeHandlers[0x84] = state => writeValueZeroPage(state, state.Y, 3);
  opcodeHandlers[0x94] = state => writeValueZeroPageX(state, state.Y, 4);
  opcodeHandlers[0x8C] = state => writeValueAbsolute(state, state.Y, 4);
}
