import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './App.module.css';
import { parseROM } from './emulator/parseROM';
import { hex, hex16 } from './emulator/stateLogging';
import {
  initMachine,
  INPUT_A,
  INPUT_B,
  INPUT_DOWN,
  INPUT_LEFT,
  INPUT_RIGHT, INPUT_SELECT, INPUT_START,
  INPUT_UP, setInputController,
  stepFrame
} from './emulator/emulator';
import { SCREEN_HEIGHT, SCREEN_WIDTH, setIsSteppingScanline } from './emulator/ppu';
import DebuggerSidebar, { BREAKPOINTS_KEY } from './components/DebuggerSidebar';
import _ from 'lodash';
import PPUDebugger from './components/PPUDebugger';
import EmulatorControls from './components/EmulatorControls';

const LOCAL_STORAGE_KEY_LAST_ROM = 'last-rom';
const LOCAL_STORAGE_KEY_LAST_TITLE = 'last-title';

export const RunModeType = Object.freeze({
  STOPPED: 'Stopped',
  RUNNING: 'Running',
  RUNNING_SINGLE_FRAME: 'RunningSingleFrame',
  RUNNING_SINGLE_SCANLINE: 'RunningSingleScanline'
});

const KeyTable = {
  'w': INPUT_UP,
  'a': INPUT_LEFT,
  's': INPUT_DOWN,
  'd': INPUT_RIGHT,
  ' ': INPUT_A,
  'm': INPUT_B,
  '.': INPUT_SELECT,
  '-': INPUT_START
};

const frameLength = 1000.0 / 60.0;

function App() {
  const [runMode, setRunMode] = useState(RunModeType.STOPPED);
  const [title, setTitle] = useState("No file selected");
  const startTime = useRef(performance.now());
  const [emulator, setEmulator] = useState(null);

  const canvasRef = useRef();
  const [display, setDisplay] = useState({ imageData: null, framebuffer: null, context: null });

  const handleGameInput = useCallback(e => {

  }, []);

  const [keyListeners, setKeyListeners] = useState([]);

  const addKeyListener = useCallback(listener => {
    setKeyListeners(oldListeners => {
      oldListeners.push(listener);
      return oldListeners;
    })
  }, []);

  const removeKeyListener = useCallback(listener => {
    setKeyListeners(oldListeners => _.without(oldListeners, listener));
  }, []);

  useEffect(() => {
    addKeyListener(handleGameInput);

    return () => {
      removeKeyListener(handleGameInput);
    }
  }, [handleGameInput, addKeyListener, removeKeyListener]);

  const handleKeyEvent = useCallback(e => {
    if (e.target.type === 'text') {
      return;
    }

    if (e.key in KeyTable) {
      setInputController(emulator, KeyTable[e.key], e.type === 'keydown');
      e.preventDefault();
    }

    for (let listener of keyListeners) {
      listener(e);
    }
  }, [keyListeners, emulator]);

  const handleGamepad = useCallback(e => {
    console.log(e);
  }, []);

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

  const loadRom = useCallback(romBuffer => {
    const rom = parseROM(romBuffer);
    const newEmulator = initMachine(rom);
    setEmulator(newEmulator);
  }, []);

  const handleFileRead = useCallback(event => {
    const buf = new Uint8Array(event.target.result);
    localStorage.setItem(LOCAL_STORAGE_KEY_LAST_ROM, JSON.stringify(Array.from(buf)));
    loadRom(buf);
  }, [loadRom]);

  useEffect(() => {
    const lastRomArray = localStorage.getItem(LOCAL_STORAGE_KEY_LAST_ROM);
    const lastTitle = localStorage.getItem(LOCAL_STORAGE_KEY_LAST_TITLE);
    if (lastRomArray != null){
      setTitle(lastTitle);
      const parsed = new Uint8Array(JSON.parse(lastRomArray));
      loadRom(parsed);
    }
  }, [loadRom]);

  const romFileChanged = useCallback(e => {
    setTitle(e.target.files[0].name);
    localStorage.setItem(LOCAL_STORAGE_KEY_LAST_TITLE, e.target.files[0].name);
    const fileReader = new FileReader();
    fileReader.onloadend = handleFileRead;
    fileReader.readAsArrayBuffer(e.target.files[0]);
    localStorage.setItem(BREAKPOINTS_KEY, null);
  }, [handleFileRead]);

  const animationFrameRef = useRef(null);

  const updateFrame = useCallback(timestamp => {
    let stopped = false;

    while ((timestamp - startTime.current) >= frameLength) {
      startTime.current += frameLength;

      const gamepads = navigator.getGamepads();

      if (gamepads[0] != null) {
        const gamepad = gamepads[0];
        const a0 = gamepad.axes[0];
        const a1 = gamepad.axes[1];
        const deg = Math.atan2(Math.abs(a0), Math.abs(a1)) / Math.PI;


        setInputController(emulator, INPUT_RIGHT, a0 > 0 && deg >= 0.125);
        setInputController(emulator, INPUT_LEFT, a0 < 0 && deg >= 0.125);
        setInputController(emulator, INPUT_UP, a1 < 0 && deg <= 0.325);
        setInputController(emulator, INPUT_DOWN, a1 > 0 && deg <= 0.325);
        setInputController(emulator, INPUT_START, gamepad.buttons[8].pressed);
        setInputController(emulator, INPUT_SELECT, gamepad.buttons[9].pressed);
        setInputController(emulator, INPUT_A, gamepad.buttons[1].pressed);
        setInputController(emulator, INPUT_B, gamepad.buttons[0].pressed);
      }

      if (stepFrame(emulator, runMode === RunModeType.RUNNING_SINGLE_SCANLINE) || runMode === RunModeType.RUNNING_SINGLE_FRAME) {
        // Hit breakpoint
        setRunMode(RunModeType.STOPPED);
        setIsSteppingScanline(false);
        stopped = true;
        break;
      }
    }

    if (display.framebuffer && emulator) {
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
      updateFrame();
    }

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [updateFrame, animationFrameRef, runMode]);

  const running = runMode !== RunModeType.STOPPED;

  const registerCell = (label, register, formatter = hex) => (
    <td>
      <label>{ label }</label>
      { running ? '-' : formatter(register) }
    </td>
  );

  useEffect(() => {
    const context = canvasRef.current.getContext("2d");
    const imageData = context.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
    const framebuffer = new Uint32Array(imageData.data.buffer);
    setDisplay({ imageData, framebuffer, context });
  }, [canvasRef]);

  const [refresh, setRefresh] = useState(false);
  const triggerRefresh = useCallback(() => setRefresh(s => !s), []);

  useEffect(() => {
    triggerRefresh();
  }, [runMode, triggerRefresh]);


  return (
    <div className={styles.app}>
      <DebuggerSidebar
        emulator={emulator}
        runMode={runMode}
        setRunMode={setRunMode}
        onRefresh={triggerRefresh}
        refresh={refresh}
        addKeyListener={addKeyListener}
        removeKeyListener={removeKeyListener}
      />
      <div className={styles.content}>
        <h1>{ title }</h1>
        <input type="file" onChange={romFileChanged} />
        { emulator && (
          <div>
            <table>
              <tbody>
              <tr>
                <td>
                  <label>Running</label>
                  { running ? '1' : '0' }
                </td>
                { registerCell('A', emulator.A) }
                { registerCell('X', emulator.X) }
                { registerCell('Y', emulator.Y) }
                { registerCell('P', emulator.P) }
                { registerCell('SP', emulator.SP) }
                { registerCell('PC', emulator.PC) }
                { registerCell('V', emulator.ppu.V, hex16) }
                { registerCell('T', emulator.ppu.T, hex16) }
                { registerCell('CYC', emulator.ppu.scanlineCycle, _.identity) }
                { registerCell('CPU CYC', emulator.CYC, _.identity) }
              </tr>
              </tbody>
            </table>
          </div>
        ) }

        <div className={styles.drawingArea}>
          <div className={styles.displayContainer}>
            <canvas width={SCREEN_WIDTH} height={SCREEN_HEIGHT} ref={canvasRef}/>
          </div>
          <div className={styles.controlsArea}>
            <EmulatorControls emulator={emulator}/>
            <PPUDebugger emulator={emulator} refresh={refresh} triggerRefresh={triggerRefresh}/>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
