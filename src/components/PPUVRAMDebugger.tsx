import React, { useMemo } from 'react';
import { hex, hex16 } from '../emulator/stateLogging';
import styles from './PPUDebugging.module.css';
import Dialog, { DialogHorizontalPosition } from '../Dialog';
import { DebugDialogProps } from '../DebugDialog';

const PPUVRAMDebugger = ({ emulator, refresh, isOpen, onClose } : DebugDialogProps) => {
  const lines = useMemo<string[]>(() => {
    const ret: string[] = [];
    for (let i = 0; i < 1024; i++) {
      let line = hex16(i * 16) + ' | ';
      for (let j = i * 16; j < (i+1) * 16; j++) {
        line += hex(emulator.ppu.readPPUMem(j)) + ' ';
      }

      line += '\n';
      ret.push(line);
    }

    return ret;
  }, [emulator, refresh])

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="PPU VRAM Debugger" horizontalPosition={DialogHorizontalPosition.RIGHT}>
      <div className={styles.hexViewer}>
        { lines }
      </div>
    </Dialog>
  );
};

export default React.memo(PPUVRAMDebugger);
