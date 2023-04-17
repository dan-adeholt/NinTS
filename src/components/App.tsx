import React, { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import styles from './App.module.css';
import '../global.css';
import { parseROM } from '../emulator/parseROM';
import EmulatorState, {
    INPUT_DOWN,
    INPUT_LEFT,
    INPUT_RIGHT,
    INPUT_UP
} from '../emulator/EmulatorState';
import { PRE_RENDER_SCANLINE, SCREEN_HEIGHT, SCREEN_WIDTH, setIsSteppingScanline } from '../emulator/ppu';
import AudioBuffer from './AudioBuffer';
import { AUDIO_BUFFER_SIZE, SAMPLE_RATE, FRAMES_PER_SECOND } from '../emulator/apu';
import Toolbar from './Toolbar';
import { HotkeyToDebugDialog, getDebugDialogComponents, DebugDialog } from './DebugDialog';
import ErrorBoundary from './ErrorBoundary';
import { LOCAL_STORAGE_BREAKPOINTS_PREFIX, LOCAL_STORAGE_KEY_LAST_ROM, LOCAL_STORAGE_KEY_INPUT_CONFIG } from '../components/types';
import { localStorageAutoloadEnabled } from '../components/localStorageUtil';
import { Transition } from 'react-transition-group';
import { animationDuration, transitionDefaultStyle, transitionStyles } from '../components/AnimationConstants';
import { drawStringBuffer, copyTextToBuffer, copyNumberToBuffer } from '../components/CanvasTextDrawer';
import FIFOBuffer from '../components/FIFOBuffer';
import { useContextWithErrorIfNull } from '../hooks/useSafeContext';
import { ApplicationStorageContext } from './ApplicationStorage';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { GamepadControllerBinding, InputConfig, KeyboardBinding, defaultInputConfig, getGamepadIndexFromButton } from './Integration/InputTypes';
import TouchControls from './TouchControls';

export enum RunModeType {
    STOPPED = 'Stopped',
    RUNNING = 'Running',
    RUNNING_SINGLE_FRAME = 'RunningSingleFrame',
    RUNNING_SINGLE_SCANLINE = 'RunningSingleScanline'
}

type InputConfigLookup = {
  keyboardLookup:  Map<string, KeyboardBinding>;
  gamepadLookup: Map<number, GamepadControllerBinding>
}

const ntscFrameLength = 1000.0 / FRAMES_PER_SECOND;

// Unfortunately the timestamp in the requestAnimationFrame callback is not
// as accurate as expected (I think due to Spectre/Meltdown mitigations).
// This causes stutters after a while when using delta calculations, as the
// error accumulates. To work around this, we use a lock table to determine
// how many times we should update the emulator per frame by comparing the delta
// to standard refresh rate deltas. If the diff is not close enough, i.e. for
// 144hz displays or when the frame takes too long to
// complete an emulation step, fall back to delta calculations.

// For some browsers, we can get access to the high precision timers again by
// specifying Cross-Origin-Embedder-Policy and Cross-Origin-Opener-Policy in
// the response headers, but it doesn't seem to work on iOS.
type FpsLockEntry = {
  delta: number
  framesPerIndex: (frameIndex: number) => number
}

const FPS_LOCK_TABLE: FpsLockEntry[] = [
  { delta: 1000 / 30.0, framesPerIndex: () => 2 },
  { delta: 1000 / 60.0, framesPerIndex: () => 1 },
  { delta: 1000 / 120.0, framesPerIndex: (frameIndex: number) => (frameIndex % 2 === 0) ? 1 : 0 },
  { delta: 1000 / 240.0, framesPerIndex: (frameIndex: number) => (frameIndex % 4 === 0) ? 1 : 0 }
];

const FPS_LOCK_EPSILON = 1;

type AudioState = {
    scriptProcessor: ScriptProcessorNode
    audioContext: AudioContext
}

type Display = {
  element: (HTMLCanvasElement | null)
  context: CanvasRenderingContext2D
  imageData: ImageData
  framebuffer: Uint32Array
}

const textBuffer = new Uint8Array(64)
const stepTimingBuffer = new FIFOBuffer(30);
const frameTimingBuffer = new FIFOBuffer(5, Math.max);

const renderScreen = (display: Display | null, emulator: EmulatorState | null, showDebugInfo: boolean) => {
    if (display != null && emulator != null) {
        display.framebuffer.set(emulator.ppu.framebuffer, 0);
        display.context.putImageData(display.imageData, 0, 0);
        if (showDebugInfo) {
          let index = copyTextToBuffer(textBuffer, 0, 'Step  timing: ');
          index = copyNumberToBuffer(textBuffer, index, stepTimingBuffer.maxValue);
          index = copyTextToBuffer(textBuffer, index, '\nFrame timing: ');
          index = copyNumberToBuffer(textBuffer, index, frameTimingBuffer.maxValue);
          drawStringBuffer(textBuffer, display.context, 0, 0, index);
        }
    }
}

export type KeyListener = (event: KeyboardEvent) => void
const audioBuffer = new AudioBuffer();

const emulator = new EmulatorState();

const breakpointsToJSON = (breakpoints: Map<number, boolean>) => {  
  return JSON.stringify(Array.from(breakpoints.entries()));
}

const loadBreakpoints = (romSHA: string) => {
  const key = LOCAL_STORAGE_BREAKPOINTS_PREFIX + romSHA;
  const item = localStorage.getItem(key);
  const parsed = JSON.parse(item ?? '[]');
  
  try {
    return new Map<number, boolean>(parsed);
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

const updateFrame = (
  timestamp: number,
  display: Display,
  onStopped: () => void,
  runMode: RunModeType,
  inputConfigLookup: InputConfigLookup,
  showDebugInfo: boolean,
  setShowControls: React.Dispatch<React.SetStateAction<boolean>>,
  hideControlsTimer: React.MutableRefObject<number>,
  animationFrameRef: React.MutableRefObject<number | null>,
  animationFrameIndex = 0,
  emulatorTime = performance.now(),
  lastTime = performance.now()
) => {
  let stopped = false;
  const gamepads = navigator.getGamepads();

  for (const gamepad of gamepads) {
    if (gamepad == null) {
      continue;
    }

    const a0 = gamepad.axes[0];
    const a1 = gamepad.axes[1];
    const deg = Math.atan2(Math.abs(a0), Math.abs(a1)) / Math.PI;

    for (let buttonIndex = 0; buttonIndex < gamepad.buttons.length; buttonIndex++) {
      const buttonAndPadIndex = getGamepadIndexFromButton(buttonIndex, gamepad.index);
      const config = inputConfigLookup.gamepadLookup.get(buttonAndPadIndex);
      if (config != null){
        let isPressed = gamepad.buttons[buttonIndex].pressed;

        // Handle dpad automatically
        switch (config.button) {
          case INPUT_RIGHT:
            isPressed = isPressed || (a0 > 0 && deg >= 0.125);  
            break;
          case INPUT_LEFT:
            isPressed = isPressed || (a0 < 0 && deg >= 0.125);
            break;
          case INPUT_UP:
            isPressed = isPressed || (a1 < 0 && deg <= 0.325);
            break;  
          case INPUT_DOWN:
            isPressed = isPressed || (a1 > 0 && deg <= 0.325);
            break;
        }

        emulator.setInputController(config.button, isPressed, config.controller);
      }
    }
  }

  const timeDelta = timestamp - lastTime;
  
  const tick = (): boolean => {
    emulatorTime += ntscFrameLength;

    if (hideControlsTimer.current > 0) {
      hideControlsTimer.current--;
      if (hideControlsTimer.current === 0) {
        setShowControls(false);
      }
    }

    const stepT0 = performance.now();
    const _stopped = emulator.stepFrame(false);
    stepTimingBuffer.push(performance.now() - stepT0);
    return _stopped;
  }
  
  let numFrames = -1;

  for (const fpsLockConfig of FPS_LOCK_TABLE) {
    const diffLast = Math.abs(timeDelta - fpsLockConfig.delta);
    if (diffLast < FPS_LOCK_EPSILON) {
      numFrames = fpsLockConfig.framesPerIndex(animationFrameIndex);
      for (let i = 0; i < numFrames && !stopped; i++) {
        stopped = tick();
      }

      break;
    }
  }

  // Found no lock config, use standard delta time based frame updates      
  if (numFrames === -1) {
    while ((timestamp - emulatorTime) >= ntscFrameLength && !stopped) {
      stopped = tick();
    }
  }

  renderScreen(display, emulator, showDebugInfo);
  animationFrameIndex = (animationFrameIndex + 1 % 8)

  if (stopped) {
    onStopped();
  }
  
  frameTimingBuffer.push(numFrames);
  lastTime = timestamp;

  if (!stopped) {
    if (animationFrameRef.current != null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = window.requestAnimationFrame((_newTimestamp) => {
      updateFrame(_newTimestamp, display, onStopped, runMode, inputConfigLookup, showDebugInfo, setShowControls, hideControlsTimer, animationFrameRef, animationFrameIndex, emulatorTime, lastTime);
    });
  }
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
        emulator.initMachine(data, false, (sampleLeft, sampleRight) => audioBuffer.receiveSample(sampleLeft, sampleRight));
        setTitle(romData.value.filename);

        if (localStorageAutoloadEnabled() && romSaveData.status !== 'rejected' && romSaveData.value != null) {
          emulator.loadEmulator(JSON.parse(romSaveData.value.data));
        }
      } catch (e) {
        if (typeof e === "string") {
          setError(e);
        } else if (e instanceof Error) {
          setError(e.message);
        }
      }
    }
  });

  const [inputConfig, setInputConfig] = useState<InputConfig>(getInitialInputConfig);
  const inputConfigLookup: InputConfigLookup = useMemo(() => {
    const keyboardLookup = new Map<string, KeyboardBinding>();
    const gamepadLookup = new Map<number, GamepadControllerBinding>();

    for (const binding of inputConfig.keyboardBindings) {
      keyboardLookup.set(binding.character, binding);
    }

    for (const binding of inputConfig.gamepadBindings) {
      gamepadLookup.set(getGamepadIndexFromButton(binding.gamepadButton, binding.gamepad), binding);
    }

    return {
      keyboardLookup,
      gamepadLookup
    }    
  }, [inputConfig]);

  // Store it as memo inside component so that HMR works properly.
  const DebugDialogComponents = useMemo(() => getDebugDialogComponents(), []);
  const audioRef = useRef<AudioState | null>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [refresh, triggerRefresh] = useReducer(num => num + 1, 0);
  const [runMode, setRunMode] = useState(RunModeType.STOPPED);

  const [loadingString, setLoadingString] = useState<string | null>(null);
  const [breakpoints, setBreakpoints] = useState<Map<number, boolean>>(loadBreakpoints(emulator.rom?.romSHA));
  const [showInfoDiv, setShowInfoDiv] = useState(lastRomSha == null || lastRomSha === '');

  const [dialogState, setDialogState] = useState<Record<string, boolean>>({});
  const display = useRef<Display | null>(null);
  const [keyListeners, setKeyListeners] = useState<KeyListener[]>([]);
  const [showControls, setShowControls] = useState(true);
  const queryClient = useQueryClient();
  const hideControlsTimer = useRef<number>(-1);
  const toggleOpenDialog = (dialog: string) => setDialogState(oldState => ({ ...oldState, [dialog]: !oldState[dialog] }));
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [sideWidth, setSideWidth] = useState(0);

  // Sync breakpoints with emulator
  useEffect(() => {
    emulator.breakpoints = breakpoints;
    localStorage.setItem(LOCAL_STORAGE_BREAKPOINTS_PREFIX + emulator.rom.romSHA, breakpointsToJSON(breakpoints));
  }, [breakpoints, emulator]);

  useLayoutEffect(() => {
    const measure = () => {
      const mainContainer = mainContainerRef.current;
      const canvas = display.current?.element;
      if (mainContainer && canvas) {
        let newScale = (mainContainer.clientHeight) / canvas.height;
        if (mainContainer.clientHeight > mainContainer.clientWidth) {
          newScale = (mainContainer.clientWidth) / canvas.width;
        }

        setSideWidth(Math.max(0.15 * mainContainer.clientWidth, (mainContainer.clientWidth - (canvas.width * newScale)) * 0.5));
        canvas.style.transform = `scale(${newScale})`;
      }
    }


    measure();
    window.addEventListener('resize', measure);

    return () => {
      window.removeEventListener('resize', measure);
    }
  }, []);

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

  const stopAudioContext = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.scriptProcessor.disconnect(audioRef.current.audioContext.destination);
      audioRef.current = null;
    }
  }, []);

  const initAudioContext = useCallback(() => {
    stopAudioContext();
    // Setup audio.
    const audioContext = new window.AudioContext({
      sampleRate: SAMPLE_RATE
    });

    const scriptProcessor = audioContext.createScriptProcessor(AUDIO_BUFFER_SIZE, 0, 2);
    scriptProcessor.onaudioprocess = event => {
      audioBuffer.writeToDestination(event.outputBuffer, () => {
        // We are missing a few samples. The emulator stops right after vblank is hit,
        // we can try to do a few more cycles before the pre-render scanline so that the
        // audio buffer can be filled
        while (audioRef.current && emulator.ppu.scanline !== PRE_RENDER_SCANLINE && !audioBuffer.playBufferFull) {
          emulator.step();
        }
      });
    }
    scriptProcessor.connect(audioContext.destination);

    audioRef.current = {
      scriptProcessor,
      audioContext
    };
  }, [stopAudioContext, audioBuffer, emulator]);

  const loadRom = useCallback((romBuffer: Uint8Array, filename: string) => {
    initialRomLoaded.current = true;
    
    setError(null);
    try {
      const rom = parseROM(romBuffer);
      emulator.initMachine(rom, false, (sampleLeft, sampleRight) => audioBuffer.receiveSample(sampleLeft, sampleRight));
      if (localStorageAutoloadEnabled()) {
        appStorage.getRomSavegame(rom.romSHA).then((savegame) => {
          if (savegame) {
            emulator.loadEmulator(JSON.parse(savegame.data));
          }
        });
      }
      setBreakpoints(loadBreakpoints(rom.romSHA));
    } catch (e) {
      if (typeof e === "string") {
        setError(e);
      } else if (e instanceof Error) {
        setError(e.message);
      }
    }

    setShowInfoDiv(false);
    setTitle(filename);
    triggerRefresh();

    if (display.current) {
      display.current.context.fillStyle = '#1e1e1e';
      display.current.context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
    }
  }, [audioBuffer, emulator, triggerRefresh]);

  const animationFrameRef = useRef<number | null>(null);

  const _setRunMode = useCallback((newRunMode: RunModeType) => {
    if (animationFrameRef.current != null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    if (newRunMode === RunModeType.RUNNING) {
      hideControlsTimer.current = 60;
      initAudioContext();
    } else {
      setShowControls(true);
      stopAudioContext();
    }

    animationFrameRef.current = null;

    if (newRunMode === RunModeType.RUNNING_SINGLE_SCANLINE || newRunMode === RunModeType.RUNNING_SINGLE_FRAME) {
      setIsSteppingScanline(newRunMode == RunModeType.RUNNING_SINGLE_SCANLINE);
      emulator.stepFrame(newRunMode === RunModeType.RUNNING_SINGLE_SCANLINE);
      if (display.current != null && emulator) {
        display.current.framebuffer.set(emulator.ppu.framebuffer, 0);
        display.current.context.putImageData(display.current.imageData, 0, 0);
      }
      setRunMode(RunModeType.STOPPED);
      setIsSteppingScanline(false);
    } else if (newRunMode !== RunModeType.STOPPED && display.current) {
      setRunMode(newRunMode);

      updateFrame(
        performance.now(),
        display.current,
        () => {
          // Hit breakpoint
          stopAudioContext();
          setShowControls(true);
          setRunMode(RunModeType.STOPPED);
          setDialogState(oldState => {
            return { ...oldState, [DebugDialog.CPUDebugger]: true };
          });
        },
        runMode,
        inputConfigLookup,
        showDebugInfo,
        setShowControls,
        hideControlsTimer,
        animationFrameRef);

    } else {
      setRunMode(newRunMode);
    }

    triggerRefresh();
  }, [triggerRefresh, showDebugInfo, runMode, inputConfig, emulator, initAudioContext, stopAudioContext, display, setRunMode, setIsSteppingScanline]);

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
    }
  });

  const loadRomFromUserInput = useCallback((romBuffer: Uint8Array, filename: string) => {
    const rom = parseROM(romBuffer);
    localStorage.setItem(LOCAL_STORAGE_KEY_LAST_ROM, rom.romSHA);
    addRom([{ sha: rom.romSHA, data: romBuffer, filename }]);
  }, [loadRom, addRom, _setRunMode]);

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
      emulator?.setInputController(binding.button, e.type === 'keydown', binding.controller);
      e.preventDefault();
    }

    for (const listener of keyListeners) {
      listener(e);
    }
  }, [keyListeners, emulator, _setRunMode, runMode, inputConfigLookup]);

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    let numLoaded = 0;
    const totalAmount = e.dataTransfer.files.length;
    const romsToAdd: { sha: string, data: Uint8Array, filename: string }[] = [];
    setLoadingString(`Loading ${totalAmount} roms...`);

    [...e.dataTransfer.files].forEach(file => {
      // Read the data from firstFile into Uint8Array
      const reader = new FileReader();
      reader.onload = (e) => {
        numLoaded++;

        if (e.target?.result != null) {
          const romBuffer = new Uint8Array(e.target.result as ArrayBuffer);
          const parsedRom = parseROM(romBuffer);
          romsToAdd.push({ sha: parsedRom.romSHA, data: romBuffer, filename: file.name });

          if (numLoaded === totalAmount) {
            addRom(romsToAdd);
          }
        }
      }
      reader.readAsArrayBuffer(file);
    })
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
