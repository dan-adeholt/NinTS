import React, { useLayoutEffect, useRef, useState } from 'react';
import EmulatorState from '../emulator/EmulatorState';
import { RunModeType } from '../App';

type APUDebuggerProps = {
  emulator: EmulatorState
  runMode: RunModeType
}

const CANVAS_HEIGHT = 380;

const APUDebugger = ({ emulator, runMode } : APUDebuggerProps) => {
  const [loggingEnabled, setLoggingEnabled] = useState(false);

  const apuCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWidth = emulator.apu.audioSamples.length;

  useLayoutEffect(() => {
    const context = apuCanvasRef.current?.getContext("2d");

    if (context != null) {
      context.clearRect(0, 0, canvasWidth, 380);
      context.fillStyle = "white";
      context.fillRect(0, 0, canvasWidth, 380);
      context.strokeStyle = "gray";
      context.setLineDash([4, 2]);
      context.beginPath();
      context.moveTo(0, CANVAS_HEIGHT / 2);
      context.lineTo(canvasWidth, CANVAS_HEIGHT / 2);
      context.stroke();

      context.strokeStyle = "black";

      context.beginPath();
      let x = 0;

      for (const sample of emulator.apu.audioSamples) {
        const normalized = 1.0 - ((sample + 1) / 2.0);
        context.lineTo(x++, CANVAS_HEIGHT * normalized);
      }

      context.stroke();
    }
    console.log(emulator.apu.audioSamples);
  }, [runMode, canvasWidth]);

  return (
    <>
      <div>
        <input id="enableLogging" type="checkbox" checked={loggingEnabled} onChange={e => {
          setLoggingEnabled(e.target.checked);
          emulator.apu.logAudio = e.target.checked;
          console.log(e.target.checked);
        }}/>
        <label htmlFor="enableLogging">Enable logging</label>
      </div>
      <div>
        <div style={{ width: 400, height: 400, overflowX: 'scroll' }}>
          <canvas width={canvasWidth} height={CANVAS_HEIGHT} ref={apuCanvasRef}/>
        </div>
        <button onClick={() => {
          emulator.apu.audioSamples = [];
        }}>Clear samples</button>
        { runMode }
      </div>
    </>
  );
};

export default React.memo(APUDebugger);
