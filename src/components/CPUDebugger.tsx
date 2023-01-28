import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretSquareRight, faPause, faPlay, faStepForward } from '@fortawesome/free-solid-svg-icons'
import { disassemble, DisassembledLine, disassembleLine, hex, hex16 } from '../emulator/stateLogging';
import classNames from 'classnames';
import { opcodeMetadata } from '../emulator/cpu';
import { RunModeType } from '../App';
import SegmentControl from './SegmentControl';
import styles from './CPUDebugger.module.css';
import EmulatorState from '../emulator/EmulatorState';
import { DebugDialogProps } from '../DebugDialog';
import Dialog, { DialogHorizontalPosition } from '../Dialog';
import EmulatorBreakState from '../emulator/EmulatorBreakState';

export const BREAKPOINTS_KEY = 'Breakpoints';

const allOpcodeNames = new Set(Object.values(opcodeMetadata).map(opcode => opcode.name));

const getComponentStyle = (component : string) => {
  if (component.startsWith('0x')) {
    return styles.addressComponent;
  } else if (allOpcodeNames.has(component)) {
    return styles.opcodeComponent;
  }
  return '';
}

type AddressRowData = {
  lines: DisassembledLine[],
  emulator: EmulatorState,
  breakpoints: Record<number, boolean>
  toggleBreakpoint: (breakpoint: string) => void,
  running: boolean
};

type AddressRowProps = {
  data: AddressRowData
  index: number
}

const AddressRowRaw = ({ data, index } : AddressRowProps) => {
  const item = data.lines[index];
  // Disassemble line again to make sure memory values etc. are updated
  const line = disassembleLine(data.emulator, item.address);

  return <div className={classNames(styles.row, !data.running && item.address === data.emulator?.PC && styles.currentRow)}>
    <div className={classNames(styles.breakpoint, data.breakpoints[item.address] && styles.active)}
         onClick={() => data.toggleBreakpoint(item.address.toString(10))}>
      <div/>
    </div>
    <div>
      {line && line.map((component, idx) => (
          <span key={idx} className={getComponentStyle(component)}>{component} </span>
      ))
      }
    </div>
  </div>
};

const AddressRow = React.memo(AddressRowRaw);

const CPUDebugger = ({ onRefresh, refresh, emulator, runMode, isOpen, onClose, setRunMode, addKeyListener, removeKeyListener } : DebugDialogProps) => {
  const [breakpoints, setBreakpoints] = useState<Record<string, boolean>>(JSON.parse(localStorage.getItem(BREAKPOINTS_KEY) ?? '{}') ?? {});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newBreakpointAddress, setNewBreakpointAddress] = useState('');

  const stepEmulator = useCallback(() => {
    emulator.step();
    onRefresh();
  }, [emulator, onRefresh]);

  const removeBreakpoint = useCallback((address: string) => {
    setBreakpoints(oldBreakpoints => {
      const newBreakpoints = { ...oldBreakpoints };
      delete newBreakpoints[address];
      localStorage.setItem(BREAKPOINTS_KEY, JSON.stringify(newBreakpoints));
      return newBreakpoints;
    })
  }, []);

  const toggleBreakpoint = useCallback((address: string) => {
    setBreakpoints(oldBreakpoints => {
      const newBreakpoints = { ...oldBreakpoints };

      if (address in newBreakpoints) {
        newBreakpoints[address] = !newBreakpoints[address];
      } else {
        newBreakpoints[address] = true;
      }

      localStorage.setItem(BREAKPOINTS_KEY, JSON.stringify(newBreakpoints));
      return newBreakpoints;
    })
  }, []);

  const addBreakpoint = useCallback(() => {
    const address = parseInt(newBreakpointAddress.replace('$', '0x'), 16);
    setNewBreakpointAddress('');
    toggleBreakpoint('' + address);
  }, [newBreakpointAddress, toggleBreakpoint]);

  const runEmulator = useCallback(() => {
    setRunMode(RunModeType.RUNNING);
  }, [setRunMode]);

  const runEmulatorFrame = useCallback(() => {
    setRunMode(RunModeType.RUNNING_SINGLE_FRAME);
  }, [setRunMode]);

  const runScanline = useCallback(() => {
    setRunMode(RunModeType.RUNNING_SINGLE_SCANLINE);
  }, [setRunMode]);

  const stopEmulator = useCallback(() => {
    setRunMode(RunModeType.STOPPED);
  }, [setRunMode]);

  // Sync breakpoints with emulator
  useEffect(() => {
    emulator.breakpoints = breakpoints;
  }, [breakpoints, emulator]);

  const running = runMode !== RunModeType.STOPPED;

  const handleKeyEvent = useCallback((e : KeyboardEvent) => {
    if ((e.target as HTMLInputElement)?.type === 'text' || e.type !== 'keydown') {
      return;
    }

    switch (e.key) {
      case 'n':
      case 'F10':
        stepEmulator();
        break;
      case 'r':
        if (!e.metaKey) {
          if (running) {
            stopEmulator();
          } else {
            runEmulator();
          }
        }
        break;
      case 'F11':
      case 'f':
        runEmulatorFrame();
        break;
      case 'l':
        runScanline();
        break;
      default:
        break;
    }
  }, [stepEmulator, runEmulator, stopEmulator, runEmulatorFrame, running, runScanline]);

  useEffect(() => {
    addKeyListener(handleKeyEvent);

    return () => {
      removeKeyListener(handleKeyEvent);
    }
  }, [handleKeyEvent, addKeyListener, removeKeyListener]);

  const lines = useMemo(() => {
    return disassemble(emulator);
  }, [emulator, refresh, runMode]);

  const data = useMemo<AddressRowData>(() => ({
    lines, emulator, breakpoints, toggleBreakpoint, running
  }), [lines, emulator, breakpoints, toggleBreakpoint, running]);

  const options = useMemo(()=> ([
    {
      view: (
        <div className={styles.listContainer}>
          { lines.map((line, idx) => (
            <AddressRow key={idx} data={ data } index={ idx }/>
          ))
          }
        </div>),
      title: 'Instructions'
    },
    {
      view: (<div className={styles.breakpointContainer}>
        {
          Object.entries(breakpoints).map(([breakpointAddress, breakpointState]) => (
            <div key={breakpointAddress}>
              <input type="checkbox" onChange={() => toggleBreakpoint(breakpointAddress)} checked={breakpointState}/>
              0x{ hex(parseInt(breakpointAddress, 10)) }
              <button onClick={() => removeBreakpoint(breakpointAddress)}>Remove</button>
            </div>
          ))
        }
        
        <div className={styles.addBreakpoint}>
          <input type={"text"} value={newBreakpointAddress} onChange={e => {
            setNewBreakpointAddress(e.target.value)
          }}/>
          <button onClick={addBreakpoint}>Add</button>
        </div>

        <div>
          <input
            type="checkbox"
            id="debugLog"
            checked={EmulatorBreakState.enableLogs}
            onChange={e => {
              EmulatorBreakState.enableLogs = e.target.checked;
              onRefresh();
            }}
          /> 
          <label htmlFor="debugLog" >Enable debug logs</label>
        </div>
      </div>),
      title: 'Breakpoints'
    }
    ]), [lines, data, breakpoints, newBreakpointAddress, addBreakpoint, removeBreakpoint, toggleBreakpoint, refresh]);

  const registerCell = (label: React.ReactNode, register: number, formatter = hex) => (
    <td>
      <label>{ label }</label>
      { running ? '-' : formatter(register) }
    </td>
  );

  return (
    <Dialog
      withoutPadding
      isOpen={isOpen}
      onClose={onClose}
      title="CPU Debugger"
      horizontalPosition={DialogHorizontalPosition.LEFT}
    >
      { emulator && (
        <div>
          <table>
            <tbody>
            <tr>
              <td>
                <label>Running</label>
                { running ? '1' : '0' }
              </td>
              { registerCell('A', emulator.A) }
              { registerCell('X', emulator.X) }
              { registerCell('Y', emulator.Y) }
              { registerCell('P', emulator.P) }
              { registerCell('SP', emulator.SP) }
            </tr>
            <tr>
              { registerCell('N', (emulator.P & 0b10000000) >> 7) }
              { registerCell('V', (emulator.P & 0b01000000) >> 6) }
              { registerCell('D', (emulator.P & 0b00001000) >> 3) }
              { registerCell('I', (emulator.P & 0b00000100) >> 2) }
              { registerCell('Z', (emulator.P & 0b00000010) >> 1) }
              { registerCell('C', (emulator.P & 0b00000001) >> 0) }
            </tr>
            <tr>
              { registerCell('PC', emulator.PC) }
              { registerCell('V', emulator.ppu?.V ?? '', hex16) }
              { registerCell('T', emulator.ppu.T, hex16) }
              { registerCell('CYC', emulator.ppu.scanlineCycle, c => c.toString()) }
              { registerCell('CPU CYC', emulator.CYC, c => c.toString()) }
            </tr>
            </tbody>
          </table>
        </div>
      ) }

      <div className={styles.instructionBar}>
        <SegmentControl onClick={setCurrentIndex} currentIndex={currentIndex} options={options} expand/>


        <div className={styles.debugArea}>
          <button onClick={stepEmulator}><FontAwesomeIcon icon={faStepForward} size="lg"/></button>
          <button onClick={runEmulatorFrame}><FontAwesomeIcon icon={faCaretSquareRight} size="lg"/></button>
          <button onClick={stopEmulator}><FontAwesomeIcon icon={faPause} size="lg"/></button>
          <button onClick={runEmulator}><FontAwesomeIcon icon={faPlay} size="lg"/></button>
        </div>
      </div>
    </Dialog>
  );
};

CPUDebugger.propTypes = {};

export default React.memo(CPUDebugger);
