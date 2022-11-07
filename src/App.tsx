import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import styles from './App.module.css';
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

export type KeyListener = (event: KeyboardEvent) => void

function App() {
// NamedExoticComponent is because we React.memo all the debug dialogs
    const DebugDialogComponents = useMemo(() => getDebugDialogComponents(), []);
    const [refresh, triggerRefresh] = useReducer(num => num + 1, 0);

    const [runMode, setRunMode] = useState(RunModeType.STOPPED);
    const [title, setTitle] = useState("No file selected");
    const audioBuffer = useMemo(() => new AudioBuffer(), []);
    const startTime = useRef(performance.now());

    const [dialogState, setDialogState] = useState<Record<string, boolean>>({
        // [DebugDialog.APUDebugger]: true,
        // [DebugDialog.CPUDebugger]: true
    });
    const toggleOpenDialog = (dialog: string) => setDialogState(oldState => ({ ...oldState, [dialog]: !oldState[dialog]}));

    const emulator = useMemo(()=> new EmulatorState(), []);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [display, setDisplay] = useState<Display | null>(null);

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
        console.log('Init audio context');
        // Setup audio.
        const audioContext = new window.AudioContext({ sampleRate: SAMPLE_RATE });

        audioContext.onstatechange = e => {
            console.log(e);
        }

        console.log('Sample rate:', audioContext.sampleRate);
        const scriptProcessor = audioContext.createScriptProcessor(AUDIO_BUFFER_SIZE, 0, 2);
        scriptProcessor.onaudioprocess = event => {
            audioBuffer.writeToDestination(event.outputBuffer, () => {
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

    const loadRom = useCallback((romBuffer : Uint8Array) => {
        const rom = parseROM(romBuffer);
        emulator.initMachine(rom, false, sample => audioBuffer.receiveSample(sample));
        console.log('ROm loaded');
        triggerRefresh();
    }, [audioBuffer, emulator, triggerRefresh]);

    const handleFileRead = useCallback((event : ProgressEvent<FileReader>) => {
        if (event.target != null) {
            const buf = new Uint8Array(event.target.result as ArrayBuffer);
            localStorage.setItem(LOCAL_STORAGE_KEY_LAST_ROM, JSON.stringify(Array.from(buf)));
            loadRom(buf);
        }
    }, [loadRom]);

    useEffect(() => {
        const lastRomArray = localStorage.getItem(LOCAL_STORAGE_KEY_LAST_ROM);
        const lastTitle = localStorage.getItem(LOCAL_STORAGE_KEY_LAST_TITLE);
        if (lastRomArray != null){
            setTitle(lastTitle ?? '');
            const parsed = new Uint8Array(JSON.parse(lastRomArray));
            loadRom(parsed);
        }
    }, [loadRom]);

    const romFileChanged = useCallback((e : React.ChangeEvent<HTMLInputElement>) => {
        const file = (e.target as HTMLInputElement).files?.[0];

        if (file != null) {
            setTitle(file.name);
            localStorage.setItem(LOCAL_STORAGE_KEY_LAST_TITLE, file.name);
            const fileReader = new FileReader();
            fileReader.onloadend = handleFileRead;
            fileReader.readAsArrayBuffer(file);
            localStorage.removeItem(BREAKPOINTS_KEY);
        }
    }, [handleFileRead]);

    const animationFrameRef = useRef<number | null>(null);

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

            if (emulator.stepFrame(runMode === RunModeType.RUNNING_SINGLE_SCANLINE) || runMode === RunModeType.RUNNING_SINGLE_FRAME) {
                // Hit breakpoint
                setRunMode(RunModeType.STOPPED);
                setIsSteppingScanline(false);
                stopped = true;
                break;
            }
        }

        if (display != null && emulator) {
            display.framebuffer.set(emulator.ppu.framebuffer, 0);
            display.context.putImageData(display.imageData, 0, 0);
        }

        if (!stopped) {
            animationFrameRef.current = window.requestAnimationFrame(updateFrame);
        }
    }, [runMode, emulator, display]);

    useEffect(() => {
        if (runMode !== RunModeType.STOPPED) {
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

    useEffect(() => {
        if (canvasRef.current != null) {
            const context = canvasRef.current.getContext("2d");
            if (context != null) {
                const imageData = context.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
                const framebuffer = new Uint32Array(imageData.data.buffer);
                setDisplay({ imageData, framebuffer, context });
            }
        }
    }, [canvasRef]);

    useEffect(() => {
        triggerRefresh();
    }, [runMode, triggerRefresh]);

    const _setRunMode = useCallback((_runMode: RunModeType) => {
        setRunMode(_runMode);
        if (_runMode === RunModeType.RUNNING) {
            initAudioContext();
        } else {
            stopAudioContext();
        }
    }, []);

    return (
      <div>
          <Toolbar toggleOpenDialog={toggleOpenDialog}/>

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
              <input type="file" onChange={romFileChanged} />

              <div className={styles.drawingArea}>
                  <div className={styles.canvasContainer}>
                      <div className={styles.displayContainer}>
                          <canvas width={SCREEN_WIDTH} height={SCREEN_HEIGHT} ref={canvasRef}/>
                      </div>
                  </div>
              </div>

          </div>
      </div>
    );
}

export default App;
