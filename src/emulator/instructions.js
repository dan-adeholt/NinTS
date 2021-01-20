import { readMem, setMem } from './emulator';

export const PAGE_MASK = ~(0xFF);

export const onSamePageBoundary = (a1, a2) => {
  return (a1 ^ a2) <= 0xFF;
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

const writeByte = (state, address, value) => {
  state.CYC++;
  return setMem(state, address, value);
}

const readByte = (state, address) => {
  state.CYC++;
  return readMem(state, address);
}

const readWord = (state, address) => {
  return readByte(state, address) + (readByte(state, address + 1) << 8);
}

// Read address functions - these read an address and updates the PC and CYC values accordingly
export const readAddressImmediate = (state) => {
  const address = state.PC;
  state.PC += 1;
  return address;
}

export const readAddressAbsolute = (state) => {
  const address = readWord(state, state.PC);
  state.PC += 2;
  return address;
}

const _readAddressAbsoluteWithOffset = (state, offset, shortenCycle) => {
  const base = readWord(state, state.PC);
  const address = (base + offset) & 0xFFFF;

  if (!onSamePageBoundary(base, address) || !shortenCycle) {
    state.CYC ++;
  }

  state.PC += 2;

  return address;
}

export const readAddressAbsoluteX = (state) => _readAddressAbsoluteWithOffset(state, state.X, false)
export const readAddressAbsoluteY = (state) => _readAddressAbsoluteWithOffset(state, state.Y, false)

export const readAddressZeroPage = (state) => {
  const address = readByte(state, state.PC);
  state.PC += 1;
  return address;
}

const _readAddressZeroPageOffset = (state, offset) => {
  const address = (readByte(state, state.PC) + offset) % 256;
  state.CYC++;
  state.PC += 1;
  return address;
}

export const readAddressZeroPageX = (state) => _readAddressZeroPageOffset(state, state.X)
export const readAddressZeroPageY = (state) => _readAddressZeroPageOffset(state, state.Y)
export const readAddressAbsoluteXWithPageBoundaryCycle = state => _readAddressAbsoluteWithOffset(state, state.X, true)
export const readAddressAbsoluteYWithPageBoundaryCycle = state => _readAddressAbsoluteWithOffset(state, state.Y, true)

export const readAddressIndirectX = (state) => {
  const offset = readByte(state, state.PC);
  state.CYC++;
  const addressLocation = (state.X + offset) % 256;
  const address = readByte(state, addressLocation) + (readByte(state, (addressLocation + 1) % 256) << 8);

  state.PC += 1;

  return address;
}

const _readAddressIndirectYWithPenaltyCycle = (state, shortenCycle) => {
  const zeroPageAddress = readByte(state, state.PC)
  const base = readByte(state, zeroPageAddress) + (readByte(state, (zeroPageAddress + 1) % 256) << 8);
  const address = (base + state.Y) & 0xFFFF;
  state.PC += 1;

  if (!onSamePageBoundary(base, address) || !shortenCycle) {
    state.CYC ++;
  }

  return address;
}

export const readAddressIndirectYWithPageBoundaryCycle = (state) => _readAddressIndirectYWithPenaltyCycle(state, true)
export const readAddressIndirectY = (state) => _readAddressIndirectYWithPenaltyCycle(state, false)

export const readOpcode = state => {
  const opcode = readByte(state, state.PC);
  state.PC++;
  return opcode;
}

export const popStack = (state) => {
  const ret = readByte(state, 0x100 + ((state.SP + 1) & 0xFF));
  state.SP = (state.SP + 1) & 0xFF;
  return ret;
}

export const pushStack = (state, value) => {
  writeByte(state, 0x100 + state.SP, value);
  state.SP = (state.SP - 1) & 0xFF;
}


/**
 * Illegal opcode. AND:s byte with accumulator. If the result is negative then carry is set.
 */
export const aac = (state, address) => {
  const result = state.A & readByte(state, address);
  state.A = result;
  setZero(state, result);
  setNegative(state, result);
  setCarry(state, isNegative(result));
};

/**
 * ADC - Add with Carry - [A,Z,C,N] = A+M+C
 */
const performADC = (state, value) => {
  const result = state.A + value + (state.P & P_REG_CARRY);
  const resultByte = (result & 0xFF);

  setOverflow(state, state.A, value, resultByte);
  state.A = resultByte & 0xFF;
  setCarry(state, result > 0xFF);
  setZero(state, resultByte);
  setNegative(state, resultByte);
}

export const adc = (state, address) => performADC(state, readByte(state, address))

/**
 * AND - Logical AND - [A,Z,N] = A & M
 */
export const performAND = (state, value) => {
  state.A = state.A & value;
  setZero(state, state.A);
  setNegative(state, state.A);
  return state.A;
};

export const and = (state, address) => performAND(state, readByte(state, address));


/**
 * ARR - Illegal opcode - AND:s byte with accumulator, then rotates one bit right in accumulator and updates C/V based on bits 5 and 6.
 *
 * Both bits == 1: set C, clear V
 * Both bits == 0: clear C and V
 * Bit 5 == 1 && Bit 6 === 0: set V, clear C.
 * Bit 5 == 0 && Bit 6 === 1: set C and V.
 */
export const arr = (state, address) => {
  const value = readByte(state, address);

  const oldCarry = state.P & P_REG_CARRY;
  const result = state.A & value;
  state.A = ((result >> 1) & BIT_7_MASK) | (oldCarry << 7);
  setZero(state, state.A);
  setNegative(state, state.A);
  const bit5 = (state.A & 0b00100000) >> 5;
  const bit6 = (state.A & 0b01000000) >> 6;
  setCarry(state, bit6);
  setOverflowValue(state, bit5 ^ bit6);
}


/**
 * ASL - Arithmetic Shift Left - [A,Z,C,N] = M*2, or [M,Z,C,N] = M*2
 */
export const aslA = (state) => {
  state.CYC++;
  setCarry(state, state.A & BIT_7); // Copy last bit to carry flag
  state.A = (state.A << 1) & 0xFF;
  setZero(state, state.A);
  setNegative(state, state.A);
}

export const asl = (state, address) => {
  const value = readByte(state, address);

  setCarry(state, value & BIT_7);
  const newValue = (value << 1) & 0xFF;
  state.CYC++;
  writeByte(state, address, newValue);
  setZero(state, newValue);
  setNegative(state, newValue);
  return newValue;
}


/**
 * ASR (illegal opcode) - AND byte with accumulator then shift bits right one bit in accumulator.
 */
export const asr = (state, address) => {
  state.A = performLSR(state, performAND(state, readByte(state, address)));
}


/**
 * ATX (illegal opcode)
 *
 * Some sites claims this opcode AND:s the value in A before transferring it to A and X.
 * However, blarggs instruction tests simply set the values. We match that behavior.
 */
export const atx = (state, address) => {
  state.A = readByte(state, address);
  state.X = state.A;
  setZero(state, state.A);
  setNegative(state, state.A);
};

/**
 * AXS (illegal opcode) - AND:s X register with the accumulator and stores result in X register, then
 * subtracts byte from the X register - without borrow.
 */
export const axs = (state, address) => {
  const value = readByte(state, address);

  let andResult = state.A & state.X;
  const result = andResult + (value ^ 0xFF) + 1;
  const resultByte = (result & 0xFF);
  state.X = result;
  setCarry(state, result > 0xFF);
  setZero(state, resultByte);
  setNegative(state, resultByte);
};

/**
 * BIT - Bit Test - A&M, N = M bit7, V = M bit6
 */
export const bit = (state, address) => {
  const value = readByte(state, address);

  if (value & state.A) {
    setZero(state, 1);
  } else {
    setZero(state, 0);
  }

  const upperBits = value & P_REGS_OVERFLOW_AND_NEGATIVE;
  const lowerBits = state.P & P_MASK_OVERFLOW_AND_NEGATIVE;
  state.P = upperBits | lowerBits;
}

/**
 * Helper function for various branch related instructions. They are all implemented the same way apart
 * from the condition on which the branch is predicated.
 */
const branch = (state, shouldBranch) => {
  let offset = readByte(state, state.PC);

  if (offset > 0x7F) {
    offset -= 256;
  }

  const nextInstruction = state.PC + 1;
  const jumpInstruction = state.PC + 1 + offset;

  if (shouldBranch) {
    state.CYC++;

    if (!onSamePageBoundary(nextInstruction, jumpInstruction)) {
      state.CYC++;
    }

    state.PC = jumpInstruction;
  } else {
    state.PC = nextInstruction;
  }
}

/**
 * Helper function for clear related instructions. Clears specific bits in the P register based on the supplied mask.
 */
const clear = (state, mask) => {
  state.P = state.P & mask;
  state.CYC++;
}

/**
 * CLC - Clear Carry Flag - P[C] = 0 - Sets the carry flag to zero.
 */
export const clc = state => clear(state, P_MASK_CARRY);

/**
 * CLD - Clear Decimal Mode - P[D] = 0 - Sets the decimal flag to zero (no decimal mode on NES)
 */
export const cld = state => clear(state, P_MASK_DECIMAL);

/**
 * CLI - Clear Interrupt Disable - P[I] = 0 - Sets the interrupt disable flag to 0 which allows normal interrupt requests to be handled.
 */
export const cli = state => clear(state, P_MASK_INTERRUPT);

/**
 * CLV - Clear Overflow Flag - P[O] = 0 - Sets the overflow flag to 0.
 */
export const clv = state => clear(state, P_MASK_OVERFLOW)

/**
 * Helper function for various compare related options.
 */
const performCompare = (state, value, register) => {
  let diff = register + (value ^ 0xFF) + 1;
  const diffByte = (diff & 0xFF);
  setCarry(state, diff > 0xFF);
  setZero(state, diffByte);
  setNegative(state, diffByte);
}

const compare = (state, address, register) => {
  const value = readByte(state, address);

  performCompare(state, value, register);
}

/**
 * CMP - Compare - Compares the accumulator with another value in memory and sets the zero and carry flags accordingly.
 */
export const cmp = (state, address) => compare(state, address, state.A)

/**
 * CPX - Compare X Register - Compares X with another value in memory and sets the zero and carry flags accordingly.
 */
export const cpx = (state, address) => compare(state, address, state.X)

/**
 * CPY - Compare Y Register - Compares Y with another value in memory and sets the zero and carry flags accordingly.
 */
export const cpy = (state, address) => compare(state, address, state.Y)

/**
 * DEC - Decrement Memory - [M, Z, N] = M - 1
 */
export const dec = (state, address) => {
  let value = (readByte(state, address) - 1) & 0xFF;

  state.CYC++;
  writeByte(state, address, value);
  setZero(state, value);
  setNegative(state, value);
  return value;
}
/**
 * DCP - Illegal opcode - DEC:s the value at a memory location and then CMP:s the result.
 */
export const dcp = (state, address) => performCompare(state, dec(state, address), state.A);

/**
 * EOR - Exclusive OR - [A, Z, N] = A ^ M
 */
const performEOR = (state, value) => {
  const result = state.A ^ value;
  state.A = result;
  setZero(state, result);
  setNegative(state, result);
};

export const eor = (state, address) => performEOR(state, readByte(state, address))

/**
 * INC - Increment Memory - [M, Z, N] = M + 1
 */
export const inc = (state, address) => {
  const value = (readByte(state, address) + 1) & 0xFF;
  state.CYC++;
  writeByte(state, address, value);
  setZero(state, value);
  setNegative(state, value);
}

/**
 * ISB - Illegal opcode - Add one to value at memory address then subtract memory from accumulator with borrow.
 */
export const isb = (state, address) => {
  let value = (readByte(state, address) + 1) & 0xFF;
  state.CYC++;
  writeByte(state, address, value);
  performSBC(state, value);
}

/**
 * LAX - Illegal opcode - Store value into both A and X registers.
 */
export const lax = (state, address) => {
  state.X = readByte(state, address);
  state.A = state.X;
  setNegative(state, state.X);
  setZero(state, state.X);
}

/**
 * LDA - Load Accumulator - [A, Z, N] = M
 */
export const lda = (state, address) => {
  state.A = readByte(state, address);
  setZero(state, state.A);
  setNegative(state, state.A);
};

/**
 * LDX - Load X - [X,Z,N] = M
 */
export const ldx = (state, address) => {
  state.X = readByte(state, address);
  setZero(state, state.X);
  setNegative(state, state.X);
};

/**
 * LDY - Load Y - [Y, Z, N] = M
 */
export const ldy = (state, address) => {
  state.Y = readByte(state, address);
  setZero(state, state.Y);
  setNegative(state, state.Y);
};

/**
 * LSR - Logical Shift Right -  [A, C, Z, N] = A / 2 or [M, C, Z, N] = M / 2
 */
const performLSR = (state, value) => {
  setCarry(state, value & 0x1);
  const newValue = value >> 1;
  setZero(state, newValue);
  setNegative(state, newValue);
  return newValue;
}

export const lsrA = (state) => {
  state.CYC++;
  state.A = performLSR(state, state.A);
}

export const lsr = (state, address) => {
  const newValue = performLSR(state, readByte(state, address));
  state.CYC++;
  writeByte(state, address, newValue);
  return newValue;
}

/**
 * NOP - No Operation - Just increment PC.
 */

export const nop = (state) => state.CYC++;

/**
 * ORA - Logical Inclusive OR - [A, Z, N] = A | M
 */
const performORA = (state, value) => {
  const result = state.A | value;
  state.A = result;
  setZero(state, result);
  setNegative(state, result);
};

export const ora = (state, address) => performORA(state, readByte(state, address));

// Helper method for various register transfer/increment instructions
const setRegister = (state, value, setter) => {
  state.CYC++;
  setZero(state, value);
  setNegative(state, value);
  setter(state, value);
}

/**
 * INY - Increment Y Register - [Y, Z, N] = Y + 1
 */
export const iny = state => setRegister(state, (state.Y + 1) & 0xFF, setY);

/**
 * DEY - Decrement Y Register - [Y, Z, N] = Y + 1
 */
export const dey = state => setRegister(state, (state.Y - 1) & 0xFF, setY);

/**
 * TAY - Transfer Accumulator to Y - Y = A
 */
export const tay = state => setRegister(state, state.A, setY);

/**
 * INX - Increment X Register - [X, Z, N] = X + 1
 */
export const inx = state => setRegister(state, (state.X + 1) & 0xFF, setX)

/**
 * DEX - Decrement X Register - [X, Z, N] = X + 1
 */
export const dex = state => setRegister(state, (state.X - 1) & 0xFF, setX)

/**
 * TAX - Transfer Accumulator to X - X = A
 */
export const tax = state => setRegister(state, state.A, setX);

/**
 * TSX - Transfer Stack Pointer to X - X = S
 */
export const tsx = state => setRegister(state, state.SP, setX)

/**
 * TXA - Transfer X to Accumulator - A = X
 */
export const txa = state => setRegister(state, state.X, setA)

/**
 * TYA - Transfer Y to Accumulator - A = Y
 */
export const tya = state => setRegister(state, state.Y, setA)

const setY = (state, value) => state.Y = value
const setX = (state, value) => state.X = value
const setA = (state, value) => state.A = value

export const rla = (state, address) => performAND(state, rol(state, address));

export const rolA = (state) => {
  state.CYC++;
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, (state.A & BIT_7) >> 7);
  state.A = ((state.A << 1) & 0xFF) | oldCarry;
  setZero(state, state.A);
  setNegative(state, state.A);
}

export const rol = (state, address) => {
  const value = readByte(state, address);

  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, (value & BIT_7) >> 7);
  const newValue = ((value << 1) & 0xFF) | oldCarry;
  state.CYC++;
  writeByte(state, address, newValue);
  setZero(state, newValue);
  setNegative(state, newValue);
  return newValue;
}

export const rorA = (state) => {
  state.CYC++;
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, state.A & 0x1);
  state.A = ((state.A >> 1) & BIT_7_MASK) | (oldCarry << 7);
  setZero(state, state.A);
  setNegative(state, state.A);
}

export const ror = (state, address) => {
  const value = readByte(state, address);

  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, value & 0x1);
  const newValue = ((value >> 1) & BIT_7_MASK) | (oldCarry << 7);
  state.CYC++;
  writeByte(state, address, newValue);
  setZero(state, newValue);
  setNegative(state, newValue);
  return newValue;
}

export const rra = (state, address) => performADC(state, ror(state, address));
export const sax = (state, address) => writeByte(state, address, state.X & state.A);

const performSBC = (state, value) => performADC(state, value ^ 0xFF)

export const sbc = (state, address) => performSBC(state, readByte(state, address));

export const slo = (state, address) => performORA(state, asl(state, address));

export const sre = (state, address) => performEOR(state, lsr(state, address));

export const sta = (state, address) => writeByte(state, address, state.A)

export const stx = (state, address) => writeByte(state, address, state.X)

export const sty = (state, address) => writeByte(state, address, state.Y)

const s_a = (state, offset, register) => {
  const base = readWord(state, state.PC);
  const address = (base + offset) & 0xFFFF;

  if (onSamePageBoundary(base, address)) {
    let hi = (address & 0xFF00) >> 8;
    hi = (hi + 1) & 0xFF;
    const result = register & hi;
    writeByte(state, address, result);
  } else {
    state.CYC++;
  }

  state.PC += 2;
}

export const sxa = (state) => s_a(state, state.Y, state.X)
export const sya = state => s_a(state, state.X, state.Y)

export const jsr = state => { // JSR
  const low = readByte(state, state.PC);
  state.CYC++;

  const jumpBackAddress = state.PC + 1; // Next instruction - 1

  pushStack(state, jumpBackAddress >> 8);
  pushStack(state, jumpBackAddress & 0xFF);
  const high = readByte(state, state.PC + 1);
  state.PC = low + (high << 8);
}

export const rts = state => { // RTS
  state.CYC++;
  state.CYC++;
  const low = popStack(state);
  const high = popStack(state);
  state.CYC++;
  state.PC = (low | (high << 8)) + 1;
}

export const pla = state => { // PLA
  state.CYC++;
  state.CYC++;
  state.A = popStack(state);
  setZero(state, state.A);
  setNegative(state, state.A);
}

export const plp = state => { // PLP
  state.CYC++;
  state.CYC++;
  state.P = popStack(state);
  setBreak(state, false); // See http://wiki.nesdev.com/w/index.php/Status_flags
  setAlwaysOne(state);
};

export const pha = state => { // PHA
  state.CYC++;
  pushStack(state, state.A);
};

export const php = state => { // PHP
  const pCopy = state.P | P_REG_BREAK;
  state.CYC++;
  pushStack(state, pCopy);
}

export const rti = state => { // RTI
  state.CYC++;
  state.CYC++;
  state.P = popStack(state);
  setBreak(state, false); // See http://wiki.nesdev.com/w/index.php/Status_flags
  setAlwaysOne(state);
  const low = popStack(state);
  const high = popStack(state);
  state.PC = (low | (high << 8));
}

export const brk = state => { // BRK
  const pCopy = state.P | P_REG_BREAK;
  state.CYC++;

  const addr = state.PC + 1; // Next instruction - 1
  pushStack(state, addr >> 8);
  pushStack(state, addr & 0xFF);
  pushStack(state, pCopy);
  setInterrupt(state, true);
  state.PC = readWord(state, 0xFFFE);
}

export const sed = state => { // SED
  setDecimal(state, true);
  state.CYC++;
}

export const sei = state => { // SEI
  setInterrupt(state, true);
  state.CYC++;
}

export const sec = state => { // SEC
  setCarry(state, true);
  state.CYC++;
}

// TXS - Transfer X to Stack Pointer
export const txs = state => {
  state.CYC++;
  state.SP = state.X;
}

export const unofficialNopZeroPage = state => readByte(state, readAddressZeroPage(state))
export const unofficialNopImmediate = state => readByte(state, readAddressImmediate(state))
export const unofficialNopZeroPageX = state => readByte(state, readAddressZeroPageX(state))
export const unofficialNopAbsolute = state => readByte(state, readAddressAbsolute(state))
export const unofficialNopAbsoluteX = state => readByte(state, readAddressAbsoluteXWithPageBoundaryCycle(state))

/**
 * JMP - Indirect - Changes the PC to the specified indirect address.
 */
export const jmpIndirect = state => { // JMP Indirect
  const address = readWord(state, state.PC);

  const lo = address;
  let hi = address + 1;

  if (!onSamePageBoundary(lo, hi)) {
    hi = (lo & PAGE_MASK);
  }

  state.PC = readByte(state, lo) + (readByte(state, hi) << 8);
}

/**
 * JMP - Absolute - Changes the PC to the specified address.
 */
export const jmpAbsolute = state => { // JMP Absolute
  state.PC = readWord(state, state.PC);
};


/**
 * BCC - Branch if Carry Clear - If the carry flag is clear then add the relative offset to the program counter to branch to a new location.
 */
export const bcc = state => branch(state, !(state.P & P_REG_CARRY ));

/**
 * BEQ - Branch if Equal - If the zero flag is set then add the offset to the program counter to branch to a new location.
 */
export const beq = state => branch(state, state.P & P_REG_ZERO);

/**
 * BNE - Branch if Not Equal - If the zero flag is clear then add the offset to the program counter to branch to a new location.
 */
export const bne = state => branch(state, !(state.P & P_REG_ZERO));

/**
 * BCS - Branch if Carry Set - If the carry flag is set then add the offset to the program counter branch to a new location.
 */
export const bcs = state => branch(state, state.P & P_REG_CARRY);

/**
 * BVC - Branch if Overflow Clear - If the overflow flag is clear then add the offset to the program counter to branch to a new location.
 */
export const bvc = state => branch(state, !(state.P & P_REG_OVERFLOW));

/**
 * BVS - Branch if Overflow Set - If the overflow flag is set then add the offset to the program counter to branch to a new location.
 */
export const bvs = state => branch(state, state.P & P_REG_OVERFLOW);

/**
 * BPL - Branch if Positive - If the negative flag is clear then add the offset to the program counter to branch to a new location.
 */
export const bpl = state => branch(state, !(state.P & P_REG_NEGATIVE));

/**
 * BMI - Branch if Minus - If the negative flag is set then add the offset to the program counter branch to a new location.
 */
export const bmi = state => branch(state, state.P & P_REG_NEGATIVE); // BMI
