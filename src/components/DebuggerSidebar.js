import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAlignCenter, faPause, faStepForward, faPlay, faCaretSquareRight } from '@fortawesome/free-solid-svg-icons'
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { disassemble, disassembleLine } from '../emulator/stateLogging';
import classNames from 'classnames';
import _ from 'lodash';
import { opcodeMetadata } from '../emulator/cpu';
import { step } from '../emulator/emulator';
import { RunModeType } from '../App';
import { setIsSteppingScanline } from '../emulator/ppu';

export const BREAKPOINTS_KEY = 'Breakpoints';

const allOpcodeNames = _.uniq(_.map(opcodeMetadata, 'name'));

const getComponentStyle = (component) => {
  if (component.startsWith('0x')) {
    return 'addressComponent';
  } else if (allOpcodeNames.includes(component)) {
    return 'opcodeComponent';
  }
  return '';
}

const AddressRow = React.memo(({ data, index, style }) => {
  const item = data.lines[index];
  // Disassemble line again to make sure memory values etc are updated
  const line = disassembleLine(data.emulator, item.address);

  return <div style={ style } className={classNames("row", !data.running && item.address === data.emulator?.PC && "currentRow")}>
    <div className={classNames("breakpoint", item.address in data.breakpoints && "active")} onClick={() => data.toggleBreakpoint(item.address)}>
      <div/>
    </div>
    <div>
      { line.map((component, idx) => (
        <span key={idx} className={getComponentStyle(component)}>{ component } </span>
      ))
      }
    </div>
  </div>
});

const DebuggerSidebar = ({ emulator, setRunMode, runMode, onRefresh }) => {
  const [lines, setLines] = useState([]);
  const [breakpoints, setBreakpoints] = useState(JSON.parse(localStorage.getItem(BREAKPOINTS_KEY) ?? '{}') ?? {});
  const [currentStep, setCurrentStep] = useState(0);
  const listRef = useRef();

  const stepEmulator = useCallback(() => {
    step(emulator);
    setCurrentStep(s => s + 1);
    onRefresh();
  }, [emulator]);

  const updateDebugger = useCallback(() => {
    if (listRef.current != null && emulator != null) {
      const itemAddress = lines.findIndex(x => x.address === emulator.PC);
      listRef.current.scrollToItem(itemAddress, 'center');
    }
  }, [emulator, listRef, lines]);

  const toggleBreakpoint = useCallback(address => {
    setBreakpoints(oldBreakpoints => {
      const newBreakpoints = { ...oldBreakpoints };

      if (address in newBreakpoints) {
        delete newBreakpoints[address];
      } else {
        newBreakpoints[address] = true;
      }

      localStorage.setItem(BREAKPOINTS_KEY, JSON.stringify(newBreakpoints));
      return newBreakpoints;
    })
  }, []);

  const runEmulator = useCallback(() => {
    setRunMode(RunModeType.RUNNING);
    setCurrentStep(s => s + 1);
  }, [setRunMode, setCurrentStep]);

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
  }, [updateDebugger, setRunMode, setCurrentStep]);

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
  }, [runMode, setRunMode]);

  useEffect(() => {
    if (emulator != null){
      const lines = disassemble(emulator);
      setLines(lines);
    }
  }, [emulator]);

  const running = runMode !== RunModeType.STOPPED;

  const handleKeyEvent = useCallback(e => {
    switch (e.key) {
      case 'n':
      case 'F10':
        stepEmulator();
        break;
      case 'r':
        if (running) {
          stopEmulator();
        } else {
          runEmulator();
        }
        break;
      case 'F11':
      case 'f':
        runEmulatorFrame();
        break;
      case 's':
        runScanline();
        break;
      default:
        break;
    }
  }, [stepEmulator, runEmulator, stopEmulator, runEmulatorFrame, running]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyEvent);

    return () => {
      document.removeEventListener('keydown', handleKeyEvent);
    }
  }, [handleKeyEvent])

  const data = useMemo(() => ({
    lines, emulator, breakpoints, toggleBreakpoint, running
  }), [lines, emulator, currentStep, breakpoints, toggleBreakpoint, running]);

  return (
    <div className="instructionBar">
      <div className="listContainer">
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
      <div className="debugArea">
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
