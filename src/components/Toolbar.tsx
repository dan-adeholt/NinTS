import React, { Dispatch, SetStateAction, useCallback, useRef, useState, useEffect } from 'react';
import styles from './Toolbar.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPowerOff, faPause, faPlay, faRefresh, faSave, faTools, faFloppyDisk, faFolderOpen, faCog, faRemove, faGamepad } from '@fortawesome/free-solid-svg-icons';
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
import ConfigureControls from './ConfigureControls';
import { InputConfig } from './Integration/InputTypes';

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
  inputConfig: InputConfig
  setInputConfig: Dispatch<SetStateAction<InputConfig>>
};

enum DropdownMenu {
  DebugTools = 1,
  Profile = 2,
  Savegames = 3,
  Restart = 4,
  Settings = 5
}

enum Dialogs {
  ROMList = 1,
  ConfigureControls = 2
}

const Toolbar = ({
  emulator,
  toggleOpenDialog,
  loadRom,
  setRunMode,
  clearLoadedRoms,
  runMode,
  isOpen,
  showDebugInfo,
  setShowDebugInfo,
  inputConfig,
  setInputConfig
} : ToolbarProps) => {
  const [menuState, setMenuState] = useState<Record<number, boolean>>({});
  const [dialogState, setDialogState] = useState<Record<number, boolean>>({});


  const appStorage = useContextWithErrorIfNull(ApplicationStorageContext);  

  const { mutate: saveGame } = useMutation(appStorage.saveEmulator, {
    onSuccess: () => {
      setMenuState({});
    }
  });

  const { mutate: loadGame } = useMutation(appStorage.getRomSavegame, {
    onSuccess: (romEntry) => {
      if (romEntry != null) {
        emulator.loadEmulator(JSON.parse(romEntry.data))
        setMenuState({});
      }
    }
  });

  const toggleOpen = (menu: DropdownMenu) => {
    setDialogState({});
    setRunMode(RunModeType.STOPPED);
    setMenuState(oldState => ({ [menu]: !oldState[menu]}))
  };

  const saveState = useCallback(() => {
    if (emulator.rom != null) {
      setRunMode(RunModeType.RUNNING);  
      const state = JSON.stringify(emulator.saveEmulator());
      saveGame({ data: state, index: 0, sha: emulator.rom.romSHA });
    }
  }, [emulator, setRunMode]);

  const loadState = useCallback(() => {
    loadGame(emulator.rom?.romSHA);
    setRunMode(RunModeType.RUNNING);
  }, [emulator, setRunMode]);

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
          setDialogState({});
        }
      }
      fileReader.readAsArrayBuffer(file);
    }
  }, [loadRom]);

  const _clearLoadedRoms = () => {
    clearLoadedRoms();
    setDialogState({});
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
    return appStorage.getRomNames().then(res => res.sort((a, b) => a.filename.localeCompare(b.filename)));
  });

  const nodeRef = useRef<HTMLDivElement>(null);
  const handleFileClick = () => {
    setRunMode(RunModeType.STOPPED);
  }

  const promptClearRoms = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all loaded ROMs?')) {
      _clearLoadedRoms();
    }  
  }, []);  
  
  return (
    <>
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
            <div className={classNames(styles.item, menuState[DropdownMenu.Savegames] && styles.activeItem)}>
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
            <div className={classNames(styles.item, menuState[DropdownMenu.Restart] && styles.activeItem)}>
              <button onClick={() => toggleOpen(DropdownMenu.Restart)}>
                <FontAwesomeIcon icon={faRefresh} />
              </button>
              <Dropdown alignLeft isOpen={menuState[DropdownMenu.Restart]}>
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
            <div className={styles.flexSpace} />

            <div className={classNames(styles.item, menuState[DropdownMenu.Settings] && styles.activeItem)}>
              <button onClick={() => toggleOpen(DropdownMenu.Settings)}>
                <FontAwesomeIcon icon={faCog} />
              </button>
              <Dropdown isOpen={menuState[DropdownMenu.Settings]}>
                <button onClick={() => {
                  setMenuState({});
                  setDialogState({ [Dialogs.ConfigureControls]: true });
                }}>
                  <FontAwesomeIcon icon={faGamepad} />
                  <span>Configure controls</span>
                </button>
                <button onClick={promptClearRoms}>
                  <FontAwesomeIcon icon={faRemove} />
                  <span>Clear cached roms</span>
                </button>
                <button onClick={() => setShowDebugInfo(oldVal => !oldVal)}>
                  <input checked={showDebugInfo} type="checkbox" onChange={changeAutoloadEnabled} />
                  <span>Show debug info</span>
                </button>
              </Dropdown>
              <div className={styles.tooltipText}>Settings</div>
            </div>
            <div className={classNames(styles.item, dialogState[Dialogs.ROMList] && styles.activeItem)}>
              <button onClick={() => {
                setMenuState({});
                setRunMode(RunModeType.STOPPED);
                setDialogState(s => ({ [Dialogs.ROMList]: !s[Dialogs.ROMList] }));
              }}
              >
                <FontAwesomeIcon icon={faFolderOpen} />
              </button>
              <div className={styles.tooltipTextRight}>Open game</div>
            </div>

            <div className={classNames(styles.item, styles.debugItem, menuState[DropdownMenu.DebugTools] && styles.activeItem)}>
              <button onClick={() => toggleOpen(DropdownMenu.DebugTools)}><FontAwesomeIcon icon={faTools} /></button>
              <Dropdown isOpen={menuState[DropdownMenu.DebugTools]}>
                {Object.values(DebugDialog).map(dialog => (
                  <button onClick={() => {
                    toggleOpen(DropdownMenu.DebugTools);
                    toggleOpenDialog(dialog);
                  }} key={dialog}>{dialog} <div className={styles.buttonSpace} /> {DebugDialogToHotkey[dialog]} </button>
                ))}
              </Dropdown>
              <div className={styles.tooltipTextRight}>Debug tools</div>
            </div>
          </div>
        )}
      </Transition>
      { 
        dialogState[Dialogs.ConfigureControls] && (
          <ConfigureControls
            inputConfig={inputConfig}
            setInputConfig={setInputConfig}
            onClose={() => setDialogState({})} 
          />
        )}
      {romNamesQuery.data && dialogState[Dialogs.ROMList] && (
        <ROMList
          handleFileSelected={romFileChanged}
          handleFileClick={handleFileClick}
          onClose={() => setDialogState({})}
          setRunMode={setRunMode}
          romList={romNamesQuery.data}
          loadRom={(romBuffer: Uint8Array, filename: string) => {
            setDialogState({});
            loadRom(romBuffer, filename);
          }}
        />
      )}
    </>
  );
};

export default React.memo(Toolbar);
