import { hex, hex16, stateToString } from './stateLogging';
import { opcodeTable, opcodeMetadata, OAM_DMA } from './cpu';

import updatePPU, { initPPU, readPPURegisterMem, setPPURegisterMem, writeDMA } from './ppu';
import { nmi } from './instructions/stack';

const getResetVectorAddress = state => {
  return readMem(state, 0xFFFC) + (readMem(state, 0xFFFD) << 8);
}

export const initMachine = (rom, enableTraceLogging = false) => {
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

  const cpuDivider = 12;

  let state = {
    A: 0,
    X: 0,
    Y: 0,
    P: 0x4,
    PF: [false, false, true, false, false, true, false, false],
    PC: startingLocation,
    SP: 0xFD,
    masterClock: cpuDivider, // For some reason the master clock is set forward 1 cycle in Mesen. Causes PPU to get delayed.
    ppuOffset: 1, // But there is also a PPU offset - very weird.
    cpuDivider,
    cpuHalfStep: cpuDivider / 2,
    // https://wiki.nesdev.com/w/index.php/CPU_interrupts#IRQ_and_NMI_tick-by-tick_execution - 7 cycles for reset routine. But mesen takes 8 for some reason,
    // set it to match.
    CYC: -1,
    settings: rom.settings,
    breakpoints: {},
    ppu: initPPU(rom.chrData),
    nmiCounter: null,
    traceLogLines: [],
    enableTraceLogging,
    memory,
    rom
  };

  // Align with Mesen: CPU takes 8 cycles before it starts executing ROM code
  for (let i = 0; i < 8; i++) {
    tick(state);
  }

  return state;
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

const _updatePPUAndHandleNMI = (state) => {
  const prevNmiOccurred = state.ppu.nmiOccurred;
  updatePPU(state, state.masterClock - state.ppuOffset);

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

export const tick = (state) => {
  state.CYC++;
  state.masterClock += state.cpuDivider;
  _updatePPUAndHandleNMI(state);
}

/**
 * Mesen compatible ways of ticking, split the cycle updating into two phases
 * and update the PPU in both instances. Perhaps helps with accuracy in some way I
 * do not understand yet.
 */
export const startTick = (state, forRead) => {
  state.CYC++;
  state.masterClock += forRead ? state.cpuHalfStep - 1 : state.cpuHalfStep + 1;
  _updatePPUAndHandleNMI(state);
}

export const endTick = (state, forRead) => {
  state.masterClock += forRead ? state.cpuHalfStep + 1 : state.cpuHalfStep - 1;
  _updatePPUAndHandleNMI(state);
}

/**
 * So Mesen logs trace statements in a really weird way. In order to be
 * compatible we have to log our traces at a very particular point in time.
 *
 * Basically, Mesen logs the last trace statement when fetching the opcode
 * for the next statement. But at that point in time, one CPU cycle has
 * already passed. Which means that the cycle count in the trace statement
 * is one more than it would be otherwise. That would be fairly easy to
 * simulate, but the problem is that the PPU has ALSO had time to execute
 * some cycles.
 *
 * Mesen implements their ticks somewhat differently than we do, they split
 * the cycle into two phases. In the first phase the cycle count is incremented
 * and the master clock is updated with 5 cycles (for read operations) and 7 cycles
 * (for write operations). Then the actual state is updated. Then the second phase
 * is executed, and then it is inverted: 7 cycles for read operations, 5 cycles for
 * write operations. I do not know why they do it this way; we might end up doing
 * something similar for all our ticks. But right now we only do it for the opcodes.
 *
 * Now the actual trace statement is actually recorded after the first phase of the
 * opcode read has taken place, which means that the cycle count has been updated
 * with 1 and the master clock has been incremented by 5 (read operation). So at
 * that particular point in time we also record our trace statement.
 *
 * The reason they do it this way is that they implement logging by listening
 * to memory accesses.
 *
 */
const readOpcode = (state) => {
  startTick(state, true);

  if (state.enableTraceLogging) {
    if (state.lastNMI != null && state.lastNMI <= state.CYC) {
      state.traceLogLines.push('[NMI - Cycle: ' + (state.lastNMI) + ']');
      state.lastNMI = null;
    }

    state.traceLogLines.push(stateToString(state));
  }

  const opcode = readMem(state, state.PC);
  endTick(state, true);

  state.PC++;
  return opcode;
}

export const step = (state, logState = false) => {
  const opcode = readOpcode(state, logState);

  if (opcode in opcodeTable) {
    opcodeTable[opcode](state);
  } else {
    console.error('No handler found for opcode $' + hex(opcode === undefined ? -1 : opcode), opcodeMetadata[opcode]?.name ?? '', hex(state.PC));
    return false;
  }

  // This actually annoys me a bit, if an NMI triggers we won't get the log output from the preceding opcode.
  // But this is the way Mesen does it so we do it to stay compatible.
  if (state.nmiCounter != null && state.nmiCounter <= 0 && state.ppu.control.generateNMI) {
    state.nmiCounter = null;
    nmi(state);
    state.lastNMI = state.CYC;
  }

  return true;
};
