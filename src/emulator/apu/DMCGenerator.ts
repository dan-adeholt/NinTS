const NTSCRates = [428, 380, 340, 320, 286, 254, 226, 214, 190, 160, 142, 128, 106,  84,  72,  54];

class DMCGenerator {
  counter = 0;
  isEnabled = true;
  remainingBytes = 0
  interrupt = false

  irqEnabled = false

  loop = false

  rate = 0

  sampleBuffer = 0

  sampleAddress = 0

  sampleLength = 0

  setRegisterMem(address: number, value: number) {
    if (address === 0x4010) {
      this.irqEnabled = (value & 0b01000000) != 0;
      if (!this.irqEnabled) {
        this.interrupt = false;
      }

      this.loop = (value & 0b00100000) != 0;
      this.rate = NTSCRates[value & 0b1111];
    } else if (address === 0x4011) {
      this.counter = value & 0b01111111;
    } else if (address === 0x4012) {
      this.sampleAddress = 0xC000 + (value * 64);
    } else if (address === 0x4013) {
      this.sampleLength = (value * 16) + 1;
    }
  }

  checkRestart() {
    if (!this.isEnabled) {
      return;
    }

    if (this.sampleBuffer === 0) {
      // eslint-disable-next-line no-empty
      if (this.remainingBytes > 0) {

        // eslint-disable-next-line no-empty
      } else if (this.loop) {

      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateSequencer() {

  }

  setEnabled(enabled: boolean, onEvenCycle: boolean) {
    this.isEnabled = enabled;
    this.remainingBytes = 0;
    this.interrupt = false

    this.checkRestart();
    // eslint-disable-next-line no-empty
    if (onEvenCycle) {

    }
  }
}

export default DMCGenerator;
