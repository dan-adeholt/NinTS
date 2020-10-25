import {
  BIT_5,
  BIT_6,
  BIT_7_MASK,
  P_REG_CARRY,
  readValueImmediate,
  setCarry,
  setNegative, setOverflowValue,
  setZero
} from './utils';

export const registerARR = opcodeHandlers => {
  opcodeHandlers[0x6B] = (state) => {
    let value = readValueImmediate(state, 2);
    const oldCarry = state.P & P_REG_CARRY;
    const result = state.A & value;
    state.A = ((result >> 1) & BIT_7_MASK) | (oldCarry << 7);
    setZero(state, state.A);
    setNegative(state, state.A);
    const bit5 = (state.A & BIT_5) >> 5;
    const bit6 = (state.A & BIT_6) >> 6;
    setCarry(state, bit6);
    setOverflowValue(state, bit5 ^ bit6);
  }
}