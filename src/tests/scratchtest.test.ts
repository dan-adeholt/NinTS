import { test } from 'vitest'
import fs from 'fs';
import { parseROM } from '../emulator/parseROM';
import EmulatorState from '../emulator/EmulatorState';
import { WaveFile } from 'wavefile';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dumpWaveFile = (romPath: string, path: string, numCycles: number) => {
  const wav = new WaveFile();
  const data = fs.readFileSync(romPath);

  const samples: number[] = [];

  const rom = parseROM(data);
  const state = new EmulatorState();
  state.ppu.disabled = true;

  const convertSample = (sample: number) => {
    // Samples are between -1 and 1.
    return Math.floor(sample * 32768);
  }

  state.initMachine(rom, false, (leftSample, rightSample) => {
    samples.push(convertSample(leftSample));
    samples.push(convertSample(rightSample));
  });
  
  for (let i = 0; state.CYC < numCycles && state.step(); i++);

  wav.fromScratch(2, 48000, '16', samples);

  fs.writeFileSync(path, wav.toBuffer());  
}

test('wavefile', () => {
  // dumpWaveFile("nes-test-roms/apu_mixer/noise.nes", "/tmp/wavefile_noise.wav", 29480438);
});

test('wavefile2', () => {
  // dumpWaveFile("src/tests/roms/apu-tests/dmc-timing/01-dmc-timing.nes", "/tmp/wavefile-dmc-timing.wav", 500000);
});

