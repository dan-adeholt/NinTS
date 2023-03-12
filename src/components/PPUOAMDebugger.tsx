import React, { useMemo } from 'react';
import {
  SPRITE_ATTRIB_FLIP_HORIZONTAL,
  SPRITE_ATTRIB_FLIP_VERTICAL,
  SPRITE_ATTRIB_PRIORITY,
  SPRITE_ATTRIBS_PALETTE
} from '../emulator/ppu';
import { hex } from '../emulator/stateLogging';
import styles from './PPUDebugging.module.css';
import { DebugDialogProps } from '../DebugDialog';
import Dialog, { DialogHorizontalPosition } from '../Dialog';
import classNames from 'classnames';

type OAMLine = {
  x: number
  y: number
  tile: string
  flipHorizontal: number
  flipVertical: number
  priority: number
  palette: number
}


const PPUOAMDebugger = ({ refresh, emulator, onClose } : DebugDialogProps) => {
  const lines = useMemo<OAMLine[]>(() => {
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
    <Dialog onClose={onClose} title={"OAM Debugger"} horizontalPosition={DialogHorizontalPosition.RIGHT}>
      <div className={classNames(styles.ppuOamDebugger, styles.monospace)}>

        { lines.map((line, idx) => (
          <div key={idx}>
            { idx.toString().padStart(3, '0') +
              ' - ' + line.x.toString().padStart(3, '0') +
              ',' + line.y.toString().padStart(3, '0') +
              ' - ' + line.tile + ' - FlipH ' + line.flipHorizontal + ', FlipV' + line.flipVertical + ', Prio: ' + line.priority + ', Palette: ' + line.palette }
          </div>
        ))
        }
      </div>
    </Dialog>
  );
};

export default React.memo(PPUOAMDebugger);
