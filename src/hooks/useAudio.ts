import { useCallback, useRef } from 'react';
import EmulatorState from '../emulator/EmulatorState';
import { PRE_RENDER_SCANLINE } from '../emulator/ppu';
import { AUDIO_BUFFER_SIZE, SAMPLE_RATE } from '../emulator/apu';
import AudioBuffer from '../components/AudioBuffer';
// Bundled as a separate chunk so that the worklet is transpiled in production builds
import audioWorkletUrl from '../components/audio-worklet-processor.ts?worker&url';

type AudioState = {
  audioContext: AudioContext
  audioNode: AudioNode
}

type SampleSink = (sampleLeft: number, sampleRight: number) => void

const audioBuffer = new AudioBuffer();
const RING_BUFFER_SAMPLES = 1 << 16;
const RING_BUFFER_MASK = RING_BUFFER_SAMPLES - 1;
const AUDIO_TARGET_BUFFER_SAMPLES = 1024;
const AUDIO_MAX_BUFFER_SLACK = 1024;
const noop = () => undefined;
const writeToAudioBuffer: SampleSink = (sampleLeft, sampleRight) => audioBuffer.receiveSample(sampleLeft, sampleRight);

// Writes samples into a ring buffer shared with the audio worklet. Requires cross origin isolation.
const createSharedBufferSink = (sharedBuffers: { left: SharedArrayBuffer, right: SharedArrayBuffer, indices: SharedArrayBuffer }): SampleSink => {
  const sharedLeft = new Float32Array(sharedBuffers.left);
  const sharedRight = new Float32Array(sharedBuffers.right);
  const sharedIndices = new Int32Array(sharedBuffers.indices);
  Atomics.store(sharedIndices, 1, Atomics.load(sharedIndices, 0));

  return (sampleLeft, sampleRight) => {
    const writeIndex = Atomics.load(sharedIndices, 0);
    const readIndex = Atomics.load(sharedIndices, 1);

    if ((writeIndex - readIndex) >= RING_BUFFER_SAMPLES) {
      return;
    }

    const bufferIndex = writeIndex & RING_BUFFER_MASK;
    sharedLeft[bufferIndex] = sampleLeft;
    sharedRight[bufferIndex] = sampleRight;
    Atomics.store(sharedIndices, 0, writeIndex + 1);
  };
}

/**
 * Sets up audio output for the emulator. Prefers an audio worklet fed through a shared
 * ring buffer, falls back to posting sample blocks to the worklet, and finally to a
 * ScriptProcessorNode for browsers without worklet support.
 */
const useAudio = (emulator: EmulatorState) => {
  const audioRef = useRef<AudioState | null>(null);
  const sampleSinkRef = useRef<SampleSink>(writeToAudioBuffer);

  // Stable callback handed to the emulator, forwards to whichever sink is currently active
  const onAudioSample = useCallback((sampleLeft: number, sampleRight: number) => {
    sampleSinkRef.current(sampleLeft, sampleRight);
  }, []);

  // We are missing a few samples. The emulator stops right after vblank is hit,
  // we can try to do a few more cycles before the pre-render scanline so that the
  // audio buffer can be filled
  const requestMoreSamples = useCallback(() => {
    while (audioRef.current && emulator.ppu.scanline !== PRE_RENDER_SCANLINE && !audioBuffer.playBufferFull) {
      emulator.step();
    }
  }, [emulator]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.audioNode.disconnect(audioRef.current.audioContext.destination);
      audioRef.current.audioContext.close();
      audioRef.current = null;
    }
    sampleSinkRef.current = noop;
  }, []);

  const startAudio = useCallback(async () => {
    stopAudio();
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextCtor({
      sampleRate: SAMPLE_RATE
    });

    let workletReady = false;
    try {
      if (audioContext.audioWorklet) {
        await audioContext.audioWorklet.addModule(audioWorkletUrl);
        workletReady = true;
      }
    } catch (err) {
      console.error('Failed to load audio worklet module', err);
    }

    let audioNode: AudioNode;

    if (!workletReady) {
      const scriptProcessor = audioContext.createScriptProcessor(AUDIO_BUFFER_SIZE, 0, 2);
      scriptProcessor.onaudioprocess = event => {
        audioBuffer.writeToDestination(event.outputBuffer, requestMoreSamples);
      };
      sampleSinkRef.current = writeToAudioBuffer;
      audioRef.current = { audioNode: scriptProcessor, audioContext };
      audioNode = scriptProcessor;
    } else {
      const canUseSharedArrayBuffer = window.crossOriginIsolated === true && typeof SharedArrayBuffer !== 'undefined';
      const sharedBuffers = canUseSharedArrayBuffer
        ? {
            left: new SharedArrayBuffer(RING_BUFFER_SAMPLES * Float32Array.BYTES_PER_ELEMENT),
            right: new SharedArrayBuffer(RING_BUFFER_SAMPLES * Float32Array.BYTES_PER_ELEMENT),
            indices: new SharedArrayBuffer(2 * Int32Array.BYTES_PER_ELEMENT)
          }
        : null;
      const workletNode = new AudioWorkletNode(audioContext, 'nes-audio-worklet', {
        numberOfOutputs: 1,
        outputChannelCount: [2],
        ...(sharedBuffers ? {
          processorOptions: {
            shared: {
              ...sharedBuffers,
              size: RING_BUFFER_SAMPLES,
              target: AUDIO_TARGET_BUFFER_SAMPLES,
              maxSlack: AUDIO_MAX_BUFFER_SLACK
            }
          }
        } : {})
      });
      // Must be set before priming the worklet below, requestMoreSamples only runs while audio is active
      audioRef.current = { audioNode: workletNode, audioContext };

      if (sharedBuffers) {
        sampleSinkRef.current = createSharedBufferSink(sharedBuffers);
      } else {
        sampleSinkRef.current = writeToAudioBuffer;

        const sendBlock = () => {
          const block = audioBuffer.consumeBlock(requestMoreSamples);
          workletNode.port.postMessage(
            { type: 'block', left: block.left.buffer, right: block.right.buffer },
            [block.left.buffer, block.right.buffer]
          );
        };

        workletNode.port.onmessage = event => {
          if (event.data?.type === 'need') {
            sendBlock();
          }
        };

        for (let i = 0; i < 4; i++) {
          sendBlock();
        }
      }

      audioNode = workletNode;
    }

    audioNode.connect(audioContext.destination);
    if (audioContext.state !== 'running') {
      await audioContext.resume();
    }
  }, [stopAudio, requestMoreSamples]);

  return { onAudioSample, startAudio, stopAudio };
}

export default useAudio;
