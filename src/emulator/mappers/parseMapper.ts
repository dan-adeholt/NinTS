import NROMMapper from './NROMMapper';
import MMC1Mapper from './MMC1Mapper';
import Mapper from "./Mapper";

const parseMapper = (rom, cpuMemory, ppuMemory): Mapper => {
  switch (rom.settings.mapper) {
    case 0:
      return new NROMMapper(rom, cpuMemory, ppuMemory);
    case 1:
      return new MMC1Mapper(rom, cpuMemory, ppuMemory);
    default:
      throw new Error('Invalid mapper specified, returning NROM');
  }
}

export default parseMapper;
