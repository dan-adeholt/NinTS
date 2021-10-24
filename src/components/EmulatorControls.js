import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { loadEmulator, saveEmulator } from '../emulator/emulator';

const EmulatorControls = ({ emulator }) => {
  const saveState = useCallback(() => {
    const key = 'save-' + emulator.rom.romSHA;
    localStorage.setItem(key, JSON.stringify(saveEmulator(emulator)));
  }, [emulator]);

  const dumpState = useCallback(() => {
    console.log(saveEmulator(emulator));
  }, [emulator]);

  const loadState = useCallback(() => {
    const key = 'save-' + emulator.rom.romSHA;
    const savegame = localStorage.getItem(key);

    if (savegame != null) {
      const parsed = JSON.parse(savegame);
      console.log(parsed);
      loadEmulator(emulator, parsed);
    }
  }, [emulator]);

  return (
    <div className="emulatorControls">
      <div>
        <button onClick={saveState}>Save state</button>
        <button onClick={loadState}>Load state</button>
        <button onClick={dumpState}>Dump state</button>
      </div>
    </div>
  );
};

EmulatorControls.propTypes = {
  emulator: PropTypes.object
};

export default React.memo(EmulatorControls);
