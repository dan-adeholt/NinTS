import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import {
  localStorageAutoloadEnabled,
  loadEmulatorFromLocalStorage,
  saveEmulatorToLocalStorage, setLocalStorageAutoloadEnabled
} from '../emulator/emulator';
import styles from './PPUDebugging.module.css';

const EmulatorControls = ({ emulator }) => {
  const saveState = useCallback(() => saveEmulatorToLocalStorage(emulator), [emulator]);
  const loadState = useCallback(() => loadEmulatorFromLocalStorage(emulator), [emulator]);

  const [autoloadEnabled, setAutoloadEnabled] = useState(localStorageAutoloadEnabled);

  const changeAutoloadEnabled = useCallback(() => {
    setAutoloadEnabled(!autoloadEnabled);
    setLocalStorageAutoloadEnabled(!autoloadEnabled);
  }, [autoloadEnabled]);

  return (
    <div className={styles.emulatorControls}>
      <div>
        <button onClick={saveState}>Save state</button>
        <button onClick={loadState}>Load state</button>
        <input checked={autoloadEnabled} onChange={changeAutoloadEnabled} type="checkbox"/>Auto-load
      </div>
    </div>
  );
};

EmulatorControls.propTypes = {
  emulator: PropTypes.object
};

export default React.memo(EmulatorControls);
