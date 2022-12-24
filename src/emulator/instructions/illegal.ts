import { readByte, writeByte } from '../memory';
import { performADC, performAND, performEOR, performORA, performSBC } from './arithmetic';
import { asl, dec, lsr, performLSR, performRMWA, rol, ror } from './readmodifywrite';
import { BIT_7_MASK, isNegative, P_REG_CARRY, setCarry, setOverflowValue, setZeroNegative } from './util';
import { performCompare } from './compare';
import EmulatorState from '../EmulatorState';

// Used for illegal instruction SXA and SYA. Making the write only if base and address is on same page
// is the way to make blargg tests pass.
const s_a = (state : EmulatorState, offset: number, register: number) => {
  let lowByte = readByte(state, state.PC);
  const highByte = readByte(state, state.PC + 1);
  lowByte = (lowByte + offset) & 0xFF;

  const didOverflow = lowByte < offset;

  if (didOverflow) {
    const possiblyInvalidAddress = (lowByte + (highByte << 8)) & 0xFFFF;
    readByte(state, possiblyInvalidAddress);
  } else {
    const address = lowByte | (highByte << 8);
    const highInc = (highByte + 1) & 0xFF;
    writeByte(state, address, register & highInc);
  }

  state.PC = (state.PC + 2) & 0xFFFF;
}

export const sxa = (state : EmulatorState) => s_a(state, state.Y, state.X)
export const sya = (state : EmulatorState) => s_a(state, state.X, state.Y)


// SAX - AND X and A and store to memory
export const sax = (state : EmulatorState, address: number) => writeByte(state, address, state.X & state.A);
// SRE - LSR value at address and then EOR result.
export const sre = (state : EmulatorState, address: number) => performEOR(state, lsr(state, address));

// RLA - ROL value at address and then AND with result.
export const rla = (state : EmulatorState, address: number) => performAND(state, rol(state, address));

// RRA Perform ROR and then ADC the result
export const rra = (state : EmulatorState, address: number) => performADC(state, ror(state, address));

// ASR - AND byte with accumulator then shift bits right one bit in accumulator.
export const asr = (state : EmulatorState, address: number) => performRMWA(state, performLSR(state, performAND(state, readByte(state, address))));

/**
 * This opcode ANDs the A and X registers (without modifying either register)
 * and copies the result to the stack  pointer. It then ANDs value with
 * the contents of the high byte of the address operand of the operand +1
 * and stores that final result to the address.
 */
export const tas = (state: EmulatorState, address: number) => {
  // Only supported address mode is abs,Y. Remove Y component from address.
  const andAX = state.A & state.X;
  state.SP = andAX;
  let highByteAddress = state.addressOperand >> 8;
  highByteAddress = (highByteAddress + 1) & 0xFF;
  writeByte(state, address, highByteAddress & andAX);
}

/**
 *
 * This opcode ANDs the value at memory location with the value of the
 * stack pointer register. It then stores the result in the accumulator, X
 * register and the stack pointer.
  */
export const las = (state: EmulatorState, address: number) => {
  const value = readByte(state, address);

  state.A = value & state.SP;
  setZeroNegative(state, state.A);
  state.X = state.A;
  state.SP = state.A;
}

/**
 * This opcode ANDS A, X and the high byte of address operand + 1 to the target addres
 */

export const axa = (state: EmulatorState, address: number) => {
  const andResult = state.A & state.X & (((state.addressOperand >> 8) + 1) & 0xFF);
  writeByte(state, address, andResult);
}

// AAC - AND:s byte with accumulator. If the result is negative then carry is set.
export const aac = (state : EmulatorState, address: number) => {
  state.A &= readByte(state, address);
  setZeroNegative(state, state.A);
  setCarry(state, isNegative(state.A));
};

// ARR - AND:s byte with accumulator, then rotates one bit right in accumulator and updates C/V based on bits 5 and 6.
export const arr = (state : EmulatorState, address: number) => {
  const oldCarry = state.P & P_REG_CARRY;
  const result = state.A & readByte(state, address);
  state.A = ((result >> 1) & BIT_7_MASK) | (oldCarry << 7);
  setZeroNegative(state, state.A);
  const bit5 = (state.A & 0b00100000) >> 5;
  const bit6 = (state.A & 0b01000000) >> 6;
  setCarry(state, bit6);
  setOverflowValue(state, bit5 ^ bit6);
}

// ISB - Add one to value at memory, then subtract that value from accumulator
export const isb = (state : EmulatorState, address: number) => {
  let value = readByte(state, address);
  writeByte(state, address, value);
  value = (value + 1) & 0xFF;
  writeByte(state, address, value);
  performSBC(state, value);
}

// ATX - Some sites claims this instruction AND:s the value in A before copying it to A and X.
// However, blarggs instruction tests simply set the values. We match that behavior.
export const atx = (state : EmulatorState, address: number) => {
  state.A = state.X = readByte(state, address);
  setZeroNegative(state, state.A);
};

// AXS - AND:s X register with the accumulator and stores result in X register, then
// subtracts the read byte from memory from the X register - without borrow.
export const axs = (state : EmulatorState, address: number) => {
  const value = readByte(state, address);
  const andResult = state.A & state.X;
  const result = andResult + (value ^ 0xFF) + 1;
  state.X = result & 0xFF;
  setCarry(state, result > 0xFF);
  setZeroNegative(state, state.X);
};

// DCP - Decrement value at memory and then compare.
export const dcp = (state : EmulatorState, address: number) => performCompare(state, dec(state, address), state.A);

// SLO - Shift left one bit of memory value, then OR accumulator with that value
export const slo = (state : EmulatorState, address: number) => performORA(state, asl(state, address));
