const lengthLookup = [
  0x0A, 0xFE, 0x14, 0x02, 0x28, 0x04, 0x50, 0x06, 0xA0, 0x08, 0x3C, 0x0A, 0x0E, 0x0C, 0x1A, 0x0E, 0x0C, 0x10, 0x18, 0x12, 0x30, 0x14, 0x60, 0x16, 0xC0, 0x18, 0x48, 0x1A, 0x10, 0x1C, 0x20, 0x1E
];

class LengthCounter {
  lengthCounter = 0;
  haltCounter = false;

  init(registerValue) {
    // Timer indices are always stored in the upper 5 bits.
    const timerIndex = (registerValue & 0b11111000) >> 3;
    this.lengthCounter = lengthLookup[timerIndex];
  }

  reset() {
    this.lengthCounter = 0;
  }

  update() {
    if (!this.haltCounter) {
      this.lengthCounter--;

      if (this.lengthCounter < 0) {
        this.lengthCounter = 0;
      }
    }

  }
}

export default LengthCounter;
