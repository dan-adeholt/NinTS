class NROMMapper {
  constructor(rom, memory, ppu) {
    memory.set(rom.prgData, 0x8000);

    if (rom.prgData.length <= 0x4000) {
      memory.set(rom.prgData, 0xC000);
    }

    this.rom = rom;
    this.memory = memory;
    this.ppu = ppu;
  }
}

export default NROMMapper;
