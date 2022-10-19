const sequences = [
  [0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 0, 0, 0],
  [1, 0, 0, 1, 1, 1, 1, 1]
];


const lengthLookup = [
  0x0A, 0xFE, 0x14, 0x02, 0x28, 0x04, 0x50, 0x06, 0xA0, 0x08, 0x3C, 0x0A, 0x0E, 0x0C, 0x1A, 0x0E, 0x0C, 0x10, 0x18, 0x12, 0x30, 0x14, 0x60, 0x16, 0xC0, 0x18, 0x48, 0x1A, 0x10, 0x1C, 0x20, 0x1E
];

export default class SquareWaveGenerator {
  constructor() {
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
  }

  updateSequencer() {
    if (this.lengthCounter === 0) {
      this.numBailed1++;
    }

    if ((!this.haltCounterOrEnvelopeLoop && this.lengthCounter === 0) || this.timerSetting < 8) {
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
      case 0: // Duty cycle, length counter halt, constant volume/envelope flag, volume/envelope divider period
        const dutyCycle =         (value & 0b11000000) >> 6;
        const lengthCounterHalt = (value & 0b00100000) >> 5;
        const constantVolume =    (value & 0b00010000) >> 4;
        const volumeEnvelope =    (value & 0b00001111);

        this.sequence = sequences[dutyCycle];
        this.haltCounterOrEnvelopeLoop = lengthCounterHalt === 1;
        this.constantVolume = constantVolume === 1;
        this.volumeOrEnvelopePeriod = volumeEnvelope;
        // if (print) console.log(unit, 'SEQ', this.sequence, 'HC:', this.haltCounter, 'CV:', this.constantVolume, 'VE', volumeEnvelope);
        break;
      case 1: // Sweep setup
        // const sweepEnabled  =     (value & 0b10000000) >> 7;
        // const sweepPeriod =       (value & 0b01110000) >> 4;
        // const sweepNegate =       (value & 0b00001000) >> 3;
        // const sweepShift =        (value & 0b00000111);
        break;
      case 2: // Timer low 8 bits
        this.timerLow = value;
        // console.log(unit, 'TL, TS:', this.timerSetting, this.numSamplesGenerated, this.numBailed1);
        // console.log('TL', value);
        break;
      case 3: // Length counter load and timer high 3 bits
        this.timerHigh =         (value & 0b00000111);
        this.timerSetting = (this.timerHigh << 8) | this.timerLow;
        this.lengthCounter = lengthLookup[(value & 0b11111000) >> 3];
        this.timerValue = this.timerSetting;
        this.startFlag = true;
        // if (print) console.log(unit, 'TH, TS:', this.timerSetting, 'LC:', this.lengthCounter, '|', this.numSamplesGenerated, this.numBailed1);
        // console.log('TH', this.timerHigh, 'TV', this.timerValue);
        // console.log('LC', this.lengthCounter);
        break;
      default:
        break;
    }

  }
}
