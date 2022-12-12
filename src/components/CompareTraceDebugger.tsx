import React, { useCallback, useRef, useState } from 'react';
import { DebugDialogProps } from '../DebugDialog';
import Dialog from '../Dialog';
import styles from './PPUDebugging.module.css';
import classNames from 'classnames';
import { hex } from '../emulator/stateLogging';

const prefixLine = (idx: number, str: string) => '[' + idx + '] ' + str
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

type DumpingState = {
  lineIndex: number,
  initialized: boolean
  lines: string[]
}


const LOCAL_STORAGE_KEY_LAST_COMPARE_URL = 'last-compare-url';

const CompareTraceDebugger = ({ emulator, isOpen, onClose, onRefresh } : DebugDialogProps) => {
  const [fileUrl, setFileUrl] = useState((localStorage.getItem(LOCAL_STORAGE_KEY_LAST_COMPARE_URL) as string) ?? '');

  const _setFileUrl = (newUrl: string) => {
    setFileUrl(newUrl);
    localStorage.setItem(LOCAL_STORAGE_KEY_LAST_COMPARE_URL, newUrl);
  }

  const [error, setError] = useState<ErrorType | null>(null);
  const [mutedLocations, setMutedLocations] = useState<number[]>(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_MUTED_LOCATIONS) ?? '[]') ?? []);

  const dumpingState = useRef<DumpingState>({
    lineIndex: 0,
    initialized: false,
    lines: []
  });

  const [loading, setLoading] = useState(false);

  const compare = useCallback(async () => {
    let text = null;
    if (dumpingState.current.lines.length === 0) {
      setLoading(true);
      try {
        text = await fetch(fileUrl)
          .then(res => {
            if (res.status !== 200) {
              throw new Error();
            }
            return res.text()
          });

        dumpingState.current.lines = text.split('\r\n');
      } catch(err) {
        setError({
          expected: '',
          found: 'Failed to load file',
          prevLines: [],
          debug: [
            {
              name: 'busLatch',
              value: 0
            }
          ]
        })
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    const lines = dumpingState.current.lines;
    let lineIndex = dumpingState.current.lineIndex;

    if (!dumpingState.current.initialized) {
      dumpingState.current.initialized = true;
      emulator.initMachine(emulator.rom, true, null);
    }

    while (lineIndex < lines.length) {
      if (lineIndex >= emulator.traceLogLines.length) {
        emulator.step();
      }
      const stateString = emulator.traceLogLines[lineIndex];

      if (stateString !== lines[lineIndex] && !mutedLocations.includes(emulator.PC)) {
        const prevStart = Math.max(lineIndex - 20, 0);
        const prevEnd = Math.max(lineIndex, 0);
        const prevLines = lines.slice(prevStart, prevEnd);

        onRefresh();

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
  }, [emulator, mutedLocations, onRefresh, fileUrl]);

  const mute = useCallback(() => {
    const newMutedLocations = mutedLocations.concat([emulator.PC])
    setMutedLocations(newMutedLocations);
    localStorage.setItem(LOCAL_STORAGE_KEY_MUTED_LOCATIONS, JSON.stringify(newMutedLocations));
  }, [emulator, mutedLocations]);

  const clearMuted = useCallback(() => {
    setMutedLocations([]);
    localStorage.setItem(LOCAL_STORAGE_KEY_MUTED_LOCATIONS, JSON.stringify([]));
  }, []);

  return (
    <Dialog onClose={onClose} isOpen={isOpen} title="Compare trace debugger">
      <div className={styles.inputRow}>
        <input value={fileUrl} onChange={e => _setFileUrl(e.target.value)}/>
        <button disabled={loading} onClick={compare}>Compare</button>
        <button disabled={loading} onClick={mute}>Mute</button>
        <button disabled={loading} onClick={clearMuted}>Clear muted</button>
      </div>
      <div className={classNames(styles.monospace, styles.compareTraceDebugger)}>
        { loading && 'Loading..' }
        { error && (
          <>
            { error.prevLines.map(prevLine => prevLine + '\n')}
            <span className={styles.expected}>{ error.expected } </span><br/>
            <span className={styles.found}>{ error.found}</span>
            <br/>
            { error.debug.map(debugInfo => debugInfo.name + ' = ' + hex(debugInfo.value) + '\n') }
          </>
        ) }
      </div>

    </Dialog>
  );
};

export default React.memo(CompareTraceDebugger);
