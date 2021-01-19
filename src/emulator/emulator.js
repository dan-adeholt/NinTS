import { hex, hex16 } from './stateLogging';
import { opcodeTable, opcodeMetadata, opcodeReadTable } from './cpu';

import updatePPU, { initPPU, readPPUMem, setPPUMem } from './ppu';

const getResetVectorAddress = state => {
  return readMem(state, 0xFFFC) + (readMem(state, 0xFFFD) << 8);
}

export const initMachine = (rom) => {
  let memory = new Uint8Array(1 << 16);
  memory.set(rom.prgData, 0x8000);

  if (rom.prgData.length <= 0x4000) {
    memory.set(rom.prgData, 0xC000);
  }

  memory[0x4015] = 0xFF;
  memory[0x4004] = 0xFF;
  memory[0x4005] = 0xFF;
  memory[0x4006] = 0xFF;
  memory[0x4007] = 0xFF;

  // PPU Registers
  memory[0x2000] = 0xFF;
  memory[0x2001] = 0xFF;
  memory[0x2002] = 0xFF;
  memory[0x2003] = 0xFF;
  memory[0x2004] = 0xFF;
  memory[0x2005] = 0xFF;
  memory[0x2006] = 0xFF;
  memory[0x2007] = 0xFF;

  // Reset vector
  const startingLocation = memory[0xFFFC] + (memory[0xFFFD] << 8);

  return {
    A: 0,
    X: 0,
    Y: 0,
    P: 0x24,
    PC: startingLocation,
    SP: 0xFD,
    CYC: 0,
    CHR: rom.chrData,
    settings: rom.settings,
    breakpoints: {},
    ppu: initPPU(),
    memory,
  };
}

export const readStack = (state, sp) => state.memory[0x100 + sp]

export const readMem = (state, addr) => {
  if (addr >= 0x2000 && addr <= 0x2007) {
    return readPPUMem(state, addr);
  } else {
    return state.memory[addr];
  }
}

export const setMem = (state, addr, value) => {
  if (addr >= 0x2000 && addr <= 0x2007) {
    setPPUMem(state, addr, value);
  } else {
    state.memory[addr] = value;
  }
};

export const reset = (state) => {
  state.PC = getResetVectorAddress(state);
}

export const stepFrame = (state) => {
  let hitBreakpoint = false;
  let vblankCount = state.ppu.vblankCount;

  while (!hitBreakpoint && vblankCount === state.ppu.vblankCount) {
    if (!step(state)) {
      break;
    }

    hitBreakpoint = state.PC in state.breakpoints;
  }

  return hitBreakpoint;
}

export const step = (state) => {
  const oldCycles = state.CYC;

  const opcode = readMem(state, state.PC);
  state.CYC++;

  if (opcode in opcodeTable) {
    opcodeTable[opcode](state);
  } else {
    console.error('No handler found for opcode $' + hex(opcode === undefined ? -1 : opcode), opcodeMetadata[opcode]?.name ?? '', hex(state.PC));

    return false;
  }

  const executedCycles = state.CYC - oldCycles;
  updatePPU(state, executedCycles);

  return true;
};
