import LengthCounter from './LengthCounter';

const sequence = [
  15, 14, 13, 12, 11, 10,  9,  8,  7,  6,  5,  4,  3,  2,  1,  0,
  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15];

class TriangleWaveGenerator {
  isEnabled = false;
  linearCounterHaltFlag = false; // I call it halt, it's really "control" but this makes it clearer
  linearCounterReload = 0;
  timerSetting = 0;
  timerValue = 0;
  lengthCounter = new LengthCounter();
  linearCounter = 0;
  generatorIndex = 0;
  curOutputValue = 0;
  linearReloadFlag = true;

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
    this.lengthCounter.update();
  }

  updateSequencer() {
    if (!this.isEnabled) {
      this.curOutputValue = 0;
      return;
    }

    this.curOutputValue = sequence[this.generatorIndex];

    if (--this.timerValue <= -1) {
      if (this.timerSetting > 2 && this.lengthCounter.lengthCounter > 0 && this.linearCounter > 0) {
        this.generatorIndex = ((this.generatorIndex + 1) % sequence.length)
      }

      this.timerValue = this.timerSetting;
    }
  }

  setRegisterMem(address: number, value: number) {
    if (address === 0x4008) {
      this.linearCounterHaltFlag = ((value & 0b10000000) >> 7) === 1;
      this.lengthCounter.setHalt(this.linearCounterHaltFlag);
      this.linearCounterReload = value & 0b01111111;
      // console.log('0x4008 Halt', this.linearCounterHaltFlag, 'Reload', this.linearCounterReload);
    } else if (address === 0x400A) {
      this.timerSetting &= 0b11100000000;
      this.timerSetting |= value;
      // console.log('0x400A timer', this.timerSetting);
    } else if (address === 0x400B) {
      const timerHigh =    (value & 0b00000111);

      if (this.isEnabled) {
        this.lengthCounter.init(value);
      }

      this.timerSetting &= 0b11111111;
      this.timerSetting |= (timerHigh << 8);
      this.timerValue = this.timerSetting;
      this.linearReloadFlag = true;
      // console.log('0x400B', this.timerSetting, this.lengthCounter.lengthCounter);
    }
  }

  setEnabled(isEnabled: boolean) {
    this.isEnabled = isEnabled;
    if (!isEnabled) {
      this.lengthCounter.reset();
    }
  }
}

export default TriangleWaveGenerator;
