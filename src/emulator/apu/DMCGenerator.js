class DMCGenerator {
  constructor() {
    this.counter = 0;
  }

  setRegisterMem(address, value) {
    if (address === 0x4011) {
      this.counter = value & 0b01111111;
    }
  }
}

export default DMCGenerator;
