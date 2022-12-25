import MemorySpace from './MemorySpace';
import { Rom } from '../parseROM';

class CPUMemorySpace {
  memory = new MemorySpace(65535);
  baseRam = new Uint8Array(2048);
  prgRam: Uint8Array
  prgRom: Uint8Array
  openBus = 0

  constructor(rom : Rom) {
    this.prgRam = new Uint8Array(rom.settings.prgRamSize);
    this.prgRom = rom.prgData;

    this.memory.map(this.baseRam, 0x0000, 0x0000, this.baseRam.length);
    this.memory.map(this.baseRam, 0x0800, 0x0000, this.baseRam.length);
    this.memory.map(this.baseRam, 0x1000, 0x0000, this.baseRam.length);
    this.memory.map(this.baseRam, 0x1800, 0x0000, this.baseRam.length);

    if (rom.settings.prgRamSize === 0x2000) {
      this.memory.map(this.prgRam, 0x6000, 0x0000, Math.min(0x2000, rom.settings.prgRamSize));
    }
  }

  getOpenBus() {
    return this.openBus;
  }

  setOpenBus(value: number, peek: boolean) {
    if (!peek) {
      this.openBus = value;
    }
  }

  read(address: number) {
    return this.memory.read(address, this.getOpenBus());
  }

  write(address: number, value: number) {
    this.memory.write(address, value)
  }

  mapPrgRom(targetStart: number, sourceStart: number, sourceEnd: number) {
    this.memory.map(this.prgRom, targetStart, sourceStart, sourceEnd);
  }

  mapPrgRam(sourceStart: number, sourceEnd: number) {
    this.memory.map(this.prgRam, 0x6000, sourceStart, sourceEnd);
  }
}

export default CPUMemorySpace;
