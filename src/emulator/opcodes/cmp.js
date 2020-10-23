import {
  readValueAbsolute, readValueAbsoluteXWithPageBoundaryCycle, readValueAbsoluteYWithPageBoundaryCycle,
  readValueImmediate, readValueIndirectX, readValueIndirectYWithPageBoundaryCycle,
  readValueZeroPage, readValueZeroPageX,
  setCarry,
  setNegative,
  setZero
} from './utils';

export const registerCMP = (opcodeHandlers) => {
  const cmp = (state, value) => {
    let diff = state.A - value;
    let diffBytes = diff;
    if (diff < 0) {
      diffBytes += 0xFF;
    }

    setZero(state, diffBytes);
    setNegative(state, diffBytes);
    setCarry(state, diff >= 0);
  }

  opcodeHandlers[0xC9] = state => cmp(state, readValueImmediate(state, 2));
  opcodeHandlers[0xC5] = state => cmp(state, readValueZeroPage(state, 3));
  opcodeHandlers[0xD5] = state => cmp(state, readValueZeroPageX(state, 4));
  opcodeHandlers[0xCD] = state => cmp(state, readValueAbsolute(state, 4));
  opcodeHandlers[0xDD] = state => cmp(state, readValueAbsoluteXWithPageBoundaryCycle(state, 4));
  opcodeHandlers[0xD9] = state => cmp(state, readValueAbsoluteYWithPageBoundaryCycle(state, 4));
  opcodeHandlers[0xC1] = state => cmp(state, readValueIndirectX(state, 6));
  opcodeHandlers[0xD1] = state => cmp(state, readValueIndirectYWithPageBoundaryCycle(state, 5));
}
