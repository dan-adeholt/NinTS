import { hex, hex16, stateToString } from './stateLogging';
import { OAM_DMA, opcodeMetadata, opcodeTable } from './cpu';

import PPU from './ppu';
import { irq, nmi } from './instructions/stack';
import parseMapper from './mappers/parseMapper';
import _ from 'lodash';
import APU from './apu';
import NROMMapper from "./mappers/NROMMapper";
import { EmptyRom, Rom, RomSettings } from "./parseROM";
import PPUMemorySpace from "./mappers/PPUMemorySpace";
import CPUMemorySpace from "./mappers/CPUMemorySpace";
import Mapper from "./mappers/Mapper";
import { P_REG_INTERRUPT } from './instructions/util';

export const INPUT_A        = 0b00000001;
export const INPUT_B        = 0b00000010;
export const INPUT_SELECT   = 0b00000100;
export const INPUT_START    = 0b00001000;
export const INPUT_UP       = 0b00010000;
export const INPUT_DOWN     = 0b00100000;
export const INPUT_LEFT     = 0b01000000;
export const INPUT_RIGHT    = 0b10000000;

export const LOCAL_STORAGE_KEY_AUTOLOAD = 'setting-autoload';

const cpuStep = 12;
const cpuHalfStep = cpuStep / 2;

const ignoredKeys = [
  'mapper.ppuMemory.memory',
  'mapper.ppuMemory.chrSource',
  'mapper.cpuMemory.memory',
  'mapper.cpuMemory.prgRom',
  'ppu.mapper',
  'ppu.framebuffer',
  'traceLogLines',
  'breakpoints',
  'enableTraceLogging',
  'rom'
];

/* eslint-disable @typescript-eslint/no-explicit-any */
const readObjectState = (state : any, data: any) => {
  _.forOwn(state, (value, key) => {
    const storedValue = data[key];

    if (storedValue === undefined) {
      return;
    }

    if (!_.isArray(value) && _.isObject(value)) {
      if (value.constructor === Uint8Array) {
        state[key].set(Uint8Array.from(storedValue));
      } else if (value.constructor === Uint32Array) {
        state[key].set(Uint32Array.from(storedValue));
      } else {
        readObjectState(value, storedValue);
      }
    } else {
      state[key] = storedValue;
    }
  });
}

const dumpObjectState = (state : any, prefix = '') => {
  const dumpedState: any = {};

  _.forOwn(state, (value, key) => {
    if (ignoredKeys.includes(prefix + key) || _.isFunction(value)) {
      return;
    }

    if (!_.isArray(value) && _.isObject(value)) {
      if (value.constructor === Uint8Array || value.constructor === Uint32Array) {
        dumpedState[key] = Array.from(value);
      } else {
        dumpedState[key] = dumpObjectState(value, prefix + key + '.');
      }
    } else {
      dumpedState[key] = value;
    }
  });

  return dumpedState;
}

/* eslint-enable @typescript-eslint/no-explicit-any */

class EmulatorState {
  A = 0;
  X = 0;
  Y = 0;
  P = 0x4;
  PC = 0;
  SP = 0;
  masterClock = cpuStep; // For some reason the master clock is set forward 1 cycle in Mesen. Causes PPU to get delayed.
  ppuOffset = 1; // But there is also a PPU offset - very weird.
  cpuStep = cpuStep;
  cpuHalfStep = cpuHalfStep;
  mapper: Mapper
  // https://wiki.nesdev.com/w/index.php/CPU_interrupts#IRQ_and_NMI_tick-by-tick_execution - 7 cycles for reset routine. But mesen takes 8 for some reason,
  // set it to match.
  CYC = -1;
  settings: RomSettings;
  breakpoints = {};
  apu: APU;
  ppu: PPU;
  irqCounter = 0;
  irqCounterActive = false;
  nmiCounter = 0;
  nmiCounterActive = false;
  traceLogLines: string[] = [];
  controller1 = 0;
  controller2 = 0;
  controller1Latch = 0;
  controller2Latch =  0;
  enableTraceLogging = false;
  rom: Rom
  lastNMI = 0;
  lastNMIOccured = false;
  audioSampleCallback: ((sample: number) => void) | null
  ppuMemory: PPUMemorySpace
  cpuMemory: CPUMemorySpace
  prevNmiOccurred = false;
  prevApuFrameInterrupt = false;
  triggerBreak = false

  constructor() {
    const rom = EmptyRom;
    this.ppuMemory = new PPUMemorySpace(EmptyRom);
    this.cpuMemory = new CPUMemorySpace(EmptyRom);
    this.mapper = new NROMMapper(rom, this.cpuMemory, this.ppuMemory);
    this.ppu = new PPU(EmptyRom.settings, this.mapper);
    this.apu = new APU(null);
    this.audioSampleCallback = null;
    this.rom = EmptyRom;
    this.settings = EmptyRom.settings;
  }

  reboot() {
    this.initMachine(this.rom, this.enableTraceLogging, this.audioSampleCallback);
  }

  initMachine(rom : Rom, enableTraceLogging = false, audioSampleCallback : ((sample: number) => void) | null) {
    this.ppuMemory = new PPUMemorySpace(rom);
    this.cpuMemory = new CPUMemorySpace(rom);
    this.mapper = parseMapper(rom, this.cpuMemory, this.ppuMemory);
    this.ppu = new PPU(rom.settings, this.mapper);
    this.audioSampleCallback = audioSampleCallback;

    // Reset vector
    const startingLocation = this.mapper.cpuMemory.read(0xFFFC) + (this.mapper.cpuMemory.read(0xFFFD) << 8);

    this.apu = new APU(audioSampleCallback);
    this.A = 0;
    this.X = 0;
    this.Y = 0;
    this.P = 0x4;
    this.PC = startingLocation;
    this.SP = 0xFD;
    this.masterClock = cpuStep; // For some reason the master clock is set forward 1 cycle in Mesen. Causes PPU to get delayed.
    this.ppuOffset = 1; // But there is also a PPU offset - very weird.
      // https://wiki.nesdev.com/w/index.php/CPU_interrupts#IRQ_and_NMI_tick-by-tick_execution - 7 cycles for reset routine. But mesen takes 8 for some reason,
    // set it to match.
    this.CYC = -1;
    this.settings = rom.settings;
    this.breakpoints = {};
    this.nmiCounter = 0;
    this.nmiCounterActive = false;
    this.traceLogLines = [];
    this.controller1 = 0;
    this.controller2 = 0;
    this.controller1Latch = 0;
    this.controller2Latch = 0;
    this.enableTraceLogging = enableTraceLogging;
    this.rom = rom;
    this.lastNMI = 0;
    this.lastNMIOccured = false;
    this.audioSampleCallback = audioSampleCallback;

    // Align with Mesen: CPU takes 8 cycles before it starts executing ROM code
    for (let i = 0; i < 8; i++) {
      this.dummyReadTick();
    }

    if (!import.meta.env.VITEST && localStorageAutoloadEnabled()) {
      this.loadEmulatorFromLocalStorage();
    }

    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadEmulator(data : any) {
    readObjectState(this, data);
    this.mapper.reload();
  }

  saveEmulator() {
    return dumpObjectState(this);
  }

  saveEmulatorToLocalStorage() {
    if (this.rom != null) {
      const key = 'save-' + this.rom.romSHA;
      localStorage.setItem(key, JSON.stringify(this.saveEmulator()));
    }
  }

  loadEmulatorFromLocalStorage() {
    if (this.rom != null) {
      const key = 'save-' + this.rom.romSHA;
      const savegame = localStorage.getItem(key);

      if (savegame != null) {
        const parsed = JSON.parse(savegame);
        this.loadEmulator(parsed);
      }
    }
  }

  setInputController(button: number, isDown: boolean) {
    const mask = ~button;

    this.controller1 &= mask;

    if (isDown) {
      this.controller1 |= button;
    }
  }

  readControllerMem(addr: number, peek: boolean) {
    let openBus = 0x40;

    // TODO: Mesen peeks 0 value but returns open bus bits
    if (peek) {
      openBus = 0;
    }

    let value;

    if (addr === 0x4016) {
      value = this.controller1Latch & 0x1;
      if (!peek) {
        this.controller1Latch >>= 1;
      }
    } else {
      value = this.controller2Latch & 0x1;

      if (!peek) {
        this.controller2Latch >>= 1;
      }
    }

    return openBus | value;
  }

  readMem (addr: number, peek = false): number {
    if (addr >= 0x2000 && addr <= 0x3FFF) {
      const modAddr = 0x2000 + (addr & 0b111);
      const ret = this.ppu.readPPURegisterMem(modAddr, peek);

      if (ret == null) {
        console.log('Attempted to read from', hex16(modAddr));
      }

      return ret;
    } else if (addr === 0x4016 || addr === 0x4017) {
      return this.readControllerMem(addr, peek);
    } else if (addr >= 0x4000 && addr <= 0x4016) {
      return this.apu.readAPURegisterMem(addr, peek);
    } else {
      return this.mapper.cpuMemory.read(addr);
    }
  }

  setInputMem(addr: number, value: number) {
    if (value === 1) {
      if (addr === 0x4016) {
        this.controller1Latch = this.controller1;
      } else {
        this.controller2Latch = this.controller2;
      }
    }
  }

  writeDMA(address: number, value: number) {
    // The actual write really takes place AFTER the write tick has been completed.
    // Thus whether or not the cycle is odd is determined based on the following tick.
    // That's why we add 1 here. TODO: Do actual DMA transfer after tick instead
    const onOddCycle = (this.CYC + 1) % 2 === 1;

    this.dummyReadTick(); // One wait this.cycle while waiting for writes to complete

    if (onOddCycle) { // One additional wait this.if we were on an odd cycle
      this.dummyReadTick();
    }

    const baseAddress = value << 8;

    for (let i = 0; i < 256; i++) {
      const address = baseAddress + i;
      this.startReadTick();
      const value = this.readMem(address);
      this.endReadTick();
      this.dummyReadTick();
      this.ppu.pushOAMValue(value);
    }
  }

  setMem(address: number, value: number) {
    // if (address === 0xF0) {
    //   console.log('WRITE f0', value);
    //   this.triggerBreak = true;
    // }

    // TODO: Add mirroring here
    if (address === OAM_DMA) {
      this.writeDMA(address, value);
    } else if (address >= 0x2000 && address <= 0x3FFF) {
      this.ppu.setPPURegisterMem(0x2000 + (address % 8), value);
    } else if (address === 0x4016) {
      this.setInputMem(address, value);
    } else if (address >= 0x4000 && address <= 0x4017) {
      this.apu.setAPURegisterMem(address, value, this.CYC);
    } else if (address >= 0x8000 && address < 0xFFFF) {
      this.mapper.handleROMWrite(address, value);
    } else {
      this.mapper.cpuMemory.write(address, value);
    }

    return value;
  }

  getResetVectorAddress(): number {
    return this.readMem(0xFFFC) + (this.readMem(0xFFFD) << 8);
  }

  reset() {
    this.PC = this.getResetVectorAddress();
  }

  stepFrame(breakAfterScanlineChange: boolean) {
    let hitBreakpoint = false;
    const vblankCount = this.ppu.vblankCount;

    const prevScanline = this.ppu.scanline;
    while (!hitBreakpoint && vblankCount === this.ppu.vblankCount) {

      if (!this.step()) {
        break;
      }

      hitBreakpoint = this.PC in this.breakpoints;

      if (this.apu.triggerBreak || this.triggerBreak) {
        hitBreakpoint = true;
        this.triggerBreak = false;
        this.apu.triggerBreak = false;
      }

      if (breakAfterScanlineChange) {
        hitBreakpoint = prevScanline !== this.ppu.scanline;
      }
    }


    return hitBreakpoint;
  }

  _updatePPUAndHandleNMI() {
    this.ppu.updatePPU(this.masterClock - this.ppuOffset);
    this.apu.update(this.masterClock);

    // From NESDEV:
    // The NMI input is connected to an edge detector. This edge detector polls the status of the NMI line during φ2 of each
    // CPU cycle (i.e., during the second half of each cycle) and raises an internal signal if the input goes from being high
    // during one cycle to being low during the next. The internal signal goes high during φ1 of the cycle that follows the one
    // where the edge is detected, and stays high until the NMI has been handled.
    // This basically means that we detected the NMI this cycle, but we should not trigger the actual NMI until the next cycle.
    // Set an internal counter that will tick down each cycle until reaching zero. nmiCounter === 0 means that the emulator should
    // handle the NMI after the current opcode has completed execution.
    if (this.ppu.nmiOccurred && !this.prevNmiOccurred && this.ppu.controlGenerateNMI) {
      this.nmiCounterActive = true;
      this.nmiCounter = 1;
    } else if (this.nmiCounterActive) {
      this.nmiCounter--;
    }

    // The IRQ input is connected to a level detector. If a low level is detected on the IRQ input during φ2 of a cycle, an internal
    // signal is raised during φ1 the following cycle, remaining high for that cycle only (or put another way, remaining high as long
    // as the IRQ input is low during the preceding cycle's φ2).
    //
    // APU Frame interrupt occurred. Like with the NMI; trigger after current cycle.
    if (this.apu.frameInterrupt && !this.prevApuFrameInterrupt && ((this.P & P_REG_INTERRUPT) === 0))
    {
      this.irqCounterActive = true;
      this.irqCounter = 1;
    } else if (this.irqCounterActive) {
      this.irqCounter--;
    }
  }

  /**
   * Mesen compatible ways of ticking, split the cycle updating into two phases
   * and update the PPU in both instances. Perhaps helps with accuracy in some way I
   * do not understand yet.
   */

  dummyReadTick() {
    this.startReadTick();
    this.endReadTick();
  }

  startReadTick() {
    this.CYC++;
    this.masterClock += this.cpuHalfStep - 1;
    this.prevNmiOccurred = this.ppu.nmiOccurred;
    this.prevApuFrameInterrupt = this.apu.frameInterrupt;
    this.ppu.updatePPU(this.masterClock - this.ppuOffset);
    this.apu.update(this.masterClock);
  }

  endReadTick() {
    this.masterClock += this.cpuHalfStep + 1;
    this._updatePPUAndHandleNMI();
  }

  startWriteTick() {
    this.CYC++;
    this.masterClock += this.cpuHalfStep + 1;
    this.prevNmiOccurred = this.ppu.nmiOccurred;
    this.prevApuFrameInterrupt = this.apu.frameInterrupt;
    this.ppu.updatePPU(this.masterClock - this.ppuOffset);
    this.apu.update(this.masterClock);
  }

  endWriteTick() {
    this.masterClock += this.cpuHalfStep - 1;
    this._updatePPUAndHandleNMI();
  }

  /**
   * So Mesen logs trace statements in a really weird way. In order to be
   * compatible we have to log our traces at a very particular point in time.
   *
   * Basically, Mesen logs the last trace statement when fetching the opcode
   * for the next statement. But at that point in time, one CPU cycle has
   * already passed. Which means that the cycle count in the trace statement
   * is one more than it would be otherwise. That would be fairly easy to
   * simulate, but the problem is that the PPU has ALSO had time to execute
   * some cycles.
   *
   * Mesen implements their ticks somewhat differently than we do, they split
   * the cycle into two phases. In the first phase the cycle count is incremented
   * and the master clock is updated with 5 cycles (for read operations) and 7 cycles
   * (for write operations). Then the actual this.is updated. Then the second phase
   * is executed, and then it is inverted: 7 cycles for read operations, 5 cycles for
   * write operations. I do not know why they do it this way; we might end up doing
   * something similar for all our ticks. But right now we only do it for the opcodes.
   *
   * Now the actual trace statement is actually recorded after the first phase of the
   * opcode read has taken place, which means that the cycle count has been updated
   * with 1 and the master clock has been incremented by 5 (read operation). So at
   * that particular point in time we also record our trace statement.
   *
   * The reason they do it this way is that they implement logging by listening
   * to memory accesses.
   *
   */
  readOpcode() {
    this.startReadTick();

    if (this.enableTraceLogging) {
      if (this.lastNMIOccured && this.lastNMI <= this.CYC) {

        this.traceLogLines.push('[NMI - Cycle: ' + (this.lastNMI) + ']');
        this.lastNMIOccured = false;
      }

      this.traceLogLines.push(stateToString(this));
    }

    const opcode = this.readMem(this.PC);
    this.endReadTick();

    this.PC = (this.PC + 1) & 0xFFFF;
    return opcode;
  }

  step() {
    const opcode = this.readOpcode();

    if (opcode in opcodeTable) {
      opcodeTable[opcode](this);
    } else {
      console.error('No handler found for opcode $' + hex(opcode === undefined ? -1 : opcode), opcodeMetadata[opcode]?.name ?? '', hex(this.PC));
      return false;
    }

    // This actually annoys me a bit, if an NMI triggers we won't get the log output from the preceding opcode.
    // But this is the way Mesen does it so we do it to stay compatible.
    if (this.nmiCounterActive && this.nmiCounter <= 0) {
      this.nmiCounterActive = false;

      if (this.ppu.controlGenerateNMI) {
        nmi(this);
      }

      this.lastNMI = this.CYC;
      this.lastNMIOccured = true;
    }

    if (this.irqCounterActive && this.irqCounter <= 0) {
      this.irqCounterActive = false;
      irq(this);
    }


    return true;
  }
}

export const localStorageAutoloadEnabled = () => {
  const autoload = localStorage.getItem(LOCAL_STORAGE_KEY_AUTOLOAD);
  return autoload != null && JSON.parse(autoload) === true;
}

export const setLocalStorageAutoloadEnabled = (enabled: boolean) => {
  localStorage.setItem(LOCAL_STORAGE_KEY_AUTOLOAD, JSON.stringify(enabled));
}


export default EmulatorState;

