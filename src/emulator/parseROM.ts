import sha1 from 'js-sha1';
import database from './database/nes20db';

export function ascii(str: string) {
  return str.charCodeAt(0);
}

const BIT_1 = 1 << 1;
const BIT_2 = 1 << 2;
const BIT_3 = 1 << 3;

export const parseROM = (buffer: Uint8Array) => {
  let index = 0;

  console.assert(buffer[index] === ascii('N'));
  index++;
  console.assert(buffer[index] === ascii('E'));
  index++;
  console.assert(buffer[index] === ascii('S'));
  index++;
  console.assert(buffer[index] === 0x1A);
  index++;

  const prgRomSize = buffer[index++];

  const chrRomSize = buffer[index++];
  const flags = [
    buffer[index++], // Flags 6: Mapper, mirroring, battery, trainer
    buffer[index++], // Flags 7: Mapper, VS/Playchoice, NES 2.0
    buffer[index++], // Flags 8: PRG-RAM size (rarely used extension)
    buffer[index++], // Flags 9: TV system (rarely used extension)
    buffer[index++], // Flags 10: TV system, PRG-RAM presence (unofficial, rarely used extension)
  ];

  const mapperLow = flags[0] >> 4;
  const mapperHigh = flags[1] >> 4;
  const inesMapper = mapperLow | mapperHigh << 4;

  const hasTrainer = (flags[0] & BIT_2) === 1;

  index += 5; // Skip padding

  if (hasTrainer) {
    index += 512;
  }

  const hash = sha1.create();
  hash.update(buffer.slice(index));
  const romSHA = hash.hex().toUpperCase();

  const databaseSettings = database[romSHA];

  const inesMirroring = (flags[0] & 0b1) === 1 ? 'V' : 'H';

  // The iNES format implies 8 KiB of PRG RAM at $6000-$7FFF, which may or may not be battery backed, even for discrete boards such as NROM and UxROM that never actually had RAM there.
  // That is why we specify 0x2000 for prgRamSize for ROM:s that have no database entry.
  const [region, type, mapper, submapper, mirroring, battery, prgRamSize, prgNVRamSize, chrRamSize, chrNVRamSize] = (databaseSettings ?? [0,0,inesMapper,0,inesMirroring,false,0x2000,0,0,0]);

  const settings = {
    mirroringVertical: mirroring === 'V',
    batteryBackedPRGRam: (flags[0] & BIT_1) === 1,
    hasTrainer,
    useFourScreenVRAM: (flags[0] & BIT_3) === 1,
    region,
    type,
    mapper,
    submapper,
    mirroring,
    battery,
    prgRomSize: prgRomSize * 0x4000,
    chrRomSize: chrRomSize * 0x2000,
    prgRamSize: prgRamSize || prgNVRamSize,
    chrRamSize: chrRamSize || chrNVRamSize,
  };

  const prgData = buffer.slice(index, index + 16384 * prgRomSize);
  index += 16384 * prgRomSize;
  const chrData = buffer.slice(index, index + 8192 * chrRomSize);

  return { prgData, chrData, settings, romSHA };
}

export type RomSettings = {
  mirroringVertical: boolean
  batteryBackedPRGRam: boolean
  hasTrainer: boolean
  useFourScreenVRAM: boolean
  region: number
  type: number
  mapper: number
  submapper: number
  mirroring: string
  battery: boolean
  prgRomSize: number
  chrRomSize: number
  prgRamSize: number
  chrRamSize: number
}

export type Rom = {
  prgData: Uint8Array
  chrData: Uint8Array
  settings: RomSettings
  romSHA: string
}

export const EmptyRom: Rom = {
  settings: {
    prgRomSize: 0x4000,
    chrRomSize: 0x2000,
    prgRamSize: 0,
    chrRamSize: 0,
    mirroringVertical: false,
    batteryBackedPRGRam: false,
    hasTrainer: false,
    useFourScreenVRAM: false,
    region: 0,
    type: 0,
    mapper: 0,
    submapper: 0,
    mirroring: 'H',
    battery: false
  },
  prgData: new Uint8Array(16384),
  chrData: new Uint8Array(8192),
  romSHA: ''
}
