import React, { useCallback, useRef } from 'react';
import EmulatorState from '../emulator/EmulatorState';
import { FRAMES_PER_SECOND } from '../emulator/apu';
import { drawStringBuffer, copyTextToBuffer, copyNumberToBuffer } from '../components/CanvasTextDrawer';
import FIFOBuffer from '../components/FIFOBuffer';
import { InputConfigLookup } from '../components/Integration/InputTypes';
import pollGamepads from '../components/Integration/pollGamepads';

export type Display = {
  element: (HTMLCanvasElement | null)
  context: CanvasRenderingContext2D
  imageData: ImageData
  framebuffer: Uint32Array
}

type AnimationState = {
  animationFrameIndex: number
  emulatorTime: number
  lastTime: number
}

type GameLoopOptions = {
  emulator: EmulatorState
  display: React.MutableRefObject<Display | null>
  inputConfigLookup: InputConfigLookup
  showDebugInfo: boolean
  // Called once for every emulated frame
  onEmulatorFrame: () => void
  // Called when the emulator hits a breakpoint
  onStopped: () => void
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

const textBuffer = new Uint8Array(64)
const stepTimingBuffer = new FIFOBuffer(30);
const frameTimingBuffer = new FIFOBuffer(5, Math.max);

export const renderScreen = (display: Display, emulator: EmulatorState, showDebugInfo = false) => {
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

// Runs the emulator for as many frames as have elapsed since the last call and renders
// the result. Returns true if the emulator stopped, i.e. hit a breakpoint.
const updateFrame = (timestamp: number, display: Display, animationState: AnimationState, options: GameLoopOptions) => {
  const { emulator, inputConfigLookup, showDebugInfo, onEmulatorFrame } = options;
  let stopped = false;

  pollGamepads(emulator, inputConfigLookup.gamepadLookup);

  const timeDelta = timestamp - animationState.lastTime;

  const tick = (): boolean => {
    animationState.emulatorTime += ntscFrameLength;
    onEmulatorFrame();

    const stepT0 = performance.now();
    const hitBreakpoint = emulator.stepFrame(false);
    stepTimingBuffer.push(performance.now() - stepT0);
    return hitBreakpoint;
  }

  let numFrames = -1;

  for (const fpsLockConfig of FPS_LOCK_TABLE) {
    const diffLast = Math.abs(timeDelta - fpsLockConfig.delta);
    if (diffLast < FPS_LOCK_EPSILON) {
      numFrames = fpsLockConfig.framesPerIndex(animationState.animationFrameIndex);
      for (let i = 0; i < numFrames && !stopped; i++) {
        stopped = tick();
      }

      break;
    }
  }

  // Found no lock config, use standard delta time based frame updates
  if (numFrames === -1) {
    while ((timestamp - animationState.emulatorTime) >= ntscFrameLength && !stopped) {
      stopped = tick();
    }
  }

  renderScreen(display, emulator, showDebugInfo);
  frameTimingBuffer.push(numFrames);

  animationState.animationFrameIndex = (animationState.animationFrameIndex + 1) % 8;
  animationState.lastTime = timestamp;

  return stopped;
}

const createAnimationState = (): AnimationState => ({
  animationFrameIndex: 0,
  emulatorTime: performance.now(),
  lastTime: performance.now()
});

/**
 * Drives the emulator from requestAnimationFrame. The options are read on every
 * frame, so callers can pass new values on each render without restarting the loop.
 */
const useGameLoop = (options: GameLoopOptions) => {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const animationFrameRef = useRef<number | null>(null);
  const animationStateRef = useRef<AnimationState>(createAnimationState());

  const stop = useCallback(() => {
    if (animationFrameRef.current != null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const runFrame = useCallback((timestamp: number) => {
    const display = optionsRef.current.display.current;
    animationFrameRef.current = null;

    if (display == null) {
      return;
    }

    if (updateFrame(timestamp, display, animationStateRef.current, optionsRef.current)) {
      optionsRef.current.onStopped();
    } else {
      animationFrameRef.current = window.requestAnimationFrame(runFrame);
    }
  }, []);

  const start = useCallback(() => {
    stop();
    animationStateRef.current = createAnimationState();
    runFrame(performance.now());
  }, [stop, runFrame]);

  return { start, stop };
}

export default useGameLoop;
