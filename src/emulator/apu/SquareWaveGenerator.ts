import { lengthLookup } from './apuConstants';

const sequences = [
  [0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 0, 0, 0],
  [1, 0, 0, 1, 1, 1, 1, 1]
];

export default class SquareWaveGenerator {
  constructor(index) {
    this.isEnabled = false;
    this.index = index;
    this.sequence = sequences[0];
    this.haltCounterOrEnvelopeLoop = false;
    this.constantVolume = false;
    this.volumeOrEnvelopePeriod = 0;
    this.timerLow = 0;
    this.timerHigh = 0;
    this.timerSetting = 200;
    this.timerValue = 0;
    this.lengthCounter = 0;
    this.generatorIndex = 0;
    this.curOutputValue = 0;
    this.numSamplesGenerated = 0;
    this.numBailed1 = 0;
    this.startFlag = false;
    this.envelopeDividerPeriod = 0;
    this.decayLevelCounter = 15;

    this.sweepEnabled  = false;
    this.sweepPeriod = 0;
    this.sweepNegate = false;
    this.sweepShift = 0;
    this.sweepMutesChannel = false;
    this.sweepDivider = 0;
    this.sweepReloadFlag = false;
  }

  updateEnvelope() {
    if (this.startFlag) {
      this.startFlag = false;
      this.envelopeDividerPeriod = this.volumeOrEnvelopePeriod;
      this.decayLevelCounter = 15;
    } else {
      this.envelopeDividerPeriod--;

      if (this.envelopeDividerPeriod === 0) {
        this.envelopeDividerPeriod = this.volumeOrEnvelopePeriod;

        if (this.decayLevelCounter > 0) {
          this.decayLevelCounter--;
        } else if (this.haltCounterOrEnvelopeLoop) {
          this.decayLevelCounter = 15;
        }
      }
    }
  }

  updateLengthCounterAndSweepUnit() {
    if (!this.haltCounterOrEnvelopeLoop) {
      this.lengthCounter--;

      if (this.lengthCounter < 0) {
        this.lengthCounter = 0;
      }
    }

    let targetPeriod = this.timerSetting;
    if (this.sweepDivider === 0 && this.sweepEnabled) {
      let targetPeriodOffset = (this.timerSetting >> this.sweepShift);
      if (this.sweepNegate) {
        targetPeriodOffset = -targetPeriodOffset;
        if (this.index === 0) {
          targetPeriodOffset--; // Pulse 1 (index 0) adds the ones' complement (−c − 1). Making 20 negative produces a change amount of −21.
        }
      }

      targetPeriod = this.timerSetting + targetPeriodOffset;
    }


    this.sweepMutesChannel = (targetPeriod > 0x7FF) || (this.timerSetting < 8);

    if (!this.sweepMutesChannel) {
      this.timerSetting = targetPeriod;
    }

    if (this.sweepReloadFlag || this.sweepDivider === 0) {
      this.sweepDivider = this.sweepPeriod;
    } else {
      this.sweepDivider--;
    }
  }

  updateSequencer() {
    if (this.lengthCounter === 0) {
      this.numBailed1++;
    }

    if (!this.isEnabled || (!this.haltCounterOrEnvelopeLoop && this.lengthCounter === 0) || this.sweepMutesChannel) {
      this.curOutputValue = 0;
    }
    else if (--this.timerValue <= -1) {
      this.timerValue = this.timerSetting;

      if (this.constantVolume) {
        this.curOutputValue = this.sequence[this.generatorIndex] * this.volumeOrEnvelopePeriod;
      } else {
        this.curOutputValue =this.sequence[this.generatorIndex] * this.decayLevelCounter;
      }

      this.generatorIndex = ((this.generatorIndex + 1) % this.sequence.length)

      if (this.curOutputValue > 0) {
        this.numSamplesGenerated++;
      }
    }
  }

  setRegisterMem(address, value) {
    const relAddress = (address - 0x4000) % 0x4;

    // const unit = address > 0x4004 ? '2' : '1';
    // const print = unit === '1';
    // const print = true;
    switch (relAddress) {
      case 0: { // Duty cycle, length counter halt, constant volume/envelope flag, volume/envelope divider period
        const dutyCycle = (value & 0b11000000) >> 6;
        const lengthCounterHalt = (value & 0b00100000) >> 5;
        const constantVolume = (value & 0b00010000) >> 4;
        const volumeEnvelope = (value & 0b00001111);

        this.sequence = sequences[dutyCycle];
        this.haltCounterOrEnvelopeLoop = lengthCounterHalt === 1;
        this.constantVolume = constantVolume === 1;
        this.volumeOrEnvelopePeriod = volumeEnvelope;
        // if (this.volumeOrEnvelopePeriod != 0) {
        //   if (--debug) console.log('Sq lc', this.index, this.lengthCounter, this.volumeOrEnvelopePeriod);
        // }
        // if (--debug) console.log(this.index, 'SEQ', this.sequence, 'HC:', this.haltCounterOrEnvelopeLoop, 'CV:', this.constantVolume, 'VE', volumeEnvelope);
        break;
      } case 1: { // Sweep setup
        this.sweepEnabled = ((value & 0b10000000) >> 7) === 1;
        this.sweepPeriod = (value & 0b01110000) >> 4;
        this.sweepNegate = ((value & 0b00001000) >> 3) === 1;
        this.sweepShift = (value & 0b00000111);
        this.sweepReloadFlag = true;
        break;
      }
      case 2: { // Timer low 8 bits
        this.timerLow = value;
        // console.log(unit, 'TL, TS:', this.timerSetting, this.numSamplesGenerated, this.numBailed1);
        // console.log('TL', value);
        break;
      }
      case 3: { // Length counter load and timer high 3 bits
        this.timerHigh = (value & 0b00000111);
        this.timerSetting = (this.timerHigh << 8) | this.timerLow;
        const timerIndex = (value & 0b11111000) >> 3;
        this.lengthCounter = lengthLookup[timerIndex];
        this.timerValue = this.timerSetting;
        this.startFlag = true;
        // console.log('Set square', this.index, timerIndex, this.lengthCounter);
        // if (print) console.log(unit, 'TH, TS:', this.timerSetting, 'LC:', this.lengthCounter, '|', this.numSamplesGenerated, this.numBailed1);
        // console.log('TH', this.timerHigh, 'TV', this.timerValue);
        // console.log('LC', this.lengthCounter);
        break;
      }
      default:
        break;
    }
  }

  setEnabled(isEnabled) {
    this.isEnabled = isEnabled;
    if (!this.isEnabled) {
      this.timerValue = 0;
      this.curOutputValue = 0;
    }
  }
}
