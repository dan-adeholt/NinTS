import { COLORS } from './constants';
import { BIT_0, BIT_7 } from './instructions/util';
import { hex } from './stateLogging';

const PPUCTRL	= 0x2000;
const PPUMASK	= 0x2001;
const PPUSTATUS = 0x2002;
const OAMADDR =	0x2003;
const OAMDATA	= 0x2004;
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
const PPUMASK_SHOW_BACKGROUND_LEFT_8_PIXELS = 1 << 1;
const PPUMASK_SHOW_SPRITES_LEFT_8_PIXELS = 1 << 2;
const PPUMASK_RENDER_BACKGROUND = 1 << 3;
const PPUMASK_RENDER_SPRITES = 1 << 4;
// const PPUMASK_EMPHASIZE_RED = 1 << 5;
// const PPUMASK_EMPHASIZE_GREEN = 1 << 6;
// const PPUMASK_EMPHASIZE_BLUE = 1 << 7;

const PPUMASK_RENDER_ENABLED_FLAGS = PPUMASK_RENDER_BACKGROUND | PPUMASK_RENDER_SPRITES;
const PPUMASK_RENDER_LEFT_SIDE = PPUMASK_SHOW_BACKGROUND_LEFT_8_PIXELS | PPUMASK_SHOW_SPRITES_LEFT_8_PIXELS;

const PPUSTATUS_VBLANK = 1 << 7;
const PPUSTATUS_SPRITE_ZERO_HIT = 1 << 6;

const POST_RENDER_SCANLINE = 240;
const VBLANK_SCANLINE = 241;
const PRE_RENDER_SCANLINE = 261;
const NUM_SCANLINES = 262;

const VRAM_BACKGROUND_COLOR = 0x3f00;
const VRAM_BG_PALETTE_1_ADDRESS = 0x3F01;
const VRAM_SPRITE_PALETTE_1_ADDRESS = 0x3F11;

export const SCREEN_WIDTH = 256;
export const SCREEN_HEIGHT = 240;

let isSteppingScanline = false;

export const setIsSteppingScanline = (_isSteppingScanline) => isSteppingScanline = _isSteppingScanline;

export const paletteIndexedColor = (ppu, indexedColor, paletteIndex, baseOffset) => {
  let paletteAddress = baseOffset + paletteIndex * 4;

  const p1Color = COLORS[readPPUMem(ppu, paletteAddress++)];
  const p2Color = COLORS[readPPUMem(ppu, paletteAddress++)];
  const p3Color = COLORS[readPPUMem(ppu, paletteAddress++)];

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
      return 0;
  }
}

export const paletteIndexedSpriteColor = (ppu, indexedColor, paletteIndex) => {
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

export const initPPU = (rom) => {
  // Store CHR rom in the first part of the memory
  const ppuMemory = new Uint8Array(16384);
  ppuMemory.set(rom);

  // Boot palette values are the same as Mesens in order to be compatible with value peeking
  ppuMemory.set([
    0x09, 0x01, 0x00, 0x01, 0x00, 0x02, 0x02, 0x0D, 0x08, 0x10, 0x08, 0x24, 0x00, 0x00, 0x04, 0x2C,
    0x09, 0x01, 0x34, 0x03, 0x00, 0x04, 0x00, 0x14, 0x08, 0x3A, 0x00, 0x02, 0x00, 0x20, 0x2C, 0x08],
    0x3F00);

  return {
    cycle: -1,
    scanlineCycle: -1,
    scanline: 0,
    masterClock: 0,
    ppuDivider: 4,
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
    paletteRAM: new Uint8Array(),
    oamAddress: 0,
    ppuMask: 0,
    maskRenderLeftSide: false,
    maskRenderingEnabled: false,
    maskSpritesEnabled: false,
    maskBackgroundEnabled: false,
    oamMemory: (new Uint8Array(256)).fill(0xFF),
    secondaryOamMemory: new Uint8Array(32),
    spriteZeroIsInSpriteUnits: false,
    pendingBackgroundTileIndex: 0,
    pendingBackgroundPalette: 0,
    backgroundShiftRegister1: 0,
    backgroundShiftRegister2: 0,
    backgroundPaletteRegister1: 0,
    backgroundPaletteRegister2: 0,
    spriteZeroHit: false,
    spriteScanline: new Uint32Array(SCREEN_WIDTH),
    framebuffer: new Uint32Array(SCREEN_WIDTH * SCREEN_HEIGHT),
    scanlineDebug: new Array(256),
    slack: 0,
    disabled: false
  }
}

const incrementVRAMAddress = ppu => {
  if (ppu.control.vramIncrement === 0) {
    ppu.V += 1;
  } else {
    ppu.V += 32;
  }

  ppu.V = ppu.V % (1 << 16);
};

const isPPUPaletteAddress = ppuAddress => ppuAddress >= 0x3F00 && ppuAddress <= 0x3F11;

const writePPUPaletteMem = (ppu, ppuAddress, value) => {
  if (ppuAddress === 0x3F00 || ppuAddress === 0x3F10) {
    ppu.ppuMemory[0x3F00] = value;
    ppu.ppuMemory[0x3F10] = value;
  } else if (ppuAddress === 0x3F04 || ppuAddress === 0x3F14) {
    ppu.ppuMemory[0x3F04] = value;
    ppu.ppuMemory[0x3F14] = value;
  } else if (ppuAddress === 0x3F08 || ppuAddress === 0x3F18) {
    ppu.ppuMemory[0x3F08] = value;
    ppu.ppuMemory[0x3F18] = value;
  } else if (ppuAddress === 0x3F1c || ppuAddress === 0x3F0c) {
    ppu.ppuMemory[0x3F0C] = value;
    ppu.ppuMemory[0x3F1C] = value;
  } else {
    ppu.ppuMemory[ppuAddress] = value;
  }
}

export const readPPUMem = (ppu, ppuAddress) => {
  return ppu.ppuMemory[ppuAddress];
}

export const writePPUMem = (ppu, ppuAddress, value) => {
  if (isPPUPaletteAddress(ppuAddress)) {
    return writePPUPaletteMem(ppu, ppuAddress, value);
  }

  ppu.ppuMemory[ppuAddress] = value;
}

export const readPPURegisterMem = (ppu, address, peek = false) => {
  let ret;

  if (address === PPUSTATUS) {
    ret = 0;

    if (ppu.nmiOccurred) {
      ret = ret | PPUSTATUS_VBLANK;

      if (!peek) {
        ppu.nmiOccurred = false;
      }
    }

    if (ppu.spriteZeroHit) {
      ret |= PPUSTATUS_SPRITE_ZERO_HIT;
    }

    ret |= (ppu.busLatch & 0b11111);

    if (!peek) {
      ppu.W = 0;
    }
  } else if (address === PPUDATA) {
    const ppuAddress = ppu.V & 0x3FFF;
    // TODO: Handle palette reading here (V > 0x3EFF)

    if (ppuAddress >= 0x3F00) {
      ret = readPPUMem(ppu, ppuAddress);
      if (!peek) {
        // From: https://wiki.nesdev.com/w/index.php/PPU_registers#Data_.28.242007.29_.3C.3E_read.2Fwrite
        // Reading the palettes still updates the internal buffer though, but the data placed in it is the mirrored nametable data that would appear "underneath" the palette.
        ppu.dataBuffer = readPPUMem(ppu, ppuAddress - 0x1000);
        incrementVRAMAddress(ppu);
      }
    } else {
      ret = ppu.dataBuffer;
      if (!peek) {
        ppu.dataBuffer = readPPUMem(ppu, ppuAddress);
        incrementVRAMAddress(ppu);
      }
    }
  } else if (address === OAMDATA) {
    ret = ppu.oamMemory[ppu.oamAddress];
  } else {
    // Reading from write-only registers return the last value on the bus. Reading from PPUCTRL
    // increments VRAM address.

    if (address === PPUCTRL) {
      if (!peek && ppu.control.vramIncrement === 0) {
        incrementVRAMAddress(ppu);
      }

      return ppu.busLatch;
    }

    switch (address) {
      case PPUMASK:
      case OAMADDR:
      case PPUSCROLL:
      case PPUADDR:
        return ppu.busLatch;
      default:
        break;
    }
  }

  if (!peek) {
    ppu.busLatch = ret;
  }

  if (ret === undefined) {
    console.error('Read PPU register returned undefined', hex(address, '0x'));
  }
  return ret;
}

export const pushOAMValue = (ppu, value) => {
  ppu.oamMemory[ppu.oamAddress] = value;
  ppu.oamAddress = (ppu.oamAddress + 1) & 0xFF;
};

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

export const setPPURegisterMem = (ppu, address, value) => {
  ppu.busLatch = value;

  switch (address) {
    case OAMDATA:
      pushOAMValue(ppu, value);
      break;
    case OAMADDR:
      ppu.oamAddress = value;
      break;
    case PPUMASK:
      ppu.ppuMask = value;
      ppu.maskRenderLeftSide = (value & PPUMASK_RENDER_LEFT_SIDE) !== 0;
      ppu.maskRenderingEnabled = (value & PPUMASK_RENDER_ENABLED_FLAGS) !== 0;
      ppu.maskSpritesEnabled = (value & PPUMASK_RENDER_SPRITES) !== 0;
      ppu.maskBackgroundEnabled = (value & PPUMASK_RENDER_BACKGROUND) !== 0;
      break;
    case PPUCTRL:
      ppu.control = {
        baseNameTable:         (value & 0b00000011),
        vramIncrement:         (value & 0b00000100) >> 2,
        spritePatternAddress:  (value & 0b00001000) >> 3,
        bgPatternAddress:      (value & 0b00010000) >> 4,
        spriteSize:            (value & 0b00100000) >> 5,
        ppuMasterSlave:        (value & 0b01000000) >> 6,
        generateNMI:           (value & 0b10000000) >> 7
      };

      // Copy base name table data to T register at bits 11 and 12
      ppu.T = ppu.T & 0b111001111111111;
      ppu.T = ppu.T | (ppu.control.baseNameTable << 10);
      break;
    case PPUSCROLL:
      if (ppu.W === 0) {
        // First write
        // Store lower three bits as X fine scroll
        ppu.X = value & 0b111;
        // Store upper five bits as part of T
        ppu.T = ppu.T & 0b111111111100000;
        ppu.T = ppu.T | (value >> 3);
        ppu.W = 1;
      } else {
        // Second write
        const p1 = value & 0b00111000;
        const p2 = value & 0b11000000;
        const p3 = value & 0b00000111;

        ppu.T = ppu.T & 0b000000000011111;
        ppu.T = ppu.T | (p1 << 2);
        ppu.T = ppu.T | (p2 << 2);
        ppu.T = ppu.T | (p3 << 10);
        ppu.V = ppu.T;
        ppu.W = 0;
      }
      break;
    case PPUADDR:
      if (ppu.W === 0) {
        // Copy first six bytes of value
        const p = value & 0b00111111;

        // Clear bits for value (and reset 15th bit)
        ppu.T = ppu.T & 0b000000011111111;
        ppu.T = ppu.T | (p << 8);

        ppu.W = 1;
      } else {
        ppu.T = ppu.T & 0b111111100000000;
        ppu.T = ppu.T | value;
        ppu.V = ppu.T;
        ppu.W = 0;
      }

      break;
    case PPUDATA:
      const ppuAddress = ppu.V & 0x3FFF;
      writePPUMem(ppu, ppuAddress, value);
      incrementVRAMAddress(ppu);
      break;
    default:
  }
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

  ppu.spriteZeroIsInSpriteUnits = false;
  for (let i = ppu.oamAddress; i < (ppu.oamMemory.length - 3) && secondaryIndex < ppu.secondaryOamMemory.length; i+=4) {
    const y = ppu.oamMemory[i];
    if (scanline >= y && scanline < (y + spriteSize)) {
      if (isSteppingScanline) {
        console.log(i, 'Adding sprite to secondary OAM at ', ppu.oamMemory[i+3] + ',' + y + ' - ', ppu.oamMemory[i+1], ppu.oamMemory[i+2]);
      }

      ppu.secondaryOamMemory[secondaryIndex++] = y;
      ppu.secondaryOamMemory[secondaryIndex++] = ppu.oamMemory[i+1];
      ppu.secondaryOamMemory[secondaryIndex++] = ppu.oamMemory[i+2];
      ppu.secondaryOamMemory[secondaryIndex++] = ppu.oamMemory[i+3];

      // Sprite zero resides in at address OAM...OAM+3. If it is visible on screen, set flag
      if (i === 0) {
        ppu.spriteZeroIsInSpriteUnits = true;
      }
    }
  }
}

const copyToSpriteUnits = ppu => {
  let oamAddress = 0;
  let spriteSize = getSpriteSize(ppu);

  for (let i = 0; i < SCREEN_WIDTH; i++) {
    ppu.spriteScanline[i] = 0;
  }

  for (let i = 0; i < 8; i++) {
    let y = ppu.secondaryOamMemory[oamAddress++];
    let tileIndex = ppu.secondaryOamMemory[oamAddress++];
    let attributes = ppu.secondaryOamMemory[oamAddress++];
    let x = ppu.secondaryOamMemory[oamAddress++];
    let pixelRow = ppu.scanline - y;

    if (attributes & SPRITE_ATTRIB_FLIP_VERTICAL) {
      pixelRow = spriteSize - 1 - pixelRow;
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

    const flipHorizontal = attributes & SPRITE_ATTRIB_FLIP_HORIZONTAL;
    const spritePriority = (attributes & SPRITE_ATTRIB_PRIORITY) >> 5;
    const paletteIndex = attributes & SPRITE_ATTRIBS_PALETTE;

    if (y !== 0xFF) {
      let shiftRegister1 = readPPUMem(ppu, chrIndex);
      let shiftRegister2 = readPPUMem(ppu, chrIndex + 8);


      for (let xp = x; xp < x + 8; xp++) {
        let c1;
        let c2;

        if (flipHorizontal) {
          c1 = (shiftRegister1 & BIT_0);
          c2 = (shiftRegister2 & BIT_0);
          shiftRegister1 >>= 1;
          shiftRegister2 >>= 1;
        } else {
          c1 = (shiftRegister1 & BIT_7) >> 7;
          c2 = (shiftRegister2 & BIT_7) >> 7;
          shiftRegister1 <<= 1;
          shiftRegister2 <<= 1;
        }

        const color = (c2 << 1) | c1;

        if (ppu.spriteScanline[xp] === 0 && color !== 0) {
          ppu.spriteScanline[xp] = color | (spritePriority << 2) | (paletteIndex << 3) | (i << 5);
        }
      }
    }
  }
};

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
      lineIndex = (((ppu.scanline + 1) % NUM_SCANLINES) % 8);
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

  if (scanlineCycle >= 257 && scanlineCycle <= 320) {
    ppu.oamAddress = 0;
  }

  if (scanlineCycle === 1) {
    clearSecondaryOAM(ppu);
    ppu.scanlineDebug[ppu.scanline] = dumpScrollPointer(ppu.V);
  } else if (scanlineCycle === 257) {
    initializeSecondaryOAM(ppu);
  } else if (scanlineCycle === 321) {
    copyToSpriteUnits(ppu);
  }
}

const handleVisibleScanline = (ppu) => {
  const { maskRenderingEnabled, maskSpritesEnabled, maskBackgroundEnabled, maskRenderLeftSide } = ppu;

  if (maskRenderingEnabled) {
    updateSpriteScanning(ppu);
    updateBackgroundRegisters(ppu);
  }

  const scanlineCycle = ppu.scanlineCycle;

  if (scanlineCycle > 0 && scanlineCycle <= 256) {
    let spriteColor = 0;

    const bitNumber = 15 - ppu.X;
    const bitMask = 1 << bitNumber;

    let backgroundColor1 = (ppu.backgroundShiftRegister1 & bitMask) >> bitNumber;
    let backgroundColor2 = (ppu.backgroundShiftRegister2 & bitMask) >> bitNumber;
    let backgroundPalette1 = (ppu.backgroundPaletteRegister1 & bitMask) >> bitNumber;
    let backgroundPalette2 = (ppu.backgroundPaletteRegister2 & bitMask) >> bitNumber;

    const backgroundPaletteIndex = (backgroundPalette2 << 1) | backgroundPalette1;
    const backgroundColorIndex = (backgroundColor2 << 1) | backgroundColor1;
    let backgroundColor = maskBackgroundEnabled ? paletteIndexedColor(ppu, backgroundColorIndex, backgroundPaletteIndex, VRAM_BG_PALETTE_1_ADDRESS) : 0;

    const pixel = scanlineCycle - 1;
    const spriteData = ppu.spriteScanline[pixel];
    const spritePatternColor = spriteData & 0b11;
    const spritePriority = (spriteData >> 2) & 0b1;

    if (spritePatternColor !== 0 && maskSpritesEnabled) {
      const spritePalette = (spriteData >> 3) & 0b11;
      spriteColor = paletteIndexedSpriteColor(ppu, spritePatternColor, spritePalette);
    }

    // Draw pixel
    const index = (ppu.scanline * SCREEN_WIDTH) + pixel;

    if (spriteColor === 0) {
      if (backgroundColor !== 0) {
        ppu.framebuffer[index] = backgroundColor;
      } else {
        const vramBackgroundColor = readPPUMem(ppu, VRAM_BACKGROUND_COLOR);
        ppu.framebuffer[index] = COLORS[vramBackgroundColor];
      }
    } else if (backgroundColor !== 0) {
      // Both colors set
      if (spritePriority === 0) {
        ppu.framebuffer[index] = spriteColor;
      } else {
        ppu.framebuffer[index] = backgroundColor;
      }

      const spriteNumber = (spriteData >> 5);

      // Sprite zero handling
      if (!ppu.spriteZeroHit &&
          ppu.spriteZeroIsInSpriteUnits &&
          // If sprite zero is among the sprite units, it's always at sprite number 0
          spriteNumber === 0 &&
          scanlineCycle !== 255 &&
          ((scanlineCycle > 8) || maskRenderLeftSide)
      ) {
        ppu.spriteZeroHit = true;
      }
    } else {
      ppu.framebuffer[index] = spriteColor;
    }
  }
}

const handleVblankScanline = (ppu) => {
  if (ppu.scanlineCycle === 1) {
    // Generate vblank interrupt
    ppu.nmiOccurred = true;

    ppu.vblankCount++;
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
}

const handlePrerenderScanline = (ppu) => {
  const { maskRenderingEnabled } = ppu;

  if (maskRenderingEnabled) {
    updateBackgroundRegisters(ppu);
  }

  if (ppu.scanlineCycle === 0) {
    ppu.nmiOccurred = false;
  }

  if (ppu.scanlineCycle === 0) {
    ppu.spriteZeroHit = false;
  } else if (ppu.scanlineCycle >= 257 && ppu.scanlineCycle <= 320) {
    ppu.oamAddress = 0;
  } else if (ppu.scanlineCycle >= 280 && ppu.scanlineCycle <= 304) {
    if (maskRenderingEnabled) {
      resetVerticalScroll(ppu);
    }
  }
}

export const incrementDot = (ppu) => {
  const renderingEnabled = ppu.ppuMask & PPUMASK_RENDER_ENABLED_FLAGS;

  ppu.scanlineCycle++;

  const skipLastCycle = renderingEnabled && !ppu.evenFrame;

  if (ppu.scanlineCycle === 340 && ppu.scanline === PRE_RENDER_SCANLINE && skipLastCycle) {
    ppu.scanlineCycle = 0;
    ppu.scanline = 0;
    ppu.evenFrame = !ppu.evenFrame;
  } else if (ppu.scanlineCycle === 341) {
    ppu.scanline++;
    ppu.scanlineCycle = 0;

    if (ppu.scanline === POST_RENDER_SCANLINE) {
      ppu.frameCount++;
    }

    if (ppu.scanline > PRE_RENDER_SCANLINE) {
      ppu.scanline = 0;
      ppu.evenFrame = !ppu.evenFrame;
    }
  }
}

const updatePPU = (ppu, targetMasterClock) => {
  if (ppu.disabled) {
    return;
  }

  while (ppu.masterClock + ppu.ppuDivider <= targetMasterClock) {
    incrementDot(ppu);

    if (ppu.scanline < SCREEN_HEIGHT) {
      handleVisibleScanline(ppu);
    } else if (ppu.scanline === VBLANK_SCANLINE) {
      // console.log('Hit vblank, renderinEnabled', renderingEnabled, spritesEnabled, backgroundEnabled);
      handleVblankScanline(ppu);
    } else if (ppu.scanline === PRE_RENDER_SCANLINE) {
      handlePrerenderScanline(ppu);
    }

    ppu.cycle++;
    ppu.masterClock += ppu.ppuDivider;
  }

  ppu.slack = targetMasterClock - ppu.masterClock;
}


export default updatePPU;
