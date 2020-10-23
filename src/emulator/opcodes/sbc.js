import {
  readValueAbsolute, readValueAbsoluteXWithPageBoundaryCycle, readValueAbsoluteYWithPageBoundaryCycle,
  readValueImmediate, readValueIndirectX, readValueIndirectYWithPageBoundaryCycle,
  readValueZeroPage,
  readValueZeroPageX,
} from './utils';
import { adc } from './adc';

export const sbc = (state, value) => adc(state, value ^ 0xFF)

export const registerSBC = opcodeHandlers => {
  opcodeHandlers[0xE9] = state => sbc(state, readValueImmediate(state, 2));
  opcodeHandlers[0xEB] = state => sbc(state, readValueImmediate(state, 2)); // *SBC

  opcodeHandlers[0xE5] = state => sbc(state, readValueZeroPage(state, 3)) ;
  opcodeHandlers[0xF5] = state => sbc(state, readValueZeroPageX(state, 4));
  opcodeHandlers[0xED] = state => sbc(state, readValueAbsolute(state, 4));
  opcodeHandlers[0xFD] = state => sbc(state, readValueAbsoluteXWithPageBoundaryCycle(state, 4));
  opcodeHandlers[0xF9] = state => sbc(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4));
  opcodeHandlers[0xE1] = state => sbc(state, readValueIndirectX(state, 6));
  opcodeHandlers[0xF1] = state => sbc(state, readValueIndirectYWithPageBoundaryCycle(state, 5));
}
