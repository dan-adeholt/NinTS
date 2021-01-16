import { readMem, setMem } from '../emulator';

const PAGE_SIZE = 256;
export const PAGE_MASK = ~(0xFF);

export const onSamePageBoundary = (a1, a2) => {
  return (a1 ^ a2) < PAGE_SIZE;
};

export const BIT_7 = 0b10000000;
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

export const isNegative = value => value > 0x7F
export const setCarry = (state, on) => setFlag(state, P_REG_CARRY, P_MASK_CARRY, on);
export const setZero = (state, value) => setFlag(state, P_REG_ZERO, P_MASK_ZERO, value === 0);
export const setNegative = (state, value) => setFlag(state, P_REG_NEGATIVE, P_MASK_NEGATIVE, value > 0x7F);

// Overflow is set if Positive + Positive = Negative or Negative + Negative = Positive
// Check this by comparing the high bits of the result.
export const setOverflow = (state, accumulator, value, result) => setFlag(state, P_REG_OVERFLOW, P_MASK_OVERFLOW, (accumulator ^ result) & (value ^ result) & 0x80);
export const setOverflowValue = (state, on) => setFlag(state, P_REG_OVERFLOW, P_MASK_OVERFLOW, on);
export const setInterrupt = (state, on) => setFlag(state, P_REG_INTERRUPT, P_MASK_INTERRUPT, on);
export const setDecimal = (state, on) => setFlag(state, P_REG_DECIMAL, P_MASK_DECIMAL, on);
export const setBreak = (state, on) => setFlag(state, P_REG_BREAK, P_MASK_BREAK, on);
export const setAlwaysOne = (state) => setFlag(state, P_REG_ALWAYS_1, P_MASK_ALWAYS_1, true);

// Get address functions - these merely fetch the values without updating anything

export const getResetVectorAddress = state => {
  return readMem(state, 0xFFFC) + (readMem(state, 0xFFFD) << 8);
}

export const getAddressAbsolute = (state, pc) => {
  return readMem(state, pc + 1) + (readMem(state, pc + 2) << 8);
}

export const getAddressZeroPage = (state) => {
  return readMem(state, state.PC + 1);
}

// Read address functions - these read an address and updates the PC and CYC values accordingly
const readAddressImmediate = (state, cycles) => {
  const address = state.PC + 1;
  state.PC += 2;
  state.CYC += cycles;
  return address;
}

export const readAddressAbsolute = (state, cycles) => {
  const address = getAddressAbsolute(state, state.PC);
  state.PC += 3;
  state.CYC += cycles;
  return address;
}

const _readAddressAbsoluteWithOffset = (state, offset, cycles) => {
  const base = getAddressAbsolute(state, state.PC);
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
  const base = getAddressAbsolute(state, state.PC);
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
  const address = readMem(state, addressLocation) + (readMem(state, (addressLocation + 1) % 256) << 8);

  state.CYC += cycles;
  state.PC += 2;

  return address;
}

const _readAddressIndirectYWithPenaltyCycle = (state, cycles, penaltyCycle) => {
  const zeroPageAddress = getAddressZeroPage(state);
  const base = readMem(state, zeroPageAddress) + (readMem(state, (zeroPageAddress + 1) % 256) << 8);
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
export const readValueImmediate = (state, cycles) => readMem(state, readAddressImmediate(state, cycles))
export const readValueAbsolute = (state, cycles) => readMem(state, readAddressAbsolute(state, cycles))
export const readValueZeroPage = (state, cycles) => readMem(state, readAddressZeroPage(state, cycles))
export const readValueZeroPageX = (state, cycles) => readMem(state, readAddressZeroPageX(state, cycles))
export const readValueZeroPageY = (state, cycles) => readMem(state, readAddressZeroPageY(state, cycles))
export const readValueAbsoluteXWithPageBoundaryCycle = (state, cycles) => readMem(state, readAddressAbsoluteXWithBoundaryCycles(state, cycles))
export const readValueAbsoluteYWithPageBoundaryCycle = (state, cycles) => readMem(state, readAddressAbsoluteYWithBoundaryCycles(state, cycles))
export const readValueIndirectX = (state, cycles) => readMem(state, readAddressIndirectX(state, cycles))
export const readValueIndirectYWithPageBoundaryCycle = (state, cycles) => readMem(state, readAddressIndirectYWithPageBoundaryCycle(state, cycles))

// Write functions
