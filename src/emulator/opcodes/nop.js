import {
  readValueAbsolute,
  readValueAbsoluteXWithPageBoundaryCycle,
  readValueImmediate,
  readValueZeroPage,
  readValueZeroPageX
} from './utils';

const nop = (state, length) => {
  state.PC += 1;
  state.CYC += 2;
}

const unofficialNopZeroPage = state => readValueZeroPage(state, 3)
const unofficialNopImmediate = state => readValueImmediate(state, 2)
const unofficialNopZeroPageX = state => readValueZeroPageX(state, 4)
const unofficialNopAbsolute = state => readValueAbsolute(state, 4)
const unofficialNopAbsoluteX = state => readValueAbsoluteXWithPageBoundaryCycle(state, 4)

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
  opcodeHandlers[0x82] = state => unofficialNopImmediate(state)
  opcodeHandlers[0x89] = state => unofficialNopImmediate(state)
  opcodeHandlers[0xC2] = state => unofficialNopImmediate(state)
  opcodeHandlers[0xE2] = state => unofficialNopImmediate(state)
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
