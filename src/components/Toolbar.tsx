import React, { Dispatch, SetStateAction, useCallback, useRef, useState, useEffect } from 'react';
import styles from './Toolbar.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPowerOff, faFileAlt, faPause, faPlay, faRefresh, faSave, faTools, faClose, faFolderOpen, faFloppyDisk } from '@fortawesome/free-solid-svg-icons'
import Dropdown from './Dropdown';
import { DebugDialog, DebugDialogToHotkey } from './DebugDialog';
import { RunModeType } from './App';
import classNames from 'classnames';
import EmulatorState from '../emulator/EmulatorState';
import ROMList from './ROMList';
import { localStorageAutoloadEnabled, setLocalStorageAutoloadEnabled } from './localStorageUtil';
import { Transition } from 'react-transition-group';
import { animationDuration, transitionDefaultStyle, transitionStyles } from './AnimationConstants';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useContextWithErrorIfNull } from '../hooks/useSafeContext';
import { ApplicationStorageContext } from './ApplicationStorage';

type ToolbarProps = {
  emulator: EmulatorState
  toggleOpenDialog: (dialog : DebugDialog) => void
  loadRom: (rom: Uint8Array, filename: string) => void,
  setRunMode: (newRunMode: RunModeType) => void
  runMode: RunModeType
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

const Toolbar = ({ emulator, toggleOpenDialog, loadRom, setRunMode, clearLoadedRoms, runMode, isOpen, showDebugInfo, setShowDebugInfo } : ToolbarProps) => {
  const [menuState, setMenuState] = useState<Record<number, boolean>>({});
  const appStorage = useContextWithErrorIfNull(ApplicationStorageContext);  

  const { mutate: saveGame } = useMutation(appStorage.saveEmulator, {
    onSuccess: () => {
      setMenuState({});
      setRunMode(RunModeType.RUNNING);
    }
  });

  const { mutate: loadGame } = useMutation(appStorage.loadEmulator, {
    onSuccess: (romEntry) => {
      if (romEntry != null) {
        emulator.loadEmulator(JSON.parse(romEntry.data))
        setMenuState({});
        setRunMode(RunModeType.RUNNING);
      }
    }
  });

  const toggleOpen = (menu: DropdownMenu) => {
    setRunMode(RunModeType.STOPPED);
    setMenuState(oldState => ({ [menu]: !oldState[menu]}))
  };

  const saveState = useCallback(() => {
    if (emulator.rom != null) {
      const state = JSON.stringify(emulator.saveEmulator());
      saveGame({ data: state, index: 0, sha: emulator.rom.romSHA });
    }
  }, [emulator]);

  const loadState = useCallback(() => {
    loadGame(emulator.rom?.romSHA);
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
          setRunMode(RunModeType.RUNNING);
        }
      }
      fileReader.readAsArrayBuffer(file);
    }
  }, [loadRom]);

  const _clearLoadedRoms = () => {
    clearLoadedRoms();
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

  
  const romNamesQuery = useQuery(['roms'], () => {
    return appStorage.getRomNames();
  });
  
  const nodeRef = useRef<HTMLDivElement>(null);
  const handleFileClick = () => {
    setRunMode(RunModeType.STOPPED);
  }

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
            <div className={styles.tooltipText}>{runMode === RunModeType.RUNNING ? 'Pause' : 'Play'}</div>
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
            <input id="file-upload" type="file" onClick={handleFileClick} onChange={romFileChanged} />
            <label className="labelButton" htmlFor="file-upload"><FontAwesomeIcon icon={faFolderOpen} /></label>
            <div className={styles.tooltipText}>Open file</div>
          </div>
          <div className={classNames(styles.item)}>
            <button onClick={() => toggleOpen(DropdownMenu.RomList)} disabled={romNamesQuery == null || romNamesQuery.data?.length === 0}>
              <FontAwesomeIcon icon={faFileAlt} />
            </button>
            <Dropdown isOpen={menuState[DropdownMenu.RomList]}>
              {romNamesQuery.data && (
                <ROMList romList={romNamesQuery.data} loadRom={(romBuffer: Uint8Array, filename: string) => {
                  toggleOpen(DropdownMenu.RomList);
                  loadRom(romBuffer, filename);
                  setRunMode(RunModeType.RUNNING);
                }} />
              )}
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

export default React.memo(Toolbar);
