import NROMMapper from './NROMMapper';
import MMC1Mapper from './MMC1Mapper';
import Mapper from "./Mapper";
import { Rom } from '../parseROM';
import CPUMemorySpace from './CPUMemorySpace';
import PPUMemorySpace from './PPUMemorySpace';
import CNROMMapper from './CNROMMapper';
import UNROMMapper from './UNROMMapper';

const parseMapper = (rom: Rom, cpuMemory: CPUMemorySpace, ppuMemory: PPUMemorySpace): Mapper => {
  switch (rom.settings.mapper) {
    case 0:
      return new NROMMapper(rom, cpuMemory, ppuMemory);
    case 1:
      return new MMC1Mapper(rom, cpuMemory, ppuMemory);
    case 2:
      return new UNROMMapper(rom, cpuMemory, ppuMemory);
    case 3:
      return new CNROMMapper(rom, cpuMemory, ppuMemory);
    default:
      throw new Error('Unsupported mapper specified: ' + rom.settings.mapper);
  }
}

export default parseMapper;
