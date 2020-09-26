export function ascii(a) {
  return a.charCodeAt(0);
}

const BIT_1 = 1;
const BIT_2 = 1 << 1;
const BIT_3 = 1 << 2;
const BIT_4 = 1 << 3;
const BIT_5 = 1 << 4;
const BIT_6 = 1 << 5;
const BIT_7 = 1 << 6;
const BIT_8 = 1 << 7;

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
    buffer[index++], // Flags 6: Mapper, mirroring, battery, trainer
    buffer[index++], // Flags 7: Mapper, VS/Playchoice, NES 2.0
    buffer[index++], // Flags 8: PRG-RAM size (rarely used extension)
    buffer[index++], // Flags 9: TV system (rarely used extension)
    buffer[index++], // Flags 10: TV system, PRG-RAM presence (unofficial, rarely used extension)
  ];

  const settings = {
    prgRomSize,
    chrRomSize,
    mirroringVertical: (flags[0] & BIT_1) === 1,
    batteryBackedPRGRam: (flags[0] & BIT_2) === 1,
    hasTrainer: (flags[0] & BIT_3) === 1,
    useFourScreenVRAM: (flags[0] & BIT_4) === 1,
    mapper: (flags[0] >> 4) | ((flags[1] >> 4) << 4),
    prgRamSize: flags[2],
  };

  index += 5; // Skip padding

  if (settings.hasTrainer) {
    index += 512;
  }

  const prgData = buffer.slice(index, index + 16384 * prgRomSize);
  index += 16384 * prgRomSize;
  const chrData = buffer.slice(index, index + 8192 * chrRomSize);

  return { prgData, chrData, settings };
}
