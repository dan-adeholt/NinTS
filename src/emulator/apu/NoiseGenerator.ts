import EnvelopeGenerator from './EnvelopeGenerator';
import LengthCounter from './LengthCounter';
import { BIT_0 } from '../instructions/util';

const NTSCEntryTable = [4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068];

class NoiseGenerator {
  mode = 0;
  timerSetting = 0;
  timerValue = 0;
  shiftRegister = 1;
  curOutputValue = 0;
  volumeOrEnvelopePeriod = 0;
  envelope = new EnvelopeGenerator();
  lengthCounter = new LengthCounter();
  constantVolume = false;
  isEnabled = false;

  updateEnvelope() {
    this.envelope.update();
    this.updateSampleValue();
  }

  updateLengthCounter() {
    this.lengthCounter.update();
    this.updateSampleValue();
  }

  updateSampleValue() {
    if (this.lengthCounter.lengthCounter === 0) {
      this.curOutputValue = 0;
    } else {
      if ((this.shiftRegister & 0b1) === 0) {
        this.curOutputValue = 0;
      } else if (this.constantVolume) {
        this.curOutputValue = this.volumeOrEnvelopePeriod;
      } else {
        this.curOutputValue = this.envelope.decayLevelCounter;
      }
    }  
  }

  updateSequencer() {
    if (--this.timerValue <= 0) {
      this.timerValue = this.timerSetting;

      let xorBit;
      if (this.mode === 1) {
        xorBit = (this.shiftRegister >> 6) & 0b1;
      } else {
        xorBit = (this.shiftRegister >> 1) & 0b1;
      }

      const feedback = (this.shiftRegister & BIT_0) ^ xorBit;
      this.shiftRegister >>= 1;
      this.shiftRegister = this.shiftRegister | (feedback << 14);
      this.updateSampleValue();
    }
  }

  setRegisterMem(address: number, value: number) {
    switch (address) {
      case 0x400C: { // Duty cycle, length counter halt, constant volume/envelope flag, volume/envelope divider period
        const lengthCounterHalt = (value & 0b00100000) >> 5;
        const constantVolume = (value & 0b00010000) >> 4;
        const volumeEnvelope = (value & 0b00001111);
        
        const haltCounterOrEnvelopeLoop = lengthCounterHalt === 1;
        this.lengthCounter.setHalt(haltCounterOrEnvelopeLoop);
        this.lengthCounter.haltCounter = haltCounterOrEnvelopeLoop;
        this.envelope.envelopeLoop = haltCounterOrEnvelopeLoop;

        this.constantVolume = constantVolume === 1;
        this.volumeOrEnvelopePeriod = volumeEnvelope;
        this.envelope.envelopePeriod = this.volumeOrEnvelopePeriod;

        break;
      } case 0x400E: {
        const mode = (value & 0b10000000);
        const periodIndex = (value & 0b00001111);

        this.mode = mode >> 7;
        this.timerSetting = NTSCEntryTable[periodIndex];
        this.shiftRegister = NTSCEntryTable[periodIndex];
        break;
      }
      case 0x400F: { // Length counter load and timer high 3 bits
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

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;

    if (!enabled) {
      this.lengthCounter.clear();
    }

    this.updateSampleValue();
  }
}

export default NoiseGenerator;
