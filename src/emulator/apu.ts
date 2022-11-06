import SquareWaveGenerator from './apu/SquareWaveGenerator';
import TriangleWaveGenerator from './apu/TriangleWaveGenerator';
import DMCGenerator from './apu/DMCGenerator';
import NoiseGenerator from './apu/NoiseGenerator';

const NTSC_CYCLES_PER_FRAME = 29780.5;
const FRAMES_PER_SECOND = 60.0;

export const NTSC_CPU_CYCLES_PER_SECOND = NTSC_CYCLES_PER_FRAME * FRAMES_PER_SECOND;
export const SAMPLE_RATE = 48000;
export const AUDIO_BUFFER_SIZE = 2048;

const CPU_CYCLES_PER_SAMPLE = (NTSC_CPU_CYCLES_PER_SECOND / SAMPLE_RATE);

const APUCycleStepNTSC = 3728.5 * 2 * 12;

class APU {
  square1 = new SquareWaveGenerator(0);
  square2 = new SquareWaveGenerator(1);
  triangle = new TriangleWaveGenerator();
  noise = new NoiseGenerator();
  dmc = new DMCGenerator();
  masterClock = 0;
  cpuDivider = 12;
  elapsedApuCycles = 0;
  apuStep = 0;
  evenTick = false;
  frameBucket = 0;
  numTicks = 0;
  accumulatedCycles = 0;
  apuSampleBucket = 0;

  lastSample = 0;
  lastRawSample = 0;
  accumulatedSamplesSquare1 = 0;
  accumulatedSamplesSquare2 = 0;
  accumulatedSamplesTriangle = 0;
  accumulatedSamplesNoise = 0;
  accumulatedSamplesDmc = 0;
  logAudio = false;
  audioSamples: number[] = [];
  debugIndex = 0;

  audioSampleCallback : ((sample: number) => void) | null = null

  constructor(audioSampleCallback : ((sample: number) => void) | null) {
    this.audioSampleCallback = audioSampleCallback
  }

  setAPURegisterMem(address: number, value: number) {
    // const time = this.masterClock / 21477272;
    // console.log(time.toFixed(2), hex(address, '$'), '=>', bin8(value));

    if (address >= 0x4000 && address <= 0x4003) {
      this.square1.setRegisterMem(address, value);
    } else if (address >= 0x4004 && address <= 0x4007) {
      this.square2.setRegisterMem(address, value);
    } else if (address === 0x4008 || address === 0x400A || address === 0x400B) {
      this.triangle.setRegisterMem(address, value);
    } else if (address >= 0x4010 && address <= 0x4013) {
      this.dmc.setRegisterMem(address, value);
    } else if (address >= 0x400C && address <= 0x400F) {
      this.noise.setRegisterMem(address, value);
    } else if (address === 0x4015) {
      this.square1.setEnabled( (value & 0b00001) !== 0);
      this.square2.setEnabled( (value & 0b00010) !== 0);
      this.triangle.setEnabled((value & 0b00100) !== 0);
      this.noise.setEnabled(   (value & 0b01000) !== 0);
      this.dmc.setEnabled(     (value & 0b10000) !== 0);
    } else if (address === 0x4017) {
      // const mode = (value & 0b10000000) >> 7;
      // const irq = (value & 0b01000000) >> 6;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  readAPURegisterMem(address: number) {
    return 0;
  }

  accumulateSampleValue() {
    this.accumulatedCycles++;
    this.accumulatedSamplesSquare1 += this.square1.curOutputValue;
    this.accumulatedSamplesSquare2 += this.square2.curOutputValue;
    this.accumulatedSamplesTriangle += this.triangle.curOutputValue;
    this.accumulatedSamplesNoise += this.noise.curOutputValue;
    this.accumulatedSamplesDmc += this.dmc.counter;
  }

  readSampleValue() {
    let sq1 = this.square1.curOutputValue;
    let sq2 = this.square2.curOutputValue;
    let tri = this.triangle.curOutputValue;
    let noise = this.noise.curOutputValue;
    let dmc = this.dmc.counter;

    // sq1 = 0;
    // sq2 = 0;
    // tri = 0;
    // noise = 0;
    // dmc = 0;

    sq1 = this.accumulatedSamplesSquare1 / this.accumulatedCycles;
    sq2 = this.accumulatedSamplesSquare2 / this.accumulatedCycles;
    tri = this.accumulatedSamplesTriangle / this.accumulatedCycles;
    noise = this.accumulatedSamplesNoise / this.accumulatedCycles;
    dmc = this.accumulatedSamplesDmc / this.accumulatedCycles;

    // sq1 = 0;
    // sq2 = 0;
    // tri = 0;
    // noise = 0;
    // dmc = 0;

    //
      // dmc = 0;


    const pulseOut = (sq1 === 0 && sq2 === 0) ? 0 :  95.88 / ((8128 / (sq1 + sq2)) + 100);
    let tndOut = 0;
    if (tri !== 0 || noise !== 0 || dmc !== 0) {
      const t1 = tri / 8227;
      const n1 = noise / 12241;
      const d1 = (dmc / 22638);
      tndOut = (159.79) /
        ((1.0 / (t1 + n1 + d1)) + 100);
    }

    this.accumulatedCycles = 0;
    this.accumulatedSamplesSquare1 = 0;
    this.accumulatedSamplesSquare2 = 0;
    this.accumulatedSamplesTriangle = 0;
    this.accumulatedSamplesNoise = 0;
    this.accumulatedSamplesDmc = 0;

    // DC blocker: https://www.dsprelated.com/freebooks/filters/DC_Blocker.html
    const R = 0.9985;
    // const R = 0.995;
    const normalized = pulseOut + tndOut;

    const rawSample = (normalized - 0.5) * 2.0;
    const newSample = rawSample - this.lastRawSample + R * this.lastSample;

    this.lastRawSample = rawSample;
    this.lastSample = newSample;

    return newSample;
  }

  update(targetMasterClock: number) {
    while ((this.masterClock + this.cpuDivider) < targetMasterClock) {
      // Do one iteration for each cpu cycle, but update sequencers for square waves every 2 cycles
      this.evenTick = !this.evenTick;

      if (this.evenTick) {
        this.square1.updateSequencer();
        this.square2.updateSequencer();
        this.noise.updateSequencer();
      }

      this.frameBucket += this.cpuDivider;

      this.apuSampleBucket++;
      this.accumulateSampleValue();

      while (this.apuSampleBucket > CPU_CYCLES_PER_SAMPLE) {
        const sample = this.readSampleValue();
        this.audioSampleCallback?.(sample);
        this.apuSampleBucket -= CPU_CYCLES_PER_SAMPLE;
        if (this.logAudio) {
          this.audioSamples.push(sample);
        }
      }

      this.triangle.updateSequencer();
      this.masterClock+=this.cpuDivider;
      this.elapsedApuCycles += this.cpuDivider;

      if (this.elapsedApuCycles > APUCycleStepNTSC) {
        // TODO: This shouldnt be float
        this.elapsedApuCycles -= APUCycleStepNTSC;

        if (this.apuStep === 1 || this.apuStep === 3) {
          this.square1.updateLengthCounterAndSweepUnit();
          this.square2.updateLengthCounterAndSweepUnit();
          this.triangle.updateLengthCounter();
          this.noise.updateLengthCounter();
        }

        this.numTicks++;

        this.triangle.updateLinearCounter();
        this.square1.updateEnvelope();
        this.square2.updateEnvelope();
        this.noise.updateEnvelope();

        // TODO: This can also be 5 steps
        this.apuStep = (this.apuStep + 1) % 4;
      }
    }
  }
}

export default APU;
