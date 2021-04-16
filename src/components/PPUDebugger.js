import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { greyScaleColorForIndexedColor } from '../emulator/ppu';
import PPUOAMDebugger from './PPUOAMDebugger';
import PPUNameTableDebugger from './PPUNameTableDebugger';
import SegmentControl from './SegmentControl';
import PPUSpritesDebugger from './PPUSpritesDebugger';
import PPUVRAMDebugger from './PPUVRAMDebugger';

const PPUDebugger = ({ emulator, refresh }) => {
  const options = useMemo(() => {
    return [
      {
        title: 'Nametables',
        view: <PPUNameTableDebugger emulator={emulator} refresh={refresh}/>
      },
      {
        title: 'Sprites',
        view: <PPUSpritesDebugger emulator={emulator} refresh={refresh}/>
      },
      {
        title: 'OAM',
        view: <PPUOAMDebugger emulator={emulator} refresh={refresh}/>
      },
      {
        title: 'VRAM',
        view: <PPUVRAMDebugger emulator={emulator} refresh={refresh}/>
      }
    ];
  }, [emulator, refresh]);

  const [index, setIndex] = useState(0);

  return (
    <div className="ppuDebugger">
      <SegmentControl options={options} onClick={setIndex} currentIndex={index}/>
    </div>
  );
};

PPUDebugger.propTypes = {
  emulator: PropTypes.object
};

export default PPUDebugger;
