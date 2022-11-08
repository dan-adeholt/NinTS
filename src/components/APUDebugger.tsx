import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Dialog, { DialogHorizontalPosition, DialogVerticalPosition } from '../Dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRecordVinyl } from '@fortawesome/free-solid-svg-icons'
import { RunModeType } from '../App';
import { DragOffset, useDrag } from '../hooks/useDrag';
import { DebugDialogProps } from '../DebugDialog';

const CANVAS_WIDTH = 780;
const CANVAS_HEIGHT = 380;

const APUDebugger = ({ emulator, runMode, isOpen, onClose, setRunMode } : DebugDialogProps) => {
  const [loggingEnabled, setLoggingEnabled] = useState(false);
  const [offset, setOffset] = useState<DragOffset>({
    x: 0, y: 0
  });
  const [zoom, setZoom] = useState(1);

  const minMax = useMemo(() => {
    const viewspaceWidth = Math.max(CANVAS_WIDTH, emulator.apu.audioSamples.length) * zoom;
    const scrollerWidth = Math.max(40, (CANVAS_WIDTH / (viewspaceWidth)) * CANVAS_WIDTH) ;

    return { minX: 0, maxX: CANVAS_WIDTH - scrollerWidth }
  }, [runMode, zoom]);

  const { onMouseDown } = useDrag(offset, setOffset, minMax, runMode !== RunModeType.RUNNING);

  const apuCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (runMode === RunModeType.STOPPED) {
      setLoggingEnabled(false)
      emulator.apu.logAudio = false;
    }
  }, [runMode]);

  useLayoutEffect(() => {
    const context = apuCanvasRef.current?.getContext("2d");

    const viewspaceWidth = Math.max(CANVAS_WIDTH, emulator.apu.audioSamples.length) * zoom;

    if (context != null) {
      context.clearRect(0, 0, viewspaceWidth, 380);
      context.fillStyle = "white";
      context.fillRect(0, 0, viewspaceWidth, CANVAS_HEIGHT);
      context.strokeStyle = "gray";
      context.setLineDash([4, 2]);

      if (runMode !== RunModeType.RUNNING) {
        const scrollerWidth = Math.max(40, (CANVAS_WIDTH / (viewspaceWidth)) * CANVAS_WIDTH);
        const relativeScroll = minMax.maxX === 0 ? 0 : offset.x / minMax.maxX;
        const maxScaledScroll = viewspaceWidth - CANVAS_WIDTH;
        const scaledScroll = (-relativeScroll * maxScaledScroll) / zoom;

        const scrollerHeight = 20;
        context.fillStyle = "black";
        context.fillRect(offset.x, CANVAS_HEIGHT - scrollerHeight, scrollerWidth, scrollerHeight);


        context.scale(zoom, 1);
        context.translate(scaledScroll, 0);
        context.beginPath();
        context.moveTo(0, CANVAS_HEIGHT / 2);
        context.lineTo(viewspaceWidth, CANVAS_HEIGHT / 2);
        context.stroke();

        context.setLineDash([]);
        context.strokeStyle = "black";

        context.beginPath();

        const startIndex = Math.floor(-scaledScroll);
        const endIndex = Math.min(emulator.apu.audioSamples.length, (startIndex + CANVAS_WIDTH) / zoom);

        for (let sampleIndex = startIndex; sampleIndex < endIndex; sampleIndex++) {
          const sample = emulator.apu.audioSamples[sampleIndex];
          const normalized = 1.0 - ((sample + 1) / 2.0);
          context.lineTo(sampleIndex, CANVAS_HEIGHT * normalized);
        }

        context.stroke();
      } else {
        context.setLineDash([]);
        context.fillStyle = "black";
        context.font = "24px Arial";
        if (loggingEnabled) {
          const size = context.measureText("Recording...");
          context.fillText('Recording...', CANVAS_WIDTH / 2.0 - size.width / 2.0, CANVAS_HEIGHT / 2);
        }
      }

      context.resetTransform();
    }
  }, [runMode, offset, minMax, zoom, loggingEnabled]);

  const onMouseWheel = useCallback((e: React.WheelEvent) => {
    if (e.shiftKey) {
      if (e.deltaX > 0) {
        setZoom(oldZoom => oldZoom * 1.1);
      } else {
        setZoom(oldZoom => Math.max(0.001, oldZoom * 0.9));
      }
    }
  }, []);

  return (
    <Dialog
      isOpen={isOpen}
      title={"APU Debugger"}
      onClose={onClose}
      horizontalPosition={DialogHorizontalPosition.RIGHT}
      verticalPosition={DialogVerticalPosition.BOTTOM}
    >
      <div>
        <h4>Sample inspector</h4>
        <div style={{ width: CANVAS_WIDTH, height: 400, overflowX: 'scroll' }}>
          <canvas
            onWheel={onMouseWheel}
            onMouseDown={onMouseDown}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            ref={apuCanvasRef}
          />
        </div>
        <button onClick={() => {
          if (loggingEnabled) {
            setRunMode(RunModeType.STOPPED);
            setLoggingEnabled(false)
            emulator.apu.logAudio = false;
          } else {
            setOffset({ x: 0, y: 0 });
            setRunMode(RunModeType.RUNNING);
            emulator.apu.audioSamples = [];
            setLoggingEnabled(true)
            emulator.apu.logAudio = true;
          }
        }}>
          <FontAwesomeIcon icon={faRecordVinyl}/><span>{ loggingEnabled ? 'Stop' : 'Start' } recording</span></button>
      </div>
    </Dialog>
  );
};

export default React.memo(APUDebugger);
