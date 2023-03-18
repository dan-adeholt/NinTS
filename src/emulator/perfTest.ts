import fs from 'fs';
import { parseROM } from './parseROM';
import EmulatorState from './EmulatorState';
import { NTSC_CPU_CYCLES_PER_SECOND } from './apu';
import { PPUMASK } from './ppu';

const runTest = () => {
  const data = fs.readFileSync('/Users/dadeholt/ParallelsShare/smb.nes');
  const rom = parseROM(data);
  const state = new EmulatorState();
  state.initMachine(rom, false, null);
  state.ppu.writePPUMem(PPUMASK, 0b00011110);  
  
  // Warm up the machine, make sure everything is optimized
  while (state.CYC < 5427091) {
    state.step();
  }

  
  
  /// TOTAL
  let t0 = performance.now();
  let targetCYC = state.CYC + NTSC_CPU_CYCLES_PER_SECOND;
  
  while (state.CYC < targetCYC) {
    state.step();
  }
  
  const systemMs = (performance.now() - t0);
  
  /// APU
  t0 = performance.now();
  
  for (let i = 0; i < NTSC_CPU_CYCLES_PER_SECOND; i++) {
    state.apu.tick();
  }
  
  const apuMs = (performance.now() - t0);
  
  /// PPU 
  state.ppu.writePPUMem(PPUMASK, 0b00011110);  
  t0 = performance.now();
  
  for (let i = 0; i < NTSC_CPU_CYCLES_PER_SECOND; i++) {
    state.ppu.tick();
  }
  
  const ppuMs = (performance.now() - t0);
  
  /// CPU
  state.apu.disabled = true;
  state.ppu.disabled = true;
  
  t0 = performance.now();
  targetCYC = state.CYC + NTSC_CPU_CYCLES_PER_SECOND;
  
  while (state.CYC < targetCYC) {
    state.step();
  }
  
  const cpuMs = (performance.now() - t0);
  
  return [cpuMs, apuMs, ppuMs, systemMs];
}
let avgCpuMs = 0;
let avgApuMs = 0;
let avgPpuMs = 0;
let avgSystemMs = 0;
let numSamples = 0;

for (let i = 0; i < 15; i++) {
  const [cpuMs, apuMs, ppuMs, systemMs]= runTest();
  console.log('CPU\tAPU\tPPU\tTOTAL\tCALC TOTAL');
  console.log(`${cpuMs.toFixed(2)}\t${apuMs.toFixed(2)}\t${ppuMs.toFixed(2)}\t${systemMs.toFixed(2)}\t${(apuMs+cpuMs+ppuMs).toFixed(2)}`);

  if (i > 0) {
    avgCpuMs += cpuMs;
    avgApuMs += apuMs;
    avgPpuMs += ppuMs;
    avgSystemMs += systemMs;
    numSamples++;
  }
}

avgCpuMs /= numSamples;
avgApuMs /= numSamples;
avgPpuMs /= numSamples;
avgSystemMs /= numSamples;

console.log('*********************************************************');
console.log('CPU\tAPU\tPPU\tTOTAL\tCALC TOTAL');
console.log(`${avgCpuMs.toFixed(2)}\t${avgApuMs.toFixed(2)}\t${avgPpuMs.toFixed(2)}\t${avgSystemMs.toFixed(2)}\t${(avgApuMs + avgCpuMs + avgPpuMs).toFixed(2)}`);
