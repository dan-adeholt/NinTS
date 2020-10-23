const PAGE_SIZE = 256;
export const PAGE_MASK = ~(0xFF);

export const onSamePageBoundary = (a1, a2) => {
  return (a1 ^ a2) < PAGE_SIZE;
};

export const BIT_7 = 1 << 7;
export const BIT_7_MASK = ~BIT_7;

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

export const P_MASK_CARRY = ~P_REG_CARRY;
export const P_MASK_ZERO = ~P_REG_ZERO;
export const P_MASK_INTERRUPT = ~P_REG_INTERRUPT;
export const P_MASK_DECIMAL = ~P_REG_DECIMAL;
export const P_MASK_BREAK = ~P_REG_BREAK;
export const P_MASK_ALWAYS_1 = ~P_REG_ALWAYS_1;
export const P_MASK_OVERFLOW = ~P_REG_OVERFLOW;
export const P_MASK_NEGATIVE = ~P_REG_NEGATIVE;

export const clampToByte = (value) => {
  let newValue = value;

  if (newValue < 0) {
    while(newValue < 0) {
      newValue += 0xFF;
    }

    newValue++;
  }

  newValue = newValue & 0xFF;

  return newValue;
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

// Overflow is set if Positive + Positive = Negative or Negative + Negative = Positive
// Check this by comparing the high bits of the result.
export const setOverflow = (state, accumulator, value, result) => setFlag(state, P_REG_OVERFLOW, P_MASK_OVERFLOW, (accumulator ^ result) & (value ^ result) & 0x80);
export const setInterrupt = (state, on) => setFlag(state, P_REG_INTERRUPT, P_MASK_INTERRUPT, on);
export const setDecimal = (state, on) => setFlag(state, P_REG_DECIMAL, P_MASK_DECIMAL, on);
export const setBreak = (state, on) => setFlag(state, P_REG_BREAK, P_MASK_BREAK, on);
export const setAlwaysOne = (state) => setFlag(state, P_REG_ALWAYS_1, P_MASK_ALWAYS_1, true);

// Get address functions - these merely fetch the values without updating anything
export const getAddressAbsolute = state => {
  return state.readMem(state.PC + 1) + (state.readMem(state.PC + 2) << 8);
}

export const getAddressZeroPage = (state) => {
  return state.readMem(state.PC + 1);
}

// Read address functions - these read an address and updates the PC and CYC values accordingly

const readAddressImmediate = (state, cycles) => {
  const address = state.PC + 1;
  state.PC += 2;
  state.CYC += cycles;
  return address;
}

export const readAddressAbsolute = (state, cycles) => {
  const address = getAddressAbsolute(state);
  state.PC += 3;
  state.CYC += cycles;
  return address;
}

const _readAddressAbsoluteWithOffset = (state, offset, cycles) => {
  const base = getAddressAbsolute(state);
  const address = (base + offset) & 0xFFFF;

  state.CYC += cycles;
  state.PC += 3;

  return address;
}

export const readAddressAbsoluteX = (state, cycles) => _readAddressAbsoluteWithOffset(state, state.X, cycles)
export const readAddressAbsoluteY = (state, cycles) => _readAddressAbsoluteWithOffset(state, state.Y, cycles)

export const readAddressZeroPage = (state, cycles) => {
  const address = getAddressZeroPage(state);
  state.PC += 2;
  state.CYC += cycles;
  return address;
}

const _readAddressZeroPageOffset = (state, offset, cycles) => {
  const address = (getAddressZeroPage(state) + offset) % 256;
  state.PC += 2;
  state.CYC += cycles;
  return address;
}

export const readAddressZeroPageX = (state, cycles) => _readAddressZeroPageOffset(state, state.X, cycles)
export const readAddressZeroPageY = (state, cycles) => _readAddressZeroPageOffset(state, state.Y, cycles)

const _readAddressAbsoluteWithOffsetAndPageBoundaryCycles = (state, offset, cycles) => {
  const base = getAddressAbsolute(state);
  const address = (base + offset) & 0xFFFF;

  state.CYC += cycles;

  if (!onSamePageBoundary(base, address)) {
    state.CYC += 1;
  }

  state.PC += 3;

  return address;
}

const readAddressAbsoluteXWithBoundaryCycles = (state, cycles) => _readAddressAbsoluteWithOffsetAndPageBoundaryCycles(state, state.X, cycles)
const readAddressAbsoluteYWithBoundaryCycles = (state, cycles) => _readAddressAbsoluteWithOffsetAndPageBoundaryCycles(state, state.Y, cycles)

export const readAddressIndirectX = (state, cycles) => {
  const offset = getAddressZeroPage(state);
  const addressLocation = (state.X + offset) % 256;
  const address = state.readMem(addressLocation) + (state.readMem((addressLocation + 1) % 256) << 8);

  state.CYC += cycles;
  state.PC += 2;

  return address;
}

const _readAddressIndirectYWithPenaltyCycle = (state, cycles, penaltyCycle) => {
  const zeroPageAddress = getAddressZeroPage(state);
  const base = state.readMem(zeroPageAddress) + (state.readMem((zeroPageAddress + 1) % 256) << 8);
  const address = (base + state.Y) & 0xFFFF;
  state.CYC += cycles;
  state.PC += 2;

  if (!onSamePageBoundary(base, address)) {
    state.CYC += penaltyCycle;
  }

  return address;
}

export const readAddressIndirectYWithPageBoundaryCycle = (state, cycles) => _readAddressIndirectYWithPenaltyCycle(state, cycles, 1)
export const readAddressIndirectY = (state, cycles) => _readAddressIndirectYWithPenaltyCycle(state, cycles, 0)

// Read functions
export const readValueImmediate = (state, cycles) => state.readMem(readAddressImmediate(state, cycles))
export const readValueAbsolute = (state, cycles) => state.readMem(readAddressAbsolute(state, cycles))
export const readValueZeroPage = (state, cycles) => state.readMem(readAddressZeroPage(state, cycles))
export const readValueZeroPageX = (state, cycles) => state.readMem(readAddressZeroPageX(state, cycles))
export const readValueZeroPageY = (state, cycles) => state.readMem(readAddressZeroPageY(state, cycles))
export const readValueAbsoluteXWithPageBoundaryCycle = (state, cycles) => state.readMem(readAddressAbsoluteXWithBoundaryCycles(state, cycles))
export const readValueAbsoluteYWithPageBoundaryCycle = (state, cycles) => state.readMem(readAddressAbsoluteYWithBoundaryCycles(state, cycles))
export const readValueIndirectX = (state, cycles) => state.readMem(readAddressIndirectX(state, cycles))
export const readValueIndirectYWithPageBoundaryCycle = (state, cycles) => state.readMem(readAddressIndirectYWithPageBoundaryCycle(state, cycles))

// Write functions
export const writeValueAbsolute = (state, value, cycles) => state.setMem(readAddressAbsolute(state, cycles), value)
export const writeValueZeroPage = (state, value, cycles) => state.setMem(readAddressZeroPage(state, cycles), value)
export const writeValueZeroPageX = (state, value, cycles) => state.setMem(readAddressZeroPageX(state, cycles), value)
export const writeValueZeroPageY = (state, value, cycles) => state.setMem(readAddressZeroPageY(state, cycles), value)
export const writeValueAbsoluteX = (state, value, cycles) => state.setMem(readAddressAbsoluteX(state, cycles), value)
export const writeValueAbsoluteY = (state, value, cycles) => state.setMem(readAddressAbsoluteY(state, cycles), value)
export const writeValueIndirectX = (state, value, cycles) => state.setMem(readAddressIndirectX(state, cycles), value)
export const writeValueIndirectY = (state, value, cycles) => state.setMem(readAddressIndirectY(state, cycles), value)
