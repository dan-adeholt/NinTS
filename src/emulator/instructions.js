import { onSamePageBoundary, popStack, pushStack, pushStackWord, readByte, readWord, writeByte } from './memory';

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
export const setDecimal = (state, on) => setFlag(state, P_REG_DECIMAL, P_MASK_DECIMAL, on);
export const setBreak = (state, on) => setFlag(state, P_REG_BREAK, P_MASK_BREAK, on);
export const setAlwaysOne = (state) => setFlag(state, P_REG_ALWAYS_1, P_MASK_ALWAYS_1, true);

const setY = (state, value) => state.Y = value
const setX = (state, value) => state.X = value
const setA = (state, value) => state.A = value
const setAX = (state, value) => state.A = state.X = value


/**
 * Arithmetic and bitwise operations
 */
export const bit = (state, address) => {
  const value = readByte(state, address);
  setZero(state, value & state.A);
  const upperBits = value & P_REGS_OVERFLOW_AND_NEGATIVE;
  const lowerBits = state.P & P_MASK_OVERFLOW_AND_NEGATIVE;
  state.P = upperBits | lowerBits;
}

const performADC = (state, value) => {
  const result = state.A + value + (state.P & P_REG_CARRY);
  const resultByte = (result & 0xFF);

  setOverflow(state, state.A, value, resultByte);
  state.A = resultByte;
  setCarry(state, result > 0xFF);
  setZeroNegative(state, state.A);
}

const performEOR = (state, value) => setZeroNegative(state, state.A ^= value);
const performSBC = (state, value) => performADC(state, value ^ 0xFF)
const performORA = (state, value) => setZeroNegative(state, state.A |= value)
const performAND = (state, value) => setZeroNegative(state, state.A &= value);

export const eor = (state, address) => performEOR(state, readByte(state, address))
export const ora = (state, address) => performORA(state, readByte(state, address));
export const adc = (state, address) => performADC(state, readByte(state, address))
export const sbc = (state, address) => performSBC(state, readByte(state, address));
export const and = (state, address) => performAND(state, readByte(state, address));
export const slo = (state, address) => performORA(state, asl(state, address));

// Illegal instruction. AND:s byte with accumulator. If the result is negative then carry is set.
export const aac = (state, address) => {
  state.A &= readByte(state, address);
  setZeroNegative(state, state.A);
  setCarry(state, isNegative(state.A));
};

// ARR - Illegal instruction - AND:s byte with accumulator, then rotates one bit right in accumulator and updates C/V based on bits 5 and 6.
export const arr = (state, address) => {
  const value = readByte(state, address);
  const oldCarry = state.P & P_REG_CARRY;
  const result = state.A & value;
  state.A = ((result >> 1) & BIT_7_MASK) | (oldCarry << 7);
  setZeroNegative(state, state.A);
  const bit5 = (state.A & 0b00100000) >> 5;
  const bit6 = (state.A & 0b01000000) >> 6;
  setCarry(state, bit6);
  setOverflowValue(state, bit5 ^ bit6);
}

// ISB - Illegal instruction
export const isb = (state, address) => {
  let value = (readByte(state, address) + 1) & 0xFF;
  state.CYC++;
  writeByte(state, address, value);
  performSBC(state, value);
}

/**
 *  Read-Modify-Write operations
 */

const performLSR = (state, value) => {
  setCarry(state, value & 0x1);
  const newValue = value >> 1;
  setZeroNegative(state, newValue);
  return newValue;
}

const performROL = (state, value) => {
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, (value & BIT_7) >> 7);
  const newValue = ((value << 1) & 0xFF) | oldCarry
  setZeroNegative(state, newValue);
  return newValue;
}

const performINC = (state, value) => {
  const newValue = (value + 1) & 0xFF;
  setZeroNegative(state, newValue);
  return newValue;
}

const performDEC = (state, value) => {
  const newValue = (value - 1) & 0xFF;
  setZeroNegative(state, newValue);
  return newValue;
}

const performROR = (state, value) => {
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, value & 0x1);
  const newValue = ((value >> 1) & BIT_7_MASK) | (oldCarry << 7);
  setZeroNegative(state, newValue);
  return newValue;
}

const performASL = (state, value) => {
  setCarry(state, value & BIT_7); // Copy last bit to carry flag
  const newValue = (value << 1) & 0xFF;
  setZeroNegative(state, newValue);
  return newValue;
}

const rmwA = (state, value) => {
  state.CYC++;
  state.A = value;
}

const rmw = (state, address, value) => {
  state.CYC++;
  return writeByte(state, address, value);
}

export const aslA = (state) => rmwA(state, performASL(state, state.A))
export const lsrA = (state) => rmwA(state, performLSR(state, state.A))
export const rolA = (state) => rmwA(state, performROL(state, state.A))
export const rorA = (state) => rmwA(state, performROR(state, state.A))
export const asl = (state, address) => rmw(state, address, performASL(state, readByte(state, address)));
export const lsr = (state, address) => rmw(state, address, performLSR(state, readByte(state, address)));
export const rol = (state, address) => rmw(state, address, performROL(state, readByte(state, address)));
export const ror = (state, address) => rmw(state, address, performROR(state, readByte(state, address)));
export const inc = (state, address) => rmw(state, address, performINC(state, readByte(state, address)));
export const dec = (state, address) => rmw(state, address, performDEC(state, readByte(state, address)));

// RLA - Illegal instruction. ROL value at address and then AND with result.
export const rla = (state, address) => performAND(state, rol(state, address));

// RRA (illegal instruction) - Perform ROR and then ADC the result
export const rra = (state, address) => performADC(state, ror(state, address));

// ASR (illegal instruction) - AND byte with accumulator then shift bits right one bit in accumulator.
export const asr = (state, address) => state.A = performLSR(state, performAND(state, readByte(state, address)));

// ATX - illegal instruction. Some sites claims this instruction AND:s the value in A before copying it to A and X.
// However, blarggs instruction tests simply set the values. We match that behavior.
export const atx = (state, address) => {
  state.A = state.X = readByte(state, address);
  setZeroNegative(state, state.A);
};

// AXS - illegal instruction. AND:s X register with the accumulator and stores result in X register, then
// subtracts read byte from memory from the X register - without borrow.
export const axs = (state, address) => {
  const value = readByte(state, address);
  let andResult = state.A & state.X;
  const result = andResult + (value ^ 0xFF) + 1;
  state.X = result & 0xFF;
  setCarry(state, result > 0xFF);
  setZeroNegative(state, state.X);
};

/**
 * Compare instructions
 */
const performCompare = (state, value, register) => {
  let diff = register + (value ^ 0xFF) + 1;
  setCarry(state, diff > 0xFF);
  setZeroNegative(state, diff & 0xFF);
}

export const cmp = (state, address) => performCompare(state, readByte(state, address), state.A)
export const cpx = (state, address) => performCompare(state, readByte(state, address), state.X)
export const cpy = (state, address) => performCompare(state, readByte(state, address), state.Y)

// DCP - illegal instruction. Decrement value at memory and then compare.
export const dcp = (state, address) => performCompare(state, dec(state, address), state.A);

/**
 *  Load instructions - load value from memory into registers.
 */
const ld = (state, address, setter) => {
  const val = setter(state, readByte(state, address))
  setZeroNegative(state, val);
}

export const lax = (state, address) => ld(state, address, setAX)
export const lda = (state, address) => ld(state, address, setA)
export const ldx = (state, address) => ld(state, address, setX)
export const ldy = (state, address) => ld(state, address, setY)

/**
 * Register update instructions.
 */
const writeRegister = (state, value, setter) => {
  state.CYC++;
  setZeroNegative(state, value);
  setter(state, value);
}

export const iny = state => writeRegister(state, (state.Y + 1) & 0xFF, setY);
export const dey = state => writeRegister(state, (state.Y - 1) & 0xFF, setY);
export const tay = state => writeRegister(state, state.A, setY);
export const inx = state => writeRegister(state, (state.X + 1) & 0xFF, setX)
export const dex = state => writeRegister(state, (state.X - 1) & 0xFF, setX)
export const tax = state => writeRegister(state, state.A, setX);
export const tsx = state => writeRegister(state, state.SP, setX)
export const txa = state => writeRegister(state, state.X, setA)
export const tya = state => writeRegister(state, state.Y, setA)

export const txs = state => {
  state.CYC++;
  state.SP = state.X;
}

/**
 * NOP instructions
 */

export const nop = (state) => state.CYC++;
export const unofficialNop = (state, address) => readByte(state, address)


/**
 * Store related functions
 */

export const sta = (state, address) => writeByte(state, address, state.A)
export const stx = (state, address) => writeByte(state, address, state.X)
export const sty = (state, address) => writeByte(state, address, state.Y)

// Used for illegal instruction SXA and SYA. Making the write only if base and address is on same page
// is the way to make blargg tests pass.
const s_a = (state, offset, register) => {
  const base = readWord(state, state.PC);
  const address = (base + offset) & 0xFFFF;

  if (onSamePageBoundary(base, address)) {
    let hi = (address & 0xFF00) >> 8;
    hi = (hi + 1) & 0xFF;
    writeByte(state, address, register & hi);
  } else {
    state.CYC++;
  }

  state.PC += 2;
}

export const sxa = state => s_a(state, state.Y, state.X)
export const sya = state => s_a(state, state.X, state.Y)

// Illegal instruction. AND X and A and store to memory
export const sax = (state, address) => writeByte(state, address, state.X & state.A);
// Illegal instruction. LSR value at address and then EOR result.
export const sre = (state, address) => performEOR(state, lsr(state, address));

/**
 * Flag (Processor Status) Instructions
 */

const writeFlag = (state, flagFunction, on) => {
  flagFunction(state, on);
  state.CYC++;
}

const clearFlag = (state, mask) => {
  state.P = state.P & mask;
  state.CYC++;
}

export const clc = state => clearFlag(state, P_MASK_CARRY);
export const cld = state => clearFlag(state, P_MASK_DECIMAL);
export const cli = state => clearFlag(state, P_MASK_INTERRUPT);
export const clv = state => clearFlag(state, P_MASK_OVERFLOW)
export const sed = state => writeFlag(state, setDecimal, true)
export const sei = state => writeFlag(state, setInterrupt, true)
export const sec = state => writeFlag(state, setCarry, true)

/**
 * Stack functions
 */
export const pla = state => {
  state.CYC++;
  state.CYC++;
  state.A = popStack(state);
  setZeroNegative(state, state.A);
}

export const plp = state => {
  state.CYC++;
  state.CYC++;
  state.P = popStack(state);
  setBreak(state, false); // See http://wiki.nesdev.com/w/index.php/Status_flags
  setAlwaysOne(state);
};

export const pha = state => {
  state.CYC++;
  pushStack(state, state.A);
};

export const php = state => {
  state.CYC++;
  pushStack(state, state.P | P_REG_BREAK);
}

/**
 *  Return instructions
 */

export const rti = state => {
  state.CYC++;
  state.CYC++;
  state.P = popStack(state);
  setBreak(state, false); // See http://wiki.nesdev.com/w/index.php/Status_flags
  setAlwaysOne(state);
  const low = popStack(state);
  const high = popStack(state);
  state.PC = (low | (high << 8));
}

export const rts = state => {
  state.CYC++;
  state.CYC++;
  const low = popStack(state);
  const high = popStack(state);
  state.CYC++;
  state.PC = (low | (high << 8)) + 1;
}

export const brk = state => {
  state.CYC++;
  pushStackWord(state, state.PC + 1);
  pushStack(state, state.P | P_REG_BREAK);
  setInterrupt(state, true);
  state.PC = readWord(state, 0xFFFE);
}

/**
 * Jump instructions
 */
export const jmp = (state, address) => state.PC = address

export const jsr = state => {
  const low = readByte(state, state.PC);
  state.CYC++;

  const jumpBackAddress = state.PC + 1; // Next instruction - 1

  pushStackWord(state, jumpBackAddress);
  const high = readByte(state, jumpBackAddress);
  state.PC = low + (high << 8);
}

/**
 * Branch instructions. They are all implemented the same way apart from the condition on which the branch is predicated.
 */
const branch = (state, address, shouldBranch) => {
  let offset = readByte(state, address);

  if (shouldBranch) {
    let offsetSigned = offset > 0x7F ? offset - 256 : offset;
    const jumpLocation = state.PC + offsetSigned;
    state.CYC++;

    if (!onSamePageBoundary(state.PC, jumpLocation)) {
      state.CYC++;
    }

    state.PC = jumpLocation;
  }
}

export const bcc = (state, address) => branch(state, address, !(state.P & P_REG_CARRY ));
export const beq = (state, address) => branch(state, address, state.P & P_REG_ZERO);
export const bne = (state, address) => branch(state, address, !(state.P & P_REG_ZERO));
export const bcs = (state, address) => branch(state, address, state.P & P_REG_CARRY);
export const bvc = (state, address) => branch(state, address, !(state.P & P_REG_OVERFLOW));
export const bvs = (state, address) => branch(state, address, state.P & P_REG_OVERFLOW);
export const bpl = (state, address) => branch(state, address, !(state.P & P_REG_NEGATIVE));
export const bmi = (state, address) => branch(state, address, state.P & P_REG_NEGATIVE);
