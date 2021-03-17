import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { greyScaleColorForIndexedColor } from '../emulator/ppu';

const PATTERN_TABLE_WIDTH = 256;
const PATTERN_TABLE_HEIGHT = 128;
const TILE_WIDTH = 8;
const TILE_HEIGHT = 8;

const blit = (tile, output, outX, outY) => {
  let lineAddress = outY * PATTERN_TABLE_WIDTH + outX;
  let inputAddress = 0;
  for (let y = 0; y < TILE_HEIGHT; y++) {
    for (let x = 0; x < TILE_WIDTH; x++) {
      output[lineAddress + x] = greyScaleColorForIndexedColor(tile[inputAddress++]);
    }

    lineAddress += PATTERN_TABLE_WIDTH;
  }
};

const generateFrameBuffer = tiles => {
  const texture = new Uint32Array(PATTERN_TABLE_WIDTH * PATTERN_TABLE_HEIGHT);

  for (let i = 0; i < PATTERN_TABLE_WIDTH * PATTERN_TABLE_HEIGHT; i++) {
    texture[i] = 0xFFFFFFFF;
  }

  for (let i = 0; i < 256 && i < tiles.length; i++) {
    let outX = (i * 8) % 128;
    let outY = Math.floor(i / 16) * 8;
    blit(tiles[i], texture, outX, outY);
  }

  for (let i = 256; i < 512 && i < tiles.length; i++) {
    let outX = ((i * 8) % 128) + 128;
    let outY = Math.floor((i - 256) / 16) * 8;
    blit(tiles[i], texture, outX, outY);
  }

  return texture;
};

const PPUDebugger = ({ emulator }) => {
  const ppuCanvasRef = useRef();

  useEffect(() => {
    if (ppuCanvasRef.current != null && emulator != null) {
      const context = ppuCanvasRef.current.getContext("2d");
      const imageData = context.createImageData(PATTERN_TABLE_WIDTH, PATTERN_TABLE_HEIGHT);
      const framebuffer = new Uint32Array(imageData.data.buffer);
      framebuffer.set(generateFrameBuffer(emulator.ppu.tiles), 0);
      context.putImageData(imageData, 0, 0);
    }
  }, [ppuCanvasRef, emulator]);

  return (
    <div className="ppuContainer">
      <canvas width={256} height={128} ref={ppuCanvasRef}/>
    </div>
  );
};

PPUDebugger.propTypes = {
  emulator: PropTypes.object
};

export default PPUDebugger;
