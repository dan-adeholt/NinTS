import React, { useCallback, useState } from 'react';
import styles from './Toolbar.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPowerOff, faFileAlt, faFile, faPause, faPlay, faRefresh, faSave, faTools } from '@fortawesome/free-solid-svg-icons'
import Dropdown from './Dropdown';
import { DebugDialog, DebugDialogHotkeysComponents } from './DebugDialog';
import { RunModeType } from './App';
import classNames from 'classnames';
import EmulatorState, { localStorageAutoloadEnabled, setLocalStorageAutoloadEnabled } from './emulator/EmulatorState';

type ToolbarProps = {
  emulator: EmulatorState
  toggleOpenDialog: (dialog : DebugDialog) => void
  loadRom: (rom: Uint8Array, filename: string) => void,
  setRunMode: (newRunMode: RunModeType) => void
  reboot: () => void
};

enum DropdownMenu {
  Settings = 1,
  Profile = 2,
  Savegames = 3
}

const Toolbar = ({ emulator, toggleOpenDialog, loadRom, setRunMode, reboot } : ToolbarProps) => {
  const [menuState, setMenuState] = useState<Record<number, boolean>>({});
  const toggleOpen = (menu: DropdownMenu) => setMenuState(oldState => ({ [menu]: !oldState[menu]}));
  const saveState = useCallback(() => emulator.saveEmulatorToLocalStorage(), [emulator]);
  const loadState = useCallback(() => emulator.loadEmulatorFromLocalStorage(), [emulator]);
  const [autoloadEnabled, setAutoloadEnabled] = useState(localStorageAutoloadEnabled());

  const changeAutoloadEnabled = useCallback(() => {
    setAutoloadEnabled(!autoloadEnabled);
    setLocalStorageAutoloadEnabled(!autoloadEnabled);
  }, [autoloadEnabled]);

  const romFileChanged = useCallback((e : React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as HTMLInputElement).files?.[0];

    if (file != null) {
      const fileReader = new FileReader();
      fileReader.onloadend = (event) => {
        if (event.target != null) {
          loadRom(new Uint8Array(event.target.result as ArrayBuffer), file.name);
        }
      }
      fileReader.readAsArrayBuffer(file);
    }
  }, [loadRom]);

  return (
    <div className={styles.toolbar}>
      <div className={styles.item}>
        <h1>NinJS</h1>
      </div>
      <div className={styles.item}>
        <input id="file-upload" type="file" onChange={romFileChanged}/>
        <label className="labelButton" htmlFor="file-upload"><FontAwesomeIcon icon={faFile}/><span>Open file...</span></label>
      </div>
      <div className={classNames(styles.buttonRow, styles.item)}>
        <button onClick={() => setRunMode(RunModeType.RUNNING)}><FontAwesomeIcon icon={faPlay}/></button>
        <button onClick={() => setRunMode(RunModeType.STOPPED)}><FontAwesomeIcon icon={faPause}/></button>
        <button onClick={reboot}><FontAwesomeIcon icon={faPowerOff}/></button>
      </div>
      <div className={styles.item}>
        <button onClick={() => toggleOpen(DropdownMenu.Savegames)}>
          <FontAwesomeIcon icon={faFileAlt}/>
          <span>Save states</span>
        </button>
        <Dropdown isOpen={menuState[DropdownMenu.Savegames]}>
          <button onClick={saveState}>
            <FontAwesomeIcon icon={faSave}/>
            <span>Save game state</span>
          </button>
          <button onClick={loadState}>
            <FontAwesomeIcon icon={faRefresh}/>
            <span>Load game state</span>
          </button>
          <button onClick={changeAutoloadEnabled}>
            <input checked={autoloadEnabled} type="checkbox" onChange={changeAutoloadEnabled}/>
            <span>Automatically load</span>
          </button>
        </Dropdown>
      </div>
      <div className={styles.item}>
        <button onClick={() => toggleOpen(DropdownMenu.Settings)}><FontAwesomeIcon icon={faTools}/><span>Debug</span></button>
        <Dropdown isOpen={menuState[DropdownMenu.Settings]}>
          { Object.values(DebugDialog).map(dialog => (
            <button onClick={() => {
              toggleOpen(DropdownMenu.Settings);
              toggleOpenDialog(dialog);
            }} key={dialog}>{ dialog } <div className={styles.buttonSpace}/> { DebugDialogHotkeysComponents[dialog] } </button>
          ))}
        </Dropdown>
      </div>
    </div>
  );
};

export default React.memo(Toolbar);
