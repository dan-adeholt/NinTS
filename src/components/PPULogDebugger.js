import React, { useCallback, useEffect, useRef, useState } from 'react';
import { initMachine, step } from '../emulator/emulator';
import { hex } from '../emulator/stateLogging';
import { prefixLine } from '../tests/testutil';

const fileUrl = 'http://localhost:5000/Trace%20-%20smb.txt';
const LOCAL_STORAGE_KEY_MUTED_LOCATIONS = 'muted-locations';

const PPULogDebugger = ({ emulator, refresh, triggerRefresh }) => {
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
      dumpingState.current.initialized = true;
      Object.assign(emulator, initMachine(emulator.rom, true));
    }

    while (isMatching && lineIndex < lines.length) {
      if (lineIndex >= emulator.traceLogLines.length) {
        step(emulator);
      }

      let stateString = emulator.traceLogLines[lineIndex];

      if (stateString !== lines[lineIndex] && !mutedLocations.includes(emulator.PC)) {
        const prevStart = Math.max(lineIndex - 5, 0);
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
        <button onClick={dumpStates} disabled={lines.length === 0}>Compare trace</button>&nbsp;
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

export default React.memo(PPULogDebugger);
