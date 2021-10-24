import sha1 from 'js-sha1';
import database from './database/nes20db';

export function ascii(a) {
  return a.charCodeAt(0);
}

const BIT_1 = 1 << 1;
const BIT_2 = 1 << 2;
const BIT_3 = 1 << 3;

export const parseROM = buffer => {
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
    buffer[index++], // Flags 6: Memoryspace, mirroring, battery, trainer
    buffer[index++], // Flags 7: Memoryspace, VS/Playchoice, NES 2.0
    buffer[index++], // Flags 8: PRG-RAM size (rarely used extension)
    buffer[index++], // Flags 9: TV system (rarely used extension)
    buffer[index++], // Flags 10: TV system, PRG-RAM presence (unofficial, rarely used extension)
  ];

  const hasTrainer = (flags[0] & BIT_2) === 1;

  index += 5; // Skip padding

  if (hasTrainer) {
    index += 512;
  }

  let hash = sha1.create();
  hash.update(buffer.slice(index));
  const romSHA = hash.hex().toUpperCase();

  const databaseSettings = database[romSHA];
  const [region, type, mapper, submapper, mirroring, battery, prgRamSize, prgNVRamSize, chrRamSize, chrNVRamSize] = (databaseSettings ?? [0,0,0,0,"H",false,0,0,0,0]);

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
