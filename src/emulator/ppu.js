import { COLORS } from './constants';
import { OAM_DMA } from './cpu';
import { tick } from './emulator';
import { BIT_7, BIT_0, BIT_7_MASK } from './instructions/util';
import { hex } from './stateLogging';

const PPUCTRL	= 0x2000;
const PPUMASK	= 0x2001;
const PPUSTATUS = 0x2002;
const OAMADDR =	0x2003;
// const OAMDATA	= 0x2004;
const PPUSCROLL	= 0x2005;
const PPUADDR	= 0x2006;
const PPUDATA	= 0x2007;

const POINTER_Y_MASK = 0b000001111100000;
const POINTER_Y_MASK_INV = ~POINTER_Y_MASK;
const POINTER_X_MASK = 0b000000000011111;
const POINTER_X_MASK_INV = ~POINTER_X_MASK;

const SPRITE_ATTRIB_FLIP_HORIZONTAL = 0b01000000;
const SPRITE_ATTRIB_FLIP_VERTICAL   = 0b10000000;
const SPRITE_ATTRIB_PRIORITY        = 0b00100000;
const SPRITE_ATTRIBS_PALETTE        = 0b00000011;

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
const VRAM_BG_PALETTE_1_ADDRESS = 0x3F01;
const VRAM_SPRITE_PALETTE_1_ADDRESS = 0x3F11;

export const SCREEN_WIDTH = 256;
export const SCREEN_HEIGHT = 240;

let isSteppingScanline = false;

export const setIsSteppingScanline = (_isSteppingScanline) => isSteppingScanline = _isSteppingScanline;

export const paletteIndexedColor = (ppu, indexedColor, attributes) => {
  const spritePalette = attributes & SPRITE_ATTRIBS_PALETTE;
  let paletteIndex = VRAM_SPRITE_PALETTE_1_ADDRESS + spritePalette * 4;

  if (isSteppingScanline) {
    // console.log('Color', hex(paletteIndex), spritePalette);
  }

  const p1Color = COLORS[ppu.ppuMemory[paletteIndex++]];
  const p2Color = COLORS[ppu.ppuMemory[paletteIndex++]];
  const p3Color = COLORS[ppu.ppuMemory[paletteIndex++]];

  if (isSteppingScanline) {
    // console.log('Colors', p1Color, p2Color, p3Color)
  }

  switch (indexedColor) {
    case 0x0:
      return 0x00000000;
    case 0x1:
      return p1Color;
    case 0x2:
      return p2Color;
    case 0x3:
      return p3Color;
    default:
      console.log('Unhandled value', indexedColor);
      return 0;
  }

  return 0;
}

export const greyScaleColorForIndexedColor = indexedColor => {
  switch (indexedColor) {
    case 0x0:
      return 0x00000000;
    case 0x1:
      return 0x66666666;
    case 0x2:
      return 0xCCCCCCCC;
    case 0x3:
      return 0xFFFFFFFF;
    default:
      console.log('Unhandled value', indexedColor);
      return 0;
  }
};

const decodeTiles = rom => {
  let address = 0;
  let tiles = [];


  for (let tile = 0; tile < 512; tile++) {
    const tileData = new Uint8Array(8 * 8);
    let tileDataIndex = 0;
    for (let row = 0; row < 8; row++) {
      let plane1 = rom[address];
      let plane2 = rom[address + 8];

      for (let col = 0; col < 8; col++) {
        const c1 = (plane1 & BIT_7) >> 7;
        const c2 = (plane2 & BIT_7) >> 7;

        tileData[tileDataIndex++] = (c2 << 1) | c1;
        plane1 <<= 1;
        plane2 <<= 1;
      }

      address++;
    }

    tiles.push(tileData);
    address += 8;
  }

  return tiles;
}

const initSpriteUnits = () => {
  let ret = new Array(8);

  for (let i = 0; i < 8; i++) {
    ret[i] = {
      shiftRegister1: 0,
      shiftRegister2: 0,
      attributes: 0,
      counter: 0,
      isValid: false,
      flipHorizontal: false
    };
  }

  return ret;
}

export const initPPU = (rom) => {
  return {
    cycle: 0,
    scanlineCycle: 0,
    scanline: 0,
    evenFrame: true,
    vblankCount: 0,
    nmiOccurred: false,
    CHR: rom,
    tiles: decodeTiles(rom),
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
    oamMemory: (new Uint8Array(256)).fill(0xFF),
    secondaryOamMemory: new Uint8Array(32),
    backgroundShiftRegister1: 0,
    backgroundShiftRegister2: 0,
    backgroundPaletteRegister1: 0,
    backgroundPaletteRegister2: 0,
    spriteUnits: initSpriteUnits(),
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
  let ret = state.memory[address];

  if (address === PPUSTATUS) {
    ret &= PPUSTATUS_VBLANK_MASK;

    if (state.ppu.nmiOccurred) {
      ret = ret | PPUSTATUS_VBLANK;
      state.ppu.nmiOccurred = false;
    }

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

export const writeDMA = (state, address, value) => {
  // Setting the memory value is actually incorrect. When reading from OAM_DMA there is no decoding circuit for that particular
  // address, and the value returned is the last value on the open bus. But we don't emulate that behavior
  // since it's too complicated (at least for now), so set the value for debugging etc
  state.memory[OAM_DMA] = value;

  if (state.CYC % 2 === 1) {
    tick(state);
  }

  const baseAddress = value << 8;

  let oamAddress = state.memory[OAMADDR];
  for (let i = 0; i < 256; i++) {
    const addr = baseAddress + i;
    tick(state);
    const value = state.memory[addr];
    tick(state);
    state.ppu.oamMemory[oamAddress] = value;
    oamAddress = (oamAddress + 1) & 0xFF;
  }
}

const getSpriteSize = ppu => {
  return ppu.control.spriteSize === 1 ? 16 : 8;
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
        state.ppu.T = state.ppu.T & 0b111111100000000;
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

const clearSecondaryOAM = ppu => {
  if (isSteppingScanline) {
    console.log('Clearing secondary OAM');
  }

  for (let i = 0; i < ppu.secondaryOamMemory.length; i++) {
    ppu.secondaryOamMemory[i] = 0xFF;
  }
}

const initializeSecondaryOAM = ppu => {
  if (isSteppingScanline) {
    console.log('Init secondary OAM');
  }

  const spriteSize = getSpriteSize(ppu);

  let secondaryIndex = 0;
  let scanline = ppu.scanline;
  for (let i = 0; i < ppu.oamMemory.length && secondaryIndex < ppu.secondaryOamMemory.length; i+=4) {
    const y = ppu.oamMemory[i];
    if (scanline >= y && scanline < (y + spriteSize)) {
      if (isSteppingScanline) {
        console.log(i, 'Adding sprite to secondary OAM at ', ppu.oamMemory[i+3] + ',' + y + ' - ', ppu.oamMemory[i+1], ppu.oamMemory[i+2]);
      }

      ppu.secondaryOamMemory[secondaryIndex++] = y;
      ppu.secondaryOamMemory[secondaryIndex++] = ppu.oamMemory[i+1];
      ppu.secondaryOamMemory[secondaryIndex++] = ppu.oamMemory[i+2];
      ppu.secondaryOamMemory[secondaryIndex++] = ppu.oamMemory[i+3];
    }
  }
}

const copyToSpriteUnits = ppu => {
  let oamAddress = 0;
  let spriteSize = getSpriteSize(ppu);

  for (let i = 0; i < 8; i++) {
    let y = ppu.secondaryOamMemory[oamAddress++];
    let tileIndex = ppu.secondaryOamMemory[oamAddress++];
    let attributes = ppu.secondaryOamMemory[oamAddress++];
    let x = ppu.secondaryOamMemory[oamAddress++];
    let unit = ppu.spriteUnits[i];
    unit.counter = x + 1; // Account for idle cycle
    unit.attributes = attributes;

    unit.isValid = y !== 0xFF;
    let pixelRow = ppu.scanline - y;

    if (attributes & SPRITE_ATTRIB_FLIP_VERTICAL) {
      pixelRow = spriteSize - 1 - pixelRow;
    }

    if (isSteppingScanline && unit.isValid) {
      console.log('Rendering sprite at', x, 'x', y);
    }

    if (spriteSize === 16) {
      tileIndex = Math.trunc(tileIndex / 16) * 16 * 2 + (tileIndex % 16);
      if (pixelRow >= 8) {
        pixelRow -= 8;
        tileIndex += 16;
      }
    } else {
      tileIndex = (ppu.control.spritePatternAddress << 8) | tileIndex;
    }

    let chrIndex = tileIndex * 8 * 2 + pixelRow;

    unit.flipHorizontal = attributes & SPRITE_ATTRIB_FLIP_HORIZONTAL;

    if (y === 0xFF) {
      unit.shiftRegister1 = 0;
      unit.shiftRegister2 = 0;
    } else {
      unit.shiftRegister1 = ppu.CHR[chrIndex];
      unit.shiftRegister2 = ppu.CHR[chrIndex + 8];
    }
  }
}

const incrementHorizontalV = ppu => {
  ppu.V++;
}

const incrementVerticalV = ppu => {
  let coarseYPos = (ppu.V & POINTER_Y_MASK) >> 5;
  coarseYPos++;
  coarseYPos <<= 5;
  ppu.V &= POINTER_Y_MASK_INV;
  ppu.V |= coarseYPos;
}

// Shift to make room for next tile
const shiftBackgroundRegistersForNextScanline = ppu => {
  const { scanlineCycle } = ppu;
  if (scanlineCycle >= 328 && scanlineCycle < 336) {
    ppu.backgroundShiftRegister1 >>= 1;
    ppu.backgroundShiftRegister2 >>= 1;
    ppu.backgroundPaletteRegister1 >>= 1;
    ppu.backgroundPaletteRegister2 >>= 1;
  }
}

const handleVisibleScanline = (ppu) => {
  const { scanlineCycle } = ppu;
  if (scanlineCycle === 1) {
    clearSecondaryOAM(ppu);
  } else if (scanlineCycle === 256) {
    // incrementVerticalV(ppu);
  } else if (scanlineCycle === 257) {
    initializeSecondaryOAM(ppu);
    resetHorizontalScroll(ppu);
  } else if (scanlineCycle === 321) {
    copyToSpriteUnits(ppu);
  }

  const generatingTilesForCurrentScanline = scanlineCycle > 1 && scanlineCycle <= 249;
  const generatingTilesForNextScanline = scanlineCycle >= 328;

  /*
  if (generatingTilesForCurrentScanline || generatingTilesForNextScanline) {
    if (scanlineCycle % 8 === 0) {
      // Read tile from current VRAM address and corresponding palette attributes,
      // feed into upper part of shift registers

      const tileAddress = 0x2000 | (ppu.V & 0x0FFF)
      const nametable = (ppu.V & 0x0C00);

      // Since each entry in the palette table handles 4x4 tiles, we drop 2
      // bits of precision from the X & Y components so that they increment
      // every 4 tiles (go from 5 bits of precision on each to only 2).
      const y = ((ppu.V >> 4) & 0b111000);
      const x = ((ppu.V >> 2) & 0b000111)
      const attributeAddress = 0x23C0 | nametable | y | x;
      const tileIndex = ppu.ppuMemory[tileAddress];
      const attribute = ppu.ppuMemory[attributeAddress];

      // The palette value is packed like this:
      // (bottomRight << 6) | (bottomLeft << 4) | (topRight << 2) | (topLeft << 0)

      // Each consecutive two bits of the palette byte represents a 2x2
      // tile area. So, we would like to know how many times we should
      // shift the value to get the correct palette. If we drop 1 bit of
      // precision on the X,Y values and combine them into a 3 bit value
      // we get:
      // topLeft     = shift 0 pixels = 0b000
      // topRight    = shift 2 pixels = 0b010
      // bottomLeft  = shift 4 pixels = 0b100
      // bottomRight = shift 6 pixels = 0b110
      const tileShift = ((ppu.V >> 4) & 0b100) | (ppu.V & 0b010);
      const palette = (attribute >> tileShift) & 0b11;

      if (palette & 0b01) { // Else it's already all zeroes due to shifts
        ppu.backgroundPaletteRegister1 |= 0b1111111100000000;
      }

      if (palette & 0b10) {
        ppu.backgroundPaletteRegister2 |= 0b1111111100000000;
      }

      let chrIndex = tileIndex * 8 * 2;
      ppu.backgroundShiftRegister1 |= (ppu.CHR[chrIndex] << 8);
      ppu.backgroundShiftRegister2 |= (ppu.CHR[chrIndex + 8] << 8);

      incrementHorizontalV(ppu);
    }
  }*/


  if (ppu.scanlineCycle > 0 && ppu.scanlineCycle <= 256) {
    let spriteColor = 0;
    let spritePriority = -1;

    const backgroundColor = 0;
    /*
    let backgroundColor1 = ppu.backgroundShiftRegister1 & 0b1;
    let backgroundColor2 = ppu.backgroundShiftRegister2 & 0b1;
    let backgroundPalette1 = ppu.backgroundPaletteRegister1 & 0b1;
    let backgroundPalette2 = ppu.backgroundPaletteRegister2 & 0b1;

    ppu.backgroundShiftRegister1 >>= 1;
    ppu.backgroundShiftRegister2 >>= 1;
    ppu.backgroundPaletteRegister1 >>= 1;
    ppu.backgroundPaletteRegister2 >>= 1;

    const backgroundColor = greyScaleColorForIndexedColor((backgroundColor2 << 1) | backgroundColor1);
    const packgroundPalette = (backgroundPalette2 << 1) | backgroundPalette1;*/

    for (let i = 0; i < ppu.spriteUnits.length; i++) {
      let unit = ppu.spriteUnits[i];
      unit.counter--;

      if (unit.isValid && unit.counter <= 0 && unit.counter > -8) {
        let c1;
        let c2;
        if (unit.flipHorizontal) {
          c1 = (unit.shiftRegister1 & BIT_0);
          c2 = (unit.shiftRegister2 & BIT_0);
          unit.shiftRegister1 >>= 1;
          unit.shiftRegister2 >>= 1;
        } else {
          c1 = (unit.shiftRegister1 & BIT_7) >> 7;
          c2 = (unit.shiftRegister2 & BIT_7) >> 7;
          unit.shiftRegister1 <<= 1;
          unit.shiftRegister2 <<= 1;
        }


        const color = (c2 << 1) | c1;

        if (spriteColor === 0) {
          spriteColor = paletteIndexedColor(ppu, color, unit.attributes);
          spritePriority = (unit.attributes & SPRITE_ATTRIB_PRIORITY) >> 5;
        }
      }
    }

    if (spriteColor !== 0 && isSteppingScanline) {
      console.log(ppu.scanline, ppu.scanlineCycle - 1, spriteColor);
    }

    // Draw pixel
    const index = ppu.scanline * SCREEN_WIDTH + (ppu.scanlineCycle - 1);
    const vramBackgroundColor = ppu.ppuMemory[VRAM_BACKGROUND_COLOR];
    if (spriteColor === 0) {
      if (backgroundColor === 0) {
        ppu.framebuffer[index] = COLORS[vramBackgroundColor];
      } else {
        ppu.framebuffer[index] = backgroundColor;
      }
    } else if (backgroundColor === 0) {
      ppu.framebuffer[index] = spriteColor;
    } else {
      // Both colors set
      if (spritePriority === 0) {
        ppu.framebuffer[index] = spriteColor;
      } else {
        ppu.framebuffer[index] = backgroundColor;
      }
    }
  }


  // shiftBackgroundRegistersForNextScanline(ppu);
}

const handleVblankScanline = (state) => {
  let { ppu } = state;

  if (ppu.scanlineCycle === 1) {
    state.memory[PPUSTATUS] = state.memory[PPUSTATUS] | PPUSTATUS_VBLANK;
  }
}

const resetVerticalScroll = (ppu) => {
  return;
  // Reset vertical part (Y scroll) of current VRAM address
  ppu.V &= POINTER_Y_MASK_INV;
  ppu.V |= (ppu.T & POINTER_Y_MASK);
}

const resetHorizontalScroll = (ppu) => {
  return;
  // Reset horizontal part (X scroll) of current VRAM address
  ppu.V &= POINTER_X_MASK_INV;
  ppu.V |= (ppu.T & POINTER_X_MASK);
}

const handlePrerenderScanline = (state) => {
  let { ppu } = state;

  if (ppu.scanlineCycle === 1) {
    state.memory[PPUSTATUS] = state.memory[PPUSTATUS] & PPUSTATUS_VBLANK_MASK;
  } else if (ppu.scanlineCycle === 257) {
    // resetHorizontalScroll(ppu);
  } else if (ppu.scanlineCycle === 304) {
    // resetVerticalScroll(ppu);
  }

  // shiftBackgroundRegistersForNextScanline(ppu);
}

const incrementDot = (state) => {
  const { ppu } = state;
  const renderingEnabled = state.memory[PPUMASK] & PPUMASK_RENDER_ENABLED_FLAGS;

  ppu.scanlineCycle++;

  const skipLastCycle = renderingEnabled && !ppu.evenFrame;

  if (ppu.scanlineCycle === 339 && ppu.scanline === PRE_RENDER_SCANLINE && skipLastCycle) {
    ppu.scanlineCycle = 0;
    ppu.scanline = 0;
    ppu.evenFrame = !ppu.evenFrame;
    ppu.nmiOccurred = false;
  } else if (ppu.scanlineCycle === 340) {
    ppu.scanline++;
    ppu.scanlineCycle = 0;

    if (ppu.scanline === VBLANK_SCANLINE) {
      // Generate vblank interrupt
      ppu.nmiOccurred = true;

      if (ppu.control.generateNMI && ppu.scanlineCycle === 0) {
        state.nmiInterruptCycle = state.CYC;
      }

      ppu.vblankCount++;
    } else if (ppu.scanline > PRE_RENDER_SCANLINE) {
      ppu.nmiOccurred = false;
      ppu.scanline = 0;
      ppu.evenFrame = !ppu.evenFrame;
    }
  }
}


const updatePPU = (state, cpuCycles) => {
  let { ppu } = state;
  ppu.cycle += cpuCycles * 3;

  for (let i = 0; i < cpuCycles * 3; i++){
    if (ppu.scanline < SCREEN_HEIGHT) {
      handleVisibleScanline(ppu);
    } else if (ppu.scanline === VBLANK_SCANLINE) {
      handleVblankScanline(state);
    } else if (ppu.scanline === PRE_RENDER_SCANLINE) {
      handlePrerenderScanline(state);
    }

    incrementDot(state);
  }

  // ppu.framebuffer[0] = 0xdadadada;
}


export default updatePPU;
