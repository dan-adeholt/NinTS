import { COLORS } from './constants';

const PPUCTRL	= 0x2000;
const PPUMASK	= 0x2001;
const PPUSTATUS = 0x2002;
const OAMADDR =	0x2003;
// const OAMDATA	= 0x2004;
const PPUSCROLL	= 0x2005;
const PPUADDR	= 0x2006;
const PPUDATA	= 0x2007;

// const PPUMASK_GREYSCALE = 1;
// const PPUMASK_SHOW_BACKGROUND_LEFT_8_PIXELS = 1 << 1;
// const PPUMASK_SHOW_SPRITES_LEFT_8_PIXELS = 1 << 2;
const PPUMASK_RENDER_BACKGROUND = 1 << 3;
const PPUMASK_RENDER_SPRITES = 1 << 4;
// const PPUMASK_EMPHASIZE_RED = 1 << 5;
// const PPUMASK_EMPHASIZE_GREEN = 1 << 6;
// const PPUMASK_EMPHASIZE_BLUE = 1 << 7;

const PPUMASK_RENDER_ENABLED_FLAGS = PPUMASK_RENDER_BACKGROUND | PPUMASK_RENDER_SPRITES;

const PPUSTATUS_VBLANK = 1 << 7;
const PPUSTATUS_VBLANK_MASK = ~PPUSTATUS_VBLANK;

const VBLANK_SCANLINE = 241;
const PRE_RENDER_SCANLINE = 261;
const NUM_SCANLINES = 262;
const PPU_CYCLES_PER_SCANLINE = 341;

const VRAM_BACKGROUND_COLOR = 0x3f00;

export const SCREEN_WIDTH = 256;
export const SCREEN_HEIGHT = 240;

export const initPPU = () => {
  return {
    cycle: 0,
    scanlineCycle: 0,
    scanline: 0,
    evenFrame: true,
    vblankCount: 0,
    V: 0,
    T: 0,
    X: 0,
    W: 0,
    control: {
      baseNameTable: 0,
      vramIncrement: 0,
      spritePatternAddress: 0,
      bgPatternAddress: 0,
      spriteSize: 0,
      ppuMasterSlave: 0,
      generateNMI: 0
    },
    busLatch: 0,
    ppuMemory: new Uint8Array(16384),
    oamMemory: new Uint8Array(256),
    framebuffer: new Uint32Array(SCREEN_WIDTH * SCREEN_HEIGHT)
  }
}

const incrementVRAMAddress = state => {
  if (state.ppu.control.vramIncrement === 0) {
    state.ppu.V += 1;
  } else {
    state.ppu.V += 32;
  }

  state.ppu.V = state.ppu.V % (1 << 16);
}

export const readPPUMem = (state, address) => {
  const ret = state.memory[address];


  if (address === PPUSTATUS) {
    state.memory[PPUSTATUS] = state.memory[PPUSTATUS] & PPUSTATUS_VBLANK_MASK;
    state.ppu.W = 0;
  } else {
    // Reading from write-only registers return the last value on the bus. Reading from PPUCTRL
    // increments VRAM address.

    if (address === PPUCTRL) {
      if (state.ppu.control.vramIncrement === 0) {
        incrementVRAMAddress(state);
      }

      return state.ppu.busLatch;
    }


    switch (address) {
      case PPUMASK:
      case OAMADDR:
      case PPUSCROLL:
      case PPUADDR:
        return state.ppu.busLatch;
      default:
        break;
    }
  }


  return ret;
}

export const setPPUMem = (state, address, value) => {
  state.memory[address] = value;

  switch (address) {
    case PPUCTRL:
      state.ppu.control = {
        baseNameTable:         (value & 0b00000011),
        vramIncrement:         (value & 0b00000100) >> 2,
        spritePatternAddress:  (value & 0b00001000) >> 3,
        bgPatternAddress:      (value & 0b00010000) >> 4,
        spriteSize:            (value & 0b00100000) >> 5,
        ppuMasterSlave:        (value & 0b01000000) >> 6,
        generateNMI:           (value & 0b10000000) >> 7
      };

      // Copy base name table data to T register at bits 11 and 12
      state.ppu.T = state.ppu.T & 0b111001111111111;
      state.ppu.T = state.ppu.T | (state.ppu.control.baseNameTable << 10);
      state.ppu.busLatch = value;
      break;
    case PPUSCROLL:
      if (state.ppu.W === 0) {
        // First write
        // Store lower three bits as X fine scroll
        state.ppu.X = value & 0b111;
        // Store upper five bits as part of T
        state.ppu.T = state.ppu.T & 0b111111111100000;
        state.ppu.T = state.ppu.T | (value >> 5);
        state.ppu.W = 1;
      } else {
        // Second write
        const p1 = value & 0b00111000;
        const p2 = value & 0b11000000;
        const p3 = value & 0b00000111;

        state.ppu.T = state.ppu.T & 0b000000000011111;
        state.ppu.T = state.ppu.T | (p1 << 2);
        state.ppu.T = state.ppu.T | (p2 << 2);
        state.ppu.T = state.ppu.T | (p3 << 10);
        state.ppu.W = 0;
      }

      state.ppu.busLatch = value;

      break;
    case PPUADDR:
      if (state.ppu.W === 0) {
        // Copy first six bytes of value
        const p = value & 0b00111111;

        // Clear bits for value (and reset 15th bit)
        state.ppu.T = state.ppu.T & 0b000000011111111;
        state.ppu.T = state.ppu.T | (p << 8);

        state.ppu.W = 1;
      } else {
        state.ppu.T = state.ppu.T & 0b11111110000000;
        state.ppu.T = state.ppu.T | value;
        state.ppu.V = state.ppu.T;
        state.ppu.W = 0;
      }

      state.ppu.busLatch = value;

      break;
    case PPUDATA:
      const ppuAddress = state.ppu.V & 0x3FFF;
      state.ppu.ppuMemory[ppuAddress] = value;
      incrementVRAMAddress(state);
      break;
    default:
  }
}

export const ppuCyclesPerFrame = state => {
  const renderingEnabled = state.memory[PPUMASK] & PPUMASK_RENDER_ENABLED_FLAGS;
  const skipLastCycle = renderingEnabled && !state.ppu.evenFrame;

  const ppuCycles = NUM_SCANLINES * PPU_CYCLES_PER_SCANLINE;

  if (skipLastCycle) {
    return ppuCycles - 1;
  }

  return ppuCycles;
}

const updatePPU = (state, cpuCycles) => {
  let { ppu } = state;
  ppu.cycle += cpuCycles * 3;

  const renderingEnabled = state.memory[PPUMASK] & PPUMASK_RENDER_ENABLED_FLAGS;

  for (let i = 0; i < cpuCycles * 3; i++){
    if (ppu.scanline < SCREEN_HEIGHT) {
      if (ppu.scanlineCycle > 0 && ppu.scanlineCycle <= 256) {

        // Draw pixel
        const index = ppu.scanline * SCREEN_WIDTH + (ppu.scanlineCycle - 1);
        const backgroundColor = state.ppu.ppuMemory[VRAM_BACKGROUND_COLOR];
        ppu.framebuffer[index] = COLORS[backgroundColor];
      }
    }


    if (ppu.scanlineCycle === 1) {
      if (ppu.scanline === VBLANK_SCANLINE) {
        // Set vblank status, generate interrupt
        state.memory[PPUSTATUS] = state.memory[PPUSTATUS] | PPUSTATUS_VBLANK;
      } else if (ppu.scanline === PRE_RENDER_SCANLINE) {
        state.memory[PPUSTATUS] = state.memory[PPUSTATUS] & PPUSTATUS_VBLANK_MASK;
      }
    }


    ppu.scanlineCycle++;

    const skipLastCycle = renderingEnabled && !ppu.evenFrame;

    if (ppu.scanlineCycle === 339 && ppu.scanline === PRE_RENDER_SCANLINE && skipLastCycle) {
      ppu.scanlineCycle = 0;
      ppu.scanline = 0;
      ppu.evenFrame = !ppu.evenFrame;
    } else if (ppu.scanlineCycle === 340) {
      ppu.scanline++;
      ppu.scanlineCycle = 0;

      if (ppu.scanline === VBLANK_SCANLINE) {
        // Generate vblank interrupt
        ppu.vblankCount++;
      } else if (ppu.scanline > PRE_RENDER_SCANLINE) {

        ppu.scanline = 0;
        ppu.evenFrame = !ppu.evenFrame;
      }
    }
  }

  // ppu.framebuffer[0] = 0xdadadada;
}


export default updatePPU;
