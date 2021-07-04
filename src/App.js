import React, { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import { parseROM } from './emulator/parseROM';
import { hex, hex16 } from './emulator/stateLogging';
import { initMachine, stepFrame } from './emulator/emulator';
import { SCREEN_HEIGHT, SCREEN_WIDTH, setIsSteppingScanline } from './emulator/ppu';
import DebuggerSidebar, { BREAKPOINTS_KEY } from './components/DebuggerSidebar';
import _ from 'lodash';
import PPUDebugger from './components/PPUDebugger';

const LOCAL_STORAGE_KEY_LAST_ROM = 'last-rom';
const LOCAL_STORAGE_KEY_LAST_TITLE = 'last-title';

export const RunModeType = Object.freeze({
  STOPPED: 'Stopped',
  RUNNING: 'Running',
  RUNNING_SINGLE_FRAME: 'RunningSingleFrame',
  RUNNING_SINGLE_SCANLINE: 'RunningSingleScanline'
});

const frameLength = 1000.0 / 60.0;

function App() {
  const [runMode, setRunMode] = useState(RunModeType.STOPPED);
  const [title, setTitle] = useState("No file selected");
  const startTime = useRef(performance.now());
  const [emulator, setEmulator] = useState(null);

  const canvasRef = useRef();
  const [display, setDisplay] = useState({ imageData: null, framebuffer: null, context: null });

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
    <div className="App">
      <DebuggerSidebar emulator={emulator} runMode={runMode} setRunMode={setRunMode} onRefresh={triggerRefresh} refresh={refresh}/>
      <div className="content">
        <h1>{ title }</h1>
        <input type="file" onChange={romFileChanged} />
        { emulator && (
          <div className="stateTable">
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

        <div className="drawingArea">
          <div className="displayContainer">
            <canvas width={SCREEN_WIDTH} height={SCREEN_HEIGHT} ref={canvasRef}/>
          </div>
          <PPUDebugger emulator={emulator} refresh={refresh} triggerRefresh={triggerRefresh}/>
        </div>

      </div>
    </div>
  );
}

export default App;
