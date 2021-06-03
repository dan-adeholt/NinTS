import React, { useMemo } from 'react';
import _ from 'lodash';

const PPUOAMDebugger = ({ refresh, emulator}) => {
  const lines = useMemo(() => {
    _.noop(refresh);
    if (emulator === null) {
      return [];
    }

    let ret = [];

    for (let i = 0; i < 256; i+=4) {
      ret.push({
        y: emulator.ppu.oamMemory[i],
        x: emulator.ppu.oamMemory[i + 3],
        tile: emulator.ppu.oamMemory[i + 1],
        attribs: emulator.ppu.oamMemory[i + 2]
        });
    }

    return ret;
  }, [refresh, emulator]);

  return (
    <>
      <h3>Sprites</h3>
      <div className="ppuOamDebugger">

        { lines.map((line, idx) => (
          <div>
            { idx + ' - ' + line.x + ',' + line.y + ' - ' + line.tile + ' - ' + line.attribs}
          </div>
        ))
        }
      </div>
    </>
  );
};

PPUOAMDebugger.propTypes = {};

export default PPUOAMDebugger;
