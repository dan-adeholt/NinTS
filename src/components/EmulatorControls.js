import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { loadEmulator, saveEmulator } from '../emulator/emulator';
import _ from 'lodash';

const EmulatorControls = ({ emulator }) => {
  const saveState = useCallback(() => {
    const key = 'save-' + emulator.rom.romSHA;
    const dump = saveEmulator(emulator);

    const ppuValues = _.flatMap(emulator.mapper.ppuMemory.memory.banks, x => _.values(x));
    localStorage.setItem(key, JSON.stringify({ ...dump, ppuValues }));
  }, [emulator]);

  const dumpState = useCallback(() => {
    console.log(saveEmulator(emulator));
  }, [emulator]);

  const loadState = useCallback(() => {
    const key = 'save-' + emulator.rom.romSHA;
    const savegame = localStorage.getItem(key);

    if (savegame != null) {
      const parsed = JSON.parse(savegame);
      loadEmulator(emulator, parsed);

      for (let i = 0; i < 16384; i++) {
        if (parsed.ppuValues[i] !== emulator.mapper.ppuMemory.read(i)) {
          // console.log(i, parsed.ppuValues[i], emulator.mapper.ppuMemory.read(i));
        }
      }
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
