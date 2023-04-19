import MirroringMode from '../MirroringMode';
import Mapper from "./Mapper";
import { Rom } from '../parseROM';
import CPUMemorySpace from './CPUMemorySpace';
import PPUMemorySpace from './PPUMemorySpace';

const minDelayA12Cycles = 10;

const A12_CHANGE_NONE = 0;
const A12_CHANGE_RISE = 1;
const A12_CHANGE_FALL = 2;

class A12Counter {
  update(address: number, scanline: number, scanlineCycle: number) {
    if (this.numCyclesDown > 0) {
      if (scanline !== this.lastScanline) {
        // Not completely accurate
        this.numCyclesDown += 341 - this.lastScanlineCycle;
        this.numCyclesDown += scanlineCycle;
      } else {
        this.numCyclesDown += scanlineCycle - this.lastScanlineCycle;
      }
    }

    let res = A12_CHANGE_NONE;

    if (address & 0b1000000000000) {
      if (this.numCyclesDown > minDelayA12Cycles) {
        res = A12_CHANGE_RISE;  
      }
      this.numCyclesDown = 0;
    } else if (this.numCyclesDown === 0) {
      res = A12_CHANGE_FALL;
      this.numCyclesDown = 1;
    }

    this.lastScanline = scanline;  
    this.lastScanlineCycle = scanlineCycle;  

    return res;
  }

  numCyclesDown = 0;
  lastScanlineCycle = 0;
  lastScanline = 0;
}

class MMC3Mapper extends Mapper {
  rom: Rom;
  targetBank = 0;
  prgRomBankMode = 0;
  chrMapMode = 0;
  irqCounter = 0;
  irqReloadValue = 0;
  irqReload = false;
  disableIrq = false;
  registers = new Uint8Array(8);
  a12Counter = new A12Counter();

  constructor(rom: Rom, cpuMemory: CPUMemorySpace, ppuMemory: PPUMemorySpace) {
    super(cpuMemory, ppuMemory);
    this.rom = rom;
    
    for (let i = 0; i < this.registers.length; i++) {
      this.registers[i] = 0;
    }

    this.irq = false;
    this.chrMapMode = 0;
    this.targetBank = 0;
    this.prgRomBankMode = 0;
    this.irqCounter = 0;
    this.irqReloadValue = 0;
    this.irqReload = false;
    this.disableIrq = false;
    this.a12Counter = new A12Counter();
    this.updateBanks();
  }

  override reload() {
    this.updateBanks();
  }

  handleVRAMAddressChange(address: number, scanline: number, scanlineCycle: number) {
    if (this.a12Counter.update(address, scanline, scanlineCycle) === A12_CHANGE_RISE) {      
      if (this.irqCounter === 0 || this.irqReload) {
        this.irqCounter = this.irqReloadValue;
      } else {
        this.irqCounter--;
      }

      if (this.irqCounter === 0 && !this.disableIrq) {
        this.irq = true;
      }

      this.irqReload = false;
    }
  }
  
  readPPUMemory(address: number, scanline: number, scanlineCycle: number) {
    this.handleVRAMAddressChange(address, scanline, scanlineCycle);
    return this.ppuMemory.read(address);
  }

  writePPUMemory(address: number, value: number, scanline: number, scanlineCycle: number) {
    this.handleVRAMAddressChange(address, scanline, scanlineCycle);
    return this.ppuMemory.write(address, value);
  }  

  updateBanks() {
    // R0 and R1 ignore the bottom bit, as the value written still counts banks in 1KB units but odd numbered banks can't be selected.
    const R0 = this.registers[0] & 0b11111110;
    const R1 = this.registers[1] & 0b11111110;
    const R2 = this.registers[2];
    const R3 = this.registers[3];
    const R4 = this.registers[4];
    const R5 = this.registers[5];

    if (this.chrMapMode === 0) {
      this.ppuMemory.mapChr(0x0000, R0 * 0x0400, (R0 + 2) * 0x0400)
      this.ppuMemory.mapChr(0x0800, R1 * 0x0400, (R1 + 2) * 0x0400)

      this.ppuMemory.mapChr(0x1000, R2 * 0x0400, (R2 + 1) * 0x0400)
      this.ppuMemory.mapChr(0x1400, R3 * 0x0400, (R3 + 1) * 0x0400)
      this.ppuMemory.mapChr(0x1800, R4 * 0x0400, (R4 + 1) * 0x0400)
      this.ppuMemory.mapChr(0x1C00, R5 * 0x0400, (R5 + 1) * 0x0400)
    } else {
      this.ppuMemory.mapChr(0x1000, R0 * 0x0400, (R0 + 2) * 0x0400)
      this.ppuMemory.mapChr(0x1800, R1 * 0x0400, (R1 + 2) * 0x0400)

      this.ppuMemory.mapChr(0x0000, R2 * 0x0400, (R2 + 1) * 0x0400)
      this.ppuMemory.mapChr(0x0400, R3 * 0x0400, (R3 + 1) * 0x0400)
      this.ppuMemory.mapChr(0x0800, R4 * 0x0400, (R4 + 1) * 0x0400)
      this.ppuMemory.mapChr(0x0C00, R5 * 0x0400, (R5 + 1) * 0x0400)
    }
    
    const bankEnd = this.rom.settings.prgRomSize;

    // R6 and R7 will ignore the top two bits, as the MMC3 has only 6 PRG ROM address lines.
    const R6 = this.registers[6] & 0b00111111;
    const R7 = this.registers[7] & 0b00111111;

    if (this.prgRomBankMode === 0) {
      this.cpuMemory.mapPrgRom(0x8000, R6 * 0x2000, (R6 + 1) * 0x2000);
      this.cpuMemory.mapPrgRom(0xA000, R7 * 0x2000, (R7 + 1) * 0x2000);
      this.cpuMemory.mapPrgRom(0xC000, bankEnd - 0x4000, bankEnd - 0x2000);
      this.cpuMemory.mapPrgRom(0xE000, bankEnd - 0x2000, bankEnd);
    } else {
      this.cpuMemory.mapPrgRom(0x8000, bankEnd - 0x4000, bankEnd - 0x2000);
      this.cpuMemory.mapPrgRom(0xA000, R7 * 0x2000, (R7 + 1) * 0x2000);
      this.cpuMemory.mapPrgRom(0xC000, R6 * 0x2000, (R6 + 1) * 0x2000);
      this.cpuMemory.mapPrgRom(0xE000, bankEnd - 0x2000, bankEnd);      
    }
    
  }  

  handleROMWrite(address: number, value: number) {
    // This bitwise AND is used to mask out all of the "middle" bits of the address. 
    // The upper bits select which general range of addresses are being written to,
    // and the lowest bit is used to select between the two registers (even and odd)
    // within that interval
    const modAddress = address & 0xE001;

    switch (modAddress) {
      case 0x8000:
        this.targetBank =      value & 0b00000111;
        this.prgRomBankMode = (value & 0b01000000) >> 6;
        this.chrMapMode =   (value & 0b10000000) >> 7;
        this.updateBanks();
        break;  
      case 0x8001:
        this.registers[this.targetBank] = value;
        this.updateBanks();
        break;
      case 0xA000:
        if (!this.rom.settings.useFourScreenVRAM) {
          this.ppuMemory.setMirroringMode(value & 0b1 ? MirroringMode.Horizontal : MirroringMode.Vertical);
        }
        
        break;  
      case 0xA001:
        // PRG RAM protect, mainly used for write-protecting save RAM during power-off. Since that
        // is not an issue for emulators, skip implementing this
        break;
      case 0xC000:
        this.irqReloadValue = value;
        break;  
      case 0xC001:
        this.irqReload = true;
        this.irqCounter = 0;
        break;
      case 0xE000:
        this.disableIrq = true;
        this.irq = false;
        break;  
      case 0xE001:
        this.disableIrq = false;
        break;
    }
  }
}

export default MMC3Mapper;
