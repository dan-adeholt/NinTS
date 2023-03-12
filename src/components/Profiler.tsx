import React, { useCallback, useState } from 'react';
import { DebugDialogProps } from '../DebugDialog';
import Dialog from '../Dialog';
import EmulatorState from '../emulator/EmulatorState';
import { EmptyRom, parseROM } from '../emulator/parseROM';
import PPUMemorySpace from '../emulator/mappers/PPUMemorySpace';
import CPUMemorySpace from '../emulator/mappers/CPUMemorySpace';
import parseMapper from '../emulator/mappers/parseMapper';
import PPU from '../emulator/ppu';
import classNames from 'classnames';
import styles from './PPUDebugging.module.css';
import { hex } from '../emulator/stateLogging';

const Profiler = ({ onClose, emulator } : DebugDialogProps) => {
  const [perfStr, setPerfStr] = useState<string | null>(null);

  const profileAPU = useCallback(() => {
    const testEmulator = new EmulatorState();
    testEmulator.initMachine(EmptyRom, false, null);

    const numCycles = 200000000;
    const t0 = performance.now();

    // Enable all channels
    testEmulator.apu.setAPURegisterMem(0x4015, 0b11111, 0);
    
    for (let i = 0; i < numCycles; i++) {
      testEmulator.apu.tick();
    }

    const diffMs = (performance.now() - t0);
    const clockSpeed = ((numCycles) / (diffMs * 1000));
    testEmulator.CYC = 0;
    setPerfStr('Elapsed ' + diffMs.toFixed(1) + 'ms, ' + clockSpeed.toFixed(1) + 'MHz');
  }, []);


  const profilePPU = useCallback(() => {
    const ppuMemory = new PPUMemorySpace(EmptyRom);
    const cpuMemory = new CPUMemorySpace(EmptyRom);
    const mapper = parseMapper(EmptyRom, cpuMemory, ppuMemory);
    const ppu = new PPU(EmptyRom.settings, mapper);
    const startCycle = ppu.cycle;
    ppu.maskRenderingEnabled = true;
    ppu.maskBackgroundEnabled = true;
    ppu.maskRenderLeftSide = true;
    ppu.maskSpritesEnabled = true;
    const t0 = performance.now();
    ppu.updatePPU(ppu.masterClock + 800000000);
    const diffMs = (performance.now() - t0);
    const ntscPpuClockSpeed = 21.477272 / 3.0;
    const clockSpeed = ((ppu.cycle - startCycle) / (diffMs * 1000));
    const ratio = (clockSpeed / ntscPpuClockSpeed).toFixed(2);
    setPerfStr('Elapsed ' + diffMs.toFixed(1) + 'ms, ' + clockSpeed.toFixed(1) + 'MHz, ' + ratio);
  }, []);

  const profileCPU = useCallback(async () => {
    const romRootPath = 'http://localhost:4004/';

    const romPaths = [
      'instr-test/01-basics.nes',
      'instr-test/02-implied.nes',
      'instr-test/03-immediate.nes',
      'instr-test/04-zero_page.nes',
      'instr-test/05-zp_xy.nes',
      'instr-test/06-absolute.nes',
      'instr-test/07-abs_xy.nes',
      'instr-test/08-ind_x.nes',
      'instr-test/09-ind_y.nes',
      'instr-test/10-branches.nes',
      'instr-test/11-stack.nes',
      'instr-test/12-jmp_jsr.nes',
      'instr-test/13-rts.nes',
      'instr-test/14-rti.nes',
      'instr-test/15-brk.nes',
      'instr-test/16-special.nes'
    ];

    const promises = romPaths.map(path => fetch(romRootPath + '/' + path)
      .then(response => response.arrayBuffer())
      .then(arrayBuf => {
        const rom = parseROM(new Uint8Array(arrayBuf));
        const em = new EmulatorState();
        em.initMachine(rom, false, null);
        em.ppu.disabled = true;
        em.apu.disabled = true;
        return em;
      }));

    const emulators = await Promise.all(promises);
    const t0 = performance.now();
    let totalNumCycles = 0;

    for (const emulator of emulators) {
      let testIsRunning = false;
      let testIsDone = false;
      const startCycle = emulator.CYC;

      while (!testIsDone) {
        const emulatorStatus = emulator.step();
        if (!emulatorStatus) {
          console.error('Invalid status');
          break;
        }

        const status = emulator.readMem(0x6000);

        if (testIsRunning && status !== 0x80) {
          if (status === 0x81) {
            emulator.reset();
          } else {
            if (status !== 0x00) {
              let testText = '';

              for (let i = 0x6004; emulator.readMem(i) !== 0; i++) {
                testText += String.fromCharCode(emulator.readMem(i));
              }

              console.error('Failed with status: ', hex(status) + ' - ' + testText);
            }
            testIsDone = true;
            totalNumCycles += (emulator.CYC - startCycle);
          }
        } else if (!testIsRunning) {
          testIsRunning = status === 0x80;
        }
      }
    }

    const diffMs = (performance.now() - t0);
    const clockSpeed = ((totalNumCycles) / (diffMs * 1000));

    setPerfStr('Elapsed ' + diffMs.toFixed(1) + 'ms, ' + clockSpeed.toFixed(1) + 'MHz');
  }, [emulator]);

  return (
    <Dialog onClose={onClose} title="Profiler">
      <div className={styles.inputRow}>
        <button onClick={profileAPU}>Profile APU</button>
        <button onClick={profilePPU}>Profile PPU</button>
        <button onClick={profileCPU}>Profile CPU</button>
      </div>
      <div className={classNames(styles.hexViewer, styles.profiler)}>
        { perfStr }
      </div>
    </Dialog>
  );
};

export default React.memo(Profiler);
