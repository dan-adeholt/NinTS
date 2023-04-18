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
  dutyCycle = 0
  timerSetting = 0;
  timerSettingCpuCount = 0;
  timerValue = 0;
  generatorIndex = 0;
  curOutputValue = 0;
  sweepEnabled  = false;
  sweepPeriod = 0;
  sweepNegate = false;
  sweepShift = 0;
  sweepTargetPeriod = 0;
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

  sweepMutesChannel() {
    return (!this.sweepNegate && this.sweepTargetPeriod > 0x7FF) || (this.timerSetting < 8)
  }

  updateSweepTargetPeriod() {
    let targetPeriodOffset = (this.timerSetting >> this.sweepShift);

    if (this.sweepNegate) {
      targetPeriodOffset = -targetPeriodOffset;
      if (this.index === 0) {
        targetPeriodOffset--; // Pulse 1 (index 0) adds the ones' complement (−c − 1). Making 20 negative produces a change amount of −21.
      }
    }

    this.sweepTargetPeriod = this.timerSetting + targetPeriodOffset;
  }

  updateLengthCounterAndSweepUnit() {
    this.lengthCounter.update();

    this.sweepDivider--;

    if (this.sweepDivider === 0 && this.sweepEnabled && !this.sweepMutesChannel()) {
      this.updateTimerSetting(this.sweepTargetPeriod);
    }

    if (this.sweepReloadFlag || this.sweepDivider <= 0) {
      this.sweepDivider = this.sweepPeriod;
      this.sweepReloadFlag = false;
    }
  }

  updateTimerSetting(newValue: number) {
    this.timerSetting = newValue;

    this.timerSettingCpuCount = (newValue * 2) + 2;
    this.updateSweepTargetPeriod();
  }

  updateSequencer() {
    if (--this.timerValue <= 0) {
      this.timerValue = this.timerSettingCpuCount;
      this.generatorIndex = ((this.generatorIndex + 1) % this.sequence.length)            

      if (this.lengthCounter.lengthCounter === 0 || this.sweepMutesChannel()) {     
        this.curOutputValue = 0; 
      } else if (this.envelope.constantVolume) {
        this.curOutputValue = this.sequence[this.generatorIndex] * this.envelope.envelopePeriodOrVolume;
      } else {
        this.curOutputValue =this.sequence[this.generatorIndex] * this.envelope.decayLevelCounter;
      }
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
        
        this.dutyCycle = dutyCycle
        this.sequence = sequences[dutyCycle];
        const haltCounterOrEnvelopeLoop = lengthCounterHalt === 1;
        this.lengthCounter.setHalt(haltCounterOrEnvelopeLoop);
        this.envelope.envelopeLoop = haltCounterOrEnvelopeLoop;
        
        this.envelope.constantVolume = constantVolume === 1;
        this.envelope.envelopePeriodOrVolume = volumeEnvelope;

        break;
      } case 1: { // Sweep setup
        const sweepEnabled = ((value & 0b10000000) >> 7) === 1;


        this.sweepEnabled = sweepEnabled;
        this.sweepPeriod = (value & 0b01110000) >> 4;
        this.sweepNegate = ((value & 0b00001000) >> 3) === 1;
        this.sweepShift = (value & 0b00000111);
        this.updateSweepTargetPeriod();
        this.sweepReloadFlag = true;

        break;
      }
      case 2: { // Timer low 8 bits
        this.updateTimerSetting(value | (this.timerSetting & 0b11100000000))  
        break;
      }
      case 3: { // Length counter load and timer high 3 bits
        const timerHigh = (value & 0b00000111);
        this.updateTimerSetting((timerHigh << 8) | (this.timerSetting & 0b11111111))  

        this.generatorIndex = 0;

        if (this.isEnabled) {
          this.lengthCounter.init(value);
        }

        this.envelope.envelopeStartFlag = true;
        break;
      }
      default:
        break;
    }
  }


  setEnabled(isEnabled: boolean) {
    this.isEnabled = isEnabled;

    if (!this.isEnabled) {
      this.lengthCounter.clear();
    }
  }
}
