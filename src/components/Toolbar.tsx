import React, { Dispatch, SetStateAction, useCallback, useRef, useState, useEffect } from 'react';
import styles from './Toolbar.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPowerOff, faFileAlt, faPause, faPlay, faRefresh, faSave, faTools, faClose, faFolderOpen, faFloppyDisk } from '@fortawesome/free-solid-svg-icons'
import Dropdown from './Dropdown';
import { DebugDialog, DebugDialogToHotkey } from './DebugDialog';
import { RunModeType } from './App';
import classNames from 'classnames';
import EmulatorState from '../emulator/EmulatorState';
import { RomEntry } from '../components/types';
import ROMList from './ROMList';
import { localStorageAutoloadEnabled, setLocalStorageAutoloadEnabled } from './localStorageUtil';
import { Transition } from 'react-transition-group';
import { animationDuration, transitionDefaultStyle, transitionStyles } from './AnimationConstants';

type ToolbarProps = {
  emulator: EmulatorState
  toggleOpenDialog: (dialog : DebugDialog) => void
  loadRom: (rom: Uint8Array, filename: string) => void,
  setRunMode: (newRunMode: RunModeType) => void
  runMode: RunModeType
  romList: RomEntry[]
  setRomList: Dispatch<SetStateAction<RomEntry[]>>
  clearLoadedRoms: () => void
  isOpen: boolean
  showDebugInfo: boolean
  setShowDebugInfo: Dispatch<SetStateAction<boolean>>
};

enum DropdownMenu {
  Settings = 1,
  Profile = 2,
  Savegames = 3,
  RomList = 4,
  Restart = 5
}

const Toolbar = ({ emulator, toggleOpenDialog, loadRom, setRunMode, clearLoadedRoms, romList, setRomList, runMode, isOpen, showDebugInfo, setShowDebugInfo } : ToolbarProps) => {
  const [menuState, setMenuState] = useState<Record<number, boolean>>({});
  const toggleOpen = (menu: DropdownMenu) => {
    setRunMode(RunModeType.STOPPED);
    setMenuState(oldState => ({ [menu]: !oldState[menu]}))
  };

  const saveState = useCallback(() => {
    emulator.saveEmulatorToLocalStorage();
    setMenuState({});
    setRunMode(RunModeType.RUNNING);
  }, [emulator]);

  const loadState = useCallback(() => {
    emulator.loadEmulatorFromLocalStorage();
    setMenuState({});
    setRunMode(RunModeType.RUNNING);
  }, [emulator]);
  const [autoloadEnabled, setAutoloadEnabled] = useState(localStorageAutoloadEnabled());
  
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    setMenuState({});
  }

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

  const _clearLoadedRoms = () => {
    clearLoadedRoms();
    setRomList([]);
    toggleOpen(DropdownMenu.RomList);
  }

  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (e.target instanceof Node && !nodeRef.current?.contains(e.target)) {
        setMenuState({});
      }
    }

    document.addEventListener('mousedown', listener)
    return () => {
      document.removeEventListener('mousedown', listener);
    }
  }, []);

  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <Transition nodeRef={nodeRef} in={isOpen} timeout={animationDuration} unmountOnExit>
      {state => (
        <div className={classNames(styles.toolbar)} ref={nodeRef} style={{
          ...transitionDefaultStyle,
          ...transitionStyles[state]
        }}
        >
          <div className={classNames(styles.buttonRow, styles.item)}>
            <button onClick={() => setRunMode(runMode === RunModeType.RUNNING ? RunModeType.STOPPED : RunModeType.RUNNING)}><FontAwesomeIcon icon={runMode === RunModeType.RUNNING ? faPause : faPlay} /></button>
            <div className={styles.tooltipText}>{ runMode === RunModeType.RUNNING ? 'Pause' : 'Play' }</div>
          </div>
          <div className={styles.item}>
            <button onClick={() => toggleOpen(DropdownMenu.Savegames)}>
              <FontAwesomeIcon icon={faFloppyDisk} />
            </button>
            <Dropdown isOpen={menuState[DropdownMenu.Savegames]} alignLeft>
              <button onClick={saveState}>
                <FontAwesomeIcon icon={faSave} />
                <span>Save game state</span>
              </button>
              <button onClick={loadState}>
                <FontAwesomeIcon icon={faRefresh} />
                <span>Load game state</span>
              </button>
              <button onClick={changeAutoloadEnabled}>
                <input checked={autoloadEnabled} type="checkbox" onChange={changeAutoloadEnabled} />
                <span>Automatically load</span>
              </button>
            </Dropdown>
            <div className={styles.tooltipText}>Save games</div>
          </div>
          <div className={styles.flexSpace} />

          <div className={styles.item}>
            <button onClick={() => toggleOpen(DropdownMenu.Restart)}>
              <FontAwesomeIcon icon={faRefresh} />
            </button>
            <Dropdown isOpen={menuState[DropdownMenu.Restart]}>
              <button onClick={() => setShowDebugInfo(oldVal => !oldVal)}>
                <input checked={showDebugInfo} type="checkbox" onChange={changeAutoloadEnabled} />
                <span>Show debug info</span>
              </button>

              <button
                onClick={() => {
                  toggleOpen(DropdownMenu.Restart);
                  emulator.reset();
                }}
              >
                <FontAwesomeIcon icon={faRefresh} />
                <span>Reset</span>
              </button>
              <button
                onClick={() => {
                  toggleOpen(DropdownMenu.Restart);  
                  emulator.reboot();
                }}
              >
                <FontAwesomeIcon icon={faPowerOff} />
                <span>Power cycle</span>
              </button>
              <button
                onClick={() => {
                  window.location.reload()
                }}
              >
                <FontAwesomeIcon icon={faPowerOff} />
                <span>Reload web page</span>
              </button>
            </Dropdown>
            <div className={styles.tooltipText}>Restart game</div>
          </div>
          <div className={styles.item}>
            <input id="file-upload" type="file" onChange={romFileChanged} />
            <label className="labelButton" htmlFor="file-upload"><FontAwesomeIcon icon={faFolderOpen} /></label>
            <div className={styles.tooltipText}>Open file</div>
          </div>
          <div className={classNames(styles.item)}>
            <button onClick={() => toggleOpen(DropdownMenu.RomList)} disabled={romList.length === 0}>
              <FontAwesomeIcon icon={faFileAlt} />
            </button>
            <Dropdown isOpen={menuState[DropdownMenu.RomList]}>
              <ROMList romList={romList} loadRom={(romBuffer: Uint8Array, filename: string) => {
                toggleOpen(DropdownMenu.RomList);
                loadRom(romBuffer, filename);
                setRunMode(RunModeType.RUNNING);
              }} />
              <button onClick={_clearLoadedRoms}><FontAwesomeIcon icon={faClose} /> Clear all</button>
            </Dropdown>
            <div className={styles.tooltipTextRight}>Recent games</div>
          </div>
         
          <div className={classNames(styles.item, styles.debugItem)}>
            <button onClick={() => toggleOpen(DropdownMenu.Settings)}><FontAwesomeIcon icon={faTools} /></button>
            <Dropdown isOpen={menuState[DropdownMenu.Settings]}>
              {Object.values(DebugDialog).map(dialog => (
                <button onClick={() => {
                  toggleOpen(DropdownMenu.Settings);
                  toggleOpenDialog(dialog);
                }} key={dialog}>{dialog} <div className={styles.buttonSpace} /> {DebugDialogToHotkey[dialog]} </button>
              ))}
            </Dropdown>
            <div className={styles.tooltipTextRight}>Debug tools</div>
          </div>
        </div>
      )}
    </Transition>
  );
};

export default  React.memo(Toolbar);
