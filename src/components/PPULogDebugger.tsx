import React, { useCallback, useEffect, useRef, useState } from 'react';
import { hex } from '../emulator/stateLogging';
import styles from './PPUDebugging.module.css';
import EmulatorState from '../emulator/EmulatorState';

const prefixLine = (idx, str) => '[' + idx + '] ' + str
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
  const [mutedLocations, setMutedLocations] = useState(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_MUTED_LOCATIONS) ?? '[]') ?? []);

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

  const profilePPU = useCallback(() => {
    const t0 = performance.now();
    const startCycle = emulator.ppu.cycle;
    emulator.ppu.maskRenderingEnabled = true;
    emulator.ppu.maskBackgroundEnabled = true;
    emulator.ppu.maskRenderLeftSide = true;
    emulator.ppu.maskSpritesEnabled = true;
    emulator.ppu.updatePPU(emulator.ppu.masterClock + 200000000);
    const diffMs = (performance.now() - t0);
    const ntscPpuClockSpeed = 21.477272 / 3.0;
    const clockSpeed = ((emulator.ppu.cycle - startCycle) / (diffMs * 1000));
    const ratio = (clockSpeed / ntscPpuClockSpeed).toFixed(2);
    setPerfStr('Elapsed ' + diffMs.toFixed(1) + 'ms, ' + clockSpeed.toFixed(1) + 'MHz: ' + ratio);
  }, [emulator]);

  const profileCPU = useCallback(() => {
    const t0 = performance.now();
    emulator.ppu.disabled = true;
    const startCyc = emulator.CYC;

    for (let i = 0; i < 10_500_000; i++) {
     emulator.step();
    }

    emulator.ppu.disabled = false;
    const diffMs = (performance.now() - t0);
    const cpuClockSpeed = 1.789773;
    const clockSpeed = ((emulator.CYC - startCyc) / (diffMs * 1000));
    const ratio = (clockSpeed / cpuClockSpeed).toFixed(2);
    setPerfStr('Elapsed ' + diffMs.toFixed(1) + 'ms, ' + clockSpeed.toFixed(1) + ' MHz: ' + ratio);
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
