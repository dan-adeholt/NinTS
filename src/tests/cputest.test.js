import { parseROM } from '../emulator/parseROM';
import { initMachine, step } from '../emulator/emulator';
import { stateToString } from '../emulator/stateLogging';
import {addCycles} from '../emulator/opcodes/utils';

const parseLog = (data) => data.toString().split('\n');

const fs = require('fs');

test('Nes test rom executes properly', () => {
  const data = fs.readFileSync('public/tests/nestest.nes');
  const log = parseLog(fs.readFileSync('public/tests/nestest.log'));

  const rom = parseROM(data);
  const machine = initMachine(rom);
  machine.PC = 0xC000;
  addCycles(machine, 7); // For some reason the logs start at 7 ? Perhaps has to do with reset vector or something

  log.forEach(entry => {
    expect(stateToString(machine)).toEqual(entry);
    step(machine);
  })






  console.log(rom);

});

