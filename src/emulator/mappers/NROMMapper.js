import PPUMemorySpace from './PPUMemorySpace';
import CPUMemorySpace from './CPUMemorySpace';

class NROMMapper {
  constructor(rom) {
    this.ppuMemory = new PPUMemorySpace(rom);
    this.cpuMemory = new CPUMemorySpace(rom);

    this.cpuMemory.mapPrgRom(0x8000, 0x0000, rom.prgData.length);

    if (rom.prgData.length <= 0x4000) {
      this.cpuMemory.mapPrgRom(0xC000, 0x0000, rom.prgData.length);
    }

    this.rom = rom;
  }

  reload() {

  }

  handleROMWrite() {

  }
}

export default NROMMapper;
