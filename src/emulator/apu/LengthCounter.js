const lengthLookup = [
  0x0A, 0xFE, 0x14, 0x02, 0x28, 0x04, 0x50, 0x06, 0xA0, 0x08, 0x3C, 0x0A, 0x0E, 0x0C, 0x1A, 0x0E, 0x0C, 0x10, 0x18, 0x12, 0x30, 0x14, 0x60, 0x16, 0xC0, 0x18, 0x48, 0x1A, 0x10, 0x1C, 0x20, 0x1E
];

class LengthCounter {
  lengthCounter = 0;
  haltCounter = false;
  pendingHaltCounter = false;
  reloadValue = 0;
  prevValue = 0;

  init(registerValue) {
    // Timer indices are always stored in the upper 5 bits.
    const timerIndex = (registerValue & 0b11111000) >> 3;
    this.reloadValue = lengthLookup[timerIndex];
    this.prevValue = this.lengthCounter;
  }

  reload() {
    if (this.reloadValue) {
      // According to 11.len_reload_timing: Reload during length clock when ctr > 0 should be ignored
      // So reload length counter only if length had not been clocked during write (i.e. the value changed)
      if (this.lengthCounter === this.prevValue) {
        this.lengthCounter = this.reloadValue;
      }

      this.reloadValue = 0;
    }

    this.haltCounter = this.pendingHaltCounter;
  }

  setHalt(newHalt) {
    this.pendingHaltCounter = newHalt;
  }

  clear() {
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
