import {
  writeValueAbsolute, writeValueZeroPage, writeValueZeroPageY
} from './utils';

export const registerSTX = opcodeHandlers => {
  opcodeHandlers[0x86] = state => writeValueZeroPage(state, state.X, 3);
  opcodeHandlers[0x96] = state => writeValueZeroPageY(state, state.X, 4);
  opcodeHandlers[0x8E] = state => writeValueAbsolute(state, state.X, 4);
}
