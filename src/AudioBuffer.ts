import { AUDIO_BUFFER_SIZE } from './emulator/apu';

class AudioBuffer {
  writePosition = 0;
  writeBuffer = new Float32Array(AUDIO_BUFFER_SIZE);
  playBuffer = new Float32Array(AUDIO_BUFFER_SIZE);
  playBufferFull = false;
  lastSample = 0;
  numBuffers = 0;
  startTime = 0;
  expected = 0
  produced = 0

  receiveSample(sample: number) {
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

    this.writeBuffer[this.writePosition++] = sample;
    this.lastSample = sample;

    if (this.writePosition === AUDIO_BUFFER_SIZE && !this.playBufferFull) {
      this.swapAudioBuffers();
    }
  }

  swapAudioBuffers() {
    [this.writeBuffer, this.playBuffer] = [this.playBuffer, this.writeBuffer];
    this.playBufferFull = true;
    this.writePosition = 0;
  }

  writeToDestination(destination: globalThis.AudioBuffer, requestMoreSamplesCallback: (numSamples: number) => void) {
    this.expected += AUDIO_BUFFER_SIZE

    if (!this.playBufferFull) {
      requestMoreSamplesCallback(AUDIO_BUFFER_SIZE - this.writePosition)
    }

    if (!this.playBufferFull) { // Got buffer underflow, force buffer swap with constant value for remaining slots
      this.writeBuffer.fill(this.lastSample, this.writePosition);
      this.swapAudioBuffers();
    }

    if (destination.copyToChannel) { // Newer method, not available in all browsers
      destination.copyToChannel(this.playBuffer, 0);
      destination.copyToChannel(this.playBuffer, 1);
    } else {
      destination.getChannelData(0).set(this.playBuffer);
      destination.getChannelData(1).set(this.playBuffer);
    }

    this.playBufferFull = false;
  }
}

export default AudioBuffer;
