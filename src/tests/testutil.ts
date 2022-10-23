import { parseROM } from '../emulator/parseROM';
import EmulatorState from '../emulator/EmulatorState';
import { hex, procFlagsToString, stateToString } from '../emulator/stateLogging';
import { PNG } from 'pngjs';
import _ from 'lodash';
import fs from 'fs';
import { expect } from 'vitest'

const parseLog = (data: Buffer) => data.toString().split(/[\r\n]+/);
export const prefixLine = (idx: number | string, str: string) => '[' + idx + '] ' + str

const procRegex = / P:([0-9A-F][0-9A-F])/;
const romRootPath = 'src/tests/roms/';

export const runTestWithLogFile = (path: string, logPath: string, adjustState: ((state: EmulatorState) => void) | null) => {
  const data = fs.readFileSync(romRootPath + path);
  const log = parseLog(fs.readFileSync(romRootPath + logPath));

  const rom = parseROM(data);
  const state = new EmulatorState();
  state.initMachine(rom, true, null);

  if (adjustState != null) {
    adjustState(state);
  }

  let prevStateString = '';
  let prevFlagString = '';

  for (let i = 0; i < log.length; i++) {
    const entry = log[i];
    if (entry.trim() === '') {
      break;
    }

    if (i >= state.traceLogLines.length) {
      if (!state.step()) {
        break;
      }
    }

    const entryLine = prefixLine(i, entry);
    const stateString = prefixLine(i, state.traceLogLines[i]);

    const flagsString = procFlagsToString(state.P);

    if (stateString !== entryLine) {
      const match = procRegex.exec(entryLine);
      console.log(prevStateString);

      if (match != null && match?.length > 0) {
        const expectedP = parseInt(match[1], 16);

        if (expectedP !== state.P) {
          console.log('PRV: ' + prevFlagString + "\nNEW: " + flagsString + "\nEXP:", procFlagsToString(expectedP));
        }
      } else {
        console.log(prevStateString);
      }
    }

    prevStateString = stateString;
    prevFlagString = flagsString;

    expect(stateString).toEqual(entryLine);
  }
}

export const testInstructionTestRom = (location: string, logOutputPath: (string | null) = null, haltAfterInstruction = -1) => {
  const data = fs.readFileSync(romRootPath + location);
  const rom = parseROM(data);
  const state = new EmulatorState();
  state.initMachine(rom, false, null);

  const stateValid = true;
  let hasBeenRunning = false;

  const logLines: string[] = [];
  for (let i = 0; stateValid; i++) {

    if (logOutputPath != null) {
      logLines.push(stateToString(state));
    }

    if (i === haltAfterInstruction) {
      if (logOutputPath != null) {
        fs.writeFileSync(logOutputPath, logLines.join("\n"), "utf-8");
      }
      break;
    }

    const emulatorStatus = state.step();
    if (!emulatorStatus) {
      // Too slow to invoke for each case
      expect(emulatorStatus).toEqual(true);
    }

    const status = state.readMem(0x6000);

    if (hasBeenRunning) {
      if (status === 0x80) {
        // Test is running
      } else if(status === 0x81) {
        state.reset();
      } else {
        if (status !== 0x00) {
          let testText = '';

          for (let i = 0x6004; state.readMem(i) !== 0; i++) {
            testText += String.fromCharCode(state.readMem(i));
          }

          console.error('[' + i + '] Failed with status: ', hex(status) + ' - ' + testText);
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

export const testPPURom = (location: string, testCase: (state: EmulatorState) => void) => {
  const romFile = romRootPath + location + '.nes';

  const data = fs.readFileSync(romFile);
  const rom = parseROM(data);
  const state = new EmulatorState();
  state.initMachine(rom, false, null);

  for (let i = 0; i < 4; i++) {
    state.stepFrame(false);
  }

  testCase(state);
};

// Remove top and bottom 8 pixels, i.e. go from 240 screen height to 224. FCEUX unfortunately dumps 224px screens.
const convertBufferToVisibleArea = (buffer: Uint32Array) => buffer.slice(8 * 256, buffer.length - 8 * 256)

export const dumpFramebuffer = (visibleBuffer32: Uint32Array) => {
  const width = 256;
  const height = visibleBuffer32.length / width;
  const outPNG = new PNG({ width, height });
  outPNG.data = Buffer.from(new Uint8Array(visibleBuffer32.buffer));
  fs.writeFileSync('/tmp/out.png', PNG.sync.write(outPNG, {}));
}

export const testPPURomWithImage = (location: string) => {
  const romFile = romRootPath + location + '.nes';
  const data = fs.readFileSync(romFile);
  const imgFile = romRootPath + location + '.png';
  const imgData = fs.readFileSync(imgFile);

  const png8 = PNG.sync.read(imgData);
  const png = new Uint32Array(png8.data.buffer);

  const rom = parseROM(data);
  const state = new EmulatorState();
  state.initMachine(rom, false, null);

  for (let i = 0; i < 5; i++) {
    state.stepFrame(false);
  }

  const visibleBuffer = convertBufferToVisibleArea(state.ppu.framebuffer);
  dumpFramebuffer(visibleBuffer);

  for (let i = 0; i < visibleBuffer.length; i++) {
    if (visibleBuffer[i] !== png[i]) {
      console.log(i % 256, Math.ceil(i / 256.0), '0x' + hex(visibleBuffer[i]), '0x' + hex(png[i]));
      break;
    }
  }

  expect(_.isEqual(visibleBuffer, png)).toEqual(true);
};
