import { onSamePageBoundary, readByte, readWord, writeByte } from '../memory';
import { performADC, performAND, performEOR, performORA, performSBC } from './arithmetic';
import { asl, dec, lsr, performLSR, performRMWA, rol, ror } from './readmodifywrite';
import { tick } from '../emulator';
import { BIT_7_MASK, isNegative, P_REG_CARRY, setCarry, setOverflowValue, setZeroNegative } from './util';
import { performCompare } from './compare';

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
    tick(state);
  }

  state.PC += 2;
}

export const sxa = state => s_a(state, state.Y, state.X)
export const sya = state => s_a(state, state.X, state.Y)

// SAX - AND X and A and store to memory
export const sax = (state, address) => writeByte(state, address, state.X & state.A);
// SRE - LSR value at address and then EOR result.
export const sre = (state, address) => performEOR(state, lsr(state, address));

// RLA - ROL value at address and then AND with result.
export const rla = (state, address) => performAND(state, rol(state, address));

// RRA Perform ROR and then ADC the result
export const rra = (state, address) => performADC(state, ror(state, address));

// ASR - AND byte with accumulator then shift bits right one bit in accumulator.
export const asr = (state, address) => performRMWA(state, performLSR(state, performAND(state, readByte(state, address))));

// AAC - AND:s byte with accumulator. If the result is negative then carry is set.
export const aac = (state, address) => {
  state.A &= readByte(state, address);
  setZeroNegative(state, state.A);
  setCarry(state, isNegative(state.A));
};

// ARR - AND:s byte with accumulator, then rotates one bit right in accumulator and updates C/V based on bits 5 and 6.
export const arr = (state, address) => {
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
export const isb = (state, address) => {
  let value = (readByte(state, address) + 1) & 0xFF;
  tick(state);
  writeByte(state, address, value);
  performSBC(state, value);
}

// ATX - Some sites claims this instruction AND:s the value in A before copying it to A and X.
// However, blarggs instruction tests simply set the values. We match that behavior.
export const atx = (state, address) => {
  state.A = state.X = readByte(state, address);
  setZeroNegative(state, state.A);
};

// AXS - AND:s X register with the accumulator and stores result in X register, then
// subtracts the read byte from memory from the X register - without borrow.
export const axs = (state, address) => {
  const value = readByte(state, address);
  let andResult = state.A & state.X;
  const result = andResult + (value ^ 0xFF) + 1;
  state.X = result & 0xFF;
  setCarry(state, result > 0xFF);
  setZeroNegative(state, state.X);
};

// DCP - Decrement value at memory and then compare.
export const dcp = (state, address) => performCompare(state, dec(state, address), state.A);

// SLO - Shift left one bit of memory value, then OR accumulator with that value
export const slo = (state, address) => performORA(state, asl(state, address));
