import React, { useCallback, useEffect, useRef, useState } from 'react';
import { step } from '../emulator/emulator';
import { hex, stateToStringMesen } from '../emulator/stateLogging';
import { prefixLine } from '../tests/testutil';

const fileUrl = 'http://localhost:5000/Trace%20-%20iceclimber.txt';
const LOCAL_STORAGE_KEY_MUTED_LOCATIONS = 'muted-locations';

const PPULogDebugger = ({ emulator, refresh }) => {
  const [lines, setLines] = useState([]);
  const [error, setError] = useState(null);
  const [mutedLocations, setMutedLocations] = useState(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_MUTED_LOCATIONS) ?? []) ?? []);

  useEffect(() => {
    if (fileUrl !== '') {
      fetch(fileUrl)
        .then(res => res.text())
        .then((text, t2) => {
          setLines(text.split('\r\n'));
        })
    }
  }, []);

  const dumpingState = useRef({
    lineIndex: 0,
    initialized: false
  });

  const dumpStates = useCallback(() => {

    let isMatching = true;

    let lineIndex = dumpingState.current.lineIndex;

    if (!dumpingState.current.initialized) {
      // Adapt to Mesen emulator - their reset routine takes 8 cycles
      emulator.CYC = 8;
      // And apparently their PPU is out of sync with CPU at boot.
      emulator.ppu.cycle = 27;
      emulator.ppu.scanlineCycle = 27;
      // Also, Mesen sets bits 4&5 to zero at boot. They are irrelevant for the CPU: https://wiki.nesdev.com/w/index.php/Status_flags#The_B_flag
      // so just set them to match.
      emulator.P = 0x4;
      dumpingState.current.initialized = true;
    }

    while (isMatching && lineIndex < lines.length) {
      let stateString = stateToStringMesen(emulator, false, true);

      if (stateString !== lines[lineIndex] && !mutedLocations.includes(emulator.PC)) {
        const prevStart = Math.max(lineIndex - 5, 0);
        const prevEnd = Math.max(lineIndex, 0);
        const prevLines = lines.slice(prevStart, prevEnd);

        if (emulator.lastNMI === emulator.CYC) {
          const nmiString = '[NMI - Cycle: ' + (emulator.lastNMI - 1) + ']';
          if (nmiString === lines[lineIndex]) {
            lineIndex++;
            continue;
          } else {
            setError({
              expected: prefixLine(lineIndex, nmiString),
              found: prefixLine(lineIndex, stateString),
              prevLines: prevLines.map((line, j) => prefixLine(prevStart + j, line)),
              debug: [
                {
                  name: 'busLatch',
                  value: emulator.ppu.busLatch
                }
              ]
            });
            break;

          }
        } else {
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

          break;
        }
      }

      step(emulator);
      lineIndex++;
    }

    dumpingState.current.lineIndex = lineIndex;
  }, [emulator, lines, mutedLocations]);

  const mute = useCallback(() => {
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
        <button onClick={dumpStates}>Compare trace</button>&nbsp;
        <button onClick={mute}>Mute</button>&nbsp;
        <button onClick={clearMuted}>Clear muted</button>&nbsp;
      </div>
      { error && (
        <div className="monospace">
          { error.prevLines.map(prevLine => prevLine + '\n')}
          <span className="expected">{ error.expected } </span><br/>
          <span className="found">{ error.found}</span>
          <br/>
          { error.debug.map(debugInfo => debugInfo.name + ' = ' + hex(debugInfo.value) + '\n') }
        </div>
      )}
    </>
  );
};

PPULogDebugger.propTypes = {};

export default PPULogDebugger;