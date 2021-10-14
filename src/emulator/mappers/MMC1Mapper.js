import { BIT_7 } from '../instructions/util';
import { hex } from '../stateLogging';
import PPUMemorySpace from './PPUMemorySpace';
import CPUMemorySpace from './CPUMemorySpace';

const MMCVariant = {
  None: 0,
  SNROM: 1,
  SOROM: 2,
  SUROM: 3,
  SXROM: 4,
  SZROM: 5
}

class MMC1Mapper {
  constructor(rom) {
    this.ppuMemory = new PPUMemorySpace(rom);
    this.cpuMemory = new CPUMemorySpace(rom);

    this.registers = [0, 0, 0, 0];

    console.log(rom.settings);
    console.log(rom.settings.chrRamSize, rom.settings.prgRamSize);

    if (rom.settings.chrRamSize === 0) {
      this.variant = MMCVariant.None;
    } else if (rom.settings.chrRamSize === 0x2000) {
      if (rom.settings.prgRomSize === 0x80000) {
        this.variant = MMCVariant.SUROM;
      } else {
        this.variant = MMCVariant.SNROM;
      }
    } else if (rom.settings.prgRamSize === 0x4000) {
      if (rom.settings.chrRomSize === 0x2000 || rom.settings.chrRamSize === 0x2000) {
        this.variant = MMCVariant.SOROM;
      } else {
        this.variant = MMCVariant.SZROM;
      }
    } else if (rom.settings.prgRamSize === 0x8000) {
      this.variant = MMCVariant.SXROM;
    }

    this.rom = rom;
    this.shiftRegister = 0;
    this.count = 0;
    // TODO: Use prgRamDisable
    this.prgRamDisabled = false;
  }

  resetRegister() {
    this.shiftRegister = 0;
    this.count = 0;
  }

  update(target, setting) {
    console.log('Updating because', target, 'changed with value', setting)
    this.registers[target] = setting;
    const mirroringMode = this.registers[0] & 0b11;
    const prgSetting = (this.registers[0] & 0b01100) >> 2;
    const chrSwitch8kb = ((this.registers[0] & 0b10000) >> 4) === 0;

    console.log('MMC CHR Bank 0/1:', hex(setting));

    let prgBank = this.registers[3] & 0b1111;
    let lowerChrBank = this.registers[1];
    let upperChrBank = this.registers[2];

    if (this.rom.settings.chrRamSize > 0) {
      // All of these variants have 8kb CHR ROM/RAM. Only lower bit is used (if 4kb mode is set)
      lowerChrBank = lowerChrBank & 0b1;
      upperChrBank = upperChrBank & 0b1;
    }

    if (chrSwitch8kb) {
      // If 8Kb mode is used, the lower byte is ignored
      lowerChrBank = lowerChrBank & (~0b1);
      this.ppuMemory.mapChr(0x0000, lowerChrBank * 0x2000, (lowerChrBank + 1) * 0x2000);
    } else {
      this.ppuMemory.mapChr(0x0000, lowerChrBank * 0x1000, (lowerChrBank + 1) * 0x1000);
      this.ppuMemory.mapChr(0x1000, upperChrBank * 0x1000, (upperChrBank + 1) * 0x1000);
    }

    if (this.variant === MMCVariant.SNROM) {
      this.prgRamDisabled = (this.registers[1] & 0b10000) !== 0 || (this.registers[2] & 0b10000) !== 0;
    } else if (this.variant === MMCVariant.SOROM || this.variant === MMCVariant.SUROM || this.variant === MMCVariant.SXROM) {
      // Read these additional settings from the lower CHR register. In theory the upper/lower register can have different values,
      // but in practice that only leads to weird HW behavior. They can only have different values in 4kb mode, in 8kb mode
      // only the lower register setting matter.
      let prgRamBank = (this.registers[1] & 0b1100) >> 2;
      let prgRomBank512 = (this.registers[1] & 0b10000);

      if (this.variant === MMCVariant.SOROM) {
        prgRamBank >>= 1; // Lower bit ignored
        this.cpuMemory.mapPrgRam(prgRamBank * 0x2000, (prgRamBank + 1) * 0x2000);
      } else if (this.variant === MMCVariant.SXROM) {
        this.cpuMemory.mapPrgRam(prgRamBank * 0x2000, (prgRamBank + 1) * 0x2000);
      }

      if (this.rom.settings.prgRomSize === 0x80000) {
        prgBank |= prgRomBank512;
      }
    } else if (this.variant === MMCVariant.SZROM) {
      const prgRamBank = (this.registers[1] & 0b10000) >> 4;
      this.cpuMemory.mapPrgRam(prgRamBank * 0x2000, (prgRamBank + 1) * 0x2000);
    }

    if (prgSetting === 0 || prgSetting === 1) {
      // Switch 32Kb at $8000, ignore low bit of bank number
      prgBank &= ~0b1;
      this.cpuMemory.mapPrgRom(0x8000, prgBank * 0x8000, (prgBank + 1) * 0x8000);
    } else if (prgSetting === 2) {
      this.cpuMemory.mapPrgRom(0xC000, prgBank * 0x4000, (prgBank + 1) * 0x4000);
      this.cpuMemory.mapPrgRom(0x8000, 0x0000, 0x4000);
      // Fix first bank at $8000 and switch 16 KB bank at $C000;
    } else if (prgSetting === 3) {
      // Fix last bank at $C000 and switch 16 KB bank at $8000)
      const bankEnd = this.rom.settings.prgRomSize;
      this.cpuMemory.mapPrgRom(0x8000, prgBank * 0x4000, (prgBank + 1) * 0x4000);
      this.cpuMemory.mapPrgRom(0xC000, bankEnd - 0x4000, bankEnd);
    }

    if (mirroringMode === 0) {
      // One-screen, lower bank
    } else if (mirroringMode === 1) {
      // One-screen, upper bank
    } else if (mirroringMode === 2) {
      // Vertical
    } else if (mirroringMode === 3) {
      // Horizontal
    }
  }

  handleROMWrite(address, value) {
    // console.log('Handle ROM write', hex(address), hex(value));
    if (value & BIT_7) {
      this.resetRegister();
    } else {
      this.shiftRegister <<= 1;
      this.shiftRegister |= value & 0b1;

      this.count++;
      if (this.count === 5) {
        const setting = this.shiftRegister;
        const target = (address & 0b110000000000000) >> 13;

        this.update(target, setting);
        this.resetRegister();
      }
    }
  }
}

export default MMC1Mapper;
