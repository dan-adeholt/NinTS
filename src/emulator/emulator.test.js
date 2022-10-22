import fs from "fs";
import { parseROM } from "./parseROM";
import Emulator  from "./emulator";
import _ from 'lodash';

test('Save state', () => {
    const data = fs.readFileSync('src/tests/roms/nestest.nes');
    const rom = parseROM(data);
    const emulator = new Emulator();
    emulator.initMachine(rom);

    for (let i = 0; i < 10; i++) {
        emulator.stepFrame();
    }

    const json = emulator.saveEmulator();
    const emulator2 = new Emulator();
    emulator2.initMachine(rom);
    emulator2.loadEmulator(json);
    const json2 = emulator2.saveEmulator();
    fs.writeFileSync('/tmp/output.json', JSON.stringify(json, null, 2));
    fs.writeFileSync('/tmp/output2.json', JSON.stringify(json2, null, 2));
    expect(_.isEqual(json, json2)).toBeTruthy();
})
