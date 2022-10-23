import React, { useMemo } from 'react';
import { hex, hex16 } from '../emulator/stateLogging';
import _ from 'lodash';
import styles from './PPUDebugging.module.css';
import EmulatorState from '../emulator/EmulatorState';

type PPUVRAMDebuggerProps = {
  emulator: EmulatorState
  refresh: boolean
}

const PPUVRAMDebugger = ({ emulator, refresh } : PPUVRAMDebuggerProps) => {
  const lines = useMemo<string[]>(() => {
    _.noop(refresh);

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
    <div className={styles.hexViewer}>
      { lines }
    </div>
  );
};

PPUVRAMDebugger.propTypes = {};

export default PPUVRAMDebugger;
