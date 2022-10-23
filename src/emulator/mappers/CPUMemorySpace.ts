import MemorySpace from './MemorySpace';

class CPUMemorySpace {
  memory = new MemorySpace(65535);
  baseRam = new Uint8Array(2048);
  prgRam: Uint8Array
  prgRom: Uint8Array

  constructor(rom) {
    this.prgRam = new Uint8Array(rom.settings.prgRamSize);
    this.prgRom = rom.prgData;

    this.memory.map(this.baseRam, 0x0000, 0x0000, this.baseRam.length);

    if (rom.settings.prgRamSize === 0x2000) {
      this.memory.map(this.prgRam, 0x6000, 0x0000, Math.min(0x2000, rom.settings.prgRamSize));
    }

    this.write(0x4015, 0xFF);
    this.write(0x4004, 0xFF);
    this.write(0x4005, 0xFF);
    this.write(0x4006, 0xFF);
    this.write(0x4007, 0xFF);

    // PPU Registers
    this.write(0x2000, 0x00);
    this.write(0x2001, 0x00);
    this.write(0x2002, 0x00);
    this.write(0x2003, 0x00);
    this.write(0x2004, 0x00);
    this.write(0x2005, 0x00);
    this.write(0x2006, 0x00);
    this.write(0x2007, 0x00);
  }

  read(address) {
    return this.memory.read(address)
  }

  write(address, value) {
    this.memory.write(address, value)
  }

  mapPrgRom(targetStart, sourceStart, sourceEnd) {
    this.memory.map(this.prgRom, targetStart, sourceStart, sourceEnd);
  }

  mapPrgRam(sourceStart, sourceEnd) {
    this.memory.map(this.prgRam, 0x6000, sourceStart, sourceEnd);
  }
}

export default CPUMemorySpace;
