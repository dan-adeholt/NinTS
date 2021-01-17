import {
  BIT_7,
  BIT_7_MASK,
  clampToByte,
  getAddressAbsolute,
  isNegative,
  onSamePageBoundary, P_MASK_CARRY, P_MASK_DECIMAL, P_MASK_INTERRUPT, P_MASK_OVERFLOW,
  P_MASK_OVERFLOW_AND_NEGATIVE, P_REG_BREAK,
  P_REG_CARRY, P_REG_NEGATIVE, P_REG_OVERFLOW, P_REG_ZERO,
  P_REGS_OVERFLOW_AND_NEGATIVE,
  PAGE_MASK,
  readValueAbsolute,
  readValueAbsoluteXWithPageBoundaryCycle,
  readValueImmediate,
  readValueZeroPage,
  readValueZeroPageX,
  setAlwaysOne, setBreak,
  setCarry,
  setDecimal,
  setInterrupt,
  setNegative,
  setOverflow,
  setOverflowValue,
  setZero
} from './utils';

import { readMem, readStack, setMem, setStack } from '../emulator';

/**
 * AAC
 * Illegal opcode. AND:s byte with accumulator. If the result is negative then carry is set.
 */
export const aac = (state, address) => {
  const value = readMem(state, address);
  const result = state.A & value;
  state.A = result;
  setZero(state, result);
  setNegative(state, result);
  setCarry(state, isNegative(result));
};

/**
 * ADC - Add with Carry
 *
 * [A,Z,C,N] = A+M+C
 *
 * This opcode adds the value of a memory address to the accumulator along with the carry bit.
 * If overflow occurs then the carry bit is set which enables multiple byte addition.
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

export const adc = (state, address) => {
  const value = readMem(state, address);
  return performADC(state, value);
};

/**
 * AND - Logical AND
 * [A,Z,N] = A&M
 *
 * A logical AND bit operation is executed bit by bit on the accumulator with the contents of a byte of memory.
 */
export const performAND = (state, value) => {
  const result = state.A & value;
  state.A = result;
  setZero(state, result);
  setNegative(state, result);
  return result;
};

export const and = (state, address) => {
  const value = readMem(state, address);
  return performAND(state, value);
};

/**
 * ARR - Illegal opcode
 *
 * AND:s byte with accumulator, then rotates one bit right in accumulator and updates C/V based on bits 5 and 6.
 * Both bits == 1: set C, clear V
 * Both bits == 0: clear C and V
 * Bit 5 == 1 && Bit 6 === 0: set V, clear C.
 * Bit 5 == 0 && Bit 6 === 1: set C and V.
 */

export const arr = (state, address) => {
  const value = readMem(state, address);
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
 * ASL - Arithmetic Shift Left
 * [A,Z,C,N] = M*2, or [M,Z,C,N] = M*2
 *
 * This operation shifts all bits of A or the content in memory one bit left. Bit 0 is set to 0 and bit 7 is copied to the carry flag.
 * The resulting effect of this operation is a multiplication of the memory contents by 2 (ignoring 2's complement), setting the carry
 * if the result will not fit into 8 bits.
 */
export const aslA = (state) => {
  setCarry(state, state.A & BIT_7);
  state.A = (state.A << 1) & 0xFF;
  setZero(state, state.A);
  setNegative(state, state.A);
  state.CYC += 2;
  state.PC += 1;
}

export const asl = (state, address) => {
  const value = readMem(state, address);
  setCarry(state, value & BIT_7);
  const newValue = (value << 1) & 0xFF;
  setMem(state, address, newValue);
  setZero(state, newValue);
  setNegative(state, newValue);
  return newValue;
}


/**
 * ASR (illegal opcode)
 *
 * AND byte with accumulator then shift bits right one bit in accumulator.
 */
export const asr = (state, address) => {
  const value = readMem(state, address);
  state.A = performLSR(state, performAND(state, value));
}


/**
 * ATX (illegal opcode)
 *
 * Some sites claims this opcode AND:s the value in A before transferring it to A and X.
 * However, blarggs instruction tests simply set the values. We match that behavior.
 */
export const atx = (state, address) => {
  const value = readMem(state, address);
  state.A = value;
  state.X = value;
  setZero(state, value);
  setNegative(state, value);
};

/**
 * AXS (illegal opcode)
 *
 * AND:s X register with the accumulator and stores result in X register, then
 * subtracts byte from the X register - without borrow.
 */
export const axs = (state, address) => {
  const value = readMem(state, address);
  let andResult = state.A & state.X;
  const result = andResult + (value ^ 0xFF) + 1;
  const resultByte = (result & 0xFF);
  state.X = result;
  setCarry(state, result > 0xFF);
  setZero(state, resultByte);
  setNegative(state, resultByte);
};

/**
 * BIT - Bit Test
 * A&M, N = M bit7, V = M bit6
 *
 * Tests if one or more bits are set in a target memory location. The bitmask pattern in A is AND:ed with the memory value to set
 * or clear the zero flag. The result is not kept. Bits 7 and 6 of the memory value are copied into the N and V flags.
 */

export const bit = (state, address) => {
  const value = readMem(state, address);
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
  let offset = readMem(state, state.PC + 1);

  if (offset > 0x7F) {
    offset -= 256;
  }

  const nextInstruction = state.PC + 2;
  const jumpInstruction = state.PC + 2 + offset;

  state.CYC += 2;

  if (shouldBranch) {
    state.CYC += 1;

    if (!onSamePageBoundary(nextInstruction, jumpInstruction)) {
      state.CYC += 1;
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
  state.PC += 1;
  state.CYC += 2;
}

/**
 * CLC - Clear Carry Flag
 *
 * P[C] = 0
 * Sets the carry flag to zero.
 */
export const clc = state => clear(state, P_MASK_CARRY);

/**
 * CLD - Clear Decimal Mode
 *
 * No real effect on the NES since the Ricoh 2A03 (6502 derivative) has no decimal mode.
 *
 * P[D] = 0
 * Sets the decimal flag to zero.
 */
export const cld = state => clear(state, P_MASK_DECIMAL);

/**
 * CLI - Clear Interrupt Disable
 *
 * P[I] = 0
 * Sets the interrupt disable flag to 0 which allows normal interrupt requests to be handled.
 */
export const cli = state => clear(state, P_MASK_INTERRUPT);

/**
 * CLV - Clear Overflow Flag
 *
 * P[O] = 0
 *
 * Sets the overflow flag to 0.
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
  const value = readMem(state, address);
  performCompare(state, value, register);
}

/**
 * CMP - Compare
 *
 * This instruction compares the accumulator value with another value in memory and then sets the zero and carry flags based on the result.
 */
export const cmp = (state, address) => compare(state, address, state.A)

/**
 * CPX - Compare X Register
 *
 * This instruction compares the X register value with another value in memory and then sets the zero and carry flags based on the result.
 */
export const cpx = (state, address) => compare(state, address, state.X)

/**
 * CPY - Compare Y Register
 *
 * This instruction compares the Y register value with another value in memory and then sets the zero and carry flags based on the result.
 */
export const cpy = (state, address) => compare(state, address, state.Y)


/**
 * DEC - Decrement Memory
 * M, Z, N = M - 1
 *
 *  Subtracts one from the value at the specified memory location, setting the zero and negative flags based on the result.
 */
export const dec = (state, address) => {
  let value = readMem(state, address) - 1;

  if (value < 0) {
    value = 0xFF;
  }

  setMem(state, address, value);
  setZero(state, value);
  setNegative(state, value);
  return value;
}
/**
 * DCP - Illegal opcode
 *
 * This opcode DEC:s the value at a memory location and then CMP:s the result.
 */
export const dcp = (state, address) => {
  performCompare(state, dec(state, address), state.A);
}


/**
 * EOR - Exclusive OR
 * [A,Z,N] = A ^ M
 An exclusive OR is performed, bit by bit, on the accumulator contents using the contents of a byte of memory.
 */

const performEOR = (state, value) => {
  const result = state.A ^ value;
  state.A = result;
  setZero(state, result);
  setNegative(state, result);
};

export const eor = (state, address) => {
  const value = readMem(state, address);
  performEOR(state, value);
};



/**
 * INC - Increment Memory
 * [M,Z,N] = M + 1
 * Adds one to the value at the memory location, setting the zero and negative flags based on the result.
 */
export const inc = (state, address) => {
  const value = (readMem(state, address) + 1) & 0xFF;
  setMem(state, address, value);
  setZero(state, value);
  setNegative(state, value);
}


/**
 * ISB - Illegal opcode
 *
 * Add one to value at memory address then subtract memory from accumulator with borrow.
 */
export const isb = (state, address) => {
  let value = readMem(state, address) + 1;
  let valueBytes = clampToByte(value);
  setMem(state, address, valueBytes);
  performSBC(state, valueBytes);
}


/**
 * LAX - Illegal opcode
 *
 * Store value into A and X registers.
 */

export const lax = (state, address) => {
  const value = readMem(state, address);
  state.X = value;
  state.A = value;
  setNegative(state, value);
  setZero(state, value);
}

/**
 * LDA - Load Accumulator
 * [A,Z,N] = M
 *
 * Loads a byte of memory into the accumulator register setting the zero and negative flags based on the value.
 */
export const lda = (state, address) => {
  const value = readMem(state, address);
  state.A = value;
  setZero(state, value);
  setNegative(state, value);
};


/**
 * LDX - Load X
 * [X,Z,N] = M
 *
 * Loads a byte of memory into the X register setting the zero and negative flags based on the value.
 */
export const ldx = (state, address) => {
  const value = readMem(state, address);
  state.X = value;
  setZero(state, value);
  setNegative(state, value);
};

/**
 * LDY - Load Y
 * [Y,Z,N] = M
 *
 * Loads a byte of memory into the Y register setting the zero and negative flags based on the value.
 */
export const ldy = (state, address) => {
  const value = readMem(state, address);
  state.Y = value;
  setZero(state, value);
  setNegative(state, value);
};

/**
 * LSR - Logical Shift Right
 *
 * [A,C,Z,N] = A/2 or [M,C,Z,N] = M/2
 *
 Every bit in A or M is shifted one place to the right. The bit that was previously in bit 0 is
 moved into the carry flag while bit 7 is set to zero.
 */
const performLSR = (state, value) => {
  setCarry(state, value & 0x1);
  const newValue = value >> 1;
  setZero(state, newValue);
  setNegative(state, newValue);
  return newValue;
}

export const lsrA = (state) => {
  state.A = performLSR(state, state.A);
  state.CYC += 2;
  state.PC += 1;
}

export const lsr = (state, address) => {
  const value = readMem(state, address);
  const newValue = performLSR(state, value);
  setMem(state, address, newValue);
  return newValue;
}



/**
 * NOP - No Operation
 *
 * The NOP instruction performs no changes to the processor apart from incrementing of the program counter to the next instruction.
 * Note that there are also "unofficial/illegal" instructions that behave as a NOP but with a larger cycle count.
 */

export const nop = (state) => {
  state.PC += 1;
  state.CYC += 2;
}


/**
 * ORA - Logical Inclusive OR
 * [A,Z,N] = A|M
 * Performs an inclusive OR on the accumulator value using the value of a byte of memory.
 */
const performORA = (state, value) => {
  const result = state.A | value;
  state.A = result;
  setZero(state, result);
  setNegative(state, result);
};

export const ora = (state, address) => {
  const value = readMem(state, address);
  performORA(state, value);
};

// Helper method for various register transfer/increment instructions
const setRegister = (state, value, setter) => {
  setZero(state, value);
  setNegative(state, value);
  setter(state, value);
  state.CYC += 2;
  state.PC += 1;
}

/**
 * INY - Increment Y Register
 * [Y,Z,N] = Y + 1
 *
 * Increments the Y register by one, setting the zero and negative flags based on the result.
 */
export const iny = state => setRegister(state, (state.Y + 1) & 0xFF, setY);

/**
 * DEY - Decrement Y Register
 * [Y,Z,N] = Y + 1
 *
 * Decrements the Y register by one, setting the zero and negative flags based on the result.
 */
export const dey = state => setRegister(state, (state.Y - 1) & 0xFF, setY);

/**
 * TAY - Transfer Accumulator to Y
 * Y = A
 *
 * Copies the current accumulator value into the Y register, setting the zero and negative flags based on the result.
 */
export const tay = state => setRegister(state, state.A, setY);

/**
 * INX - Increment X Register
 * [X,Z,N] = X + 1
 *
 * Increments the X register by one, setting the zero and negative flags based on the result.
 */
export const inx = state => setRegister(state, (state.X + 1) & 0xFF, setX)

/**
 * DEX - Decrement X Register
 * [X,Z,N] = X + 1
 *
 * Decrements the X register by one, setting the zero and negative flags based on the result.
 */
export const dex = state => setRegister(state, (state.X - 1) & 0xFF, setX)

/**
 * TAX - Transfer Accumulator to X
 * X = A
 * Copies the current accumulator value into the X register, setting the zero and negative flags based on the result.
 */
export const tax = state => setRegister(state, state.A, setX);

/**
 * TSX - Transfer Stack Pointer to X
 * X = S
 * Copies the current stack register value into the X register, setting the zero and negative flags based on the result.
 */
export const tsx = state => setRegister(state, state.SP, setX)

/**
 * TXA - Transfer X to Accumulator
 * A = X
 * Copies the current X register value into the accumulator register, setting the zero and negative flags based on the result.
 */
export const txa = state => setRegister(state, state.X, setA)

/**
 * TYA - Transfer Y to Accumulator
 * A = Y
 * Copies the current Y register value into the accumulator register, setting the zero and negative flags based on the result.
 */
export const tya = state => setRegister(state, state.Y, setA)


const setY = (state, value) => state.Y = value
const setX = (state, value) => state.X = value
const setA = (state, value) => state.A = value


export const rla = (state, address) => {
  const val = rol(state, address);
  performAND(state, val);
}



export const rolA = (state) => {
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, (state.A & BIT_7) >> 7);
  state.A = ((state.A << 1) & 0xFF) | oldCarry;
  setZero(state, state.A);
  setNegative(state, state.A);
  state.CYC += 2;
  state.PC += 1;
}

export const rol = (state, address) => {
  const value = readMem(state, address);
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, (value & BIT_7) >> 7);
  const newValue = ((value << 1) & 0xFF) | oldCarry;
  setMem(state, address, newValue);
  setZero(state, newValue);
  setNegative(state, newValue);
  return newValue;
}

export const rorA = (state) => {
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, state.A & 0x1);
  state.A = ((state.A >> 1) & BIT_7_MASK) | (oldCarry << 7);
  setZero(state, state.A);
  setNegative(state, state.A);
  state.CYC += 2;
  state.PC += 1;
}

export const ror = (state, address) => {
  const value = readMem(state, address);
  const oldCarry = state.P & P_REG_CARRY;
  setCarry(state, value & 0x1);
  const newValue = ((value >> 1) & BIT_7_MASK) | (oldCarry << 7);
  setMem(state, address, newValue);
  setZero(state, newValue);
  setNegative(state, newValue);
  return newValue;
}

export const rra = (state, address) => {
  const value = ror(state, address);
  performADC(state, value);
}

export const sax = (state, address) => {
  setMem(state, address, state.X & state.A);
}

const performSBC = (state, value) => performADC(state, value ^ 0xFF)
export const sbc = (state, address) => performSBC(state, readMem(state, address))


export const slo = (state, address) => {
  const value = asl(state, address);
  performORA(state, value);
};

export const sre = (state, address) => {
  const value = lsr(state, address);
  performEOR(state, value);
}

export const sta = (state, address) => {
  setMem(state, address, state.A);
}

export const stx = (state, address) => {
  setMem(state, address, state.X);
}

export const sty = (state, address) => {
  setMem(state, address, state.Y);
}

const s_a = (state, offset, register) => {
  const base = getAddressAbsolute(state, state.PC);
  const address = (base + offset) & 0xFFFF;

  if (onSamePageBoundary(base, address)) {
    let hi = (address & 0xFF00) >> 8;
    hi = (hi + 1) & 0xFF;
    const result = register & hi;
    setMem(state, address, result);
  }

  state.CYC += 5;
  state.PC += 3;
}

export const sxa = (state) => s_a(state, state.Y, state.X)
export const sya = state => s_a(state, state.X, state.Y)

const offsetSP = (sp, offset) => {
  return (sp + offset) & 0xFF;
}

const offsetSPNeg = (sp, offset) => {
  return offsetSP(sp, (offset ^ 0xFF) + 1);
}

export const jsr = state => { // JSR
  const addr = state.PC + 2; // Next instruction - 1
  setStack(state, state.SP, addr >> 8);
  setStack(state, offsetSPNeg(state.SP, 1), addr & 0xFF);
  state.SP = offsetSPNeg(state.SP, 2);
  state.PC = getAddressAbsolute(state, state.PC);
  state.CYC += 6;
}

export const rts = state => { // RTS
  const low = readStack(state, offsetSP(state.SP, 1));
  const high = readStack(state, offsetSP(state.SP, 2));
  state.SP = offsetSP(state.SP, 2);
  state.PC = (low | (high << 8)) + 1;
  state.CYC += 6;
}

export const pla = state => { // PLA
  state.A = readStack(state, offsetSP(state.SP, 1));
  state.SP = offsetSP(state.SP, 1);
  state.PC += 1;
  setZero(state, state.A);
  setNegative(state, state.A);
  state.CYC += 4;
}

export const plp = state => { // PLP
  state.P = readStack(state, offsetSP(state.SP, 1));
  setBreak(state, false); // See http://wiki.nesdev.com/w/index.php/Status_flags
  setAlwaysOne(state);
  state.SP = offsetSP(state.SP, 1);
  state.PC += 1;
  state.CYC += 4;
};

export const pha = state => { // PHA
  setStack(state, state.SP, state.A);
  state.SP = offsetSPNeg(state.SP, 1);
  state.PC += 1;
  state.CYC += 3;
};

export const php = state => { // PHP
  const pCopy = state.P | P_REG_BREAK;
  setStack(state, state.SP, pCopy);
  state.SP = offsetSPNeg(state.SP, 1);
  state.PC += 1;
  state.CYC += 3;
}

export const rti = state => { // RTI
  state.P = readStack(state, offsetSP(state.SP, 1));
  setBreak(state, false); // See http://wiki.nesdev.com/w/index.php/Status_flags
  setAlwaysOne(state);
  const low = readStack(state, offsetSP(state.SP, 2));
  const high = readStack(state, offsetSP(state.SP, 3));


  state.SP = offsetSP(state.SP, 3);
  state.PC = (low | (high << 8));

  state.CYC += 6;
}

export const brk = state => { // BRK
  const pCopy = state.P | P_REG_BREAK;

  const addr = state.PC + 2; // Next instruction - 1
  setStack(state, state.SP, addr >> 8);
  setStack(state, offsetSPNeg(state.SP, 1), addr & 0xFF);
  setStack(state, offsetSPNeg(state.SP, 2), pCopy);
  state.SP = offsetSPNeg(state.SP, 3);
  setInterrupt(state, true);
  state.PC = readMem(state, 0xFFFE) + (readMem(state, 0xFFFF) << 8);
  state.CYC += 7;
}

export const sed = state => { // SED
  setDecimal(state, true);
  state.CYC += 2;
  state.PC += 1;
}

export const sei = state => { // SEI
  setInterrupt(state, true);
  state.CYC += 2;
  state.PC += 1;
}

export const sec = state => { // SEC
  setCarry(state, true);
  state.PC += 1;
  state.CYC += 2;
}


// TXS - Transfer X to Stack Pointer
export const txs = state => {
  state.SP = state.X;
  state.CYC += 2;
  state.PC += 1;
}

export const unofficialNopZeroPage = state => readValueZeroPage(state, 3)
export const unofficialNopImmediate = state => readValueImmediate(state, 2)
export const unofficialNopZeroPageX = state => readValueZeroPageX(state, 4)
export const unofficialNopAbsolute = state => readValueAbsolute(state, 4)
export const unofficialNopAbsoluteX = state => readValueAbsoluteXWithPageBoundaryCycle(state, 4)

/**
 * JMP - Indirect
 * Changes the PC to the specified indirect address.
 */
export const jmpIndirect = state => { // JMP Indirect
  const address = getAddressAbsolute(state, state.PC);

  const lo = address;
  let hi = address + 1;

  if (!onSamePageBoundary(lo, hi)) {
    hi = (lo & PAGE_MASK);
  }

  state.PC = readMem(state, lo) + (readMem(state, hi) << 8);
  state.CYC += 5;
}

/**
 * JMP - Absolute
 * Changes the PC to the specified address.
 */
export const jmpAbsolute = state => { // JMP Absolute
  state.PC = getAddressAbsolute(state, state.PC);
  state.CYC += 3;
};


/**
 * BCC - Branch if Carry Clear
 * If the carry flag is clear then add the relative offset to the program counter to branch to a new location.
 */
export const bcc = state => branch(state, !(state.P & P_REG_CARRY ));

/** BEQ - Branch if Equal
 * If the zero flag is set then add the offset to the program counter to branch to a new location.
 */
export const beq = state => branch(state, state.P & P_REG_ZERO);

/**
 * BNE - Branch if Not Equal
 * If the zero flag is clear then add the offset to the program counter to branch to a new location.
 */
export const bne = state => branch(state, !(state.P & P_REG_ZERO));

/**
 * BCS - Branch if Carry Set
 * If the carry flag is set then add the offset to the program counter branch to a new location.
 */
export const bcs = state => branch(state, state.P & P_REG_CARRY);

/**
 * BVC - Branch if Overflow Clear
 * If the overflow flag is clear then add the offset to the program counter to branch to a new location.
 */
export const bvc = state => branch(state, !(state.P & P_REG_OVERFLOW));

/**
 * BVS - Branch if Overflow Set
 * If the overflow flag is set then add the offset to the program counter to branch to a new location.
 */
export const bvs = state => branch(state, state.P & P_REG_OVERFLOW);

/**
 * BPL - Branch if Positive
 * If the negative flag is clear then add the offset to the program counter to branch to a new location.
 */
export const bpl = state => branch(state, !(state.P & P_REG_NEGATIVE));

/**
 * BMI - Branch if Minus
 * If the negative flag is set then add the offset to the program counter branch to a new location.
 */
export const bmi = state => branch(state, state.P & P_REG_NEGATIVE); // BMI
