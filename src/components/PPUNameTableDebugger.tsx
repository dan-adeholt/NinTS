import React, { useEffect, useRef } from 'react';
import PPU, { greyScaleColorForIndexedColor } from '../emulator/ppu';
import { BIT_7 } from '../emulator/instructions/util';
import { mirroringModeToString } from '../emulator/MirroringMode';
import styles from './PPUDebugging.module.css';
import EmulatorState from '../emulator/EmulatorState';
import { DebugDialogProps } from './DebugDialog';
import Dialog, { DialogHorizontalPosition } from './Dialog';

const NAME_TABLE_WIDTH = 256;
const NAME_TABLE_HEIGHT = 240;

const blit = (ppu: PPU, tileIndex: number, output: Uint32Array, outX: number, outY: number, lineWidth: number) => {
  let lineAddress = outY * lineWidth + outX;

  let address = tileIndex * 2 * 8;

  for (let y = 0; y < 8; y++) {
    let plane1 = ppu.mapper.ppuMemory.read(address);
    let plane2 = ppu.mapper.ppuMemory.read(address + 8);

    for (let x = 0; x < 8; x++) {
      const c1 = (plane1 & BIT_7) >>> 7;
      const c2 = (plane2 & BIT_7) >>> 7;
      output[lineAddress + x] = greyScaleColorForIndexedColor((c2 << 1) | c1);
      plane1 <<= 1;
      plane2 <<= 1;
    }

    address++;
    lineAddress += lineWidth;
  }
};

const generateFrameBuffer = (emulator: EmulatorState) => {
  const texture = new Uint32Array(NAME_TABLE_WIDTH * 2 * NAME_TABLE_HEIGHT * 2);

  for (let i = 0; i < texture.length; i++) {
    texture[i] = 0xFF000000;
  }

  if (emulator === null) {
    return texture;
  }

  const tileIndexOffset = emulator.ppu.controlBgPatternAddress === 1 ? 256 : 0;

  const offsets = [[0x2000, 0, 0], [0x2400, 256, 0], [0x2800, 0, 240], [0x2C00, 256, 240]];
  let curAddress;

  for (const offset of offsets) {
    const [addressStart, offsetX, offsetY] = offset;
    curAddress = addressStart;

    for (let row = 0; row < 30; row++) {
      for (let col = 0; col < 32; col++) {
        const tileIndex = emulator.ppu.readPPUMem(curAddress);
        blit(emulator.ppu, tileIndex + tileIndexOffset, texture, col * 8 + offsetX, row * 8 + offsetY, NAME_TABLE_WIDTH * 2);
        curAddress++;
      }
    }
  }



  return texture;
};

const PPUNameTableDebugger = ({ emulator, refresh, onClose } : DebugDialogProps) => {
  const ppuCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (ppuCanvasRef.current != null) {
      const context = ppuCanvasRef.current.getContext("2d");
      if (context != null) {
        const imageData = context.createImageData(NAME_TABLE_WIDTH * 2, NAME_TABLE_HEIGHT * 2);
        const framebuffer = new Uint32Array(imageData.data.buffer);

        framebuffer.set(generateFrameBuffer(emulator), 0);
        context.putImageData(imageData, 0, 0);
      }
    }
  }, [ppuCanvasRef, emulator, refresh]);

  let scrollPos = '';
  if (emulator != null) {
    const coarseXMask = 0b11111;
    const coarseYMask = 0b1111100000;
    const ntMask = 0b110000000000;
    scrollPos = 'X:' + (emulator.ppu.T & coarseXMask) + ', Y:' + ((emulator.ppu.T & coarseYMask) >> 5) + ', NT:' + ((emulator.ppu.T & ntMask) >> 10);
  }

  const titleStringSuffix = mirroringModeToString(emulator?.mapper?.ppuMemory?.mirroringMode) + ' - Scroll pos: ' + scrollPos;

  return (
    <Dialog
      onClose={onClose}
      title={"PPU Nametables " + titleStringSuffix}
      horizontalPosition={DialogHorizontalPosition.RIGHT}
    >

      <div className={styles.ppuNameTableContainer}>
        <canvas width={NAME_TABLE_WIDTH * 2} height={NAME_TABLE_HEIGHT * 2} ref={ppuCanvasRef}/>
      </div>
    </Dialog>
  );
};

export default React.memo(PPUNameTableDebugger);
