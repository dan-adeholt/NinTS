import React, { useMemo } from 'react';

const PPUScanlineDebugger = ({ emulator, refresh }) => {
  const lines = useMemo(() => {
    let ret = '';

    for (let i = 0; i < emulator.ppu.frameDebug.length; i++) {
      ret += emulator.ppu.frameDebug[i] + '\n';
    }

    return ret;
  }, [emulator, refresh])

  return (
    <div className="hexViewer">
      { lines }
    </div>
  );
};

PPUScanlineDebugger.propTypes = {};

export default PPUScanlineDebugger;
