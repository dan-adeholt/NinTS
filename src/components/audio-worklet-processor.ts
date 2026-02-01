export {};

type AudioWorkletProcessorOptions = {
  processorOptions?: {
    shared?: {
      left: SharedArrayBuffer;
      right: SharedArrayBuffer;
      indices: SharedArrayBuffer;
      size: number;
      target?: number;
      maxSlack?: number;
    };
  };
};

declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor(options?: AudioWorkletProcessorOptions);
  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean;
}

declare const registerProcessor: (name: string, processorCtor: typeof AudioWorkletProcessor) => void;

type AudioBlock = {
  left: Float32Array;
  right: Float32Array;
  index: number;
};

class NesAudioProcessor extends AudioWorkletProcessor {
  private queue: AudioBlock[] = [];
  private lastSampleLeft = 0;
  private lastSampleRight = 0;
  private needsMore = false;
  private sharedLeft: Float32Array | null = null;
  private sharedRight: Float32Array | null = null;
  private sharedIndices: Int32Array | null = null;
  private sharedSize = 0;
  private sharedMask = -1;
  private targetBufferedSamples = 0;
  private maxBufferedSlack = 0;

  constructor(options?: AudioWorkletProcessorOptions) {
    super();
    const shared = options?.processorOptions?.shared;

    if (shared?.left && shared?.right && shared?.indices && shared?.size) {
      this.sharedLeft = new Float32Array(shared.left);
      this.sharedRight = new Float32Array(shared.right);
      this.sharedIndices = new Int32Array(shared.indices);
      this.sharedSize = shared.size;
      this.targetBufferedSamples = shared.target ?? 0;
      this.maxBufferedSlack = shared.maxSlack ?? 0;
      if ((this.sharedSize & (this.sharedSize - 1)) === 0) {
        this.sharedMask = this.sharedSize - 1;
      }
    } else {
      this.port.onmessage = (event: MessageEvent) => {
        if (event.data?.type !== 'block') {
          return;
        }

        const left = new Float32Array(event.data.left);
        const right = new Float32Array(event.data.right);
        this.queue.push({ left, right, index: 0 });
        this.needsMore = false;
      };
    }
  }

  private requestMore() {
    if (this.needsMore) {
      return;
    }
    this.needsMore = true;
    this.port.postMessage({ type: 'need' });
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]) {
    const output = outputs[0];
    const left = output[0];
    const right = output[1];

    if (this.sharedLeft && this.sharedRight && this.sharedIndices && this.sharedSize > 0) {
      let readIndex = Atomics.load(this.sharedIndices, 1);
      const writeIndex = Atomics.load(this.sharedIndices, 0);
      const queued = writeIndex - readIndex;

      if (this.targetBufferedSamples > 0 && queued > (this.targetBufferedSamples + this.maxBufferedSlack)) {
        readIndex = writeIndex - this.targetBufferedSamples;
      }

      for (let i = 0; i < left.length; i++) {
        if (readIndex === writeIndex) {
          left[i] = this.lastSampleLeft;
          right[i] = this.lastSampleRight;
          continue;
        }

        const bufferIndex = this.sharedMask >= 0
          ? (readIndex & this.sharedMask)
          : (readIndex % this.sharedSize);

        left[i] = this.sharedLeft[bufferIndex];
        right[i] = this.sharedRight[bufferIndex];
        this.lastSampleLeft = left[i];
        this.lastSampleRight = right[i];
        readIndex++;
      }

      Atomics.store(this.sharedIndices, 1, readIndex);
      return true;
    }

    for (let i = 0; i < left.length; i++) {
      const block = this.queue[0];

      if (!block) {
        left[i] = this.lastSampleLeft;
        right[i] = this.lastSampleRight;
        this.requestMore();
        continue;
      }

      left[i] = block.left[block.index];
      right[i] = block.right[block.index];
      this.lastSampleLeft = left[i];
      this.lastSampleRight = right[i];
      block.index++;

      if (block.index >= block.left.length) {
        this.queue.shift();
        if (this.queue.length < 2) {
          this.requestMore();
        }
      }
    }

    return true;
  }
}

registerProcessor('nes-audio-worklet', NesAudioProcessor);
