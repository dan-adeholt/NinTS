import { testInstructionTestRom, runTestWithLogFile, testPPURomWithImage } from './testutil';
import { test } from 'vitest'
import EmulatorState from '../emulator/EmulatorState';

test('Nes test rom executes properly', () =>
  runTestWithLogFile(
    'nes-test-roms/other/nestest.nes',
    'nes-test-images/nestest.log',
    (state : EmulatorState) => {
      state.PC = 0xC000;
      state.mapper.cpuMemory.write(0x4015, 0x00);
    })
);



// These ROM:s are invalid, they use PRG ram but the header specifies that there is no such RAM. Patch settings after parse.
test('Branch Basics', () => testPPURomWithImage('nes-test-roms/branch_timing_tests/1.Branch_Basics.nes', 'nes-test-images/1.Branch_Basics.nes.png', 15, rom => {
  rom.settings.chrRamSize = 0x2000
}));

test('Backward Branch', () => testPPURomWithImage('nes-test-roms/branch_timing_tests/2.Backward_Branch.nes', 'nes-test-images/2.Backward_Branch.nes.png', 18, rom => {
  rom.settings.chrRamSize = 0x2000
}));

test('Forward branch', () => testPPURomWithImage('nes-test-roms/branch_timing_tests/3.Forward_Branch.nes', 'nes-test-images/3.Forward_Branch.nes.png', 16, rom => {
  rom.settings.chrRamSize = 0x2000
}));


// We don't run the APU exec space test. Very esoteric, APU open bus is not well documented and we are not done with APU yet.
test('CPU exec space PPUIO', () => testPPURomWithImage('nes-test-roms/cpu_exec_space/test_cpu_exec_space_ppuio.nes', 'nes-test-images/test_cpu_exec_space_ppuio.nes.png', 45));
test('CPU exec space APUIO', () => testPPURomWithImage('nes-test-roms/cpu_exec_space/test_cpu_exec_space_apu.nes', 'nes-test-images/test_cpu_exec_space_apu.nes.png', 300));

test('InstrMisc - 01 - Abs X Wrap', () => testInstructionTestRom('nes-test-roms/instr_misc/rom_singles/01-abs_x_wrap.nes'));
test('InstrMisc - 02 - Branch Wrap', () => testInstructionTestRom('nes-test-roms/instr_misc/rom_singles/02-branch_wrap.nes'));
test('InstrMisc - 03 - Dummy Reads', () => testInstructionTestRom('nes-test-roms/instr_misc/rom_singles/03-dummy_reads.nes'));
test('InstrMisc - 04 - Dummy Reads APU', () => testInstructionTestRom('nes-test-roms/instr_misc/rom_singles/04-dummy_reads_apu.nes'));
