import CPUMemorySpace from './CPUMemorySpace';
import PPUMemorySpace from './PPUMemorySpace';
import NROMMapper from './NROMMapper';
import { Rom } from '../parseROM';
import MirroringMode from '../MirroringMode';

class AxROMMapper extends NROMMapper {
  constructor(rom: Rom, cpuMemory: CPUMemorySpace, ppuMemory: PPUMemorySpace) {
    super(rom, cpuMemory, ppuMemory);
    this.ppuMemory.setMirroringMode(MirroringMode.SingleScreenA);
  }

  handleROMWrite(_address: number, value: number) {
    const bank = value & 0b111;
    this.cpuMemory.mapPrgRom(0x8000, bank * 0x8000, (bank + 1) * 0x8000);
    const mirrorMode = (value & 0b10000) ? MirroringMode.SingleScreenB : MirroringMode.SingleScreenA;
    this.ppuMemory.setMirroringMode(mirrorMode);
  }
}

export default AxROMMapper;
