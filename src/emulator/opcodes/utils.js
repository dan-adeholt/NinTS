const PAGE_SIZE = 256;

export const onSamePageBoundary = (a1, a2) => {
  return (a1 ^ a2) < PAGE_SIZE;
};

export const P_REG_CARRY = 1;
export const P_REG_ZERO = 1 << 1;
export const P_REG_INTERRUPT = 1 << 2;
export const P_REG_DECIMAL = 1 << 3;
export const P_REG_BREAK = 1 << 4;
export const P_REG_ALWAYS_1 = 1 << 5;
export const P_REG_OVERFLOW = 1 << 6;
export const P_REG_NEGATIVE = 1 << 7;
export const P_REGS_OVERFLOW_AND_NEGATIVE = P_REG_NEGATIVE | P_REG_OVERFLOW;
export const P_MASK_OVERFLOW_AND_NEGATIVE = ~P_REGS_OVERFLOW_AND_NEGATIVE;

const P_MASK_CARRY = ~P_REG_CARRY;
const P_MASK_ZERO = ~P_REG_ZERO;
const P_MASK_INTERRUPT = ~P_REG_INTERRUPT;
const P_MASK_DECIMAL = ~P_REG_DECIMAL;
const P_MASK_BREAK = ~P_REG_BREAK;
const P_MASK_ALWAYS_1 = ~P_REG_ALWAYS_1;
const P_MASK_OVERFLOW = ~P_REG_OVERFLOW;
const P_MASK_NEGATIVE = ~P_REG_NEGATIVE;

export const addCycles = (state, cycles) => {
  state.CYC += cycles;
}
const setFlag = (state, flag, mask, on) => {
  if (on) {
    state.P = state.P | flag;
  } else {
    state.P = state.P & mask;
  }
}
export const setCarry = (state, on) => setFlag(state, P_REG_CARRY, P_MASK_CARRY, on);
export const setZero = (state, value) => setFlag(state, P_REG_ZERO, P_MASK_ZERO, value === 0);
export const setNegative = (state, value) => setFlag(state, P_REG_NEGATIVE, P_MASK_NEGATIVE, value > 0x7F);
export const setNegativeNativeNumber = (state, value) => setFlag(state, P_REG_NEGATIVE, P_MASK_NEGATIVE, value < 0);
export const setInterrupt = (state, on) => setFlag(state, P_REG_INTERRUPT, P_MASK_INTERRUPT, on);
export const setDecimal = (state, on) => setFlag(state, P_REG_DECIMAL, P_MASK_DECIMAL, on);
export const setBreak = (state, on) => setFlag(state, P_REG_BREAK, P_MASK_BREAK, on);
export const setAlwaysOne = (state) => setFlag(state, P_REG_ALWAYS_1, P_MASK_ALWAYS_1, true);
export const readImmediate = state => {
  const value = state.readMem(state.PC + 1);
  state.PC += 2;
  state.CYC += 2;
  return value;
}
export const readZeroPage = state => {
  const value = state.readMem(state.readMem(state.PC + 1));
  state.PC += 2;
  state.CYC += 3;
  return value;
}

export const readAbsolute = state => {
  const value = state.readMem(state.readMem(state.PC + 1) + (state.readMem(state.PC + 2) << 8));
  state.PC += 2;
  state.CYC += 4;
  return value;
}

const readZeroPageHelper = (state, offset) => {
  const value = state.readMem((state.readMem(state.PC + 1) + offset) % 256);
  state.PC += 2;
  state.CYC += 4;
  return value;
}

const readAbsoluteHelper = (state, add) => {
  const base = state.readMem(state.PC + 1) + (state.readMem(state.PC + 2) << 8);
  const target = base + add;

  state.CYC += 4;

  if (!onSamePageBoundary(base, target)) {
    state.CYC += 1;
  }

  state.PC += 2;

  return state.readMem(target);
}

export const readIndirectX = (state) => {
  const offset = state.readMem(state.PC + 1);
  const address = (state.X + offset) % 256;
  const value = state.readMem(address + 1) + (state.readMem(address + 2) << 8);

  state.CYC += 6;

  return value;
}

export const readIndirectY = (state) => {
  const zeroPageAddress = state.readMem(state.PC + 1);
  const base = state.readMem(zeroPageAddress + 1) + (state.readMem(zeroPageAddress + 2) << 8);
  const target = base + state.Y;
  state.CYC += 5;

  if (!onSamePageBoundary(base, target)) {
    state.CYC += 1;
  }

  return state.readMem(target);
}

export const readZeroPageX = state => readZeroPageHelper(state, state.X)
export const readZeroPageY = state => readZeroPageHelper(state, state.Y)
export const readAbsoluteX = state => readAbsoluteHelper(state, state.X)
export const readAbsoluteY = state => readAbsoluteHelper(state, state.Y)

export const setZeroAndNegative = (state, value) => {
  setZero(state, value);
  setNegative(state, value);
};

