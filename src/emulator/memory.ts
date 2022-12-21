import EmulatorState from './EmulatorState';

export const PAGE_MASK = ~(0xFF);

export const onSamePageBoundary = (a1 : number, a2 : number) => (a1 ^ a2) <= 0xFF;

export const writeByte = (state : EmulatorState, address: number, value: number) => {
  state.startWriteTick();
  const ret = state.setMem(address, value);
  state.endWriteTick();
  return ret;
}

export const readByte = (state : EmulatorState, address: number) => {
  state.startReadTick();
  const ret = state.readMem(address);
  state.endReadTick();
  return ret;
}

export const readWord = (state : EmulatorState, address: number) => {
  return readByte(state, address) + (readByte(state, address + 1) << 8);
}

// Read address functions - these read an address and updates the PC and CYC values accordingly
export const readImmediate = (state : EmulatorState) => {
  const address = state.PC;
  state.PC = (state.PC + 1) & 0xFFFF;
  return address;
}

export const readAbsolute = (state : EmulatorState) => {
  const lo = readByte(state, state.PC);
  state.PC = (state.PC + 1) & 0xFFFF;
  const hi = readByte(state, state.PC);
  state.PC = (state.PC + 1) & 0xFFFF;

  return lo + (hi << 8);
}

export const readIndirect = (state : EmulatorState) => {
  const address = readAbsolute(state);
  let hi = address + 1;

  if (!onSamePageBoundary(address, hi)) {
    hi = (address & PAGE_MASK);
  }

  return readByte(state, address) + (readByte(state, hi) << 8);
}

// Derived from https://www.nesdev.org/6502_cpu.txt
const readAbsoluteWithOffset = (state : EmulatorState, offset: number, shortenCycle: boolean) => {
  let lowByte = readByte(state, state.PC);
  let highByte = readByte(state, state.PC + 1);

  lowByte = (lowByte + offset) & 0xFF;

  const didOverflow = lowByte < offset;

  if (didOverflow || !shortenCycle) {
    const possiblyInvalidAddress = (lowByte + (highByte << 8)) & 0xFFFF;
    readByte(state, possiblyInvalidAddress);
  }

  if (didOverflow) {
    highByte = (highByte + 1) & 0xFF;
  }

  const address = (lowByte + (highByte << 8)) & 0xFFFF;

  state.PC = (state.PC + 2) & 0xFFFF;

  return address;
}

export const readAbsoluteX = (state : EmulatorState) => readAbsoluteWithOffset(state, state.X, false)
export const readAbsoluteY = (state : EmulatorState) => readAbsoluteWithOffset(state, state.Y, false)

export const readZeroPage = (state : EmulatorState) => readByte(state, state.PC++)

const readZeroPageOffset = (state : EmulatorState, offset: number) => {
  const address = (readByte(state, state.PC) + offset) % 256;
  state.dummyReadTick();
  state.PC = (state.PC + 1) & 0xFFFF;
  return address;
}

export const readZeroPageX = (state : EmulatorState) => readZeroPageOffset(state, state.X)
export const readZeroPageY = (state : EmulatorState) => readZeroPageOffset(state, state.Y)
export const readAbsoluteXShortenCycle = (state : EmulatorState) => readAbsoluteWithOffset(state, state.X, true)
export const readAbsoluteYShortenCycle = (state : EmulatorState) => readAbsoluteWithOffset(state, state.Y, true)

export const readIndirectX = (state : EmulatorState) => {
  const offset = readByte(state, state.PC);
  state.dummyReadTick();
  const addressLocation = (state.X + offset) % 256;
  const address = readByte(state, addressLocation) + (readByte(state, (addressLocation + 1) & 0xFF) << 8);

  state.PC = (state.PC + 1) & 0xFFFF;

  return address;
}

const readIndirectYHelper = (state : EmulatorState, shortenCycle: boolean) => {
  const zeroPageAddress = readByte(state, state.PC)
  let lowByte = readByte(state, zeroPageAddress);
  let highByte = readByte(state, (zeroPageAddress + 1) & 0xFF);

  lowByte = (lowByte + state.Y) & 0xFF;
  const didOverflow = lowByte < state.Y;

  if (didOverflow || !shortenCycle) {
    const possiblyInvalidAddress = (lowByte + (highByte << 8)) & 0xFFFF;
    readByte(state, possiblyInvalidAddress);
  }

  if (didOverflow) {
    highByte = (highByte + 1) & 0xFF;
  }

  const address = (lowByte + (highByte << 8)) & 0xFFFF;
  state.PC = (state.PC + 1) & 0xFFFF;

  return address;
}

export const readIndirectYShortenCycle = (state : EmulatorState) => readIndirectYHelper(state, true)
export const readIndirectY = (state : EmulatorState) => readIndirectYHelper(state, false)


export const popStack = (state : EmulatorState) => {
  const ret = readByte(state, 0x100 + ((state.SP + 1) & 0xFF));
  state.SP = (state.SP + 1) & 0xFF;
  return ret;
}

export const pushStack = (state : EmulatorState, value : number) => {
  writeByte(state, 0x100 + state.SP, value);
  state.SP = (state.SP - 1) & 0xFF;
}

export const pushStackWord = (state : EmulatorState, word: number) => {
  pushStack(state, word >> 8);
  pushStack(state, word & 0xFF);
}
