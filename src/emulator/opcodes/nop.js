import {
  readAbsolute4Cycles,
  readAbsoluteX4PlusCycles,
  readImmediate2Cycles,
  readZeroPage3Cycles,
  readZeroPageX4Cycles
} from './utils';

const nopHelper = (state, length, cycles) => {
  state.PC += length;
  state.CYC += cycles;
}

const nop = state => nopHelper(state, 1, 2)
const unofficialNopZeroPage = state => readZeroPage3Cycles(state)
const unofficialNopImmediate = state => readImmediate2Cycles(state)
const unofficialNopZeroPageX = state => readZeroPageX4Cycles(state)
const unofficialNopAbsolute = state => readAbsolute4Cycles(state)
const unofficialNopAbsoluteX = state => readAbsoluteX4PlusCycles(state)

export const registerNOP = opcodeHandlers => {
  opcodeHandlers[0xEA] = state => { // NOP
    state.PC += 1;
    state.CYC += 2;
  }

  opcodeHandlers[0x1A] = state => nop(state)
  opcodeHandlers[0x3A] = state => nop(state)
  opcodeHandlers[0x5A] = state => nop(state)
  opcodeHandlers[0x7A] = state => nop(state)
  opcodeHandlers[0xDA] = state => nop(state)
  opcodeHandlers[0xFA] = state => nop(state)
  opcodeHandlers[0x80] = state => unofficialNopImmediate(state)
  opcodeHandlers[0x04] = state => unofficialNopZeroPage(state)
  opcodeHandlers[0x44] = state => unofficialNopZeroPage(state)
  opcodeHandlers[0x64] = state => unofficialNopZeroPage(state)
  opcodeHandlers[0x0C] = state => unofficialNopAbsolute(state)
  opcodeHandlers[0x14] = state => unofficialNopZeroPageX(state)
  opcodeHandlers[0x34] = state => unofficialNopZeroPageX(state)
  opcodeHandlers[0x54] = state => unofficialNopZeroPageX(state)
  opcodeHandlers[0x74] = state => unofficialNopZeroPageX(state)
  opcodeHandlers[0xD4] = state => unofficialNopZeroPageX(state)
  opcodeHandlers[0xF4] = state => unofficialNopZeroPageX(state)

  opcodeHandlers[0x1C] = state => unofficialNopAbsoluteX(state)
  opcodeHandlers[0x3C] = state => unofficialNopAbsoluteX(state)
  opcodeHandlers[0x5C] = state => unofficialNopAbsoluteX(state)
  opcodeHandlers[0x7C] = state => unofficialNopAbsoluteX(state)
  opcodeHandlers[0xDC] = state => unofficialNopAbsoluteX(state)
  opcodeHandlers[0xFC] = state => unofficialNopAbsoluteX(state)

}
