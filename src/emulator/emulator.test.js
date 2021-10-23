import fs from "fs";
import { parseROM } from "./parseROM";
import { initMachine, loadEmulator, saveEmulator, stepFrame } from "./emulator";
import _ from 'lodash';

test('Save state', () => {
    const data = fs.readFileSync('src/tests/roms/nestest.nes');
    const rom = parseROM(data);
    const emulator = initMachine(rom, true);

    for (let i = 0; i < 10; i++) {
        stepFrame(emulator);
    }

    const json = saveEmulator(emulator);
    const emulator2 = initMachine(rom, true);
    loadEmulator(emulator2, json);
    const json2 = saveEmulator(emulator2);
    fs.writeFileSync('/tmp/output.json', JSON.stringify(json, null, 2));
    fs.writeFileSync('/tmp/output2.json', JSON.stringify(json2, null, 2));
    expect(_.isEqual(json, json2)).toBeTruthy();
})
