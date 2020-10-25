import { and } from './and';
import { performLSR } from './lsr';
import { readValueImmediate } from './utils';

const asr = (state, value) => {
  state.A = performLSR(state, and(state, value));
}

export const registerASR = opcodeHandlers => {
  opcodeHandlers[0x4B] = state => asr(state, readValueImmediate(state, 2));
}
