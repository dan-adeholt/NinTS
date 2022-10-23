import React, { useMemo } from 'react';
import _ from 'lodash';
import {
  SPRITE_ATTRIB_FLIP_HORIZONTAL,
  SPRITE_ATTRIB_FLIP_VERTICAL,
  SPRITE_ATTRIB_PRIORITY,
  SPRITE_ATTRIBS_PALETTE
} from '../emulator/ppu';
import { hex } from '../emulator/stateLogging';
import styles from './PPUDebugging.module.css';
import EmulatorState from '../emulator/EmulatorState';

type OAMLine = {
  x: number
  y: number
  tile: string
  flipHorizontal: number
  flipVertical: number
  priority: number
  palette: number
}

type PPUOAMDebuggerProps = {
  refresh: boolean
  emulator: EmulatorState
}

const PPUOAMDebugger = ({ refresh, emulator } : PPUOAMDebuggerProps) => {
  const lines = useMemo<OAMLine[]>(() => {
    _.noop(refresh);
    if (emulator === null) {
      return [];
    }

    const ret: OAMLine[] = [];

    for (let i = 0; i < 256; i+=4) {
      ret.push({
        y: emulator.ppu.oamMemory[i],
        x: emulator.ppu.oamMemory[i + 3],
        tile: hex(emulator.ppu.oamMemory[i + 1]),
        flipHorizontal: (emulator.ppu.oamMemory[i + 2] & SPRITE_ATTRIB_FLIP_HORIZONTAL) >> 6,
        flipVertical: (emulator.ppu.oamMemory[i + 2] & SPRITE_ATTRIB_FLIP_VERTICAL) >> 7,
        priority: (emulator.ppu.oamMemory[i + 2] & SPRITE_ATTRIB_PRIORITY) >> 5,
        palette: (emulator.ppu.oamMemory[i + 2] & SPRITE_ATTRIBS_PALETTE)
      });
    }

    return ret;
  }, [refresh, emulator]);

  return (
    <>
      <div className={styles.ppuOamDebugger}>

        { lines.map((line, idx) => (
          <div key={idx}>
            { idx + ' - ' + line.x + ',' + line.y + ' - ' + line.tile + ' - FlipH  ' + line.flipHorizontal + ', FlipV' + line.flipVertical + ', Prio: ' + line.priority + ', Palette: ' + line.palette }
          </div>
        ))
        }
      </div>
    </>
  );
};

PPUOAMDebugger.propTypes = {};

export default PPUOAMDebugger;
