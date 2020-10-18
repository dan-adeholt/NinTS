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

const getAddressImmediate2Cycles = state => {
  const address = state.PC + 1;
  state.PC += 2;
  state.CYC += 2;
  return address;
}

const getAddressAbsolute = (state, cycles) => {
  const address = state.readMem(state.readMem(state.PC + 1) + (state.readMem(state.PC + 2) << 8));
  state.PC += 2;
  state.CYC += cycles;
  return address;
}

const getAddressZeroPage = (state, cycles) => {
  const address = state.readMem(state.PC + 1);
  state.PC += 2;
  state.CYC += cycles;
  return address;
}

const getAddressZeroPageOffset = (state, offset, cycles) => {
  const address = state.readMem((state.readMem(state.PC + 1) + offset) % 256);
  state.PC += 2;
  state.CYC += cycles;
  return address;
}

const getAddressAbsoluteWithOffset4PlusCycles = (state, offset) => {
  const base = state.readMem(state.PC + 1) + (state.readMem(state.PC + 2) << 8);
  const address = base + offset;

  state.CYC += 4;

  if (!onSamePageBoundary(base, address)) {
    state.CYC += 1;
  }

  state.PC += 2;

  return address;
}

const getAddressAbsoluteWithOffset = (state, offset, cycles) => {
  const base = state.readMem(state.PC + 1) + (state.readMem(state.PC + 2) << 8);
  const address = base + offset;

  state.CYC += cycles;
  state.PC += 2;

  return address;
}


export const getAddressIndirectX6Cycles = (state) => {
  const offset = state.readMem(state.PC + 1);
  const addressLocation = (state.X + offset) % 256;
  const address = state.readMem(addressLocation + 1) + (state.readMem(addressLocation + 2) << 8);

  state.CYC += 6;

  return address;
}

export const getAddressIndirectY5PlusCycles = (state) => {
  const zeroPageAddress = state.readMem(state.PC + 1);
  const base = state.readMem(zeroPageAddress + 1) + (state.readMem(zeroPageAddress + 2) << 8);
  const address = base + state.Y;
  state.CYC += 5;

  if (!onSamePageBoundary(base, address)) {
    state.CYC += 1;
  }

  return address;
}

export const getAddressIndirect6Cycles = (state, cycles) => {
  const zeroPageAddress = state.readMem(state.PC + 1);
  const base = state.readMem(zeroPageAddress + 1) + (state.readMem(zeroPageAddress + 2) << 8);
  const address = base + state.Y;
  state.CYC += cycles
  return address;
}

// Read functions
export const readImmediate2Cycles = state => state.readMem(getAddressImmediate2Cycles(state))

export const readAbsolute4Cycles = state => state.readMem(getAddressAbsolute(state, 4))
export const readAbsolute6Cycles = state => state.readMem(getAddressAbsolute(state, 6))

export const readZeroPage3Cycles = state => state.readMem(getAddressZeroPage(state, 3))
export const readZeroPage5Cycles = state => state.readMem(getAddressZeroPage(state, 5))

export const readZeroPageX4Cycles = state => state.readMem(getAddressZeroPageOffset(state, state.X, 4))
export const readZeroPageX6Cycles = state => state.readMem(getAddressZeroPageOffset(state, state.X, 6))

export const readZeroPageY4Cycles = state => state.readMem(getAddressZeroPageOffset(state, state.Y, 4))


export const readAbsoluteX4PlusCycles = state => state.readMem(getAddressAbsoluteWithOffset4PlusCycles(state, state.X))
export const readAbsoluteX5Cycles = state => state.readMem(getAddressAbsoluteWithOffset(state, state.X, 5))
export const readAbsoluteX7Cycles = state => state.readMem(getAddressAbsoluteWithOffset(state, state.X, 7))

export const readAbsoluteY4PlusCycles = state => state.readMem(getAddressAbsoluteWithOffset4PlusCycles(state, state.Y))
export const readAbsoluteY5Cycles = state => state.readMem(getAddressAbsoluteWithOffset(state, state.Y, 5))

export const readIndirectX6Cycles = state => state.readMem(getAddressIndirectX6Cycles(state))

export const readIndirectY5PlusCycles = state => state.readMem(getAddressIndirectY5PlusCycles(state))
export const readIndirectY6Cycles = state => state.readMem(getAddressIndirect6Cycles(state))

// Write functions

export const writeImmediate2Cycles = (state, value) => state.setMem(getAddressImmediate2Cycles(state), value)

export const writeAbsolute4Cycles = (state, value) => state.setMem(getAddressAbsolute(state, 4), value)
export const writeAbsolute6Cycles = (state, value) => state.setMem(getAddressAbsolute(state, 6), value)

export const writeZeroPage3Cycles = (state, value) => state.setMem(getAddressZeroPage(state, 3), value)
export const writeZeroPage5Cycles = (state, value) => state.setMem(getAddressZeroPage(state, 5), value)

export const writeZeroPageX4Cycles = (state, value) => state.setMem(getAddressZeroPageOffset(state, state.X, 4), value)
export const writeZeroPageX6Cycles = (state, value) => state.setMem(getAddressZeroPageOffset(state, state.X, 6), value)

export const writeZeroPageYCycles = (state, value) => state.setMem(getAddressZeroPageOffset(state, state.Y, 4), value)

export const writeAbsoluteX4PlusCycles = (state, value) => state.setMem(getAddressAbsoluteWithOffset4PlusCycles(state, state.X), value)
export const writeAbsoluteX5Cycles = (state, value) => state.setMem(getAddressAbsoluteWithOffset(state, state.X, 5), value)
export const writeAbsoluteX7Cycles = (state, value) => state.setMem(getAddressAbsoluteWithOffset(state, state.X, 7), value)

export const writeAbsoluteY4PlusCycles = (state, value) => state.setMem(getAddressAbsoluteWithOffset4PlusCycles(state, state.Y), value)
export const writeAbsoluteY5Cycles = (state, value) => state.setMem(getAddressAbsoluteWithOffset(state, state.Y, 5), value)

export const writeIndirectX6Cycles = (state, value) => state.setMem(getAddressIndirectX6Cycles(state), value)

export const writeIndirectY5PlusCycles = (state, value) => state.setMem(getAddressIndirectY5PlusCycles(state), value)
export const writeIndirectY6Cycles = (state, value) => state.setMem(getAddressIndirect6Cycles(state), value)
