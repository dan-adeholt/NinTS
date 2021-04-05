export const BIT_7 = 0b10000000;
export const BIT_0 = 0b00000001;
export const BIT_7_MASK = ~BIT_7;

export const P_REG_CARRY     = 0b00000001;
export const P_REG_ZERO      = 0b00000010;
export const P_REG_INTERRUPT = 0b00000100;
export const P_REG_DECIMAL   = 0b00001000;
export const P_REG_BREAK     = 0b00010000;
export const P_REG_ALWAYS_1  = 0b00100000;
export const P_REG_OVERFLOW  = 0b01000000;
export const P_REG_NEGATIVE  = 0b10000000;
export const P_REGS_OVERFLOW_AND_NEGATIVE = P_REG_NEGATIVE | P_REG_OVERFLOW;
export const P_MASK_OVERFLOW_AND_NEGATIVE = ~P_REGS_OVERFLOW_AND_NEGATIVE;

export const P_MASK_CARRY = ~P_REG_CARRY;
export const P_MASK_ZERO = ~P_REG_ZERO;
export const P_MASK_INTERRUPT = ~P_REG_INTERRUPT;
export const P_MASK_DECIMAL = ~P_REG_DECIMAL;
export const P_MASK_BREAK = ~P_REG_BREAK;
export const P_MASK_ALWAYS_1 = ~P_REG_ALWAYS_1;
export const P_MASK_OVERFLOW = ~P_REG_OVERFLOW;
export const P_MASK_NEGATIVE = ~P_REG_NEGATIVE;

const setFlag = (state, flag, mask, on) => {
  if (on) {
    state.P = state.P | flag;
  } else {
    state.P = state.P & mask;
  }
}

export const isNegative = value => value > 0x7F
export const setCarry = (state, on) => setFlag(state, P_REG_CARRY, P_MASK_CARRY, on);
export const setZero = (state, value) => setFlag(state, P_REG_ZERO, P_MASK_ZERO, value === 0);
export const setNegative = (state, value) => setFlag(state, P_REG_NEGATIVE, P_MASK_NEGATIVE, value > 0x7F);

export const setZeroNegative = (state, value) => {
  setZero(state, value);
  setNegative(state, value);
  return value;
}

// Overflow is set if Positive + Positive = Negative or Negative + Negative = Positive
// Check this by comparing the high bits of the result.
export const setOverflow = (state, accumulator, value, result) => setFlag(state, P_REG_OVERFLOW, P_MASK_OVERFLOW, (accumulator ^ result) & (value ^ result) & 0x80);
export const setOverflowValue = (state, on) => setFlag(state, P_REG_OVERFLOW, P_MASK_OVERFLOW, on);
export const setInterrupt = (state, on) => setFlag(state, P_REG_INTERRUPT, P_MASK_INTERRUPT, on);
export const setBreak = (state, on) => setFlag(state, P_REG_BREAK, P_MASK_BREAK, on);
export const setAlwaysOne = (state) => setFlag(state, P_REG_ALWAYS_1, P_MASK_ALWAYS_1, true);

export const setY = (state, value) => state.Y = value
export const setX = (state, value) => state.X = value
export const setA = (state, value) => state.A = value
export const setAX = (state, value) => state.A = state.X = value

