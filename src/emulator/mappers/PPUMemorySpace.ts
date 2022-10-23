import MemorySpace from './MemorySpace';
import MirroringMode from '../MirroringMode';
import { Rom } from '../parseROM';

class PPUMemorySpace {
  memory = new MemorySpace(16384);
  chrRam: Uint8Array
  namespaceRam = new Uint8Array(4096); // Make it 4KB to allow for 4 screen mirroring
  mirroringMode = MirroringMode.Vertical;
  chrSource: Uint8Array

  constructor(rom: Rom) {
    this.chrRam = new Uint8Array(rom.settings.chrRamSize);
    if (rom.settings.chrRamSize > 0) {
      this.chrSource = this.chrRam;
    } else {
      this.chrSource = rom.chrData;
    }

    if (this.chrSource.length >= 0x2000) {
      this.memory.map(this.chrSource, 0x0000, 0x0000, 0x2000);
    }

    this.mirroringMode = MirroringMode.Vertical;

    if (rom.settings.mirroringVertical) {
      this.setMirroringMode(MirroringMode.Vertical);
    } else {
      this.setMirroringMode(MirroringMode.Horizontal);
    }
  }

  read(address: number) {
    return this.memory.read(address)
  }

  write(address: number, value: number) {
    this.memory.write(address, value);
  }

  mapChr(targetStart: number, sourceStart: number, sourceEnd: number) {
    this.memory.map(this.chrSource, targetStart, sourceStart, sourceEnd);
  }

  setMirroringMode(mirroringMode: MirroringMode) {
    this.mirroringMode = mirroringMode;
    switch(mirroringMode) {
      case MirroringMode.SingleScreenUpper:
        this.memory.map(this.namespaceRam, 0x2000, 0x0000, 0x0400);
        this.memory.map(this.namespaceRam, 0x2400, 0x0000, 0x0400);
        this.memory.map(this.namespaceRam, 0x2800, 0x0000, 0x0400);
        this.memory.map(this.namespaceRam, 0x2C00, 0x0000, 0x0400);
        break;
      case MirroringMode.SingleScreenLower:
        this.memory.map(this.namespaceRam, 0x2000, 0x0400, 0x0800);
        this.memory.map(this.namespaceRam, 0x2400, 0x0400, 0x0800);
        this.memory.map(this.namespaceRam, 0x2800, 0x0400, 0x0800);
        this.memory.map(this.namespaceRam, 0x2C00, 0x0400, 0x0800);
        break;
      case MirroringMode.Horizontal:
        this.memory.map(this.namespaceRam, 0x2000, 0x0000, 0x0400);
        this.memory.map(this.namespaceRam, 0x2400, 0x0000, 0x0400);
        this.memory.map(this.namespaceRam, 0x2800, 0x0400, 0x0800);
        this.memory.map(this.namespaceRam, 0x2C00, 0x0400, 0x0800);
        break;
      case MirroringMode.Vertical:
        this.memory.map(this.namespaceRam, 0x2000, 0x0000, 0x0800);
        this.memory.map(this.namespaceRam, 0x2800, 0x0000, 0x0800);
        break;
      case MirroringMode.FourScreen:
        this.memory.map(this.namespaceRam, 0x2000, 0x0000, 0x1000);
        break;
      default:
        console.error('Unrecognized mirroring mode', mirroringMode);
        break;
    }


  }
}

export default PPUMemorySpace;
