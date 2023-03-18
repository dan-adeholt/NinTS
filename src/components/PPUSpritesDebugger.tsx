import React, { useLayoutEffect, useRef } from 'react';
import { BIT_7 } from '../emulator/instructions/util';
import styles from './PPUDebugging.module.css';
import PPU from '../emulator/ppu';
import { DebugDialogProps } from '../DebugDialog';
import Dialog, { DialogHorizontalPosition } from '../Dialog';

const PATTERN_TABLE_WIDTH = 256;
const PATTERN_TABLE_HEIGHT = 128;

const pixelRow = (output: number[] | Uint32Array , x: number, y: number, lower: number, upper: number, ppu: PPU) => {
  let lineAddress = y * PATTERN_TABLE_WIDTH + x;

  for (let i = 0; i < 8; i++) {
    const c1 = (lower & BIT_7) >>> 7;
    const c2 = (upper & BIT_7) >>> 7;
    const color = (c2 << 1) | c1;

    output[lineAddress++] = ppu.paletteIndexedSpriteColor(color, 0);

    lower <<= 1;
    upper <<= 1;
  }
}

const blitSprite = (output: Uint32Array, x: number, y: number, spriteAddress: number, spriteSize: number, ppu: PPU) => {
  for (let offsetY = 0; offsetY < 8; offsetY++) {
    pixelRow(output, x, y + offsetY, ppu.readPPUMem(spriteAddress + offsetY), ppu.readPPUMem(spriteAddress + offsetY + 8), ppu);
  }
}

const generateFrameBuffer = (ppu: PPU) => {
  const texture = new Uint32Array(PATTERN_TABLE_WIDTH * PATTERN_TABLE_HEIGHT);

  for (let i = 0; i < PATTERN_TABLE_WIDTH * PATTERN_TABLE_HEIGHT; i++) {
    texture[i] = 0xFFFFFFFF;
  }

  const spriteSize = ppu.controlSpriteSize;

  let x = 0;
  let y = 0;
  let xSideOffset = 0;

  for (let spriteAddress = 0; spriteAddress < 0x2000; spriteAddress += 16) {
    blitSprite(texture, x + xSideOffset, y, spriteAddress, spriteSize, ppu);

    if (spriteSize === 16) {
      spriteAddress += 16;

      blitSprite(texture, x + xSideOffset, y + 8, spriteAddress, spriteSize, ppu);
    }

    x += 8;

    if (x >= PATTERN_TABLE_WIDTH / 2) {
      x = 0;
      y += spriteSize;
    }

    if (y >= PATTERN_TABLE_HEIGHT) {
      y = 0;
      xSideOffset = PATTERN_TABLE_WIDTH / 2;
    }
  }

  return texture;
};


const PPUSpritesDebugger = ({ emulator, onClose, refresh } : DebugDialogProps) => {
  const ppuCanvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    if (ppuCanvasRef.current != null) {
      const context = ppuCanvasRef.current.getContext("2d");
      if (context != null) {
        const imageData = context.createImageData(PATTERN_TABLE_WIDTH, PATTERN_TABLE_HEIGHT);
        const framebuffer = new Uint32Array(imageData.data.buffer);
        framebuffer.set(generateFrameBuffer(emulator.ppu), 0);
        context.putImageData(imageData, 0, 0);
      }
    }
  }, [ppuCanvasRef, emulator, refresh]);

  return (
    <Dialog onClose={onClose} title="PPU Sprites" horizontalPosition={DialogHorizontalPosition.RIGHT}>
      <div className={styles.ppuContainer}>
        <canvas width={256} height={128} ref={ppuCanvasRef}/>
      </div>
    </Dialog>
  );
};

export default React.memo(PPUSpritesDebugger);
