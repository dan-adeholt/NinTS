import SquareWaveGenerator from './apu/SquareWaveGenerator';

const APUCycleStepNTSC = 3728.5;

class APU {
  constructor() {
    this.square1 = new SquareWaveGenerator();
    this.square2 = new SquareWaveGenerator();
    this.masterClock = 0;
    this.apuDivider = 24;
    this.elapsedApuCycles = 0;
    this.apuStep = 0;
  }

  setAPURegisterMem(address, value) {
    if (address >= 0x4000 && address <= 0x4003) {
      this.square1.setRegisterMem(address, value);
    } else if (address >= 0x4004 && address <= 0x4007) {
      this.square2.setRegisterMem(address, value);
    }
  }

  readAPURegisterMem(address) {
    return 0;
  }

  readSampleValue() {
    const pulseOut = 95.88 / ((8128 / (this.square1.curOutputValue + this.square2.curOutputValue)) + 100);
    return pulseOut;
  }

  update(targetMasterClock) {
    while ((this.masterClock + this.apuDivider) < targetMasterClock) {
      if (this.masterClock % 2 === 0) {
        this.square1.updateSequencer();
        this.square2.updateSequencer();
      }

      this.masterClock+=this.apuDivider;
      this.elapsedApuCycles += this.apuDivider;
      if (this.elapsedApuCycles > APUCycleStepNTSC) {
        // TODO: This shouldnt be float
        this.elapsedApuCycles -= APUCycleStepNTSC;

        if (this.apuStep === 1 && this.apuStep === 3) {
          this.square1.updateLengthCounterAndSweepUnit();
          this.square2.updateLengthCounterAndSweepUnit();
        }

        this.square1.updateEnvelope();
        this.square2.updateEnvelope();

        // TODO: This can also be 5 steps
        this.apuStep = (this.apuStep + 1) % 4;
      }
    }
  }
}

export default APU;
