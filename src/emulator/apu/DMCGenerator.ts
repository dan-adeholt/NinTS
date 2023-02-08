const NTSCRates = [428, 380, 340, 320, 286, 254, 226, 214, 190, 160, 142, 128, 106, 84, 72, 54];

type DMCReaderState = {
  dmcCountdown: number
  currentAddress: number
  remainingBytes: number
  triggerDMACallback : (() => void) | null
  bufferEmpty: boolean
  buffer: number
}

class DMCGenerator {
  output = {
    shiftRegister: 0,
    counter: 0,
    bitsRemaining: 8,
    silenceFlag: true
  }

  reader: DMCReaderState = {
    triggerDMACallback: null,
    dmcCountdown: 0,
    currentAddress: 0,
    remainingBytes: 0,
    bufferEmpty: true,
    buffer: 0
  }

  settings = {
    irqEnabled: false,
    loop: false,
    isEnabled: true,
    sampleAddress: 0xC000,
    sampleLength: 1
  }

  irq = {
    interrupt: false
  }

  clock = {
    period: NTSCRates[0],
    timer: NTSCRates[0]
  }

  setRegisterMem(address: number, value: number) {
    if (address === 0x4010) {
      this.settings.irqEnabled = (value & 0b10000000) != 0;

      if (!this.settings.irqEnabled) {
        this.irq.interrupt = false;
      }

      this.settings.loop = (value & 0b01000000) != 0;
      this.clock.period = NTSCRates[value & 0b1111];
    } else if (address === 0x4011) {
      this.output.counter = value & 0b01111111;
    } else if (address === 0x4012) {
      this.settings.sampleAddress = 0xC000 + (value * 64);
    } else if (address === 0x4013) {
      this.settings.sampleLength = (value * 16) + 1;
    }
  }

  setDMAValue(value: number) {
    if (this.reader.remainingBytes > 0) {
      this.reader.buffer = value;
      this.reader.bufferEmpty = false;
      this.reader.currentAddress = (this.reader.currentAddress + 1);
      this.reader.remainingBytes--;

      if (this.reader.currentAddress > 0xFFFF) {
        this.reader.currentAddress = 0x8000;
      }

      if (this.reader.remainingBytes === 0) {
        if (this.settings.loop) {
          this.restoreState();
        } else if (this.settings.irqEnabled) {
          this.irq.interrupt = true;
        }
      }
    }
  }

  updatePendingDMC() {
    if (this.reader.dmcCountdown > 0) {
      this.reader.dmcCountdown--;
      if (this.reader.dmcCountdown === 0) {
        this.triggerDMATransfer();
      }
    }
  }

  updateSequencer() {
    this.clock.timer--;

    
    if (this.clock.timer === 0) {
      this.clock.timer = this.clock.period;

      if (!this.output.silenceFlag) {
        if ((this.output.shiftRegister & 0b1) === 1) {
          if (this.output.counter <= 125) {
            this.output.counter += 2;
          }
        } else {
          if (this.output.counter >= 2) {
            this.output.counter -= 2;
          }
        }
      }


      this.output.shiftRegister >>= 1;
      this.output.bitsRemaining--;

      if (this.output.bitsRemaining === 0) {
        this.output.bitsRemaining = 8;

        if (this.reader.bufferEmpty) {
          this.output.silenceFlag = true;
        } else {
          this.output.silenceFlag = false;
          this.output.shiftRegister = this.reader.buffer;
          this.reader.bufferEmpty = true;
          this.triggerDMATransfer()
        }
      }
    }
  }

  triggerDMATransfer() {
    if (this.reader.bufferEmpty && this.reader.remainingBytes > 0) {
      this.reader.triggerDMACallback?.()
    } else {
      this.output.silenceFlag = true;
    }
  }

  restoreState() {
    this.reader.currentAddress = this.settings.sampleAddress;
    this.reader.remainingBytes = this.settings.sampleLength;
  }

  setEnabled(enabled: boolean, onEvenCycle: boolean) {
    this.irq.interrupt = false
    this.settings.isEnabled = enabled;

    if (!this.settings.isEnabled) {
      this.reader.remainingBytes = 0;
    } else if(this.reader.remainingBytes === 0) {
      this.restoreState();

      if (onEvenCycle) {
        this.reader.dmcCountdown = 2;
      } else {
        this.reader.dmcCountdown = 3;
      }
    }
  }
}

export default DMCGenerator;
