import MemorySpace from './MemorySpace';

class PPUMemorySpace {
  constructor(rom) {
    this.memory = new MemorySpace(16384);
    this.chrRam = new Uint8Array(rom.settings.chrRamSize);

    if (rom.settings.chrRamSize > 0) {
      this.chrSource = this.chrRam;
    } else {
      this.chrSource = rom.chrData;
    }

    this.memory.map(this.chrSource, 0x0000, 0x0000, 0x2000);
  }

  read(address) {
    return this.memory.read(address)
  }

  write(address, value) {
    this.memory.write(address, value);
  }

  mapChr(targetStart, sourceStart, sourceEnd) {
    this.memory.map(this.chrSource, targetStart, sourceStart, sourceEnd);
  }
}

export default PPUMemorySpace;
