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

// const dumpScrollPointer = pointer => {
//   const FY = (pointer & 0b111000000000000) >> 12;
//   const NT = (pointer & 0b000110000000000) >> 10;
//   const CY = (pointer & 0b000001111100000) >> 5;
//   const CX = (pointer & 0b000000000011111);
//   return '[FY: ' + FY + ', NT: ' + NT + ', CY: ' + CY + ', CX: ' + CX + ']';
// }

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

const isPPUPaletteAddress = ppuAddress => ppuAddress >= 0x3F00 && ppuAddress <= 0x3F11;

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
};

class PPU {
  cycle = -1;
  scanlineCycle = -1;
  scanline = 0;
  masterClock = 0;
  ppuDivider = 4;
  evenFrame = true;
  frameCount = 0;
  vblankCount = 0;
  nmiOccurred = false;
  tiles = null;
  V = 0;
  T = 0;
  X = 0;
  W = 0;
  control = {
    baseNameTable: 0,
    vramIncrement: 0,
    spritePatternAddress: 0,
    bgPatternAddress: 0,
    spriteSize: 0,
    ppuMasterSlave: 0,
    generateNMI: 0
  };
  busLatch = 0;
  dataBuffer = 0;
  paletteRAM = new Uint8Array();
  oamAddress = 0;
  maskRenderLeftSide = false;
  maskRenderingEnabled = false;
  maskSpritesEnabled = false;
  maskBackgroundEnabled = false;
  oamMemory = (new Uint8Array(256)).fill(0xFF);
  secondaryOamMemory = new Uint8Array(32);
  spriteZeroIsInSpriteUnits = false;
  pendingBackgroundTileIndex = 0;
  pendingBackgroundPalette = 0;
  backgroundShiftRegister1 = 0;
  backgroundShiftRegister2 = 0;
  backgroundPaletteRegister1 = 0;
  backgroundPaletteRegister2 = 0;
  spriteZeroHit = false;
  spriteScanline = new Uint32Array(SCREEN_WIDTH);
  framebuffer = new Uint32Array(SCREEN_WIDTH * SCREEN_HEIGHT);
  scanlineDebug = new Array(256);
  slack = 0;
  disabled = false;

  constructor(rom) {
    // Store CHR rom in the first part of the memory
    const ppuMemory = new Uint8Array(16384);
    ppuMemory.set(rom);

    // Boot palette values are the same as Mesens in order to be compatible with value peeking
    ppuMemory.set([
          0x09, 0x01, 0x00, 0x01, 0x00, 0x02, 0x02, 0x0D, 0x08, 0x10, 0x08, 0x24, 0x00, 0x00, 0x04, 0x2C,
          0x09, 0x01, 0x34, 0x03, 0x00, 0x04, 0x00, 0x14, 0x08, 0x3A, 0x00, 0x02, 0x00, 0x20, 0x2C, 0x08],
        0x3F00);

    this.tiles = decodeTiles(rom);
    this.ppuMemory = ppuMemory;
  }

  paletteIndexedColor(indexedColor, paletteIndex, baseOffset) {
    let paletteAddress = baseOffset + paletteIndex * 4;

    const p1Color = COLORS[this.readPPUMem(paletteAddress++)];
    const p2Color = COLORS[this.readPPUMem(paletteAddress++)];
    const p3Color = COLORS[this.readPPUMem(paletteAddress++)];

    if (indexedColor === 1) {
      return p1Color;
    } else if (indexedColor === 2) {
      return p2Color;
    } else if (indexedColor === 3) {
      return p3Color;
    }

    return 0;
  }

  paletteIndexedSpriteColor(indexedColor, paletteIndex) {
    return this.paletteIndexedColor(indexedColor, paletteIndex, VRAM_SPRITE_PALETTE_1_ADDRESS);
  }

  incrementVRAMAddress = () => {
    if (this.control.vramIncrement === 0) {
      this.V += 1;
    } else {
      this.V += 32;
    }

    this.V = this.V % (1 << 16);
  };

  writePPUPaletteMem = (ppuAddress, value) => {
    if (ppuAddress === 0x3F00 || ppuAddress === 0x3F10) {
      this.ppuMemory[0x3F00] = value;
      this.ppuMemory[0x3F10] = value;
    } else if (ppuAddress === 0x3F04 || ppuAddress === 0x3F14) {
      this.ppuMemory[0x3F04] = value;
      this.ppuMemory[0x3F14] = value;
    } else if (ppuAddress === 0x3F08 || ppuAddress === 0x3F18) {
      this.ppuMemory[0x3F08] = value;
      this.ppuMemory[0x3F18] = value;
    } else if (ppuAddress === 0x3F1c || ppuAddress === 0x3F0c) {
      this.ppuMemory[0x3F0C] = value;
      this.ppuMemory[0x3F1C] = value;
    } else {
      this.ppuMemory[ppuAddress] = value;
    }
  }

  readPPUMem = (ppuAddress) => {
    return this.ppuMemory[ppuAddress];
  }

  writePPUMem = (ppuAddress, value) => {
    if (isPPUPaletteAddress(ppuAddress)) {
      return this.writePPUPaletteMem(ppuAddress, value);
    }

    this.ppuMemory[ppuAddress] = value;
  }

  readPPURegisterMem = (address, peek = false) => {
    let ret;

    if (address === PPUSTATUS) {
      ret = 0;

      if (this.nmiOccurred) {
        ret = ret | PPUSTATUS_VBLANK;

        if (!peek) {
          this.nmiOccurred = false;
        }
      }

      if (this.spriteZeroHit) {
        ret |= PPUSTATUS_SPRITE_ZERO_HIT;
      }

      ret |= (this.busLatch & 0b11111);

      if (!peek) {
        this.W = 0;
      }
    } else if (address === PPUDATA) {
      const ppuAddress = this.V & 0x3FFF;
      // TODO: Handle palette reading here (V > 0x3EFF)

      if (ppuAddress >= 0x3F00) {
        ret = this.readPPUMem(ppuAddress);
        if (!peek) {
          // From: https://wiki.nesdev.com/w/index.php/PPU_registers#Data_.28.242007.29_.3C.3E_read.2Fwrite
          // Reading the palettes still updates the internal buffer though, but the data placed in it is the mirrored nametable data that would appear "underneath" the palette.
          this.dataBuffer = this.readPPUMem(ppuAddress - 0x1000);
          this.incrementVRAMAddress();
        }
      } else {
        ret = this.dataBuffer;
        if (!peek) {
          this.dataBuffer = this.readPPUMem(ppuAddress);
          this.incrementVRAMAddress();
        }
      }
    } else if (address === OAMDATA) {
      ret = this.oamMemory[this.oamAddress];
    } else {
      // Reading from write-only registers return the last value on the bus. Reading from PPUCTRL
      // increments VRAM address.

      if (address === PPUCTRL) {
        if (!peek && this.control.vramIncrement === 0) {
          this.incrementVRAMAddress();
        }

        return this.busLatch;
      }

      switch (address) {
        case PPUMASK:
        case OAMADDR:
        case PPUSCROLL:
        case PPUADDR:
          return this.busLatch;
        default:
          break;
      }
    }

    if (!peek) {
      this.busLatch = ret;
    }

    if (ret === undefined) {
      console.error('Read PPU register returned undefined', hex(address, '0x'));
    }
    return ret;
  }

  pushOAMValue = (value) => {
    this.oamMemory[this.oamAddress] = value;
    this.oamAddress = (this.oamAddress + 1) & 0xFF;
  };

  getSpriteSize = () => {
    return this.control.spriteSize === 1 ? 16 : 8;
  }

  setPPURegisterMem = (address, value) => {
    this.busLatch = value;

    switch (address) {
      case OAMDATA:
        this.pushOAMValue(value);
        break;
      case OAMADDR:
        this.oamAddress = value;
        break;
      case PPUMASK:
        this.maskRenderLeftSide = (value & PPUMASK_RENDER_LEFT_SIDE) !== 0;
        this.maskRenderingEnabled = (value & PPUMASK_RENDER_ENABLED_FLAGS) !== 0;
        this.maskSpritesEnabled = (value & PPUMASK_RENDER_SPRITES) !== 0;
        this.maskBackgroundEnabled = (value & PPUMASK_RENDER_BACKGROUND) !== 0;
        break;
      case PPUCTRL:
        this.control = {
          baseNameTable:         (value & 0b00000011),
          vramIncrement:         (value & 0b00000100) >> 2,
          spritePatternAddress:  (value & 0b00001000) >> 3,
          bgPatternAddress:      (value & 0b00010000) >> 4,
          spriteSize:            (value & 0b00100000) >> 5,
          ppuMasterSlave:        (value & 0b01000000) >> 6,
          generateNMI:           (value & 0b10000000) >> 7
        };

        // Copy base name table data to T register at bits 11 and 12
        this.T = this.T & 0b111001111111111;
        this.T = this.T | (this.control.baseNameTable << 10);
        break;
      case PPUSCROLL:
        if (this.W === 0) {
          // First write
          // Store lower three bits as X fine scroll
          this.X = value & 0b111;
          // Store upper five bits as part of T
          this.T = this.T & 0b111111111100000;
          this.T = this.T | (value >> 3);
          this.W = 1;
        } else {
          // Second write
          const p1 = value & 0b00111000;
          const p2 = value & 0b11000000;
          const p3 = value & 0b00000111;

          this.T = this.T & 0b000000000011111;
          this.T = this.T | (p1 << 2);
          this.T = this.T | (p2 << 2);
          this.T = this.T | (p3 << 10);
          this.V = this.T;
          this.W = 0;
        }
        break;
      case PPUADDR:
        if (this.W === 0) {
          // Copy first six bytes of value
          const p = value & 0b00111111;

          // Clear bits for value (and reset 15th bit)
          this.T = this.T & 0b000000011111111;
          this.T = this.T | (p << 8);

          this.W = 1;
        } else {
          this.T = this.T & 0b111111100000000;
          this.T = this.T | value;
          this.V = this.T;
          this.W = 0;
        }

        break;
      case PPUDATA:
        const ppuAddress = this.V & 0x3FFF;
        this.writePPUMem(ppuAddress, value);
        this.incrementVRAMAddress();
        break;
      default:
    }
  }

  clearSecondaryOAM = () => {
    if (isSteppingScanline) {
      console.log('Clearing secondary OAM');
    }

    for (let i = 0; i < this.secondaryOamMemory.length; i++) {
      this.secondaryOamMemory[i] = 0xFF;
    }
  }

  initializeSecondaryOAM = () => {
    if (isSteppingScanline) {
      console.log('Init secondary OAM');
    }

    const spriteSize = this.getSpriteSize();

    let secondaryIndex = 0;
    let scanline = this.scanline;

    this.spriteZeroIsInSpriteUnits = false;
    for (let i = this.oamAddress; i < (this.oamMemory.length - 3) && secondaryIndex < this.secondaryOamMemory.length; i+=4) {
      const y = this.oamMemory[i];
      if (scanline >= y && scanline < (y + spriteSize)) {
        if (isSteppingScanline) {
          console.log(i, 'Adding sprite to secondary OAM at ', this.oamMemory[i+3] + ',' + y + ' - ', this.oamMemory[i+1], this.oamMemory[i+2]);
        }

        this.secondaryOamMemory[secondaryIndex++] = y;
        this.secondaryOamMemory[secondaryIndex++] = this.oamMemory[i+1];
        this.secondaryOamMemory[secondaryIndex++] = this.oamMemory[i+2];
        this.secondaryOamMemory[secondaryIndex++] = this.oamMemory[i+3];

        // Sprite zero resides in at address OAM...OAM+3. If it is visible on screen, set flag
        if (i === 0) {
          this.spriteZeroIsInSpriteUnits = true;
        }
      }
    }
  }

  copyToSpriteUnits = () => {
    let oamAddress = 0;
    let spriteSize = this.getSpriteSize();

    for (let i = 0; i < SCREEN_WIDTH; i++) {
      this.spriteScanline[i] = 0;
    }

    for (let i = 0; i < 8; i++) {
      let y = this.secondaryOamMemory[oamAddress++];
      let tileIndex = this.secondaryOamMemory[oamAddress++];
      let attributes = this.secondaryOamMemory[oamAddress++];
      let x = this.secondaryOamMemory[oamAddress++];
      let pixelRow = this.scanline - y;

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
        tileIndex = (this.control.spritePatternAddress << 8) | tileIndex;
      }

      let chrIndex = tileIndex * 8 * 2 + pixelRow;

      const flipHorizontal = attributes & SPRITE_ATTRIB_FLIP_HORIZONTAL;
      const spritePriority = (attributes & SPRITE_ATTRIB_PRIORITY) >> 5;
      const paletteIndex = attributes & SPRITE_ATTRIBS_PALETTE;

      if (y !== 0xFF) {
        let shiftRegister1 = this.readPPUMem(chrIndex);
        let shiftRegister2 = this.readPPUMem(chrIndex + 8);


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

          if (this.spriteScanline[xp] === 0 && color !== 0) {
            this.spriteScanline[xp] = color | (spritePriority << 2) | (paletteIndex << 3) | (i << 5);
          }
        }
      }
    }
  };

  incrementHorizontalV = () => {
    if ((this.V & 0b11111) === 31) {
      this.V = this.V & (~0b11111);
      // // Toggle bit 10 => switch horizontal namespace
      this.V ^= 0b10000000000;
    } else {
      this.V += 1;
    }
  }

  incrementVerticalV = () => {
    let coarseYPos = (this.V & POINTER_Y_MASK) >> 5;
    coarseYPos = (Math.floor((this.scanline + 1) / 8)) & 0b11111;
    coarseYPos <<= 5;
    this.V &= POINTER_Y_MASK_INV;
    this.V |= coarseYPos;
  }

  updateBackgroundRegisters = () => {
    const { scanlineCycle } = this;

    if (this.scanlineCycle < 2 || (this.scanlineCycle > 257 && this.scanlineCycle < 322) || this.scanlineCycle > 337) {
      return;
    }

    this.backgroundShiftRegister1 <<= 1;
    this.backgroundShiftRegister2 <<= 1;
    this.backgroundPaletteRegister1 <<= 1;
    this.backgroundPaletteRegister2 <<= 1;

    if (scanlineCycle % 8 === 0) {
      // Read attributes into temporary registers. We cheat a bit and do this in one pass, in
      // reality it's a sequential process taking place across several cycles

      const nametable = (this.V & 0x0C00);
      const y = ((this.V >> 4) & 0b111000); // Since each entry in the palette table handles 4x4 tiles, we drop 2 bits of
      const x = ((this.V >> 2) & 0b000111)  // precision from the X & Y components so that they increment every 4 tiles

      const attributeAddress = 0x23C0 | nametable | y | x;
      let tileIndex = this.readPPUMem(0x2000 | (this.V & 0x0FFF));
      tileIndex = (this.control.bgPatternAddress << 8) | tileIndex;
      const attribute = this.readPPUMem(attributeAddress);
      const palette = getPaletteFromByte(this.V, attribute);

      let lineIndex = (this.scanline % 8);

      const generatingTilesForNextScanline = scanlineCycle >= 328;

      if (generatingTilesForNextScanline) {
        lineIndex = (((this.scanline + 1) % NUM_SCANLINES) % 8);
      }

      this.pendingBackgroundTileIndex = (tileIndex * 8 * 2) + lineIndex;
      this.pendingBackgroundPalette = palette;

      this.incrementHorizontalV();

      if (scanlineCycle === 256) {
        this.incrementVerticalV();
      }
    } else if ((scanlineCycle - 1) % 8 === 0) {
      this.backgroundShiftRegister1 |= (this.readPPUMem(this.pendingBackgroundTileIndex));
      this.backgroundShiftRegister2 |= (this.readPPUMem(this.pendingBackgroundTileIndex + 8));

      if (this.pendingBackgroundPalette & 0b01) { // Else it's already all zeroes due to shifts
        this.backgroundPaletteRegister1 |= 0b11111111;
      }

      if (this.pendingBackgroundPalette & 0b10) {
        this.backgroundPaletteRegister2 |= 0b11111111;
      }
    }

    if (scanlineCycle === 257) {
      this.resetHorizontalScroll();
    }
  }

  updateSpriteScanning = () => {
    const { scanlineCycle } = this;

    if (scanlineCycle >= 257 && scanlineCycle <= 320) {
      this.oamAddress = 0;
    }

    if (scanlineCycle === 1) {
      this.clearSecondaryOAM();
    } else if (scanlineCycle === 257) {
      this.initializeSecondaryOAM();
    } else if (scanlineCycle === 321) {
      this.copyToSpriteUnits();
    }
  }

  // Reset vertical part (Y scroll) of current VRAM address
  resetVerticalScroll = () => {
    this.V &= POINTER_Y_MASK_INV;
    this.V |= (this.T & POINTER_Y_MASK);
  }

  // Reset horizontal part (X scroll) of current VRAM address
  resetHorizontalScroll = () => {
    this.V &= POINTER_HORIZ_MASK_INV;
    this.V |= (this.T & POINTER_HORIZ_MASK);
  }

  handleVisibleScanline = () => {
    const { maskRenderingEnabled, maskSpritesEnabled, maskBackgroundEnabled, maskRenderLeftSide } = this;

    if (maskRenderingEnabled) {
      this.updateSpriteScanning();
      this.updateBackgroundRegisters();
    }

    const scanlineCycle = this.scanlineCycle;

    if (scanlineCycle > 0 && scanlineCycle <= 256) {
      let spriteColor = 0;

      const bitNumber = 15 - this.X;
      const bitMask = 1 << bitNumber;

      let backgroundColor1 = (this.backgroundShiftRegister1 & bitMask) >> bitNumber;
      let backgroundColor2 = (this.backgroundShiftRegister2 & bitMask) >> bitNumber;
      let backgroundPalette1 = (this.backgroundPaletteRegister1 & bitMask) >> bitNumber;
      let backgroundPalette2 = (this.backgroundPaletteRegister2 & bitMask) >> bitNumber;

      const backgroundPaletteIndex = (backgroundPalette2 << 1) | backgroundPalette1;
      const backgroundColorIndex = (backgroundColor2 << 1) | backgroundColor1;
      let backgroundColor = maskBackgroundEnabled ? this.paletteIndexedColor(backgroundColorIndex, backgroundPaletteIndex, VRAM_BG_PALETTE_1_ADDRESS) : 0;

      const pixel = scanlineCycle - 1;
      const spriteData = this.spriteScanline[pixel];
      const spritePatternColor = spriteData & 0b11;
      const spritePriority = (spriteData >> 2) & 0b1;

      if (spritePatternColor !== 0 && maskSpritesEnabled) {
        const spritePalette = (spriteData >> 3) & 0b11;
        spriteColor = this.paletteIndexedSpriteColor(spritePatternColor, spritePalette);
      }

      // Draw pixel
      const index = (this.scanline * SCREEN_WIDTH) + pixel;

      if (spriteColor === 0) {
        if (backgroundColor !== 0) {
          this.framebuffer[index] = backgroundColor;
        } else {
          const vramBackgroundColor = this.readPPUMem(VRAM_BACKGROUND_COLOR);
          this.framebuffer[index] = COLORS[vramBackgroundColor];
        }
      } else if (backgroundColor !== 0) {
        // Both colors set
        if (spritePriority === 0) {
          this.framebuffer[index] = spriteColor;
        } else {
          this.framebuffer[index] = backgroundColor;
        }

        const spriteNumber = (spriteData >> 5);

        // Sprite zero handling
        if (!this.spriteZeroHit &&
            this.spriteZeroIsInSpriteUnits &&
            // If sprite zero is among the sprite units, it's always at sprite number 0
            spriteNumber === 0 &&
            scanlineCycle !== 255 &&
            ((scanlineCycle > 8) || maskRenderLeftSide)
        ) {
          this.spriteZeroHit = true;
        }
      } else {
        this.framebuffer[index] = spriteColor;
      }
    }
  };

  handleVblankScanline = () => {
    if (this.scanlineCycle === 1) {
      // Generate vblank interrupt
      this.nmiOccurred = true;

      this.vblankCount++;
    }
  }

  handlePrerenderScanline = () => {
    const { maskRenderingEnabled } = this;

    if (maskRenderingEnabled) {
      this.updateBackgroundRegisters();
    }

    if (this.scanlineCycle === 0) {
      this.nmiOccurred = false;
    }

    if (this.scanlineCycle === 0) {
      this.spriteZeroHit = false;
    } else if (this.scanlineCycle >= 257 && this.scanlineCycle <= 320) {
      this.oamAddress = 0;
    } else if (this.scanlineCycle >= 280 && this.scanlineCycle <= 304) {
      if (maskRenderingEnabled) {
        this.resetVerticalScroll();
      }
    }
  }

  incrementDot = () => {
    this.scanlineCycle++;

    const skipLastCycle = this.maskRenderingEnabled && !this.evenFrame;

    if (this.scanlineCycle === 340 && this.scanline === PRE_RENDER_SCANLINE && skipLastCycle) {
      this.scanlineCycle = 0;
      this.scanline = 0;
      this.evenFrame = !this.evenFrame;
    } else if (this.scanlineCycle === 341) {
      this.scanline++;
      this.scanlineCycle = 0;

      if (this.scanline === POST_RENDER_SCANLINE) {
        this.frameCount++;
      }

      if (this.scanline > PRE_RENDER_SCANLINE) {
        this.scanline = 0;
        this.evenFrame = !this.evenFrame;
      }
    }
  }

  updatePPU = (targetMasterClock) => {
    if (this.disabled) {
      return;
    }

    while (this.masterClock + this.ppuDivider <= targetMasterClock) {
      this.incrementDot();

      if (this.scanline < SCREEN_HEIGHT) {
        this.handleVisibleScanline();
      } else if (this.scanline === VBLANK_SCANLINE) {
        // console.log('Hit vblank, renderinEnabled', renderingEnabled, spritesEnabled, backgroundEnabled);
        this.handleVblankScanline();
      } else if (this.scanline === PRE_RENDER_SCANLINE) {
        this.handlePrerenderScanline();
      }

      this.cycle++;
      this.masterClock += this.ppuDivider;
    }

    this.slack = targetMasterClock - this.masterClock;
  }
};


export default PPU;
