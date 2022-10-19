import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAlignCenter, faPause, faStepForward, faPlay, faCaretSquareRight } from '@fortawesome/free-solid-svg-icons'
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { disassemble, disassembleLine, hex } from '../emulator/stateLogging';
import classNames from 'classnames';
import _ from 'lodash';
import { opcodeMetadata } from '../emulator/cpu';
import { step } from '../emulator/emulator';
import { RunModeType } from '../App';
import { setIsSteppingScanline } from '../emulator/ppu';
import SegmentControl from './SegmentControl';
import styles from './DebuggerSidebar.module.css';

export const BREAKPOINTS_KEY = 'Breakpoints';

const allOpcodeNames = _.uniq(_.map(opcodeMetadata, 'name'));

const getComponentStyle = (component) => {
  if (component.startsWith('0x')) {
    return styles.addressComponent;
  } else if (allOpcodeNames.includes(component)) {
    return styles.opcodeComponent;
  }
  return '';
}

const AddressRow = React.memo(({ data, index, style }) => {
  const item = data.lines[index];
  // Disassemble line again to make sure memory values etc are updated
  const line = disassembleLine(data.emulator, item.address);

  return <div style={ style } className={classNames(styles.row, !data.running && item.address === data.emulator?.PC && styles.currentRow)}>
    <div className={classNames(styles.breakpoint, data.breakpoints[item.address] === true && styles.active)} onClick={() => data.toggleBreakpoint(item.address)}>
      <div/>
    </div>
    <div>
      { line && line.map((component, idx) => (
        <span key={idx} className={getComponentStyle(component)}>{ component } </span>
      ))
      }
    </div>
  </div>
});

const DebuggerSidebar = ({ emulator, setRunMode, runMode, onRefresh, refresh, addKeyListener, removeKeyListener, initAudioContext, stopAudioContext }) => {
  const [lines, setLines] = useState([]);
  const [breakpoints, setBreakpoints] = useState(JSON.parse(localStorage.getItem(BREAKPOINTS_KEY) ?? '{}') ?? {});
  const [currentStep, setCurrentStep] = useState(0);
  const listRef = useRef();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newBreakpointAddress, setNewBreakpointAddress] = useState('');

  const stepEmulator = useCallback(() => {
    step(emulator);
    setCurrentStep(s => s + 1);
    onRefresh();
  }, [emulator, onRefresh]);

  const updateDebugger = useCallback(() => {
    _.noop(refresh);
    if (listRef.current != null && emulator != null) {
      const itemAddress = lines.findIndex(x => x.address === emulator.PC);
      listRef.current.scrollToItem(itemAddress, 'center');
    }
  }, [emulator, listRef, lines, refresh]);

  const removeBreakpoint = useCallback(address => {
    setBreakpoints(oldBreakpoints => {
      const newBreakpoints = { ...oldBreakpoints };
      delete newBreakpoints[address];
      localStorage.setItem(BREAKPOINTS_KEY, JSON.stringify(newBreakpoints));
      return newBreakpoints;
    })
  }, []);

  const toggleBreakpoint = useCallback(address => {
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
    const address = _.parseInt(newBreakpointAddress.replace('$', '0x'), 16);
    setNewBreakpointAddress('');
    toggleBreakpoint(address);
  }, [newBreakpointAddress, toggleBreakpoint]);

  const runEmulator = useCallback(() => {
    setRunMode(RunModeType.RUNNING);
    setCurrentStep(s => s + 1);

    initAudioContext();
  }, [setRunMode, setCurrentStep, initAudioContext]);

  const runEmulatorFrame = useCallback(() => {
    setRunMode(RunModeType.RUNNING_SINGLE_FRAME);
    setCurrentStep(s => s + 1);
  }, [setRunMode, setCurrentStep]);

  const runScanline = useCallback(() => {
    setRunMode(RunModeType.RUNNING_SINGLE_SCANLINE);
    setIsSteppingScanline(true);
    setCurrentStep(s => s + 1);
  }, [setRunMode, setCurrentStep]);

  const stopEmulator = useCallback(() => {
    setRunMode(RunModeType.STOPPED);
    setIsSteppingScanline(false);
    setCurrentStep(s => s + 1);
    _.defer(() => {
      updateDebugger();
    })

    stopAudioContext();
  }, [updateDebugger, setRunMode, setCurrentStep, stopAudioContext]);

  // Sync breakpoints with emulator
  useEffect(() => {
    if (emulator != null) {
      emulator.breakpoints = breakpoints;
    }
  }, [breakpoints, emulator]);

  useEffect(() => {
    updateDebugger();
  }, [lines, currentStep, updateDebugger]);

  useEffect(() => {
    if (runMode === RunModeType.STOPPED) {
      setCurrentStep(s => s + 1);
      setRunMode(RunModeType.STOPPED);
      stopEmulator();
    }
  }, [runMode, setRunMode, stopEmulator]);

  useEffect(() => {
    if (emulator != null){
      const lines = disassemble(emulator);
      setLines(lines);
    }
  }, [emulator]);

  const running = runMode !== RunModeType.STOPPED;

  const handleKeyEvent = useCallback(e => {
    if (e.target.type === 'text' || e.type !== 'keydown') {
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

  const data = useMemo(() => ({
    lines, emulator, breakpoints, toggleBreakpoint, running
  }), [lines, emulator, breakpoints, toggleBreakpoint, running]);

  const options = useMemo(()=> ([
      {
        view: (
          <div className={styles.listContainer}>
            <AutoSizer>
              { ({ width, height }) => (
                <List
                  height={ height }
                  ref={listRef}
                  itemCount={ lines.length }
                  itemData={ data }
                  itemSize={ 35 }
                  width={ width }
                >
                  { AddressRow }
                </List>
              )
              }
            </AutoSizer>
          </div>
        ),
        title: 'Instructions'
      },
    {
      view: (<div className={styles.breakpointContainer}>
        { _.map(breakpoints, (breakpointState, breakpointAddress) => (
          <div key={breakpointAddress}>
            <input type="checkbox" onChange={() => toggleBreakpoint(breakpointAddress)} checked={breakpointState}/>
            { hex(_.parseInt(breakpointAddress, 10)) }
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
      </div>),
      title: 'Breakpoints'
    }
    ]), [lines, data, breakpoints, newBreakpointAddress, addBreakpoint, removeBreakpoint, toggleBreakpoint]);

  return (
    <div className={styles.instructionBar}>
      <SegmentControl onClick={setCurrentIndex} currentIndex={currentIndex} options={options} expand/>


      <div className={styles.debugArea}>
        <button onClick={updateDebugger}><FontAwesomeIcon icon={faAlignCenter} size="lg"/></button>
        <button onClick={stopEmulator}><FontAwesomeIcon icon={faPause} size="lg"/></button>
        <button onClick={stepEmulator}><FontAwesomeIcon icon={faStepForward} size="lg"/></button>
        <button onClick={runEmulatorFrame}><FontAwesomeIcon icon={faCaretSquareRight} size="lg"/></button>
        <button onClick={runEmulator}><FontAwesomeIcon icon={faPlay} size="lg"/></button>
      </div>
    </div>
  );
};

DebuggerSidebar.propTypes = {};

export default DebuggerSidebar;
