import React, { useMemo } from 'react';
import { hex, hex16 } from '../emulator/stateLogging';
import _ from 'lodash';

const PPUVRAMDebugger = ({ emulator, refresh }) => {
  const lines = useMemo(() => {
    _.noop(refresh);

    let ret = [];
    for (let i = 0; i < 1024; i++) {
      let line = hex16(i * 16) + ' | ';
      for (let j = i * 16; j < (i+1) * 16; j++) {
        line += hex(emulator.ppu.ppuMemory[j]) + ' ';
      }

      line += '\n';
      ret.push(line);
    }

    return ret;
  }, [emulator, refresh])

  return (
    <div className="hexViewer">
      { lines }
    </div>
  );
};

PPUVRAMDebugger.propTypes = {};

export default PPUVRAMDebugger;
