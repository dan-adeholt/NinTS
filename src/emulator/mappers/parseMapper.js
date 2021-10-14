import NROMMapper from './NROMMapper';
import MMC1Mapper from './MMC1Mapper';

const parseMapper = (rom) => {
  switch (rom.settings.mapper) {
    case 0:
      return new NROMMapper(rom);
    case 1:
      return new MMC1Mapper(rom);
    default:
      return null;
  }
}

export default parseMapper;
