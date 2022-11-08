import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
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
import { BREAKPOINTS_KEY } from './components/CPUDebugger';
import _ from 'lodash';
import AudioBuffer from './AudioBuffer';
import { AUDIO_BUFFER_SIZE, SAMPLE_RATE } from './emulator/apu';
import Toolbar from './Toolbar';
import { DebugDialogHotkeys, getDebugDialogComponents } from './DebugDialog';

const LOCAL_STORAGE_KEY_LAST_ROM = 'last-rom';
const LOCAL_STORAGE_KEY_LAST_TITLE = 'last-title';

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

const ntscFrameLength = 1000.0 / 60.0;

type AudioState = {
    scriptProcessor: ScriptProcessorNode
    audioContext: AudioContext
}

type Display = {
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

function App() {
    const DebugDialogComponents = useMemo(() => getDebugDialogComponents(), []);
    const [refresh, triggerRefresh] = useReducer(num => num + 1, 0);

    const [runMode, setRunMode] = useState(RunModeType.STOPPED);
    const [title, setTitle] = useState("No file selected");
    const audioBuffer = useMemo(() => new AudioBuffer(), []);
    const startTime = useRef(performance.now());

    const [dialogState, setDialogState] = useState<Record<string, boolean>>({});

    const toggleOpenDialog = (dialog: string) => setDialogState(oldState => ({ ...oldState, [dialog]: !oldState[dialog]}));

    const emulator = useMemo(()=> new EmulatorState(), []);
    const display = useRef<Display | null>(null);

    const [keyListeners, setKeyListeners] = useState<KeyListener[]>([]);

    const addKeyListener = useCallback((listener : KeyListener) => {
        setKeyListeners(oldListeners => {
            oldListeners.push(listener);
            return oldListeners;
        })
    }, []);

    const removeKeyListener = useCallback((listener : KeyListener) => {
        setKeyListeners(oldListeners => _.without(oldListeners, listener));
    }, []);


    const handleKeyEvent = useCallback((e : KeyboardEvent) => {
        if ((e.target as HTMLInputElement)?.type === 'text') {
            return;
        }

        if (e.type === 'keydown' && e.key in DebugDialogHotkeys) {
            toggleOpenDialog(DebugDialogHotkeys[e.key]);
        }

        if (e.key in KeyTable) {
            emulator?.setInputController(KeyTable[e.key], e.type === 'keydown');
            e.preventDefault();
        }

        for (const listener of keyListeners) {
            listener(e);
        }
    }, [keyListeners, emulator]);

    const handleGamepad = useCallback((e : GamepadEvent) => {
        console.log(e);
    }, []);

    const audioRef = useRef<AudioState | null>(null);

    const stopAudioContext = useCallback(() => {
        if (audioRef.current) {
            console.log('Stop audio context');
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
                while (emulator.ppu.scanline !== PRE_RENDER_SCANLINE && !audioBuffer.playBufferFull) {
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
        emulator.initMachine(rom, false, sample => audioBuffer.receiveSample(sample));
        setTitle(filename);
        triggerRefresh();
    }, [audioBuffer, emulator, triggerRefresh]);

    const loadRomFromUserInput = useCallback((romBuffer: Uint8Array, filename: string) => {
        localStorage.setItem(LOCAL_STORAGE_KEY_LAST_ROM, JSON.stringify(Array.from(romBuffer)));
        localStorage.setItem(LOCAL_STORAGE_KEY_LAST_TITLE, filename);
        localStorage.removeItem(BREAKPOINTS_KEY);
        loadRom(romBuffer, filename);
    }, [loadRom]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyEvent);
        document.addEventListener('keyup', handleKeyEvent);
        window.addEventListener('gamepadconnected', handleGamepad);

        return () => {
            document.removeEventListener('keydown', handleKeyEvent);
            document.removeEventListener('keyup', handleKeyEvent);
            window.removeEventListener('gamepadconnected', handleGamepad);
        }
    }, [handleKeyEvent, handleGamepad])

    useEffect(() => {
        const lastRomArray = localStorage.getItem(LOCAL_STORAGE_KEY_LAST_ROM);
        const lastTitle = localStorage.getItem(LOCAL_STORAGE_KEY_LAST_TITLE) as string;
        if (lastRomArray != null){
            const parsed = new Uint8Array(JSON.parse(lastRomArray));
            loadRom(parsed, lastTitle ?? '');
        }
    }, [loadRom]);

    const animationFrameRef = useRef<number | null>(null);

    const _setRunMode = useCallback((_runMode: RunModeType) => {
        setRunMode(_runMode);

        if (_runMode === RunModeType.RUNNING_SINGLE_SCANLINE) {
            setIsSteppingScanline(true);
        } else {
            setIsSteppingScanline(false);
        }

        if (_runMode === RunModeType.RUNNING) {
            initAudioContext();
        } else {
            stopAudioContext();
        }

        triggerRefresh();
    }, [triggerRefresh]);

    const updateFrame = useCallback((timestamp: number) => {
        let stopped = false;

        while ((timestamp - startTime.current) >= ntscFrameLength) {
            startTime.current += ntscFrameLength;

            const gamepads = navigator.getGamepads();

            if (gamepads[0] != null) {
                const gamepad = gamepads[0];
                const a0 = gamepad.axes[0];
                const a1 = gamepad.axes[1];
                const deg = Math.atan2(Math.abs(a0), Math.abs(a1)) / Math.PI;


                emulator.setInputController(INPUT_RIGHT, a0 > 0 && deg >= 0.125);
                emulator.setInputController(INPUT_LEFT, a0 < 0 && deg >= 0.125);
                emulator.setInputController(INPUT_UP, a1 < 0 && deg <= 0.325);
                emulator.setInputController(INPUT_DOWN, a1 > 0 && deg <= 0.325);
                emulator.setInputController(INPUT_START, gamepad.buttons[8].pressed);
                emulator.setInputController(INPUT_SELECT, gamepad.buttons[9].pressed);
                emulator.setInputController(INPUT_A, gamepad.buttons[1].pressed);
                emulator.setInputController(INPUT_B, gamepad.buttons[0].pressed);
            }

            if (emulator.stepFrame(runMode === RunModeType.RUNNING_SINGLE_SCANLINE)) {
                // Hit breakpoint
                _setRunMode(RunModeType.STOPPED);
                setIsSteppingScanline(false);
                stopped = true;
                break;
            }
        }

        renderScreen(display.current, emulator);

        if (!stopped) {
            animationFrameRef.current = window.requestAnimationFrame(updateFrame);
        }
    }, [runMode, emulator, display, _setRunMode]);

    useEffect(() => {
        if (runMode === RunModeType.RUNNING_SINGLE_SCANLINE || runMode === RunModeType.RUNNING_SINGLE_FRAME) {
            emulator.stepFrame(runMode === RunModeType.RUNNING_SINGLE_FRAME);
            if (display.current != null && emulator) {
                display.current.framebuffer.set(emulator.ppu.framebuffer, 0);
                display.current.context.putImageData(display.current.imageData, 0, 0);
            }
            _setRunMode(RunModeType.STOPPED);
        } else if (runMode !== RunModeType.STOPPED) {
            startTime.current = performance.now();
            updateFrame(startTime.current);
        }

        return () => {
            if (animationFrameRef.current != null) {
                window.cancelAnimationFrame(animationFrameRef.current);
            }

            animationFrameRef.current = null;
        }
    }, [updateFrame, animationFrameRef, runMode]);

    const reboot = useCallback(() => {
        emulator.reboot();
    }, [emulator]);

    return (
      <div>
          <Toolbar
            emulator={emulator}
            toggleOpenDialog={toggleOpenDialog}
            loadRom={loadRomFromUserInput}
            setRunMode={_setRunMode}
            reboot={reboot}
          />

          { Object.entries(DebugDialogComponents).map(([type, DialogComponent]) => (
            <DialogComponent
              isOpen={dialogState[type]}
              onClose={() => toggleOpenDialog(type)}
              emulator={emulator}
              runMode={runMode}
              setRunMode={_setRunMode}
              key={type}
              onRefresh={triggerRefresh}
              refresh={refresh}
              addKeyListener={addKeyListener}
              removeKeyListener={removeKeyListener}
            />
          ))
          }
          <div className={styles.app}>
              <h1>{ title }</h1>
              <div className={styles.drawingArea}>
                  <div className={styles.canvasContainer}>
                      <div className={styles.displayContainer}>
                          <canvas width={SCREEN_WIDTH} height={SCREEN_HEIGHT} ref={ref => {
                              const context = ref?.getContext("2d");
                              if (context != null) {
                                  const imageData = context.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
                                  const framebuffer = new Uint32Array(imageData.data.buffer);
                                  display.current = { imageData, framebuffer, context };
                              }
                          }}/>
                      </div>
                  </div>
              </div>

          </div>
      </div>
    );
}

export default App;
