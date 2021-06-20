import { hex } from './stateLogging';
import { opcodeTable, opcodeMetadata, OAM_DMA } from './cpu';

import updatePPU, { initPPU, readPPUMem, setPPUMem, writeDMA } from './ppu';
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
    P: 0x24,
    PF: [false, false, true, false, false, true, false, false],
    PC: startingLocation,
    SP: 0xFD,
    // https://wiki.nesdev.com/w/index.php/CPU_interrupts#IRQ_and_NMI_tick-by-tick_execution - 7 cycles for reset routine
    CYC: 7,
    settings: rom.settings,
    breakpoints: {},
    ppu: initPPU(rom.chrData),
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
  if (addr >= 0x2000 && addr <= 0x2007) {
    return readPPUMem(state, addr, peek);
  } else if (addr === 0x4016 || addr === 0x4017) {
    return readControllerMem(state, addr, peek);
  } else {
    if (addr === 0x4016) {
      console.log('ADDR:', hex(addr), peek, state.memory[addr]);
    }

    return state.memory[addr];
  }
}


export const setMem = (state, addr, value) => {
  if (addr === OAM_DMA) {
    writeDMA(state, addr, value);
  } else if (addr >= 0x2000 && addr <= 0x2007) {
    setPPUMem(state, addr, value);
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
  updatePPU(state, 1);
}

export const alignMesen = state => {
  // Adapt to Mesen emulator - their reset routine takes 8 cycles
  state.CYC = 8;
  // And apparently their PPU is out of sync with CPU at boot.
  state.ppu.cycle = 27;
  state.ppu.scanlineCycle = 27;
  // Also, Mesen sets bits 4&5 to zero at boot. They are irrelevant for the CPU: https://wiki.nesdev.com/w/index.php/Status_flags#The_B_flag
  // so just set them to match.
  state.P = 0x4;
}

export const step = (state) => {
  const opcode = readOpcode(state);

  if (opcode in opcodeTable) {
    opcodeTable[opcode](state);
  } else {
    console.error('No handler found for opcode $' + hex(opcode === undefined ? -1 : opcode), opcodeMetadata[opcode]?.name ?? '', hex(state.PC));
    return false;
  }

  if (state.nmiInterruptCycle != null) {
    // @TODO: Use cycle later to perfect NMI triggering conditions
    nmi(state);
    state.nmiInterruptCycle = null;
    state.lastNMI = state.CYC; // -1 for Mesen compatibility
  }

  return true;
};
