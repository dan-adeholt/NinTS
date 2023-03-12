import React, { useCallback, useRef, useState } from 'react';
import { DebugDialogProps } from '../DebugDialog';
import Dialog from '../Dialog';
import styles from './PPUDebugging.module.css';
import classNames from 'classnames';
import { hex } from '../emulator/stateLogging';
import { LOCAL_STORAGE_KEY_MUTED_LOCATIONS_PREFIX } from './types';

const prefixLine = (idx: number, str: string) => '[' + idx + '] ' + str

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

type PhaseConstant = 'idle' | 'loading' | 'comparing' | 'success' | 'error'

type Phase = {
  phase: PhaseConstant
  data: string | ErrorType | null
}

function phaseToString(phase: Phase) {
  switch (phase.phase) {
    case 'idle':
      return '';
    case 'loading':
      return 'Loading...';
    case 'comparing':
      return 'Comparing...';
    case 'error':
      return 'Error';
    case 'success':
      return 'Successful, no difference'
  }
}

const CompareTraceDebugger = ({ emulator, onClose, onRefresh } : DebugDialogProps) => {
  const fileUrl = (localStorage.getItem(LOCAL_STORAGE_KEY_LAST_COMPARE_URL + '-' + emulator.rom?.romSHA) as string) ?? '';

  const _setFileUrl = (newUrl: string) => {
    localStorage.setItem(LOCAL_STORAGE_KEY_LAST_COMPARE_URL + '-' + emulator.rom?.romSHA, newUrl);
    onRefresh();
  }

  const [phase, setPhase] = useState<Phase>({
    phase: 'idle',
    data: null
  });

  const [mutedLocations, setMutedLocations] = useState<number[]>(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_MUTED_LOCATIONS_PREFIX + emulator.rom?.romSHA) ?? '[]') ?? []);

  const dumpingState = useRef<DumpingState>({
    lineIndex: 0,
    initialized: false,
    lines: []
  });

  const compare = useCallback(async () => {
    let text = null;

    if (dumpingState.current.lineIndex === dumpingState.current.lines.length) {
      dumpingState.current.lineIndex = 0;
      dumpingState.current.initialized = false;
      setPhase({
        phase: 'comparing',
        data: null
      });
    }

    if (dumpingState.current.lines.length === 0) {
      setPhase({
        phase: 'loading',
        data: null
      });

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
        setPhase({
          phase: 'error',
          data: {
            expected: '',
            found: 'Failed to load file',
            prevLines: [],
            debug: [
              {
                name: 'busLatch',
                value: 0
              }
            ]
          }
        });

        return;
      }

      setPhase({
        phase: 'comparing',
        data: null
      });
    }

    const lines = dumpingState.current.lines;
    let lineIndex = dumpingState.current.lineIndex;

    if (!dumpingState.current.initialized) {
      dumpingState.current.initialized = true;
      emulator.initMachine(emulator.rom, true, null);
    }

    let success = true;

    while (lineIndex < lines.length) {
      if (lineIndex >= emulator.traceLogLines.length) {
        emulator.step();
      }
      const stateString = emulator.traceLogLines[lineIndex];

      if (lines[lineIndex] === '') {
        // End of file
        lineIndex++;
        break;
      }

      if (stateString !== lines[lineIndex] && !mutedLocations.includes(emulator.PC)) {
        const prevStart = Math.max(lineIndex - 19, 0);
        const prevEnd = Math.max(lineIndex, 0);
        const prevLines = lines.slice(prevStart, prevEnd);

        success = false,
        onRefresh();
        setPhase({
          phase: 'error',
          data: {
            expected: prefixLine(lineIndex, lines[lineIndex]),
            found: prefixLine(lineIndex, stateString),
            prevLines: prevLines.map((line, j) => prefixLine(prevStart + j, line)),
            debug: [
              {
                name: 'busLatch',
                value: emulator.ppu.busLatch
              }
            ]
          }
        })

        lineIndex++;
        break;
      }

      lineIndex++;
    }

    if (success) {
      setPhase({
        phase: 'success',
        data: null
      })
    }

    dumpingState.current.lineIndex = lineIndex;
  }, [emulator, mutedLocations, onRefresh, fileUrl]);

  const mute = useCallback(() => {
    const newMutedLocations = mutedLocations.concat([emulator.PC])
    setMutedLocations(newMutedLocations);
    localStorage.setItem(LOCAL_STORAGE_KEY_MUTED_LOCATIONS_PREFIX + emulator.rom?.romSHA, JSON.stringify(newMutedLocations));
  }, [emulator, mutedLocations]);

  const clearMuted = useCallback(() => {
    setMutedLocations([]);
    localStorage.setItem(LOCAL_STORAGE_KEY_MUTED_LOCATIONS_PREFIX + emulator.rom?.romSHA, JSON.stringify([]));
  }, []);

  const errorDetails = phase.phase === 'error' ? phase.data as ErrorType : null
  const isLoadingOrComparing = phase.phase === 'loading' || phase.phase === 'comparing';

  return (
    <Dialog onClose={onClose} title="Compare trace debugger">
      <div className={styles.inputRow}>
        <input value={fileUrl} onChange={e => _setFileUrl(e.target.value)}/>
        <button disabled={isLoadingOrComparing} onClick={compare}>Compare</button>
        <button disabled={isLoadingOrComparing} onClick={mute}>Mute</button>
        <button disabled={isLoadingOrComparing} onClick={clearMuted}>Clear muted</button>
      </div>
      <div className={classNames(styles.monospace, styles.compareTraceDebugger)}>
        { phaseToString(phase) }<br/>
        { errorDetails && (
          <>
            { errorDetails.prevLines.map(prevLine => prevLine + '\n')}
            <span className={styles.expected}>{ errorDetails.expected } </span><br/>
            <span className={styles.found}>{ errorDetails.found}</span>
            <br/>
            { errorDetails.debug.map(debugInfo => debugInfo.name + ' = ' + hex(debugInfo.value) + '\n') }
          </>
        ) }
      </div>

    </Dialog>
  );
};

export default React.memo(CompareTraceDebugger);
