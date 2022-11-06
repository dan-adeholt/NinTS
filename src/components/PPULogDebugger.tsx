import React, { useCallback, useEffect, useRef, useState } from 'react';
import { hex } from '../emulator/stateLogging';
import styles from './PPUDebugging.module.css';
import EmulatorState  from '../emulator/EmulatorState';
import { EmptyRom, parseROM } from '../emulator/parseROM';
import PPUMemorySpace from '../emulator/mappers/PPUMemorySpace';
import CPUMemorySpace from '../emulator/mappers/CPUMemorySpace';
import parseMapper from '../emulator/mappers/parseMapper';
import PPU from '../emulator/ppu';
import { NTSC_CPU_CYCLES_PER_SECOND } from '../emulator/apu';

const prefixLine = (idx: number, str: string) => '[' + idx + '] ' + str
const fileUrl: string | null = 'http://localhost:5000/Trace%20-%20zelda2.txt';
const LOCAL_STORAGE_KEY_MUTED_LOCATIONS = 'muted-locations';

type ErrorDebugEntry = {
  name: string
  value: number
}

type ErrorType = {
  expected: string
  found: string
  prevLines: string[]
  debug: ErrorDebugEntry[]
}

type PPULogDebuggerProps = {
  emulator: EmulatorState
  triggerRefresh: () => void
}

const PPULogDebugger = ({ emulator, triggerRefresh } : PPULogDebuggerProps) => {
  const [lines, setLines] = useState<string[]>([]);
  const [error, setError] = useState<ErrorType | null>(null);
  const [mutedLocations, setMutedLocations] = useState<number[]>(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_MUTED_LOCATIONS) ?? '[]') ?? []);

  useEffect(() => {
    if (fileUrl !== '') {
      fetch(fileUrl)
        .then(res => res.text())
        .then(text => {
          setLines(text.split('\r\n'));
        })
          .catch(() => {
            // console.error(e);
          })
    }
  }, []);

  const dumpingState = useRef({
    lineIndex: 0,
    initialized: false
  });

  const dumpStates = useCallback(() => {
    const isMatching = true;

    let lineIndex = dumpingState.current.lineIndex;

    if (!dumpingState.current.initialized) {
      dumpingState.current.initialized = true;
      Object.assign(emulator, emulator.initMachine(emulator.rom, true, null));
    }

    while (isMatching && lineIndex < lines.length) {
      if (lineIndex >= emulator.traceLogLines.length) {
        emulator.step();
      }

      const stateString = emulator.traceLogLines[lineIndex];

      if (stateString !== lines[lineIndex] && !mutedLocations.includes(emulator.PC)) {
        const prevStart = Math.max(lineIndex - 20, 0);
        const prevEnd = Math.max(lineIndex, 0);
        const prevLines = lines.slice(prevStart, prevEnd);

        triggerRefresh();

        setError({
          expected: prefixLine(lineIndex, lines[lineIndex]),
          found: prefixLine(lineIndex, stateString),
          prevLines: prevLines.map((line, j) => prefixLine(prevStart + j, line)),
          debug: [
            {
              name: 'busLatch',
              value: emulator.ppu.busLatch
            }
          ]
        });

        lineIndex++;
        break;
      }


      lineIndex++;
    }

    dumpingState.current.lineIndex = lineIndex;
  }, [emulator, lines, mutedLocations, triggerRefresh]);

  const [perfStr, setPerfStr] = useState<string | null>(null);

  const profileAPU = useCallback(() => {
    let numSamples = 0;
    const onSample = () => {
      numSamples++;
    };

    const testEmulator = new EmulatorState();
    testEmulator.initMachine(EmptyRom, false, onSample);
    testEmulator.CYC = 0;

    const numSeconds = 20;

    while(testEmulator.CYC < (NTSC_CPU_CYCLES_PER_SECOND * numSeconds)) {
      testEmulator.stepFrame(false);
    }

    setPerfStr('Num samples: ' + numSamples / numSeconds);
  }, []);


  const profilePPU = useCallback(() => {
    const t0 = performance.now();
    const startCycle = emulator.ppu.cycle;
    const ppuMemory = new PPUMemorySpace(EmptyRom);
    const cpuMemory = new CPUMemorySpace(EmptyRom);
    const mapper = parseMapper(EmptyRom, cpuMemory, ppuMemory);
    const ppu = new PPU(EmptyRom.settings, mapper);
    ppu.maskRenderingEnabled = true;
    ppu.maskBackgroundEnabled = true;
    ppu.maskRenderLeftSide = true;
    ppu.maskSpritesEnabled = true;
    ppu.updatePPU(ppu.masterClock + 800000000);
    const diffMs = (performance.now() - t0);
    const ntscPpuClockSpeed = 21.477272 / 3.0;
    const clockSpeed = ((ppu.cycle - startCycle) / (diffMs * 1000));
    const ratio = (clockSpeed / ntscPpuClockSpeed).toFixed(2);
    setPerfStr('Elapsed ' + diffMs.toFixed(1) + 'ms, ' + clockSpeed.toFixed(1) + 'MHz: ' + ratio);
  }, []);

  const profileCPU = useCallback(async () => {
    const romRootPath = 'http://localhost:5173/src/tests/roms/';

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
        return em;
      }));

    const emulators = await Promise.all(promises);
    const t0 = performance.now();

    for (const emulator of emulators) {
      let testIsRunning = false;
      let testIsDone = false;

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
          }
        } else if (!testIsRunning) {
          testIsRunning = status === 0x80;
        }
      }
    }

    const diffMs = (performance.now() - t0);
    setPerfStr('Elapsed ' + diffMs.toFixed(1) + 'ms');
  }, [emulator]);

  const mute = useCallback(() => {
    console.log('Muting', hex(emulator.PC), emulator.PC);
    setMutedLocations(oldMutedLocations => oldMutedLocations.concat([emulator.PC]));
  }, [emulator]);

  const clearMuted = useCallback(() => {
    setMutedLocations([]);
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_MUTED_LOCATIONS, JSON.stringify(mutedLocations));
  }, [mutedLocations]);

  return (
    <>
      <div>
        <button onClick={profileAPU}>Profile APU</button>
        <button onClick={profilePPU}>Profile PPU</button>
        <button onClick={profileCPU}>Profile CPU</button>
        <button onClick={dumpStates} disabled={lines.length === 0}>Compare trace</button>
        <button onClick={mute}>Mute</button>
        <button onClick={clearMuted}>Clear muted</button>
        <br/>
        { perfStr }
      </div>
      { error && (
        <div className={styles.monospace}>
          { error.prevLines.map(prevLine => prevLine + '\n')}
          <span className={styles.expected}>{ error.expected } </span><br/>
          <span className={styles.found}>{ error.found}</span>
          <br/>
          { error.debug.map(debugInfo => debugInfo.name + ' = ' + hex(debugInfo.value) + '\n') }
        </div>
      )}
    </>
  );
};

export default React.memo(PPULogDebugger);
