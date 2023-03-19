import SquareWaveGenerator from './apu/SquareWaveGenerator';
import TriangleWaveGenerator from './apu/TriangleWaveGenerator';
import DMCGenerator from './apu/DMCGenerator';
import NoiseGenerator from './apu/NoiseGenerator';

const LOCK_INTEGER_FPS = true;
const NTSC_CYCLES_PER_FRAME = 29780.5;
export const FRAMES_PER_SECOND = LOCK_INTEGER_FPS ? 60 : (3579545.45 / 227.333 / 262);

export const NTSC_CPU_CYCLES_PER_SECOND = NTSC_CYCLES_PER_FRAME * FRAMES_PER_SECOND;
export const SAMPLE_RATE = 48000;
export const AUDIO_BUFFER_SIZE = 2048;

const CPU_CYCLES_PER_SAMPLE = (NTSC_CPU_CYCLES_PER_SECOND / SAMPLE_RATE);

const APU_CPU_DIVIDER = 12;
const FRAME_TYPE_QUARTER = 1;
const FRAME_TYPE_HALF = 2;
const FRAME_TYPE_IRQ = 3;
const FRAME_TYPE_IDLE = 4;
const FRAME_TYPE_HALF_AND_IRQ = 5;

// Mode 0: 4-Step Sequence (bit 7 of $4017 clear) - all steps in this sequence with cycle time and event type
const steps4 = [
  [7457, FRAME_TYPE_QUARTER],
  [14913, FRAME_TYPE_HALF],
  [22371, FRAME_TYPE_QUARTER],
  [29828, FRAME_TYPE_IRQ],
  [29829, FRAME_TYPE_HALF_AND_IRQ],
  [29830, FRAME_TYPE_IRQ]
];

// Mode 1: 5-Step Sequence (bit 7 of $4017 set) - all steps in this sequence with cycle time and event type
const steps5 = [
  [7457, FRAME_TYPE_QUARTER],
  [14913, FRAME_TYPE_HALF],
  [22371, FRAME_TYPE_QUARTER],
  [29829, FRAME_TYPE_IDLE],
  [37281, FRAME_TYPE_HALF],
  [37282, FRAME_TYPE_IDLE]
];
class APU {
  square1 = new SquareWaveGenerator(0);
  square2 = new SquareWaveGenerator(1);
  triangle = new TriangleWaveGenerator();
  noise = new NoiseGenerator();
  dmc = new DMCGenerator();
  cpuDivider = APU_CPU_DIVIDER;
  elapsedApuCycles = 0;
  apuStep = 0;
  accumulatedCycles = 0;
  apuSampleBucket = 0;

  frameCounterDelayCycles = -1;
  pendingFrameCounterMode = 0;
  frameCounterMode = 0;
  lastSampleLeft = 0;
  lastRawSampleLeft = -0.5;
  lastSampleRight = 0;
  lastRawSampleRight = -0.5;

  accumulatedSamplesSquare1 = 0;
  accumulatedSamplesSquare2 = 0;
  accumulatedSamplesTriangle = 0;
  accumulatedSamplesNoise = 0;
  accumulatedSamplesDmc = 0;
  frameInterrupt = false;
  frameInterruptCycle = false;
  triggerIRQ = true;
  disabled = false;
  lastValue4017 = 0;
  audioSampleCallback : ((sampleLeft: number, sampleRight: number) => void) | null = null

  constructor(audioSampleCallback : ((sampleLeft: number, sampleRight: number) => void) | null, triggerDMACallback: (() => void) | null = null) {
    this.audioSampleCallback = audioSampleCallback
    this.dmc.reader.triggerDMACallback = triggerDMACallback
  }

  setAPURegisterMem(address: number, value: number, cpuCycles: number) {
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
      this.dmc.setEnabled(     (value & 0b10000) !== 0, cpuCycles % 2 === 0);
    } else if (address === 0x4017) {
      this.lastValue4017 = value;  
      this.pendingFrameCounterMode = (value & 0b10000000) >> 7;

      if (cpuCycles % 2 === 0) {
        // If the write occurs during an APU cycle, the effects occur 3 CPU cycles after the $4017 write cycle
        this.frameCounterDelayCycles = 3;
      } else {
        // If the write occurs between APU cycles, the effects occur 4 CPU cycles after the write cycle.
        this.frameCounterDelayCycles = 4;
      }
      this.triggerIRQ = (value & 0b01000000) == 0;
      if (!this.triggerIRQ) {
        this.frameInterrupt = false;
      }
    }
  }

  readAPURegisterMem(address: number, peek: boolean): number {
    if (address === 0x4015) {
      const status =
        (this.square1.lengthCounter.lengthCounter > 0 ?  0b00000001 : 0) |
        (this.square2.lengthCounter.lengthCounter > 0 ?  0b00000010 : 0) |
        (this.triangle.lengthCounter.lengthCounter > 0 ? 0b00000100 : 0) |
        (this.noise.lengthCounter.lengthCounter > 0 ?    0b00001000 : 0) |
        (this.dmc.reader.remainingBytes > 0 ?            0b00010000 : 0) |
        (this.frameInterrupt ?                           0b01000000 : 0) |
        (this.dmc.irq.interrupt ?                        0b10000000 : 0);

      // If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared.
      if (!peek && !this.frameInterruptCycle) {
        this.frameInterrupt = false;
      }

      return status;
    }
    return 0;
  }

  accumulateSampleValue() {
    this.accumulatedCycles++;
    this.accumulatedSamplesSquare1 += this.square1.curOutputValue;
    this.accumulatedSamplesSquare2 += this.square2.curOutputValue;
    this.accumulatedSamplesTriangle += this.triangle.curOutputValue;
    this.accumulatedSamplesNoise += this.noise.curOutputValue;
    this.accumulatedSamplesDmc += this.dmc.output.counter;
  }

  readSampleValue() {
    const sq1 = this.accumulatedSamplesSquare1 / this.accumulatedCycles;
    const sq2 = this.accumulatedSamplesSquare2 / this.accumulatedCycles;
    const tri = this.accumulatedSamplesTriangle / this.accumulatedCycles;
    const noise = this.accumulatedSamplesNoise / this.accumulatedCycles;
    const dmc = this.accumulatedSamplesDmc / this.accumulatedCycles;
    const pulseOut = 95.52 / (8128.0 / (sq1 + sq2) + 100);
    const tndOut = 163.67 / (24329.0 / (3 * tri + 2 * noise + dmc) + 100);
    
    const monoOut = pulseOut + tndOut;
    this.accumulatedCycles = 0;
    this.accumulatedSamplesSquare1 = 0;
    this.accumulatedSamplesSquare2 = 0;
    this.accumulatedSamplesTriangle = 0;
    this.accumulatedSamplesNoise = 0;
    this.accumulatedSamplesDmc = 0;

    // DC blocker: https://www.dsprelated.com/freebooks/filters/DC_Blocker.html
    const R = 0.9985;
    // const R = 0.995;
    const normalizedLeft = monoOut;
    const rawSampleLeft = (normalizedLeft - 0.5) * 2.0;
    const newSampleLeft = rawSampleLeft - this.lastRawSampleLeft + R * this.lastSampleLeft;

    this.lastRawSampleLeft = rawSampleLeft;
    this.lastSampleLeft = newSampleLeft;

    const normalizedRight = monoOut;
    const rawSampleRight = (normalizedRight - 0.5) * 2.0;
    const newSampleRight = rawSampleRight - this.lastRawSampleRight + R * this.lastSampleRight;

    this.lastRawSampleRight = rawSampleRight;
    this.lastSampleRight = newSampleRight;
  }


  irqStep() {
    if (this.triggerIRQ && !this.frameInterrupt) {
      this.frameInterrupt = true;
      this.frameInterruptCycle = true;
    }
  }

  quarterStep() {
    this.triangle.updateLinearCounter();
    this.square1.updateEnvelope();
    this.square2.updateEnvelope();
    this.noise.updateEnvelope();
  }

  halfStep() {
    this.quarterStep();
    this.square1.updateLengthCounterAndSweepUnit();
    this.square2.updateLengthCounterAndSweepUnit();
    this.triangle.updateLengthCounter();
    this.noise.updateLengthCounter();
  }

  tickSampleCollector() {
    this.apuSampleBucket++;
    this.accumulateSampleValue();

    while (this.apuSampleBucket > CPU_CYCLES_PER_SAMPLE) {
      this.readSampleValue();
      this.audioSampleCallback?.(this.lastSampleLeft, this.lastSampleRight);
      this.apuSampleBucket -= CPU_CYCLES_PER_SAMPLE;
    }
  }

  tickFrameCounter() {
    const step4 = this.frameCounterMode === 0;

    this.elapsedApuCycles++;

    const curSteps = step4 ? steps4 : steps5;
    const curStep = curSteps[this.apuStep];
    if (this.elapsedApuCycles >= curStep[0]) {
      const frameType = curStep[1];

      switch (frameType) {
        case FRAME_TYPE_HALF:
          this.halfStep();
          break;
        case FRAME_TYPE_QUARTER:
          this.quarterStep();
          break;
        case FRAME_TYPE_IRQ:
          this.irqStep();
          break;
        case FRAME_TYPE_HALF_AND_IRQ:
          this.halfStep();
          this.irqStep();
          break;
        default:
        case FRAME_TYPE_IDLE:
          break;
      }


      this.apuStep++;

      if (this.apuStep >= curSteps.length) {
        this.elapsedApuCycles -= curSteps[curSteps.length - 1][0];
        this.apuStep = 0;
      }
    }

    if (this.frameCounterDelayCycles > 0) {
      this.frameCounterDelayCycles--;
      if (this.frameCounterDelayCycles === 0) {
        this.frameCounterMode = this.pendingFrameCounterMode;
        this.frameCounterDelayCycles = -1;
        this.elapsedApuCycles = 0;
        this.apuStep = 0;

        if (this.frameCounterMode === 1) {
          // Writing to $4017 resets the frame counter, and if bit 7 is set the quarter/half frame triggers happen simultaneously
          this.quarterStep();
          this.halfStep();
        }
      }
    }
  }

  tickSequencers() {
    this.dmc.updatePendingDMC();
    this.square1.updateSequencer();
    this.square2.updateSequencer();
    this.noise.updateSequencer();
    this.dmc.updateSequencer();


    this.triangle.updateSequencer();
  }

  reloadLengthCounters() {
    this.square1.lengthCounter.reload();
    this.square2.lengthCounter.reload();
    this.noise.lengthCounter.reload();
    this.triangle.lengthCounter.reload();
  }

  tick() {
    if (this.disabled) {
      return
    }

    this.frameInterruptCycle = false;
    this.tickFrameCounter();
    this.reloadLengthCounters();
    this.tickSequencers();
    this.tickSampleCollector();
  }
}

export default APU;
