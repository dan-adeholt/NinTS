import { parseROM } from '../emulator/parseROM';
import { initMachine, reset, step } from '../emulator/emulator';
import { hex, procFlagsToString, stateToString } from '../emulator/stateLogging';

const parseLog = (data) => data.toString().split(/[\r\n]+/);

const fs = require('fs');

const prefixLine = (idx, str) => {
  return '[' + idx + '] ' + str;
}

const procRegex = / P:([0-9A-F][0-9A-F])/;

export const runTestWithLogFile = (path, logPath, adjustState, swapPPU) => {
  const data = fs.readFileSync(path);
  const log = parseLog(fs.readFileSync(logPath));

  const rom = parseROM(data);
  const machine = initMachine(rom);
  if (adjustState != null) {
    adjustState(machine);
  }

  let prevStateString = '';
  let prevFlagString = '';

  for (let i = 0; i < log.length; i++) {
    const entry = log[i];
    if (entry.trim() === '') {
      break;
    }

    const entryLine = prefixLine(i, entry);
    let stateString = prefixLine(i, stateToString(machine, swapPPU));
    let flagsString = procFlagsToString(machine.P);

    if (stateString !== entryLine) {
      const match = procRegex.exec(entryLine);
      console.log(prevStateString);

      if (match?.length > 0) {
        const expectedP = parseInt(match[1], 16);

        if (expectedP !== machine.P) {
          console.log('PRV: ' + prevFlagString + "\nNEW: " + flagsString + "\nEXP:", procFlagsToString(expectedP));
        }
      } else {
        console.log(prevStateString);
      }
    }

    prevStateString = stateString;
    prevFlagString = flagsString;

    expect(stateString).toEqual(entryLine);
    if (!step(machine)) {
      break;
    }
  }
}

export const testInstructionTestRom = (location, logOutputPath) => {
  const data = fs.readFileSync(location);
  const rom = parseROM(data);
  const state = initMachine(rom);

  let stateValid = true;
  let hasBeenRunning = false;

  let logLines = [];
  for (let i = 0; stateValid; i++) {

    if (logOutputPath != null) {
      logLines.push(stateToString(state, true));
    }

    const emulatorStatus = step(state);
    if (!emulatorStatus) {
      // Too slow to invoke for each case
      expect(emulatorStatus).toEqual(true);
    }

    const status = state.readMem(0x6000);

    if (hasBeenRunning) {
      if (status === 0x80) {
        // Test is running
      } else if(status === 0x81) {
        reset(state);
      } else {
        if (status !== 0x00) {
          let testText = '';

          for (let i = 0x6004; state.readMem(i) !== 0; i++) {
            testText += String.fromCharCode(state.readMem(i));
          }

          console.error('[' + i + '] Failed with status: ', hex(status) + '.' + testText);
        }

        if (logOutputPath != null) {
          fs.writeFileSync(logOutputPath, logLines.join("\n"), "utf-8");
        }

        expect(status).toEqual(0x00);
        break;
      }
    } else {
      hasBeenRunning = status === 0x80;
    }
  }

}
