import { COLOR_TABLE, GREYSCALE_COLOR_TABLE } from './constants';
import { BIT_0, BIT_7 } from './instructions/util';
import { hex } from './stateLogging';
import Mapper from './mappers/Mapper';
import { RomSettings } from './parseROM';
import Logger from './logger';

const PPUCTRL	  = 0x2000;
const PPUMASK	  = 0x2001;
const PPUSTATUS = 0x2002;
const OAMADDR   =	0x2003;
const OAMDATA	  = 0x2004;
const PPUSCROLL	= 0x2005;
const PPUADDR	  = 0x2006;
const PPUDATA	  = 0x2007;

const POINTER_HORIZ_MASK = 0b000010000011111;
const POINTER_HORIZ_MASK_INV = ~POINTER_HORIZ_MASK;

const POINTER_Y_MASK = POINTER_HORIZ_MASK_INV;
const POINTER_Y_MASK_INV = POINTER_HORIZ_MASK;

const POINTER_FINE_Y_MASK = 0b111000000000000;

export const SPRITE_ATTRIB_FLIP_HORIZONTAL  = 0b01000000;
export const SPRITE_ATTRIB_FLIP_VERTICAL    = 0b10000000;
export const SPRITE_ATTRIB_PRIORITY         = 0b00100000;
export const SPRITE_ATTRIBS_PALETTE         = 0b00000011;

const PPUMASK_GREYSCALE                     = 0b00000001;
const PPUMASK_SHOW_BACKGROUND_LEFT_8_PIXELS = 0b00000010;
const PPUMASK_SHOW_SPRITES_LEFT_8_PIXELS    = 0b00000100;
const PPUMASK_RENDER_BACKGROUND             = 0b00001000;
const PPUMASK_RENDER_SPRITES                = 0b00010000;
const PPUMASK_EMPHASIZE                     = 0b11100000;

const PPUMASK_RENDER_ENABLED_FLAGS = PPUMASK_RENDER_BACKGROUND | PPUMASK_RENDER_SPRITES;

const PPUSTATUS_VBLANK          = 0b10000000;
const PPUSTATUS_SPRITE_ZERO_HIT = 0b01000000;

const POST_RENDER_SCANLINE = 240;
const VBLANK_SCANLINE = 241;
export const PRE_RENDER_SCANLINE = 261;

const VRAM_BACKGROUND_COLOR = 0x3f00;
const VRAM_BG_PALETTE_1_ADDRESS = 0x3F01;
const VRAM_SPRITE_PALETTE_1_ADDRESS = 0x3F11;

export const SCREEN_WIDTH = 256;
export const SCREEN_HEIGHT = 240;

let isSteppingScanline = false;

export function setIsSteppingScanline(_isSteppingScanline: boolean) {
  isSteppingScanline = _isSteppingScanline;
}

// const dumpScrollPointer = pointer => {
//   const FY = (pointer & 0b111000000000000) >> 12;
//   const NT = (pointer & 0b000110000000000) >> 10;
//   const CY = (pointer & 0b000001111100000) >> 5;
//   const CX = (pointer & 0b000000000011111);
//   return '[FineY: ' + FY + ', NTable: ' + NT + ', CoarseY: ' + CY + ', CoarseX: ' + CX + ']';
// }

export function greyScaleColorForIndexedColor(indexedColor: number) {
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
}

function isPPUPaletteAddress(ppuAddress: number) {
  return ppuAddress >= 0x3F00 && ppuAddress <= 0x3FFF;
}

function getPaletteFromByte(v: number, byte: number) {
  const coarseX = (v & 0b0000011111) % 4;
  const coarseY = ((v & 0b1111100000) >>> 5) % 4;

  if (coarseY >= 2) {
    byte >>>= 4;
    if (coarseX >= 2) {
      byte >>>= 2;
    }
  } else if (coarseX >= 2) {
    byte >>>= 2;
  }

  return byte & 0b11;
}

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
  V = 0;
  T = 0;
  X = 0;
  W = 0;
  controlBaseNameTable = 0;
  controlVramIncrement = 0;
  controlSpritePatternAddress = 0;
  controlBgPatternAddress = 0;
  controlSpriteSize = 0;
  controlPpuMasterSlave = 0;
  controlGenerateNMI = 0;
  nmiFlag = false;
  busLatch = 0;
  dataBuffer = 0;
  oamAddress = 0;

  vramReadDisableCounter = 0
  showSpritesLeftSide = false
  greyscale = false

  showBackgroundLeftSide = false

  maskRenderLeftSide = false;
  maskRenderingEnabled = false;

  pendingMaskRenderingEnabled = false;

  maskSpritesEnabled = false;
  maskBackgroundEnabled = false;
  colors = COLOR_TABLE[0];
  muteVerticalBlank = false;

  colorLatch1 = 0;
  colorLatch2 = 0;

  oamMemory = (new Uint8Array(256)).fill(0xFF);
  secondaryOamMemory = new Uint8Array(32);
  spriteZeroIsInSpriteUnits = false;
  pendingBackgroundTileIndex = 0;
  pendingBackgroundPalette = 0;
  spriteZeroHit = false;
  spriteScanline = new Uint32Array(SCREEN_WIDTH);
  tileScanlineIndex = 0;
  tileScanline = new Uint32Array(SCREEN_WIDTH + 8);
  framebuffer = new Uint32Array(SCREEN_WIDTH * SCREEN_HEIGHT);
  paletteRAM = new Uint32Array(32)
  slack = 0;
  disabled = false;
  mapper: Mapper;
  scanlineLogger = new Logger();
  triggerDelayedStateUpdate = false

  constructor(settings: RomSettings, mapper: Mapper) {
    // Boot palette values are the same as Mesens in order to be compatible with value peeking
    const initialPalette = [
      0x09, 0x01, 0x00, 0x01, 0x00, 0x02, 0x02, 0x0D, 0x08, 0x10, 0x08, 0x24, 0x00, 0x00, 0x04, 0x2C,
      0x09, 0x01, 0x34, 0x03, 0x00, 0x04, 0x00, 0x14, 0x08, 0x3A, 0x00, 0x02, 0x00, 0x20, 0x2C, 0x08];
    this.mapper = mapper;

    this.paletteRAM.set(initialPalette);
  }


  paletteIndexedColor(indexedColor: number, paletteIndex: number, baseOffset: number) {
    // Shortcut: We know we are always in palette RAM here, read from there directly.    
    if (indexedColor === 1) {
      return this.paletteRAM[(baseOffset + (paletteIndex * 4)) & 0x1F];
    } else if (indexedColor === 2) {
      return this.paletteRAM[(baseOffset + (paletteIndex * 4) + 1) & 0x1F];
    } else if (indexedColor === 3) {
      return this.paletteRAM[(baseOffset + (paletteIndex * 4) + 2) & 0x1F];
    }

    return 0;
  }

  paletteIndexedSpriteColor(indexedColor: number, paletteIndex: number) {
    return this.paletteIndexedColor(indexedColor, paletteIndex, VRAM_SPRITE_PALETTE_1_ADDRESS);
  }

  incrementVRAMAddress() {
    if (this.controlVramIncrement === 0) {
      this.V += 1;
    } else {
      this.V += 32;
    }

    this.V = this.V % (1 << 16);
  }

  writePPUPaletteMem(paletteAddress: number, value: number) {
    if (paletteAddress === 0x00 || paletteAddress === 0x10) {
      this.paletteRAM[0x00] = value;
      this.paletteRAM[0x10] = value;
    } else if (paletteAddress === 0x04 || paletteAddress === 0x14) {
      this.paletteRAM[0x04] = value;
      this.paletteRAM[0x14] = value;
    } else if (paletteAddress === 0x08 || paletteAddress === 0x18) {
      this.paletteRAM[0x08] = value;
      this.paletteRAM[0x18] = value;
    } else if (paletteAddress === 0x1c || paletteAddress === 0x0c) {
      this.paletteRAM[0x0C] = value;
      this.paletteRAM[0x1C] = value;
    } else {
      this.paletteRAM[paletteAddress] = value;
    }
  }

  readDirectPPUMem(ppuAddress: number) {  
    return this.mapper.ppuMemory.read(ppuAddress);
  }
  
  readPPUMem(ppuAddress: number) {
    if (isPPUPaletteAddress(ppuAddress)) {
      return this.paletteRAM[ppuAddress & 0x1F];
    } else {
      return this.mapper.ppuMemory.read(ppuAddress);
    }
  }

  writePPUMem(ppuAddress: number, value: number) {
    if (isPPUPaletteAddress(ppuAddress)) {
      this.writePPUPaletteMem(ppuAddress & 0x1F, value);
    } else {
      this.mapper.ppuMemory.write(ppuAddress, value);
    }
  }

  readPPURegisterMem(address: number, peek = false): number {
    let ret = -1;

    if (address === PPUSTATUS) {
      ret = 0;

      if (this.nmiOccurred) {
        ret = ret | PPUSTATUS_VBLANK;

        if (!peek) {
          this.nmiOccurred = false;
          this.nmiFlag = false;
        }
      }

      // I think this is a bug in Mesen, but we do this to align anyways.
      if (peek && this.scanline === VBLANK_SCANLINE && this.scanlineCycle < 3) {
        ret &= 0b1111111;
      }

      if (!peek && this.scanline === VBLANK_SCANLINE && this.scanlineCycle === 0) {
        this.muteVerticalBlank = true;
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

      // Double read of $2007 sometimes ignores extra read, and puts odd things into buffer.
      // Do this to fix double_2007_read.nes - if re-reading 2007 within 2 CPU cycles, return 
      // open bus.
      if (this.vramReadDisableCounter > 0) {
        return this.busLatch;
      } else if (ppuAddress >= 0x3F00) {
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

      // Disable reads for PPUData for 2 CPU cycles = 6 PPU cycles
      if (!peek) {  
        this.vramReadDisableCounter = 6;
      }
    } else if (address === OAMDATA) {
      ret = this.oamMemory[this.oamAddress];
    } else {
      // Reading from write-only registers return the last value on the bus.
      return this.busLatch;
    }

    if (!peek) {
      this.busLatch = ret;
    }

    if (ret === undefined) {
      console.error('Read PPU register returned undefined', hex(address, '0x'));
    }
    return ret;
  }

  pushOAMValue(value: number) {
    this.oamMemory[this.oamAddress] = value;
    this.oamAddress = (this.oamAddress + 1) & 0xFF;
  }

  getSpriteSize() {
    return this.controlSpriteSize === 1 ? 16 : 8;
  }

  setPPURegisterMem(address: number, value: number) {
    if (address !== 0x4014) {
      this.busLatch = value;
    }

    switch (address) {
      case OAMDATA:
        this.pushOAMValue(value);
        break;
      case OAMADDR:
        this.oamAddress = value;
        break;
      case PPUMASK: {
        this.greyscale = (value & PPUMASK_GREYSCALE) != 0;

        this.showSpritesLeftSide = (value & PPUMASK_SHOW_SPRITES_LEFT_8_PIXELS) !== 0;
        this.showBackgroundLeftSide = (value & PPUMASK_SHOW_BACKGROUND_LEFT_8_PIXELS) !== 0;

        this.pendingMaskRenderingEnabled = (value & PPUMASK_RENDER_ENABLED_FLAGS) !== 0;
        this.maskSpritesEnabled = (value & PPUMASK_RENDER_SPRITES) !== 0;
        this.maskBackgroundEnabled = (value & PPUMASK_RENDER_BACKGROUND) !== 0;

        if (this.pendingMaskRenderingEnabled !== this.maskRenderingEnabled) {
          this.triggerDelayedStateUpdate = true;
        }

        const emphasis = (value & PPUMASK_EMPHASIZE) >> 5;
        if (!this.greyscale) {
          this.colors = COLOR_TABLE[emphasis];
        } else {
          this.colors = GREYSCALE_COLOR_TABLE[emphasis];
        }

        // Reach back in time and apply the new style to the two preceding pixels. 
        // The reason for this is that the attributes are read two cycles later in
        // the rendering pipeline. See the following discussion from bizhawk dev 
        // team: https://tasvideos.org/Forum/Topics/17971?CurrentPage=6&Highlight=440662#440662
        const pixelIndex = (this.scanline << 8) + this.scanlineCycle - 1;

        if (pixelIndex > 0) {
          this.framebuffer[pixelIndex] = this.colors[this.colorLatch1];

          if (pixelIndex - 1 > 0) {
            this.framebuffer[pixelIndex - 1] = this.colors[this.colorLatch2];
          }
        } 

        break;
      }
      case PPUCTRL: {
        this.controlBaseNameTable =         (value & 0b00000011);
        this.controlVramIncrement =         (value & 0b00000100) >>> 2;
        this.controlSpritePatternAddress =  (value & 0b00001000) >>> 3;
        this.controlBgPatternAddress =      (value & 0b00010000) >>> 4;
        this.controlSpriteSize =            (value & 0b00100000) >>> 5;
        this.controlPpuMasterSlave =        (value & 0b01000000) >>> 6;
        this.controlGenerateNMI =           (value & 0b10000000) >>> 7;

        this.updateNMIFlag();

          // Copy base name table data to T register at bits 11 and 12
        this.T = this.T & 0b111001111111111;
        this.T = this.T | (this.controlBaseNameTable << 10);
        break;
      }
      case PPUSCROLL:
        if (this.W === 0) {
          // First write
          // Store lower three bits as X fine scroll
          this.X = value & 0b111;
          // Store upper five bits as part of T
          this.T = this.T & 0b111111111100000;
          this.T = this.T | (value >>> 3);
          this.W = 1;
        } else {
          // Second write
          const ABCDE  = value & 0b11111000;
          const FGH    = value & 0b00000111;

          this.T = this.T & 0b000110000011111;
          this.T = this.T | (ABCDE << 2);
          this.T = this.T | (FGH << 12);

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
      case PPUDATA: {
        const ppuAddress = this.V & 0x3FFF;
        this.writePPUMem(ppuAddress, value);
        this.incrementVRAMAddress();
        break;
      }
      default:
    }
  }

  updateNMIFlag() {
    if (this.controlGenerateNMI && this.nmiOccurred) {
      this.nmiFlag = true;
    } else {
      this.nmiFlag = false;
    }
  }

  clearSecondaryOAM() {
    if (isSteppingScanline) {
      this.scanlineLogger.log('Clearing secondary OAM');
    }

    for (let i = 0; i < this.secondaryOamMemory.length; i++) {
      this.secondaryOamMemory[i] = 0xFF;
    }
  }

  initializeSecondaryOAM() {
    if (isSteppingScanline) {
      this.scanlineLogger.log('Init secondary OAM');
    }

    const spriteSize = this.getSpriteSize();

    let secondaryIndex = 0;
    const scanline = this.scanline;

    this.spriteZeroIsInSpriteUnits = false;
    for (let i = this.oamAddress; i < (this.oamMemory.length - 3) && secondaryIndex < this.secondaryOamMemory.length; i+=4) {
      const y = this.oamMemory[i];
      if (scanline >= y && scanline < (y + spriteSize)) {
        if (isSteppingScanline) {
          this.scanlineLogger.log(i + ' - Adding sprite to secondary OAM at ' + this.oamMemory[i+3] + ',' + y + ' - ' + this.oamMemory[i+1] + ' ' + this.oamMemory[i+2]);
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

  copyToSpriteUnits() {
    let oamAddress = 0;
    const spriteSize = this.getSpriteSize();

    for (let i = 0; i < SCREEN_WIDTH; i++) {
      this.spriteScanline[i] = 0;
    }

    for (let i = 0; i < 8; i++) {
      const y = this.secondaryOamMemory[oamAddress++];
      let tileIndex = this.secondaryOamMemory[oamAddress++];
      const attributes = this.secondaryOamMemory[oamAddress++];
      const x = this.secondaryOamMemory[oamAddress++];
      let pixelRow = this.scanline - y;

      if (attributes & SPRITE_ATTRIB_FLIP_VERTICAL) {
        pixelRow = spriteSize - 1 - pixelRow;
      }

      if (spriteSize === 16) {
        const nametable = tileIndex & 0b1;
        tileIndex = (nametable << 8) | (tileIndex & 0b11111110);

        if (pixelRow >= 8) {
          pixelRow -= 8;
          tileIndex++;
        }
      } else {
        tileIndex = (this.controlSpritePatternAddress << 8) | tileIndex;
      }

      const chrIndex = tileIndex * 8 * 2 + pixelRow;

      const flipHorizontal = attributes & SPRITE_ATTRIB_FLIP_HORIZONTAL;
      const spritePriority = (attributes & SPRITE_ATTRIB_PRIORITY) >>> 5;
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
            shiftRegister1 >>>= 1;
            shiftRegister2 >>>= 1;
          } else {
            c1 = (shiftRegister1 & BIT_7) >>> 7;
            c2 = (shiftRegister2 & BIT_7) >>> 7;
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
  }

  incrementHorizontalV() {
    if ((this.V & 0b11111) === 31) {
      this.V = this.V & (~0b11111);
      // Toggle bit 10 => switch horizontal namespace
      this.V ^= 0b10000000000;
    } else {
      this.V += 1;
    }
  }

  incrementVerticalV() {
    // If fine Y less than 7 (upper 3 bits of V = fine Y scroll)
    if ((this.V & POINTER_FINE_Y_MASK) !== POINTER_FINE_Y_MASK) {
      this.V += 0b001000000000000;
    } else {
      this.V &= ~POINTER_FINE_Y_MASK; // Reset fine Y to 0
      let coarseY = (this.V & 0b1111100000) >> 5;
      if (coarseY === 29) {
        coarseY = 0;
        // Toggle bit 11 => switch vertical namespace
        this.V ^= 0b100000000000;
      } else if (coarseY === 31) {
        // Row 29 is the last row of tiles in a nametable, so wrapping typically happens after that.
        // However, it can be set explicitly to point at values > 29. In this case 31 will increment
        // to 0 without incrementing the nametable.
        coarseY = 0;
      } else {
        coarseY++;
      }

      this.V &= ~0b1111100000; // Clear coarse Y portion of V
      this.V |= (coarseY << 5); // Put modified coarse Y back into V
    }
  }

  updateBackgroundRegisters() {
    const scanlineCycle = this.scanlineCycle;

    if (scanlineCycle > 257 && scanlineCycle < 322 || scanlineCycle > 337 || scanlineCycle < 2) {
      return;
    }

    if (scanlineCycle === 328) {
      this.tileScanlineIndex = 0;
    }

    if (scanlineCycle % 8 === 0) {
      // Read attributes into temporary registers. We cheat a bit and do this in one pass, in
      // reality it's a sequential process taking place across several cycles

      const nametable = (this.V & 0x0C00);
      const y = ((this.V >>> 4) & 0b111000);  // Since each entry in the palette table handles 4x4 tiles, we drop 2 bits of
      const x = ((this.V >>> 2) & 0b000111);  // precision from the X & Y components so that they increment every 4 tiles

      const attributeAddress = 0x23C0 | nametable | y | x;
      const tileIndex = (this.controlBgPatternAddress << 8) | this.readPPUMem(0x2000 | (this.V & 0x0FFF));
      const attribute = this.readPPUMem(attributeAddress);
      const palette = getPaletteFromByte(this.V, attribute);

      const fineY = (this.V & POINTER_FINE_Y_MASK) >> 12;

      this.pendingBackgroundTileIndex = (tileIndex * 8 * 2) + fineY;
      this.pendingBackgroundPalette = palette;

      this.incrementHorizontalV();

      if (scanlineCycle === 256) {
        this.incrementVerticalV();
      }
    } else if ((scanlineCycle - 1) % 8 === 0) {
      let lowByte = this.readPPUMem(this.pendingBackgroundTileIndex);
      let highByte = this.readPPUMem(this.pendingBackgroundTileIndex + 8);

      const palette = this.pendingBackgroundPalette << 2;
      for (let i = 0; i < 8; i++) {
        const c1 = (lowByte & BIT_7) >>> 7;
        const c2 = (highByte & BIT_7) >>> 6;
        lowByte <<= 1;
        highByte <<= 1;
        this.tileScanline[this.tileScanlineIndex++] = palette | c2 | c1;
      }
    }

    if (scanlineCycle === 257) {
      this.resetHorizontalScroll();
    }
  }

  updateSpriteScanning() {
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
  resetVerticalScroll() {
    this.V &= POINTER_Y_MASK_INV;
    this.V |= (this.T & POINTER_Y_MASK);
  }

  // Reset horizontal part (X scroll) of current VRAM address
  resetHorizontalScroll() {
    this.V &= POINTER_HORIZ_MASK_INV;
    this.V |= (this.T & POINTER_HORIZ_MASK);
  }

  handleVisibleScanline() {
    if (this.maskRenderingEnabled) {
      this.updateSpriteScanning();
      this.updateBackgroundRegisters();
    }

    const scanlineCycle = this.scanlineCycle;

    if (scanlineCycle <= 0 || scanlineCycle > 256) {
      return;
    }

    let spriteColor = 0;
    const pixel = scanlineCycle - 1;
    const tileData = this.tileScanline[pixel + this.X];
    const backgroundColorIndex = tileData & 0b11;
    const backgroundPaletteIndex = (tileData & 0b1100) >>> 2;
    const minSpriteCycle = this.showSpritesLeftSide ? 0 : 8;
    const minBackgroundCycle = this.showBackgroundLeftSide ? 0 : 8;

    const backgroundColor = (this.maskBackgroundEnabled && scanlineCycle > minBackgroundCycle) ? this.paletteIndexedColor(backgroundColorIndex, backgroundPaletteIndex, VRAM_BG_PALETTE_1_ADDRESS) : 0;

    const spriteData = this.spriteScanline[pixel];
    const spritePatternColor = spriteData & 0b11;


    // No sprites are rendered on the first scanline
    if (this.scanline > 0 && spritePatternColor !== 0 && this.maskSpritesEnabled && scanlineCycle > minSpriteCycle) {
      const spritePalette = (spriteData >>> 3) & 0b11;
      spriteColor = this.paletteIndexedSpriteColor(spritePatternColor, spritePalette);
    }

    // Draw pixel
    const index = (this.scanline << 8) + pixel;
    let color = 0;

    if (spriteColor === 0) {
      if (backgroundColor !== 0) {
        color = backgroundColor;
      } else {
        const vramBackgroundColor = this.readPPUMem(VRAM_BACKGROUND_COLOR);
        color = vramBackgroundColor;
      }
    } else if (backgroundColor !== 0) {
      const spritePriority = (spriteData >>> 2) & 0b1;

      // Both colors set
      if (spritePriority === 0) {
        color = spriteColor;
      } else {
        color = backgroundColor;
      }

      const spriteNumber = (spriteData >>> 5);

      // Sprite zero handling
      if (!this.spriteZeroHit &&
        this.spriteZeroIsInSpriteUnits &&
        // If sprite zero is among the sprite units, it's always at sprite number 0
        spriteNumber === 0 &&
        scanlineCycle !== 256
      ) {
        this.spriteZeroHit = true;
      }
    } else {      
      color = spriteColor;
    }

    this.colorLatch1 = color;    
    this.colorLatch2 = this.colorLatch1;
    
    this.framebuffer[index] = this.colors[color];
  }

  handleVblankScanline() {
    if (this.scanlineCycle === 1) {
      // Generate vblank interrupt

      if (!this.muteVerticalBlank) {
        this.nmiOccurred = true;
        this.updateNMIFlag();
      }

      this.muteVerticalBlank = false;
      this.vblankCount++;
    }
  }

  handlePrerenderScanline() {
    if (this.maskRenderingEnabled) {
      this.updateBackgroundRegisters();
    }

    if (this.scanlineCycle === 1) {
      this.nmiOccurred = false;
      this.updateNMIFlag();
    }

    if (isSteppingScanline) {
      this.scanlineLogger.clear();
    }

    if (this.scanlineCycle === 0) {
      this.spriteZeroHit = false;
    } else if (this.scanlineCycle >= 257 && this.scanlineCycle <= 320) {
      if (this.maskRenderingEnabled) {
        this.oamAddress = 0;

        if (this.scanlineCycle === 257) {
          this.resetHorizontalScroll();
        } else if (this.scanlineCycle === 280) {
          this.resetVerticalScroll();
        }
      }
    }
  }

  incrementDot() {
    let scanlineCycle = this.scanlineCycle + 1;
    const skipLastCycle = this.maskRenderingEnabled && !this.evenFrame;

    if (scanlineCycle === 339 && this.scanline === PRE_RENDER_SCANLINE && skipLastCycle) {
      scanlineCycle = 340;
    } else if (scanlineCycle === 341) {
      this.scanline++;
      scanlineCycle = 0;

      if (this.scanline === POST_RENDER_SCANLINE) {
        this.frameCount++;
      }

      if (this.scanline > PRE_RENDER_SCANLINE) {
        this.scanline = 0;
        this.evenFrame = !this.evenFrame;
      }
    }
    this.scanlineCycle = scanlineCycle;
  }

  updateDelayedState() {
    this.maskRenderingEnabled = this.pendingMaskRenderingEnabled;
  }

  updatePPU(targetMasterClock: number) {
    if (this.disabled) {
      return;
    }

    while (this.masterClock + this.ppuDivider <= targetMasterClock) {
      if (this.vramReadDisableCounter > 0) {
        this.vramReadDisableCounter--;
      }
  
      this.incrementDot();

      if (this.scanline < SCREEN_HEIGHT) {
        this.handleVisibleScanline();
      } else if (this.scanline === VBLANK_SCANLINE) {
        this.handleVblankScanline();
      } else if (this.scanline === PRE_RENDER_SCANLINE) {
        this.handlePrerenderScanline();
      }

      if (this.triggerDelayedStateUpdate) {
        this.updateDelayedState();
        this.triggerDelayedStateUpdate = false;
      }


      this.cycle++;
      this.masterClock += this.ppuDivider;
    }

    this.slack = targetMasterClock - this.masterClock;
  }
}


export default PPU;
