import Mapper from "./Mapper";
import { Rom } from '../parseROM';
import CPUMemorySpace from './CPUMemorySpace';
import PPUMemorySpace from './PPUMemorySpace';

class UNRomMapper extends Mapper {
  rom: Rom;

  constructor(rom: Rom, cpuMemory: CPUMemorySpace, ppuMemory: PPUMemorySpace) {
    super(cpuMemory, ppuMemory);

    this.rom = rom;
    // TODO: Use prgRamDisable
    this.update(0);
  }

  update(prgBank: number) {
    // Fix last bank at $C000 and switch 16 KB bank at $8000
    const bankEnd = this.rom.settings.prgRomSize;

    this.cpuMemory.mapPrgRom(0x8000, prgBank * 0x4000, (prgBank + 1) * 0x4000);
    this.cpuMemory.mapPrgRom(0xC000, bankEnd - 0x4000, bankEnd);
  }

  handleROMWrite(address: number, value: number) {
    this.update(value);
  }
}

export default UNRomMapper;
