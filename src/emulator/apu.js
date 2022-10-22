import SquareWaveGenerator from './apu/SquareWaveGenerator';
import TriangleWaveGenerator from './apu/TriangleWaveGenerator';
import DMCGenerator from './apu/DMCGenerator';

const APUCycleStepNTSC = 3728.5 * 2 * 12;

class APU {
  constructor() {
    this.square1 = new SquareWaveGenerator(0);
    this.square2 = new SquareWaveGenerator(1);
    this.triangle = new TriangleWaveGenerator();
    this.dmc = new DMCGenerator();
    this.masterClock = 0;
    this.cpuDivider = 12;
    this.elapsedApuCycles = 0;
    this.apuStep = 0;
    this.evenTick = false;
    this.frameBucket = 0;
    this.numTicks = 0;
  }

  setAPURegisterMem(address, value) {
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
    } else if (address === 0x4015) {
      this.square1.setEnabled((value & 0b001) !== 0);
      this.square2.setEnabled((value & 0b010) !== 0);
      this.triangle.setEnabled((value & 0b100) !== 0);
    }
  }

  readAPURegisterMem(address) {
    return 0;
  }

  readSampleValue() {
    const noise = 0;
    const dmc = this.dmc.counter;
    const pulseOut = 95.88 / ((8128 / (this.square1.curOutputValue + this.square2.curOutputValue)) + 100);
    const tndOut = 159.79 / (1.0 / ((this.triangle.curOutputValue / 8227) + (noise / 12241) + (dmc / 22638)))
    return pulseOut + tndOut;
  }

  update(targetMasterClock) {
    while ((this.masterClock + this.cpuDivider) < targetMasterClock) {
      // Do one iteration for each cpu cycle, but update sequencers for square waves every 2 cycles
      this.evenTick = !this.evenTick;

      if (this.evenTick) {
        this.square1.updateSequencer();
        this.square2.updateSequencer();
      }

      this.frameBucket += this.cpuDivider;
      //
      // if (this.frameBucket > 21477272) {
      //   this.frameBucket -= 21477272;
      //   console.log('1 second elapsed', this.numTicks);
      //   this.numTicks = 0;
      // }

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
        }

        this.numTicks++;

        this.triangle.updateLinearCounter();
        this.square1.updateEnvelope();
        this.square2.updateEnvelope();

        // TODO: This can also be 5 steps
        this.apuStep = (this.apuStep + 1) % 4;
      }
    }
  }
}

export default APU;
