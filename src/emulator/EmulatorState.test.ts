import fs from 'fs';
import { parseROM } from './parseROM';
import EmulatorState  from './EmulatorState';
import { expect, test } from 'vitest'

test('Save state', () => {
    const data = fs.readFileSync('nes-test-roms/other/nestest.nes');
    const rom = parseROM(data);
    const emulator = new EmulatorState();
    emulator.initMachine(rom, false, null);

    for (let i = 0; i < 10; i++) {
        emulator.stepFrame(false);
    }

    const json = emulator.saveEmulator();
    const emulator2 = new EmulatorState();
    emulator2.initMachine(rom, false, null);
    emulator2.loadEmulator(json);
    const json2 = emulator2.saveEmulator();
    fs.writeFileSync('/tmp/output.json', JSON.stringify(json, null, 2));
    fs.writeFileSync('/tmp/output2.json', JSON.stringify(json2, null, 2));
    expect(JSON.stringify(json)).toEqual(JSON.stringify(json2));
})
