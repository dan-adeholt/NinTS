import { readMem, setMem } from './emulator';
import { PAGE_MASK } from './instructions';

export const onSamePageBoundary = (a1, a2) => (a1 ^ a2) <= 0xFF;

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
export const readImmediate = (state) => {
  const address = state.PC;
  state.PC += 1;
  return address;
}

export const readAbsolute = (state) => {
  const lo = readByte(state, state.PC);
  state.PC++;
  const hi = readByte(state, state.PC);
  state.PC++;

  return lo + (hi << 8);
}

export const readIndirect = state => {
  const address = readAbsolute(state);
  let hi = address + 1;

  if (!onSamePageBoundary(address, hi)) {
    hi = (address & PAGE_MASK);
  }

  return readByte(state, address) + (readByte(state, hi) << 8);
}

const readAbsoluteWithOffset = (state, offset, shortenCycle) => {
  const base = readWord(state, state.PC);
  const address = (base + offset) & 0xFFFF;

  if (!onSamePageBoundary(base, address) || !shortenCycle) {
    state.CYC ++;
  }

  state.PC += 2;

  return address;
}

export const readAbsoluteX = (state) => readAbsoluteWithOffset(state, state.X, false)
export const readAbsoluteY = (state) => readAbsoluteWithOffset(state, state.Y, false)

export const readZeroPage = (state) => readByte(state, state.PC++)

const readZeroPageOffset = (state, offset) => {
  const address = (readByte(state, state.PC) + offset) % 256;
  state.CYC++;
  state.PC += 1;
  return address;
}

export const readZeroPageX = (state) => readZeroPageOffset(state, state.X)
export const readZeroPageY = (state) => readZeroPageOffset(state, state.Y)
export const readAbsoluteXShortenCycle = state => readAbsoluteWithOffset(state, state.X, true)
export const readAbsoluteYShortenCycle = state => readAbsoluteWithOffset(state, state.Y, true)

export const readIndirectX = (state) => {
  const offset = readByte(state, state.PC);
  state.CYC++;
  const addressLocation = (state.X + offset) % 256;
  const address = readByte(state, addressLocation) + (readByte(state, (addressLocation + 1) & 0xFF) << 8);

  state.PC += 1;

  return address;
}

const readIndirectYHelper = (state, shortenCycle) => {
  const zeroPageAddress = readByte(state, state.PC)
  const base = readByte(state, zeroPageAddress) + (readByte(state, (zeroPageAddress + 1) & 0xFF) << 8);
  const address = (base + state.Y) & 0xFFFF;
  state.PC += 1;

  if (!onSamePageBoundary(base, address) || !shortenCycle) {
    state.CYC ++;
  }

  return address;
}

export const readIndirectYShortenCycle = (state) => readIndirectYHelper(state, true)
export const readIndirectY = (state) => readIndirectYHelper(state, false)

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
