import { AUDIO_BUFFER_SIZE } from '../emulator/apu';

class AudioBuffer {
  writePosition = 0;
  writeBufferLeft = new Float32Array(AUDIO_BUFFER_SIZE);
  writeBufferRight = new Float32Array(AUDIO_BUFFER_SIZE);
  playBufferLeft = new Float32Array(AUDIO_BUFFER_SIZE);
  playBufferRight = new Float32Array(AUDIO_BUFFER_SIZE);
  playBufferFull = false;
  lastSampleLeft = 0;
  lastSampleRight = 0;
  numBuffers = 0;
  startTime = 0;
  expected = 0
  produced = 0

  receiveSample(sampleLeft: number, sampleRight: number) {
    this.produced++

    if (this.numBuffers === 0) {
      this.startTime = performance.now();
    }

    this.numBuffers++;
    const now = performance.now();
    const diff = now  - this.startTime;

    if (diff > 1000) {
      this.startTime = now;
      this.numBuffers = 0;
    }

    if (this.writePosition === AUDIO_BUFFER_SIZE) {
      if (!this.playBufferFull) {
        this.swapAudioBuffers();
      } else {

        return;
      }
    }

    this.writeBufferLeft[this.writePosition] = sampleLeft;
    this.writeBufferRight[this.writePosition] = sampleRight;
    this.writePosition++;
    this.lastSampleLeft = sampleLeft;
    this.lastSampleRight = sampleRight;

    if (this.writePosition === AUDIO_BUFFER_SIZE && !this.playBufferFull) {
      this.swapAudioBuffers();
    }
  }

  swapAudioBuffers() {
    [this.writeBufferLeft, this.playBufferLeft] = [this.playBufferLeft, this.writeBufferLeft];
    [this.writeBufferRight, this.playBufferRight] = [this.playBufferRight, this.writeBufferRight];
    this.playBufferFull = true;
    this.writePosition = 0;
  }

  writeToDestination(destination: globalThis.AudioBuffer, requestMoreSamplesCallback: (numSamples: number) => void) {
    this.expected += AUDIO_BUFFER_SIZE

    if (!this.playBufferFull) {
      requestMoreSamplesCallback(AUDIO_BUFFER_SIZE - this.writePosition)
    }

    if (!this.playBufferFull) { // Got buffer underflow, force buffer swap with constant value for remaining slots
      this.writeBufferLeft.fill(this.lastSampleLeft, this.writePosition);
      this.writeBufferRight.fill(this.lastSampleRight, this.writePosition);
      this.swapAudioBuffers();
    }

    if (destination.copyToChannel) { // Newer method, not available in all browsers
      destination.copyToChannel(this.playBufferLeft, 0);
      destination.copyToChannel(this.playBufferRight, 1);
    } else {
      destination.getChannelData(0).set(this.playBufferLeft);
      destination.getChannelData(1).set(this.playBufferRight);
    }

    this.playBufferFull = false;
  }
}

export default AudioBuffer;
