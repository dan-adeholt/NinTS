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

export const writeStackByte = (state, sp, value) => {
  writeByte(state, 0x100 + sp, value);
}

export const readStackByte = (state, sp) => {
  return readByte(state, 0x100 + sp);
}

export const writeByte = (state, address, value) => {
  state.CYC++;
  return setMem(state, address, value);
}

export const readByte = (state, address) => {
  state.CYC++;
  return readMem(state, address);
}

export const readWord = (state, address) => {
  return readByte(state, address) + (readByte(state, address + 1) << 8);
}

// Read address functions - these read an address and updates the PC and CYC values accordingly
export const readAddressImmediate = (state) => {
  const address = state.PC + 1;
  state.PC += 2;
  return address;
}

export const readAddressAbsolute = (state) => {
  const address = readWord(state, state.PC + 1);
  state.PC += 3;
  return address;
}

const _readAddressAbsoluteWithOffset = (state, offset, shortenCycle) => {
  const base = readWord(state, state.PC + 1);
  const address = (base + offset) & 0xFFFF;

  if (!onSamePageBoundary(base, address) || !shortenCycle) {
    state.CYC ++;
  }

  state.PC += 3;

  return address;
}

export const readAddressAbsoluteX = (state) => _readAddressAbsoluteWithOffset(state, state.X, false)
export const readAddressAbsoluteY = (state) => _readAddressAbsoluteWithOffset(state, state.Y, false)

export const readAddressZeroPage = (state) => {
  const address = readByte(state, state.PC + 1);
  state.PC += 2;
  return address;
}

const _readAddressZeroPageOffset = (state, offset) => {
  const address = (readByte(state, state.PC + 1) + offset) % 256;
  state.CYC++;
  state.PC += 2;
  return address;
}

export const readAddressZeroPageX = (state) => _readAddressZeroPageOffset(state, state.X)
export const readAddressZeroPageY = (state) => _readAddressZeroPageOffset(state, state.Y)
export const readAddressAbsoluteXWithPageBoundaryCycle = state => _readAddressAbsoluteWithOffset(state, state.X, true)
export const readAddressAbsoluteYWithPageBoundaryCycle = state => _readAddressAbsoluteWithOffset(state, state.Y, true)

export const readAddressIndirectX = (state) => {
  const offset = readByte(state, state.PC + 1);
  state.CYC++;
  const addressLocation = (state.X + offset) % 256;
  const address = readByte(state, addressLocation) + (readByte(state, (addressLocation + 1) % 256) << 8);

  state.PC += 2;

  return address;
}

const _readAddressIndirectYWithPenaltyCycle = (state, shortenCycle) => {
  const zeroPageAddress = readByte(state, state.PC + 1)
  const base = readByte(state, zeroPageAddress) + (readByte(state, (zeroPageAddress + 1) % 256) << 8);
  const address = (base + state.Y) & 0xFFFF;
  state.PC += 2;

  if (!onSamePageBoundary(base, address) || !shortenCycle) {
    state.CYC ++;
  }

  return address;
}

export const readAddressIndirectYWithPageBoundaryCycle = (state) => _readAddressIndirectYWithPenaltyCycle(state, true)
export const readAddressIndirectY = (state) => _readAddressIndirectYWithPenaltyCycle(state, false)
