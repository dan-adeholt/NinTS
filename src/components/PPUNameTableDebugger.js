import React, { useEffect, useRef } from 'react';
import { greyScaleColorForIndexedColor } from '../emulator/ppu';
import { BIT_7 } from '../emulator/instructions/util';

const NAME_TABLE_WIDTH = 256;
const NAME_TABLE_HEIGHT = 240;

const blit = (ppu, tileIndex, output, outX, outY) => {
  let lineAddress = outY * NAME_TABLE_WIDTH + outX;

  let address = tileIndex * 2 * 8;

  for (let y = 0; y < 8; y++) {
    let plane1 = ppu.ppuMemory[address];
    let plane2 = ppu.ppuMemory[address + 8];

    for (let x = 0; x < 8; x++) {
      const c1 = (plane1 & BIT_7) >>> 7;
      const c2 = (plane2 & BIT_7) >>> 7;
      output[lineAddress + x] = greyScaleColorForIndexedColor((c2 << 1) | c1);
      plane1 <<= 1;
      plane2 <<= 1;
    }

    address++;
    lineAddress += NAME_TABLE_WIDTH;
  }
};

const NAMETABLE_START = 0x2000;

const generateFrameBuffer = emulator => {
  const texture = new Uint32Array(NAME_TABLE_WIDTH * NAME_TABLE_HEIGHT);

  for (let i = 0; i < NAME_TABLE_WIDTH * NAME_TABLE_HEIGHT; i++) {
    texture[i] = 0xFFFFFFFF;
  }

  if (emulator === null) {
    return texture;
  }

  let curAddress = NAMETABLE_START;
  let tileIndexOffset = emulator.ppu.controlBgPatternAddress === 1 ? 256 : 0;

  for (let row = 0; row < 30; row++) {
    for (let col = 0; col < 32; col++) {
      let tileIndex = emulator.ppu.readPPUMem(curAddress);
      blit(emulator.ppu, tileIndex + tileIndexOffset, texture, col * 8, row * 8);
      curAddress++;
    }
  }

  return texture;
};

const PPUNameTableDebugger = ({ emulator, refresh }) => {
  const ppuCanvasRef = useRef();

  useEffect(() => {
    if (ppuCanvasRef.current != null && emulator != null) {
      const context = ppuCanvasRef.current.getContext("2d");
      const imageData = context.createImageData(NAME_TABLE_WIDTH, NAME_TABLE_HEIGHT);
      const framebuffer = new Uint32Array(imageData.data.buffer);

      framebuffer.set(generateFrameBuffer(emulator), 0);
      context.putImageData(imageData, 0, 0);
    }
  }, [ppuCanvasRef, emulator, refresh]);

  return (
    <div className="ppuNameTableContainer">
      <canvas width={NAME_TABLE_WIDTH} height={NAME_TABLE_HEIGHT} ref={ppuCanvasRef}/>
    </div>
  );
};

PPUNameTableDebugger.propTypes = {};

export default PPUNameTableDebugger;
