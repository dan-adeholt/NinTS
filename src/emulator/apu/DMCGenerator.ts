class DMCGenerator {
  counter = 0;
  isEnabled = true;

  setRegisterMem(address: number, value: number) {
    if (address === 0x4011) {
      this.counter = value & 0b01111111;
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}

export default DMCGenerator;
