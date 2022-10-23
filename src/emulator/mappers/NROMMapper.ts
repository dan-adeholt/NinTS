import Mapper from './Mapper'
import { Rom } from '../parseROM';
import CPUMemorySpace from './CPUMemorySpace';
import PPUMemorySpace from './PPUMemorySpace';

class NROMMapper extends Mapper {
  constructor(rom: Rom, cpuMemory: CPUMemorySpace, ppuMemory: PPUMemorySpace) {
    super(cpuMemory, ppuMemory);

    this.cpuMemory.mapPrgRom(0x8000, 0x0000, rom.prgData.length);

    if (rom.prgData.length <= 0x4000) {
      this.cpuMemory.mapPrgRom(0xC000, 0x0000, rom.prgData.length);
    }
  }
}

export default NROMMapper;
