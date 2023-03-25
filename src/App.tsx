import React, { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import styles from './App.module.css';
import './global.css';
import { parseROM } from './emulator/parseROM';
import EmulatorState, {
    INPUT_A,
    INPUT_B,
    INPUT_DOWN,
    INPUT_LEFT,
    INPUT_RIGHT, INPUT_SELECT, INPUT_START,
    INPUT_UP
} from './emulator/EmulatorState';
import { PRE_RENDER_SCANLINE, SCREEN_HEIGHT, SCREEN_WIDTH, setIsSteppingScanline } from './emulator/ppu';
import AudioBuffer from './AudioBuffer';
import { AUDIO_BUFFER_SIZE, SAMPLE_RATE, FRAMES_PER_SECOND } from './emulator/apu';
import Toolbar from './Toolbar';
import { HotkeyToDebugDialog, getDebugDialogComponents, DebugDialog } from './DebugDialog';
import ErrorBoundary from './ErrorBoundary';
import { LOCAL_STORAGE_BREAKPOINTS_PREFIX, LOCAL_STORAGE_KEY_ROM_LIST, LOCAL_STORAGE_ROM_PREFIX, RomEntry } from './components/types';
import { localStorageAutoloadEnabled } from './components/localStorageUtil';
import { Transition } from 'react-transition-group';
import { animationDuration, transitionDefaultStyle, transitionStyles } from './components/AnimationConstants';

export enum RunModeType {
    STOPPED = 'Stopped',
    RUNNING = 'Running',
    RUNNING_SINGLE_FRAME = 'RunningSingleFrame',
    RUNNING_SINGLE_SCANLINE = 'RunningSingleScanline'
}

const KeyTable: Record<string, number> = {
    'w': INPUT_UP,
    'a': INPUT_LEFT,
    's': INPUT_DOWN,
    'd': INPUT_RIGHT,
    ' ': INPUT_A,
    'm': INPUT_B,
    '.': INPUT_SELECT,
    '-': INPUT_START
};

const ntscFrameLength = 1000.0 / FRAMES_PER_SECOND;

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

const renderScreen = (display: Display | null, emulator: EmulatorState | null ) => {
    if (display != null && emulator != null) {
        display.framebuffer.set(emulator.ppu.framebuffer, 0);
        display.context.putImageData(display.imageData, 0, 0);
    }
}

export type KeyListener = (event: KeyboardEvent) => void
const audioBuffer = new AudioBuffer();

let initialError: (string | null) = null;

const initialRomList: RomEntry[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_ROM_LIST) ?? '[]') ?? [];

const emulator = new EmulatorState();
let lastRomArray = null;
const intialRomEntry = initialRomList?.[0];

if (intialRomEntry != null) {
  lastRomArray = localStorage.getItem(LOCAL_STORAGE_ROM_PREFIX + intialRomEntry.sha);
}

if (lastRomArray != null) {
  const romBuffer = new Uint8Array(JSON.parse(lastRomArray));
  const rom = parseROM(romBuffer);
  try {
    emulator.initMachine(rom, false, (sampleLeft, sampleRight) => audioBuffer.receiveSample(sampleLeft, sampleRight));

    if (localStorageAutoloadEnabled()) {
      emulator.loadEmulatorFromLocalStorage();
    }
  } catch (e) {
    if (typeof e === "string") {
      initialError = e;
    } else if (e instanceof Error) {
      initialError = e.message;
    }
  }
}

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

function App() {
    // Store it as memo inside component so that HMR works properly.
    const DebugDialogComponents = useMemo(() => getDebugDialogComponents(), []);
    const audioRef = useRef<AudioState | null>(null);
    const mainContainerRef = useRef<HTMLDivElement>(null);
    const [refresh, triggerRefresh] = useReducer(num => num + 1, 0);
    const [runMode, setRunMode] = useState(RunModeType.STOPPED);
    const [title, setTitle] = useState<string | null>(intialRomEntry?.filename);
    const [romList, setRomList] = useState<RomEntry[]>(initialRomList);
    const [breakpoints, setBreakpoints] = useState<Map<number, boolean>>(loadBreakpoints(emulator.rom?.romSHA));
    const [showInfoDiv, setShowInfoDiv] = useState(intialRomEntry?.filename == null);
    const startTime = useRef(performance.now());
    const [error, setError] = useState<string | null>(initialError);
    const [dialogState, setDialogState] = useState<Record<string, boolean>>({});
    const display = useRef<Display | null>(null);
    const [keyListeners, setKeyListeners] = useState<KeyListener[]>([]);
    const [showControls, setShowControls] = useState(true);
    const hideControlsTimer = useRef<number>(-1);
    const toggleOpenDialog = (dialog: string) => setDialogState(oldState => ({ ...oldState, [dialog]: !oldState[dialog]}));

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

          canvas.style.transform = `scale(${newScale})`;
        }
      }

      
      measure();
      window.addEventListener('resize', measure);

      return () => {
        window.removeEventListener('resize', measure);
      }
    });

    const addKeyListener = useCallback((listener : KeyListener) => {
        setKeyListeners(oldListeners => {
            return [...oldListeners, listener];
        })
    }, []);

    const removeKeyListener = useCallback((listener : KeyListener) => {
        setKeyListeners(oldListeners => {
            return oldListeners.filter(oldListener => oldListener !== listener);
        });
    }, []);

    const handleGamepad = useCallback((e : GamepadEvent) => {
        console.log(e);
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

    const loadRom = useCallback((romBuffer : Uint8Array, filename: string) => {
        const rom = parseROM(romBuffer);
        setError(null);
        try {
            emulator.initMachine(rom, false, (sampleLeft, sampleRight) => audioBuffer.receiveSample(sampleLeft, sampleRight));

          if (localStorageAutoloadEnabled()) {
            emulator.loadEmulatorFromLocalStorage();
          }

        } catch (e) {
            if (typeof e === "string") {
                setError(e);
            } else if (e instanceof Error) {
                setError(e.message);
            }
        }
        setShowInfoDiv(false);
        setBreakpoints(loadBreakpoints(rom.romSHA));
        setTitle(filename);
        triggerRefresh();
        return rom;
    }, [audioBuffer, emulator, triggerRefresh]);

    const loadRomFromUserInput = useCallback((romBuffer: Uint8Array, filename: string) => {
      localStorage.removeItem(LOCAL_STORAGE_BREAKPOINTS_PREFIX);
      const rom = loadRom(romBuffer, filename);
      const entry: RomEntry = { filename, sha: rom.romSHA };      
      
      setRomList(oldRomList => {
        const newRomList = oldRomList.filter(romEntry => romEntry.sha !== entry.sha);
        newRomList.unshift(entry);
        localStorage.setItem(LOCAL_STORAGE_KEY_ROM_LIST, JSON.stringify(newRomList));
        return newRomList;
      });

      localStorage.setItem(LOCAL_STORAGE_ROM_PREFIX + entry.sha, JSON.stringify(Array.from(romBuffer)));
    }, [loadRom, romList]);

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
        } else if (newRunMode !== RunModeType.STOPPED) {
            setRunMode(newRunMode);
            startTime.current = performance.now();
            updateFrame(startTime.current);
        } else {
            setRunMode(newRunMode);
        }

        triggerRefresh();
    }, [triggerRefresh]);


    const handleKeyEvent = useCallback((e : KeyboardEvent) => {
      if ((e.target as HTMLInputElement)?.type === 'text') {
          return;
      }

      if (e.type === 'keydown') {
        if(e.key in HotkeyToDebugDialog) {
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

      if (e.key in KeyTable) {
          emulator?.setInputController(KeyTable[e.key], e.type === 'keydown');
          e.preventDefault();
      }

      for (const listener of keyListeners) {
          listener(e);
      }
  }, [keyListeners, emulator, _setRunMode, runMode]);



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

        return () => {
            document.removeEventListener('visibilitychange', handleFocus);
            document.removeEventListener('keydown', handleKeyEvent);
            document.removeEventListener('keyup', handleKeyEvent);
            window.removeEventListener('gamepadconnected', handleGamepad);
        }
    }, [handleKeyEvent, handleGamepad, handleFocus])


    const updateFrame = useCallback((timestamp: number) => {
        let stopped = false;
        renderScreen(display.current, emulator);
        
        while ((timestamp - startTime.current) >= ntscFrameLength) {
            startTime.current += ntscFrameLength;

            if (hideControlsTimer.current > 0) {
              hideControlsTimer.current--;
              if (hideControlsTimer.current === 0) {
                setShowControls(false);
              }
            }

            const gamepads = navigator.getGamepads();

            if (gamepads[0] != null) {
                const gamepad = gamepads[0];
                const a0 = gamepad.axes[0];
                const a1 = gamepad.axes[1];
                const deg = Math.atan2(Math.abs(a0), Math.abs(a1)) / Math.PI;

                

                emulator.setInputController(INPUT_RIGHT, (a0 > 0 && deg >= 0.125) || gamepad.buttons[15].pressed);
                emulator.setInputController(INPUT_LEFT, (a0 < 0 && deg >= 0.125) || gamepad.buttons[14].pressed);
                emulator.setInputController(INPUT_UP, (a1 < 0 && deg <= 0.325) || gamepad.buttons[12].pressed);
                emulator.setInputController(INPUT_DOWN, (a1 > 0 && deg <= 0.325) || gamepad.buttons[13].pressed);
                emulator.setInputController(INPUT_START, gamepad.buttons[8].pressed);
                emulator.setInputController(INPUT_SELECT, gamepad.buttons[9].pressed);
                emulator.setInputController(INPUT_A, gamepad.buttons[1].pressed);
                emulator.setInputController(INPUT_B, gamepad.buttons[3].pressed);
            }

            if (emulator.stepFrame(false)) {
                // Hit breakpoint
                _setRunMode(RunModeType.STOPPED);
                setDialogState(oldState => {
                  return { ...oldState, [DebugDialog.CPUDebugger]: true };
                });

                stopped = true;
                break;
            }
        }
        
        

        if (!stopped) {
            animationFrameRef.current = window.requestAnimationFrame(updateFrame);
        }
    }, [runMode, emulator, display, _setRunMode, setDialogState]);

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
        context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
      }
    }, []);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      [...e.dataTransfer.files].forEach(file => {
        // Read the data from firstFile into Uint8Array
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result != null) {
            console.log('Result', file.name);
            const rom = new Uint8Array(e.target.result as ArrayBuffer);
            loadRomFromUserInput(rom, file.name);
          }
        }
        reader.readAsArrayBuffer(file);
      })
    }
    
  const clearLoadedRoms = () => {
    Object.keys(localStorage).forEach(function (key) {
      if (key.startsWith(LOCAL_STORAGE_ROM_PREFIX) || key === LOCAL_STORAGE_KEY_ROM_LIST) {
        localStorage.removeItem(key);
      }
    });
    setShowInfoDiv(true);
    setTitle(null);
  };

  return (
    <>
      <Title text={title ?? 'No file selected'} isOpen={showControls} />
      <div
        className={styles.mainContainer}
        ref={mainContainerRef}
        onMouseMove={e => {
          setShowControls(true);
          if (e.target === mainContainerRef.current || e.target === display.current?.element) {
            hideControlsTimer.current = 60;
          } else {
            hideControlsTimer.current = -1;
          }
        }}
        onDragOver={e => {
          e.preventDefault();
        }}
        onDrop={handleDrop}>


        {showInfoDiv && (
          <div className={styles.infoDiv}>
            <p>
              Load a file using the menu or drop a file to start.
            </p>
          </div>)
        }
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
          isOpen={showControls}
          clearLoadedRoms={clearLoadedRoms}
          setRomList={setRomList}
          emulator={emulator}
          toggleOpenDialog={toggleOpenDialog}
          loadRom={loadRomFromUserInput}
          setRunMode={_setRunMode}
          romList={romList}
          runMode={runMode}
        />
    </>
  );
}

export default React.memo(App);
