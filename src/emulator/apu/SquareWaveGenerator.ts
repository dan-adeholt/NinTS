import EnvelopeGenerator from './EnvelopeGenerator';
import LengthCounter from './LengthCounter';

const sequences = [
  [0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 0, 0, 0],
  [1, 0, 0, 1, 1, 1, 1, 1]
];

export default class SquareWaveGenerator {
  isEnabled = false;
  index = 0
  sequence = sequences[0];
  constantVolume = false;
  volumeOrEnvelopePeriod = 0;
  timerSetting = 200;
  timerValue = 0;
  generatorIndex = 0;
  curOutputValue = 0;
  sweepEnabled  = false;
  sweepPeriod = 0;
  sweepNegate = false;
  sweepShift = 0;
  sweepMutesChannel = false;
  sweepDivider = 0;
  sweepReloadFlag = false;
  envelope = new EnvelopeGenerator();
  lengthCounter = new LengthCounter();

  constructor(index: number) {
    this.index = index;
  }

  updateEnvelope() {
    this.envelope.update();
  }

  updateLengthCounterAndSweepUnit() {
    this.lengthCounter.update();

    let targetPeriod = this.timerSetting;

    if (this.sweepDivider === 0 && this.sweepEnabled) {
      let targetPeriodOffset = (this.timerSetting >> this.sweepShift);
      if (this.sweepNegate) {
        targetPeriodOffset = -targetPeriodOffset;
        if (this.index === 0) {
          targetPeriodOffset--; // Pulse 1 (index 0) adds the ones' complement (−c − 1). Making 20 negative produces a change amount of −21.
        }
      }

      targetPeriod += targetPeriodOffset;
    }


    this.sweepMutesChannel = (targetPeriod > 0x7FF) || (this.timerSetting < 8);

    if (!this.sweepMutesChannel) {
      this.timerSetting = targetPeriod;
    }

    if (this.sweepReloadFlag || this.sweepDivider <= 0) {

      this.sweepDivider = this.sweepPeriod;
      this.sweepReloadFlag = false;
    } else {
      this.sweepDivider--;
    }
  }

  updateSequencer() {
    if (!this.isEnabled || (!this.lengthCounter.haltCounter && this.lengthCounter.lengthCounter === 0) || this.sweepMutesChannel) {
      this.curOutputValue = 0;
    }
    else if (--this.timerValue <= -1) {
      this.timerValue = this.timerSetting;

      if (this.constantVolume) {
        this.curOutputValue = this.sequence[this.generatorIndex] * this.volumeOrEnvelopePeriod;
      } else {
        this.curOutputValue =this.sequence[this.generatorIndex] * this.envelope.decayLevelCounter;
      }

      this.generatorIndex = ((this.generatorIndex + 1) % this.sequence.length)
    }
  }

  setRegisterMem(address: number, value: number) {
    const relAddress = (address - 0x4000) % 0x4;

    switch (relAddress) {
      case 0: { // Duty cycle, length counter halt, constant volume/envelope flag, volume/envelope divider period
        const dutyCycle = (value & 0b11000000) >> 6;
        const lengthCounterHalt = (value & 0b00100000) >> 5;
        const constantVolume = (value & 0b00010000) >> 4;
        const volumeEnvelope = (value & 0b00001111);

        this.sequence = sequences[dutyCycle];
        const haltCounterOrEnvelopeLoop = lengthCounterHalt === 1;
        this.lengthCounter.setHalt(haltCounterOrEnvelopeLoop);
        this.envelope.envelopeLoop = haltCounterOrEnvelopeLoop;

        this.constantVolume = constantVolume === 1;
        this.volumeOrEnvelopePeriod = volumeEnvelope;
        this.envelope.envelopePeriod = this.volumeOrEnvelopePeriod;

        // if (print) {
        //   console.log('1SEQ', dutyCycle, 'HC:', haltCounterOrEnvelopeLoop, 'CV:', this.constantVolume, 'VE', volumeEnvelope);
        // }

        // if (this.volumeOrEnvelopePeriod != 0) {
        //   if (--debug) console.log('Sq lc', this.index, this.lengthCounter, this.volumeOrEnvelopePeriod);
        // }
        // if (this.index === 0) {
        //   console.log('SEQ', dutyCycle, 'HC:', haltCounterOrEnvelopeLoop, 'CV:', this.constantVolume, 'VE', volumeEnvelope);
        // }
        break;
      } case 1: { // Sweep setup
        const sweepEnabled = ((value & 0b10000000) >> 7) === 1;


        this.sweepEnabled = sweepEnabled;
        this.sweepPeriod = (value & 0b01110000) >> 4;
        this.sweepNegate = ((value & 0b00001000) >> 3) === 1;
        this.sweepShift = (value & 0b00000111);
        this.sweepReloadFlag = true;

        // if (print) {
        //   console.log('2SWEEP', this.sweepEnabled, this.sweepPeriod, this.sweepNegate, this.sweepShift);
        // }

        break;
      }
      case 2: { // Timer low 8 bits
        this.timerSetting = value | (this.timerSetting & 0b11100000000);
        break;
      }
      case 3: { // Length counter load and timer high 3 bits
        const timerHigh = (value & 0b00000111);
        this.timerSetting = (timerHigh << 8) | (this.timerSetting & 0b11111111);
        this.timerValue = this.timerSetting;
        this.generatorIndex = 0;

        if (this.isEnabled) {
          this.lengthCounter.init(value);
        }

        this.envelope.envelopeStartFlag = true;

        // console.log('Set square', this.index, timerIndex, this.lengthCounter);
        // if (this.index === 0) console.log('TH, TS:', this.timerSetting, 'LC:', this.lengthCounter);
        // console.log('TH', this.timerHigh, 'TV', this.timerValue);
        // console.log('LC', this.lengthCounter);
        break;
      }
      default:
        break;
    }
  }

  setEnabled(isEnabled: boolean) {
    this.isEnabled = isEnabled;

    if (!this.isEnabled) {
      this.lengthCounter.reset();
    }
  }
}
