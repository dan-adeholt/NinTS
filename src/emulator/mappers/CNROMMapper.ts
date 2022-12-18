import CPUMemorySpace from './CPUMemorySpace';
import PPUMemorySpace from './PPUMemorySpace';
import NROMMapper from './NROMMapper';
import { Rom } from '../parseROM';

class CNROMMapper extends NROMMapper {
  constructor(rom: Rom, cpuMemory: CPUMemorySpace, ppuMemory: PPUMemorySpace) {
    super(rom, cpuMemory, ppuMemory);
  }

  handleROMWrite(address: number, value: number) {
    const bank = value & 0b11;
    this.ppuMemory.mapChr(0x0000, bank * 0x2000, (bank + 1) * 0x2000);
  }
}

export default CNROMMapper;
