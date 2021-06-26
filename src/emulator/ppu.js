import { COLORS } from './constants';
import { OAM_DMA } from './cpu';
import { tick } from './emulator';
import { BIT_0, BIT_7 } from './instructions/util';

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
const POINTER_HORIZ_MASK = 0b000010000011111;
const POINTER_HORIZ_MASK_INV = ~POINTER_HORIZ_MASK;

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

const POST_RENDER_SCANLINE = 240;
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

export const paletteIndexedColor = (ppu, indexedColor, paletteIndex, baseOffset) => {
  let paletteAddress = baseOffset + paletteIndex * 4;

  if (isSteppingScanline) {
    // console.log('Color', hex(paletteIndex), spritePalette);
  }

  const p1Color = COLORS[readPPUMem(ppu, paletteAddress++)];
  const p2Color = COLORS[readPPUMem(ppu, paletteAddress++)];
  const p3Color = COLORS[readPPUMem(ppu, paletteAddress++)];

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
}

export const paletteIndexedSpriteColor = (ppu, indexedColor, attributes) => {
  const paletteIndex = attributes & SPRITE_ATTRIBS_PALETTE;
  return paletteIndexedColor(ppu, indexedColor, paletteIndex, VRAM_SPRITE_PALETTE_1_ADDRESS);
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
  // Store CHR rom in the first part of the memory
  const ppuMemory = new Uint8Array(16384);
  ppuMemory.set(rom);

  return {
    // Mesen PPU alignment is off with CPU at boot - set to match
    cycle: 27,
    scanlineCycle: 27,
    scanline: 0,
    evenFrame: true,
    frameCount: 0,
    vblankCount: 0,
    nmiOccurred: false,
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
    dataBuffer: 0,
    ppuMemory,
    oamMemory: (new Uint8Array(256)).fill(0xFF),
    secondaryOamMemory: new Uint8Array(32),
    pendingBackgroundTileIndex: 0,
    pendingBackgroundPalette: 0,
    backgroundShiftRegister1: 0,
    backgroundShiftRegister2: 0,
    backgroundPaletteRegister1: 0,
    backgroundPaletteRegister2: 0,
    spriteUnits: initSpriteUnits(),
    framebuffer: new Uint32Array(SCREEN_WIDTH * SCREEN_HEIGHT),
    scanlineDebug: new Array(256),
    frameDebug: []
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

export const readPPUMem = (ppu, ppuAddress) => {
  return ppu.ppuMemory[ppuAddress];
}

export const writePPUMem = (ppu, ppuAddress, value) => {
  ppu.ppuMemory[ppuAddress] = value;
}

export const readPPURegisterMem = (state, address, peek = false) => {
  let ret;

  if (address === PPUSTATUS) {
    ret = 0;

    if (state.ppu.nmiOccurred) {
      ret = ret | PPUSTATUS_VBLANK;

      if (!peek) {
        state.ppu.nmiOccurred = false;
      }
    }

    ret |= (state.ppu.busLatch & 0b11111);

    if (!peek) {
      state.ppu.W = 0;
    }
  } else if (address === PPUDATA) {
    const ppuAddress = state.ppu.V & 0x3FFF;
    // TODO: Handle palette reading here (V > 0x3EFF)
    ret = state.ppu.dataBuffer;
    if (!peek) {
      state.ppu.dataBuffer = readPPUMem(state.ppu, ppuAddress);
      incrementVRAMAddress(state);
    }
  } else {
    // Reading from write-only registers return the last value on the bus. Reading from PPUCTRL
    // increments VRAM address.

    if (address === PPUCTRL) {
      if (!peek && state.ppu.control.vramIncrement === 0) {
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

  if (!peek) {
    state.ppu.busLatch = ret;
  }

  return ret;
}

export const writeDMA = (state, address, value) => {
  // Setting the memory value is actually incorrect. When reading from OAM_DMA there is no decoding circuit for that particular
  // address, and the value returned is the last value on the open bus. But we don't emulate that behavior
  // since it's too complicated (at least for now), so set the value for debugging etc
  state.memory[OAM_DMA] = value;

  const onOddCycle = state.CYC % 2 === 1;

  tick(state); // One wait state cycle while waiting for writes to complete

  if (onOddCycle) { // One additional wait state if we were on an odd cycle
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

const dumpScrollPointer = pointer => {
  const FY = (pointer & 0b111000000000000) >> 12;
  const NT = (pointer & 0b000110000000000) >> 10;
  const CY = (pointer & 0b000001111100000) >> 5;
  const CX = (pointer & 0b000000000011111);
  return '[FY: ' + FY + ', NT: ' + NT + ', CY: ' + CY + ', CX: ' + CX + ']';
}

export const setPPUMem = (state, address, value) => {
  state.memory[address] = value;
  state.ppu.busLatch = value;

  switch (address) {
    case PPUMASK:
      break;
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
      break;
    case PPUSCROLL:
      if (state.ppu.W === 0) {
        // First write
        // Store lower three bits as X fine scroll
        state.ppu.X = value & 0b111;
        // Store upper five bits as part of T
        state.ppu.T = state.ppu.T & 0b111111111100000;
        state.ppu.T = state.ppu.T | (value >> 3);
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
        state.ppu.V = state.ppu.T;
        state.ppu.W = 0;
      }
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

      break;
    case PPUDATA:
      const ppuAddress = state.ppu.V & 0x3FFF;
      writePPUMem(state.ppu, ppuAddress, value);

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
      unit.shiftRegister1 = readPPUMem(ppu, chrIndex);
      unit.shiftRegister2 = readPPUMem(ppu, chrIndex + 8);
    }
  }
}

const incrementHorizontalV = ppu => {
  if ((ppu.V & 0b11111) === 31) {
    ppu.V = ppu.V & (~0b11111);
    // // Toggle bit 10 => switch horizontal namespace
    ppu.V ^= 0b10000000000;
  } else {
    ppu.V += 1;
  }
}

const incrementVerticalV = ppu => {
  let coarseYPos = (ppu.V & POINTER_Y_MASK) >> 5;
  coarseYPos = (Math.floor((ppu.scanline + 1) / 8)) & 0b11111;
  coarseYPos <<= 5;
  ppu.V &= POINTER_Y_MASK_INV;
  ppu.V |= coarseYPos;
}

const getPaletteFromByte = (v, byte) => {
  const coarseX = (v & 0b0000011111) % 4;
  const coarseY = ((v & 0b1111100000) >> 5) % 4;

  if (coarseY >= 2) {
    byte >>= 4;
    if (coarseX >= 2) {
      byte >>= 2;
    }
  } else if (coarseX >= 2) {
    byte >>= 2;
  }

  return byte & 0b11;
}

const updateBackgroundRegisters = (ppu) => {
  const { scanlineCycle } = ppu;

  if (ppu.scanlineCycle < 2 || (ppu.scanlineCycle > 257 && ppu.scanlineCycle < 322) || ppu.scanlineCycle > 337) {
    return;
  }

  ppu.backgroundShiftRegister1 <<= 1;
  ppu.backgroundShiftRegister2 <<= 1;
  ppu.backgroundPaletteRegister1 <<= 1;
  ppu.backgroundPaletteRegister2 <<= 1;

  const generatingTilesForNextScanline = scanlineCycle >= 328;

  if (scanlineCycle % 8 === 0) {
    // Read attributes into temporary registers. We cheat a bit and do this in one pass, in
    // reality it's a sequential process taking place across several cycles

    const nametable = (ppu.V & 0x0C00);
    const y = ((ppu.V >> 4) & 0b111000); // Since each entry in the palette table handles 4x4 tiles, we drop 2 bits of
    const x = ((ppu.V >> 2) & 0b000111)  // precision from the X & Y components so that they increment every 4 tiles

    const attributeAddress = 0x23C0 | nametable | y | x;
    let tileIndex = readPPUMem(ppu, 0x2000 | (ppu.V & 0x0FFF));
    tileIndex = (ppu.control.bgPatternAddress << 8) | tileIndex;
    const attribute = readPPUMem(ppu, attributeAddress);
    const palette = getPaletteFromByte(ppu.V, attribute);

    let lineIndex = (ppu.scanline % 8);

    if (generatingTilesForNextScanline) {
      // ppu.frameDebug.push(ppu.scanline + ',' + ppu.scanlineCycle + ': ' + dumpScrollPointer(ppu.V) + ': ' + y + ', ' + x + ' - gennext');
      lineIndex = (((ppu.scanline + 1) % NUM_SCANLINES) % 8);
    } else {
      // ppu.frameDebug.push(ppu.scanline + ',' + ppu.scanlineCycle + ': ' + dumpScrollPointer(ppu.V) + ': ' + y + ', ' + x + ' - gencur');
    }

    ppu.pendingBackgroundTileIndex = (tileIndex * 8 * 2) + lineIndex;
    ppu.pendingBackgroundPalette = palette;

    incrementHorizontalV(ppu);

    if (scanlineCycle === 256) {
      incrementVerticalV(ppu);
    }
  } else if ((scanlineCycle - 1) % 8 === 0) {
    ppu.backgroundShiftRegister1 |= (readPPUMem(ppu, ppu.pendingBackgroundTileIndex));
    ppu.backgroundShiftRegister2 |= (readPPUMem(ppu, ppu.pendingBackgroundTileIndex + 8));

    if (ppu.pendingBackgroundPalette & 0b01) { // Else it's already all zeroes due to shifts
      ppu.backgroundPaletteRegister1 |= 0b11111111;
    }

    if (ppu.pendingBackgroundPalette & 0b10) {
      ppu.backgroundPaletteRegister2 |= 0b11111111;
    }
  }

  if (scanlineCycle === 257) {
    resetHorizontalScroll(ppu);
  }
}

const updateSpriteScanning = ppu => {
  const { scanlineCycle } = ppu;

  if (scanlineCycle === 1) {
    clearSecondaryOAM(ppu);
    ppu.scanlineDebug[ppu.scanline] = dumpScrollPointer(ppu.V);
  } else if (scanlineCycle === 257) {
    initializeSecondaryOAM(ppu);
  } else if (scanlineCycle === 321) {
    copyToSpriteUnits(ppu);
  }
}

const handleVisibleScanline = (ppu, renderingEnabled, spritesEnabled, backgroundEnabled) => {
  if (renderingEnabled) {
    updateSpriteScanning(ppu);
    updateBackgroundRegisters(ppu);
  }

  if (ppu.scanlineCycle > 0 && ppu.scanlineCycle <= 256) {
    let spriteColor = 0;
    let spritePriority = -1;

    const bitNumber = 15 - ppu.X;
    const bitMask = 1 << bitNumber;

    if (ppu.scanline === 0) {
      // ppu.frameDebug.push(ppu.scanline + ': ' + ppu.X + ' - ' + dumpScrollPointer(ppu.T));
    }

    let backgroundColor1 = (ppu.backgroundShiftRegister1 & bitMask) >> bitNumber;
    let backgroundColor2 = (ppu.backgroundShiftRegister2 & bitMask) >> bitNumber;
    let backgroundPalette1 = (ppu.backgroundPaletteRegister1 & bitMask) >> bitNumber;
    let backgroundPalette2 = (ppu.backgroundPaletteRegister2 & bitMask) >> bitNumber;

    const backgroundPaletteIndex = (backgroundPalette2 << 1) | backgroundPalette1;
    const backgroundColorIndex = (backgroundColor2 << 1) | backgroundColor1;
    let backgroundColor = backgroundEnabled ? paletteIndexedColor(ppu, backgroundColorIndex, backgroundPaletteIndex, VRAM_BG_PALETTE_1_ADDRESS) : 0;

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
          spriteColor = spritesEnabled ? paletteIndexedSpriteColor(ppu, color, unit.attributes) : 0;
          spritePriority = (unit.attributes & SPRITE_ATTRIB_PRIORITY) >> 5;
        }
      }
    }

    if (spriteColor !== 0 && isSteppingScanline) {
      console.log(ppu.scanline, ppu.scanlineCycle - 1, spriteColor);
    }

    // Draw pixel
    const index = ppu.scanline * SCREEN_WIDTH + (ppu.scanlineCycle - 1);
    const vramBackgroundColor = readPPUMem(ppu, VRAM_BACKGROUND_COLOR);

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
}

const handleVblankScanline = (state) => {
  let { ppu } = state;

  if (ppu.scanlineCycle === 1) {
    state.memory[PPUSTATUS] = state.memory[PPUSTATUS] | PPUSTATUS_VBLANK;
  }
}

// Reset vertical part (Y scroll) of current VRAM address
const resetVerticalScroll = (ppu) => {
    ppu.V &= POINTER_Y_MASK_INV;
  ppu.V |= (ppu.T & POINTER_Y_MASK);
}

// Reset horizontal part (X scroll) of current VRAM address
const resetHorizontalScroll = (ppu) => {
  ppu.V &= POINTER_HORIZ_MASK_INV;
  ppu.V |= (ppu.T & POINTER_HORIZ_MASK);

  ppu.frameDebug.push('After reset ' + ppu.scanline + ':' + dumpScrollPointer(ppu.V));
}

const handlePrerenderScanline = (state, renderingEnabled) => {
  let { ppu } = state;

  if (renderingEnabled) {
    updateBackgroundRegisters(ppu);
  }


  if (ppu.scanlineCycle === 1) {
    state.memory[PPUSTATUS] = state.memory[PPUSTATUS] & PPUSTATUS_VBLANK_MASK;
  } else if (ppu.scanlineCycle >= 280 && ppu.scanlineCycle <= 304) {
    if (renderingEnabled) {
      resetVerticalScroll(ppu);
    }

    ppu.frameDebug.length = 0;
  }
}

const incrementDot = (state) => {
  const { ppu } = state;
  const renderingEnabled = state.memory[PPUMASK] & PPUMASK_RENDER_ENABLED_FLAGS;

  ppu.scanlineCycle++;

  const skipLastCycle = renderingEnabled && !ppu.evenFrame;

  if (ppu.scanlineCycle === 340 && ppu.scanline === PRE_RENDER_SCANLINE && skipLastCycle) {
    ppu.scanlineCycle = 0;
    ppu.scanline = 0;
    ppu.evenFrame = !ppu.evenFrame;
    ppu.nmiOccurred = false;
  } else if (ppu.scanlineCycle === 341) {
    ppu.scanline++;
    ppu.scanlineCycle = 0;

    if (ppu.scanline === POST_RENDER_SCANLINE) {
      ppu.frameCount++;
    }

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

  for (let i = 0; i < cpuCycles * 3; i++){
    const renderingEnabled = state.memory[PPUMASK] & PPUMASK_RENDER_ENABLED_FLAGS;
    const spritesEnabled = state.memory[PPUMASK] & PPUMASK_RENDER_SPRITES;
    const backgroundEnabled = state.memory[PPUMASK] & PPUMASK_RENDER_BACKGROUND;

    if (ppu.scanline < SCREEN_HEIGHT) {
      handleVisibleScanline(ppu, renderingEnabled, spritesEnabled, backgroundEnabled);
    } else if (ppu.scanline === VBLANK_SCANLINE) {
      // console.log('Hit vblank, renderinEnabled', renderingEnabled, spritesEnabled, backgroundEnabled);
      handleVblankScanline(state);
    } else if (ppu.scanline === PRE_RENDER_SCANLINE) {
      handlePrerenderScanline(state, renderingEnabled);
    }

    incrementDot(state);
    ppu.cycle++;
  }

  // ppu.framebuffer[0] = 0xdadadada;
}


export default updatePPU;
