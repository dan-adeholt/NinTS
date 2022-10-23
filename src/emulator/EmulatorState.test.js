import fs from 'fs';
import { parseROM } from './parseROM';
import EmulatorState  from './EmulatorState';
import _ from 'lodash';
import { expect, test } from 'vitest'

test('Save state', () => {
    const data = fs.readFileSync('src/tests/roms/nestest.nes');
    const rom = parseROM(data);
    const emulator = new EmulatorState();
    emulator.initMachine(rom);

    for (let i = 0; i < 10; i++) {
        emulator.stepFrame();
    }

    const json = emulator.saveEmulator();
    const emulator2 = new EmulatorState();
    emulator2.initMachine(rom);
    emulator2.loadEmulator(json);
    const json2 = emulator2.saveEmulator();
    fs.writeFileSync('/tmp/output.json', JSON.stringify(json, null, 2));
    fs.writeFileSync('/tmp/output2.json', JSON.stringify(json2, null, 2));
    expect(_.isEqual(json, json2)).toBeTruthy();
})
