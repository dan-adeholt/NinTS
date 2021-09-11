import NROMMapper from './NROMMapper';
import MMC1Mapper from './MMC1Mapper';

const parseMapper = (rom, memory, ppu) => {
  console.log(rom.settings.mapper);
  switch (rom.settings.mapper) {
    case 0:
      return new NROMMapper(rom, memory, ppu);
    case 1:
      return new MMC1Mapper(rom, memory, ppu);
    default:
      return null;
  }
}

export default parseMapper;
