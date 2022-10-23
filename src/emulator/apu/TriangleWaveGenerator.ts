import { lengthLookup } from './apuConstants';

const sequence = [
  15, 14, 13, 12, 11, 10,  9,  8,  7,  6,  5,  4,  3,  2,  1,  0,
  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15];

class TriangleWaveGenerator {
  isEnabled = false;
  linearCounterHaltFlag = false; // I call it halt, it's really "control" but this makes it clearer
  linearCounterReload = 0;
  timerLow = 0;
  timerSetting = 0;
  timerValue = 0;
  lengthCounter = 0;
  linearCounter = 0;
  generatorIndex = 0;
  curOutputValue = 0;
  linearReloadFlag = true;
  lengthCounterHalt = true;

  updateLinearCounter() {
    if (this.linearReloadFlag) {
      this.linearCounter = this.linearCounterReload;
    } else if (this.linearCounter > 0) {
      this.linearCounter--;
    }

    if (!this.linearCounterHaltFlag) {
      this.linearReloadFlag = false;
    }
  }

  updateLengthCounter() {
    if (!this.lengthCounterHalt) {
      this.lengthCounter--;
      // if (--debug) console.log('Tri lc', this.lengthCounter);

      if (this.lengthCounter < 0) {
        this.lengthCounter = 0;
      }
    }
  }

  updateSequencer() {
    if (!this.isEnabled) {
      return;
    }

    if (--this.timerValue <= -1) {
      if (this.lengthCounter === 0 || this.linearCounter === 0) {
        this.curOutputValue = 0;
      } else {
        this.curOutputValue = sequence[this.generatorIndex];
        this.generatorIndex = ((this.generatorIndex + 1) % sequence.length)
      }

      this.timerValue = this.timerSetting;
    }
  }

  setRegisterMem(address: number, value: number) {
    if (address === 0x4008) {
      this.linearCounterHaltFlag = ((value & 0b10000000) >> 7) === 1;
      this.lengthCounterHalt = this.linearCounterHaltFlag;
      this.linearCounterReload = value & 0b01111111;
    } else if (address === 0x400A) {
      this.timerLow = value;
    } else if (address === 0x400B) {
      const timerHigh =    (value & 0b00000111);
      const lengthIndex = (value & 0b11111000) >> 3;
      this.lengthCounter = lengthLookup[lengthIndex];
      this.timerSetting = this.timerLow | (timerHigh << 8);
      this.timerValue = this.timerSetting;
      this.linearReloadFlag = true;
    }
  }

  setEnabled(isEnabled: boolean) {
    this.isEnabled = isEnabled;
    if (!isEnabled) {
      this.curOutputValue = 0;
      this.timerValue = 0;
    }
  }
}

export default TriangleWaveGenerator;
