import {
  readAbsolute4Cycles, readAbsoluteX4PlusCycles, readAbsoluteY4PlusCycles,
  readImmediate2Cycles, readIndirectX6Cycles, readIndirectY5PlusCycles,
  readZeroPage3Cycles,
  readZeroPageX4Cycles,
} from './utils';
import { adc } from './adc';

const sbc = (state, value) => adc(state, value ^ 0xFF)

export const registerSBC = opcodeHandlers => {
  opcodeHandlers[0xE9] = state => sbc(state, readImmediate2Cycles(state));
  opcodeHandlers[0xE5] = state => sbc(state, readZeroPage3Cycles(state)) ;
  opcodeHandlers[0xF5] = state => sbc(state, readZeroPageX4Cycles(state));
  opcodeHandlers[0xED] = state => sbc(state, readAbsolute4Cycles(state));
  opcodeHandlers[0xFD] = state => sbc(state, readAbsoluteX4PlusCycles(state));
  opcodeHandlers[0xF9] = state => sbc(state, readAbsoluteY4PlusCycles(state));
  opcodeHandlers[0xE1] = state => sbc(state, readIndirectX6Cycles(state));
  opcodeHandlers[0xF1] = state => sbc(state, readIndirectY5PlusCycles(state));
}
