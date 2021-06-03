import React, { useMemo } from 'react';
import _ from 'lodash';
const PPUScanlineDebugger = ({ emulator, refresh }) => {
  const lines = useMemo(() => {
    _.noop(refresh);
    if (emulator == null) {
      return [];
    }
    let ret = '';

    for (let i = 0; i < emulator.ppu.frameDebug.length; i++) {
      ret += emulator.ppu.frameDebug[i] + '\n';
    }

    return ret;
  }, [emulator, refresh])

  return (
    <>
      <div className="hexViewer">
        { lines }
      </div>
    </>
  );
};

PPUScanlineDebugger.propTypes = {};

export default PPUScanlineDebugger;
