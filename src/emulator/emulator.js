import { hex, hex16, stateToString } from './stateLogging';
import { opcodeTable, opcodeMetadata, OAM_DMA } from './cpu';

import updatePPU, { initPPU, readPPURegisterMem, setPPURegisterMem, writeDMA } from './ppu';
import { readOpcode } from './memory';
import { nmi } from './instructions/stack';

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
  memory[0x2000] = 0x00;
  memory[0x2001] = 0x00;
  memory[0x2002] = 0x00;
  memory[0x2003] = 0x00;
  memory[0x2004] = 0x00;
  memory[0x2005] = 0x00;
  memory[0x2006] = 0x00;
  memory[0x2007] = 0x00;

  // Reset vector
  const startingLocation = memory[0xFFFC] + (memory[0xFFFD] << 8);

  return {
    A: 0,
    X: 0,
    Y: 0,
    P: 0x4,
    PF: [false, false, true, false, false, true, false, false],
    PC: startingLocation,
    SP: 0xFD,
    // https://wiki.nesdev.com/w/index.php/CPU_interrupts#IRQ_and_NMI_tick-by-tick_execution - 7 cycles for reset routine. But mesen takes 8 for some reason,
    // set it to match.
    CYC: 8,
    settings: rom.settings,
    breakpoints: {},
    ppu: initPPU(rom.chrData),
    nmiCounter: null,
    memory,
  };
}

const readControllerMem = (state, addr, peek) => {
  // TODO: Implement proper controller logic
  // TODO: Mesen peeks 0 value but returns open bus bits
  if (peek) {
    return 0;
  } else {
    return 0x40;
  }
}

export const readMem = (state, addr, peek = false) => {
  if (addr >= 0x2000 && addr <= 0x3FFF) {
    const modAddr = 0x2000 + (addr & 0b111);
    const ret = readPPURegisterMem(state, modAddr, peek);

    if (ret == null) {
      console.log('Attempted to read from', hex16(modAddr));
    }

    return ret;
  } else if (addr === 0x4016 || addr === 0x4017) {
    return readControllerMem(state, addr, peek);
  } else {
    return state.memory[addr];
  }
}


export const setMem = (state, addr, value) => {
  if (addr === OAM_DMA) {
    writeDMA(state, addr, value);
  } else if (addr >= 0x2000 && addr <= 0x2007) {
    setPPURegisterMem(state, addr, value);
  } else {
    state.memory[addr] = value;
  }

  return value;
};

export const reset = (state) => {
  state.PC = getResetVectorAddress(state);
}

export const stepFrame = (state, breakAfterScanlineChange) => {
  let hitBreakpoint = false;
  let vblankCount = state.ppu.vblankCount;

  let prevScanline = state.ppu.scanline;
  while (!hitBreakpoint && vblankCount === state.ppu.vblankCount) {
    if (!step(state)) {
      break;
    }

    hitBreakpoint = state.PC in state.breakpoints;
    if (breakAfterScanlineChange) {
      hitBreakpoint = prevScanline !== state.ppu.scanline;
    }
  }

  return hitBreakpoint;
}

export const tick = (state) => {
  state.CYC++;
  const prevNmiOccurred = state.ppu.nmiOccurred;
  updatePPU(state, 1);

  // From NESDEV:
  // The NMI input is connected to an edge detector. This edge detector polls the status of the NMI line during φ2 of each
  // CPU cycle (i.e., during the second half of each cycle) and raises an internal signal if the input goes from being high
  // during one cycle to being low during the next. The internal signal goes high during φ1 of the cycle that follows the one
  // where the edge is detected, and stays high until the NMI has been handled.
  // This basically means that we detected the NMI this cycle, but we should not trigger the actual NMI until the next cycle.
  // Set an internal counter that will tick down each cycle until reaching zero. nmiCounter === 0 means that the emulator should
  // handle the NMI after the current opcode has completed execution.
  if (state.ppu.nmiOccurred && !prevNmiOccurred && state.ppu.control.generateNMI) {
    state.nmiCounter = 1;
  } else if (state.nmiCounter != null) {
    state.nmiCounter--;
  }
}

export const step = (state) => {
  const opcode = readOpcode(state);

  if (opcode in opcodeTable) {
    opcodeTable[opcode](state);
  } else {
    console.error('No handler found for opcode $' + hex(opcode === undefined ? -1 : opcode), opcodeMetadata[opcode]?.name ?? '', hex(state.PC));
    return false;
  }

  // This actually annoys me a bit, if an NMI triggers we won't get the log output from the preceding opcode.
  // But this is the way Mesen does it so we do it to stay compatible.
  if (state.nmiCounter != null && state.nmiCounter <= 0 && state.ppu.control.generateNMI) {
    console.log('Triggering NMI', stateToString(state), state.nmiCounter);
    state.nmiCounter = null;
    nmi(state);
    state.lastNMI = state.CYC; // -1 for Mesen compatibility
  }

  return true;
};
