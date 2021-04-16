import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { hex, hex16 } from '../emulator/stateLogging';

const PPUVRAMDebugger = ({ emulator, refresh }) => {
  const lines = useMemo(() => {
    let ret = [];
    for (let i = 0; i < 1024; i++) {
      let line = '0x' + hex16(i * 16) + ' | ';
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
