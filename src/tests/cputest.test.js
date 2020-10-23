import { parseROM } from '../emulator/parseROM';
import { initMachine, step } from '../emulator/emulator';
import { procFlagsToString, stateToString } from '../emulator/stateLogging';

const parseLog = (data) => data.toString().split('\n');

const fs = require('fs');

const prefixLine = (idx, str) => {
  return '[' + idx + '] ' + str;
}

const procRegex = / P:([0-9A-F][0-9A-F])/;

test('Nes test rom executes properly', () => {
  const data = fs.readFileSync('public/tests/nestest.nes');
  const log = parseLog(fs.readFileSync('public/tests/nestest.log'));

  const rom = parseROM(data);
  const machine = initMachine(rom);
  machine.PC = 0xC000;
  machine.CYC += 7; // For some reason the logs start at 7 ? Perhaps has to do with reset vector or something

  let prevStateString = '';
  let prevFlagString = '';

  for (var i = 0; i < log.length; i++) {
    const entry = log[i];
    if (entry.trim() === '') {
      break;
    }

    const entryLine = prefixLine(i, entry);
    const stateString = prefixLine(i, stateToString(machine));
    let flagsString = procFlagsToString(machine.P);

    if (stateString !== entryLine) {
      console.log(prevStateString);
      const match = procRegex.exec(entryLine);

      if (match?.length > 0) {
        const expectedP = parseInt(match[1], 16);

        if (expectedP !== machine.P) {
          console.log('PRV: ' + prevFlagString + "\nNEW: " + flagsString + "\nEXP:", procFlagsToString(expectedP));
        }
      }
    }

    prevStateString = stateString;
    prevFlagString = flagsString;
    expect(stateString).toEqual(entryLine);
    if (!step(machine)) {
      break;
    }
  }
});

