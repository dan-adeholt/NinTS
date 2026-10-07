import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import styles from './App.module.css';
import '../global.css';
import { parseROM } from '../emulator/parseROM';
import EmulatorState from '../emulator/EmulatorState';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../emulator/ppu';
import Toolbar from './Toolbar';
import { HotkeyToDebugDialog, getDebugDialogComponents, DebugDialog } from './DebugDialog';
import ErrorBoundary from './ErrorBoundary';
import { LOCAL_STORAGE_BREAKPOINTS_PREFIX, LOCAL_STORAGE_KEY_LAST_ROM, LOCAL_STORAGE_KEY_INPUT_CONFIG } from '../components/types';
import { localStorageAutoloadEnabled } from '../components/localStorageUtil';
import { Transition } from 'react-transition-group';
import { animationDuration, transitionDefaultStyle, transitionStyles } from '../components/AnimationConstants';
import { useContextWithErrorIfNull } from '../hooks/useSafeContext';
import { ApplicationStorageContext } from './ApplicationStorage';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { InputConfig, createInputConfigLookup, defaultInputConfig } from './Integration/InputTypes';
import TouchControls from './TouchControls';
import useAudio from '../hooks/useAudio';
import useGameLoop, { Display, renderScreen } from '../hooks/useGameLoop';
import useViewportLayout from '../hooks/useViewportLayout';
import { errorMessage, readRomFile } from './readRomFile';

export enum RunModeType {
    STOPPED = 'Stopped',
    RUNNING = 'Running',
    RUNNING_SINGLE_FRAME = 'RunningSingleFrame',
    RUNNING_SINGLE_SCANLINE = 'RunningSingleScanline'
}

export type KeyListener = (event: KeyboardEvent) => void

const emulator = new EmulatorState();

const breakpointsToJSON = (breakpoints: Map<number, boolean>) => {
  return JSON.stringify(Array.from(breakpoints.entries()));
}

const loadBreakpoints = (romSHA: string) => {
  const key = LOCAL_STORAGE_BREAKPOINTS_PREFIX + romSHA;
  const item = localStorage.getItem(key);

  try {
    return new Map<number, boolean>(JSON.parse(item ?? '[]'));
  } catch(e) {
    return new Map<number, boolean>();
  }
}

type TitleProps = {
  isOpen: boolean
  text: string
}
function Title({ isOpen, text } : TitleProps) {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <Transition nodeRef={nodeRef} in={isOpen} timeout={animationDuration} unmountOnExit>
      {state => (
        <div className={styles.header} ref={nodeRef} style={{
          ...transitionDefaultStyle,
          ...transitionStyles[state]
        }}>
          { text }
        </div>
      )}
    </Transition>
  );
}

const lastRomSha = localStorage.getItem(LOCAL_STORAGE_KEY_LAST_ROM) ?? '';

const getInitialInputConfig = () => {
  const savedConfig = localStorage.getItem(LOCAL_STORAGE_KEY_INPUT_CONFIG)
  return savedConfig ? JSON.parse(savedConfig) : defaultInputConfig;
}

const deviceHasGamepads = () => navigator.getGamepads().filter(x => x!= null).length > 0;

function App() {
  const appStorage = useContextWithErrorIfNull(ApplicationStorageContext);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const initialRomLoaded = useRef(false);
  const { onAudioSample, startAudio, stopAudio } = useAudio(emulator);

  const [hasGamepads, setHasGamepads] = useState(deviceHasGamepads);

  const firstRomQuery = useQuery(['firstRom'], () => appStorage.getRomDataAndSavegame(lastRomSha), {
    enabled: lastRomSha != '' && !initialRomLoaded.current,
    onSuccess: ([romData, romSaveData]) => {
      initialRomLoaded.current = true;
      if (romData.status === "rejected" || romData.value == null) {
        return;
      }

      try {
        const data = parseROM(romData.value.data);
        emulator.initMachine(data, false, onAudioSample);
        setTitle(romData.value.filename);

        if (localStorageAutoloadEnabled() && romSaveData.status !== 'rejected' && romSaveData.value != null) {
          emulator.loadEmulator(JSON.parse(romSaveData.value.data));
        }
      } catch (e) {
        setError(errorMessage(e));
      }
    }
  });

  const [inputConfig, setInputConfig] = useState<InputConfig>(getInitialInputConfig);
  const inputConfigLookup = useMemo(() => createInputConfigLookup(inputConfig), [inputConfig]);

  // Store it as memo inside component so that HMR works properly.
  const DebugDialogComponents = useMemo(() => getDebugDialogComponents(), []);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [refresh, triggerRefresh] = useReducer(num => num + 1, 0);
  const [runMode, setRunMode] = useState(RunModeType.STOPPED);

  const [loadingString, setLoadingString] = useState<string | null>(null);
  const [breakpoints, setBreakpoints] = useState<Map<number, boolean>>(() => loadBreakpoints(emulator.rom.romSHA));
  const [showInfoDiv, setShowInfoDiv] = useState(lastRomSha === '');

  const [dialogState, setDialogState] = useState<Record<string, boolean>>({});
  const display = useRef<Display | null>(null);
  const [keyListeners, setKeyListeners] = useState<KeyListener[]>([]);
  const [showControls, setShowControls] = useState(true);
  const queryClient = useQueryClient();
  const hideControlsTimer = useRef<number>(-1);
  const toggleOpenDialog = useCallback((dialog: string) => setDialogState(oldState => ({ ...oldState, [dialog]: !oldState[dialog] })), []);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const sideWidth = useViewportLayout(mainContainerRef, display);

  // Sync breakpoints with emulator
  useEffect(() => {
    emulator.breakpoints = breakpoints;
    localStorage.setItem(LOCAL_STORAGE_BREAKPOINTS_PREFIX + emulator.rom.romSHA, breakpointsToJSON(breakpoints));
  }, [breakpoints]);

  const addKeyListener = useCallback((listener: KeyListener) => {
    setKeyListeners(oldListeners => {
      return [...oldListeners, listener];
    })
  }, []);

  const removeKeyListener = useCallback((listener: KeyListener) => {
    setKeyListeners(oldListeners => {
      return oldListeners.filter(oldListener => oldListener !== listener);
    });
  }, []);

  const handleGamepad = useCallback(() => {
    setHasGamepads(true);
  }, []);

  const loadRom = useCallback((romBuffer: Uint8Array, filename: string) => {
    initialRomLoaded.current = true;

    setError(null);
    try {
      const rom = parseROM(romBuffer);
      emulator.initMachine(rom, false, onAudioSample);
      if (localStorageAutoloadEnabled()) {
        appStorage.getRomSavegame(rom.romSHA).then((savegame) => {
          if (savegame) {
            emulator.loadEmulator(JSON.parse(savegame.data));
          }
        });
      }
      setBreakpoints(loadBreakpoints(rom.romSHA));
    } catch (e) {
      setError(errorMessage(e));
    }

    setShowInfoDiv(false);
    setTitle(filename);
    triggerRefresh();

    if (display.current) {
      display.current.context.fillStyle = '#1e1e1e';
      display.current.context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
    }
  }, [appStorage, onAudioSample]);

  const handleStopped = useCallback(() => {
    // Hit breakpoint
    stopAudio();
    setShowControls(true);
    setRunMode(RunModeType.STOPPED);
    setDialogState(oldState => {
      return { ...oldState, [DebugDialog.CPUDebugger]: true };
    });
  }, [stopAudio]);

  const { start: startGameLoop, stop: stopGameLoop } = useGameLoop({
    emulator,
    display,
    inputConfigLookup,
    showDebugInfo,
    onStopped: handleStopped,
    onEmulatorFrame: () => {
      if (hideControlsTimer.current > 0) {
        hideControlsTimer.current--;
        if (hideControlsTimer.current === 0) {
          setShowControls(false);
        }
      }
    }
  });

  const _setRunMode = useCallback((newRunMode: RunModeType) => {
    stopGameLoop();

    if (newRunMode === RunModeType.RUNNING) {
      hideControlsTimer.current = 60;
      void startAudio();
    } else {
      setShowControls(true);
      stopAudio();
    }

    if (newRunMode === RunModeType.RUNNING_SINGLE_SCANLINE || newRunMode === RunModeType.RUNNING_SINGLE_FRAME) {
      emulator.stepFrame(newRunMode === RunModeType.RUNNING_SINGLE_SCANLINE);
      if (display.current != null) {
        renderScreen(display.current, emulator);
      }
      setRunMode(RunModeType.STOPPED);
    } else if (newRunMode !== RunModeType.STOPPED && display.current) {
      setRunMode(newRunMode);
      startGameLoop();
    } else {
      setRunMode(newRunMode);
    }

    triggerRefresh();
  }, [startAudio, stopAudio, startGameLoop, stopGameLoop]);

  const { mutate: addRom } = useMutation(appStorage.addRoms, {
    onSuccess: (_res, args) => {
      const lastRom = args[args.length - 1];
      loadRom(lastRom.data, lastRom.filename);
      setLoadingString(null);
      localStorage.setItem(LOCAL_STORAGE_KEY_LAST_ROM, lastRom.sha);
      queryClient.invalidateQueries(['roms']);
    },
    onError: (error) => {
      console.error('Failed to add rom', error);
      setLoadingString(null);
      setError(errorMessage(error));
    }
  });

  const loadRomFromUserInput = useCallback((romBuffer: Uint8Array, filename: string) => {
    try {
      const rom = parseROM(romBuffer);
      localStorage.setItem(LOCAL_STORAGE_KEY_LAST_ROM, rom.romSHA);
      addRom([{ sha: rom.romSHA, data: romBuffer, filename }]);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [addRom]);

  const handleKeyEvent = useCallback((e: KeyboardEvent) => {
    if ((e.target as HTMLInputElement)?.type === 'text') {
      return;
    }

    if (e.type === 'keydown') {
      if (e.key in HotkeyToDebugDialog) {
        toggleOpenDialog(HotkeyToDebugDialog[e.key]);
      } else {
        switch (e.key) {
          case 'r':
            if (!e.metaKey) {
              if (runMode === RunModeType.RUNNING) {
                _setRunMode(RunModeType.STOPPED);
              } else {
                _setRunMode(RunModeType.RUNNING);
              }
            }
            break;
          case 'f':
            _setRunMode(RunModeType.RUNNING_SINGLE_FRAME);
            break;
          case 'l':
            _setRunMode(RunModeType.RUNNING_SINGLE_SCANLINE);
            break;
          default:
            break;
        }
      }
    }

    const binding = inputConfigLookup.keyboardLookup.get(e.key);

    if (binding != null) {
      emulator.setInputController(binding.button, e.type === 'keydown', binding.controller);
      e.preventDefault();
    }

    for (const listener of keyListeners) {
      listener(e);
    }
  }, [keyListeners, _setRunMode, runMode, inputConfigLookup, toggleOpenDialog]);

  const handleFocus = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      _setRunMode(RunModeType.STOPPED);
    }
  }, [_setRunMode]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyEvent);
    document.addEventListener('keyup', handleKeyEvent);
    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('gamepadconnected', handleGamepad);
    window.addEventListener('gamepaddisconnected', handleGamepad);

    return () => {
      document.removeEventListener('visibilitychange', handleFocus);
      document.removeEventListener('keydown', handleKeyEvent);
      document.removeEventListener('keyup', handleKeyEvent);
      window.removeEventListener('gamepadconnected', handleGamepad);
      window.removeEventListener('gamepaddisconnected', handleGamepad);
    }
  }, [handleKeyEvent, handleGamepad, handleFocus])

  const canvasRefCallback = useCallback((ref: HTMLCanvasElement | null) => {
    const context = ref?.getContext("2d");
    if (context != null) {
      const imageData = context.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
      const framebuffer = new Uint32Array(imageData.data.buffer);
      for (let i = 0; i < framebuffer.length; i++) {
        framebuffer[i] = 0xdadada;
      }

      display.current = { imageData, framebuffer, context, element: ref };
      context.fillStyle = '#1e1e1e';
      context.imageSmoothingEnabled = false;
      context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
    }
  }, []);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = [...e.dataTransfer.files];
    setLoadingString(`Loading ${files.length} roms...`);

    const results = await Promise.allSettled(files.map(readRomFile));
    const romsToAdd = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
    const failed = results.flatMap(result => result.status === 'rejected' ? [result.reason] : []);

    if (failed.length > 0) {
      console.error('Failed to read roms', failed);
    }

    if (romsToAdd.length > 0) {
      addRom(romsToAdd);
    } else {
      setLoadingString(null);
      setError(failed.length > 0 ? errorMessage(failed[0]) : null);
    }
  }

  const clearQuery = useMutation(appStorage.clearRoms, {
    onSuccess: () => {
      queryClient.invalidateQueries(['roms']);
      window.location.reload();
    }
  });


  const clearLoadedRoms = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY_LAST_ROM);
    clearQuery.mutate();
    setShowInfoDiv(true);
    setTitle(null);
  };

  let titleText: string;

  if (lastRomSha != '' && firstRomQuery.isFetching) {
    titleText = '';
  } else {
    titleText = title ?? 'No file selected'
  }

  return (
    <>
      <Title text={titleText} isOpen={showControls} />
      <div
        className={styles.mainContainer}
        ref={mainContainerRef}
        onMouseMove={e => {
          setShowControls(true);
          if (e.target === mainContainerRef.current || e.target === display.current?.element) {
            hideControlsTimer.current = 120;
          } else {
            hideControlsTimer.current = -1;
          }
        }}
        onDragOver={e => {
          e.preventDefault();
        }}
        onDrop={handleDrop}>

        {!firstRomQuery.isFetching && showInfoDiv && (
          <div className={styles.infoDiv}>
            <p>
              {loadingString ? loadingString : <span>Load a file using the menu or drop a file to start.</span>}
            </p>
          </div>)
        }

        { !hasGamepads && <TouchControls emulator={emulator} sideWidth={sideWidth}/> }

        <ErrorBoundary>
          {Object.entries(DebugDialogComponents).map(([type, DialogComponent]) => dialogState[type] && (
            <DialogComponent
              onClose={() => toggleOpenDialog(type)}
              emulator={emulator}
              runMode={runMode}
              setRunMode={_setRunMode}
              key={type + emulator.rom?.romSHA}
              onRefresh={triggerRefresh}
              refresh={refresh}
              addKeyListener={addKeyListener}
              removeKeyListener={removeKeyListener}
              breakpoints={breakpoints}
              setBreakpoints={setBreakpoints}
            />
          ))
          }
          {error}
          {!error && (
            <canvas width={SCREEN_WIDTH} height={SCREEN_HEIGHT} ref={canvasRefCallback} />
          )}
        </ErrorBoundary>
      </div>
      <Toolbar
        inputConfig={inputConfig}
        setInputConfig={setInputConfig}
        isOpen={showControls}
        clearLoadedRoms={clearLoadedRoms}
        emulator={emulator}
        toggleOpenDialog={toggleOpenDialog}
        loadRom={loadRomFromUserInput}
        setRunMode={_setRunMode}
        runMode={runMode}
        showDebugInfo={showDebugInfo}
        setShowDebugInfo={setShowDebugInfo}
      />
    </>
  );
}

export default React.memo(App);
