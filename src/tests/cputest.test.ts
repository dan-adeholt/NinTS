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

test('InstrTestV5 - 01 - Basics', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/01-basics.nes'));
test('InstrTestV5 - 02 - Implied', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/02-implied.nes'));
test('InstrTestV5 - 03 - Immediate', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/03-immediate.nes'));
test('InstrTestV5 - 04 - Zero Page', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/04-zero_page.nes'));
test('InstrTestV5 - 05 - Zero Page XY', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/05-zp_xy.nes'));
test('InstrTestV5 - 06 - Absolute', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/06-absolute.nes'));
test('InstrTestV5 - 07 - Absolute XY', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/07-abs_xy.nes'));
test('InstrTestV5 - 08 - Indirect X', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/08-ind_x.nes'));
test('InstrTestV5 - 09 - Indirect Y', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/09-ind_y.nes'));
test('InstrTestV5 - 10 - Branches', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/10-branches.nes'));
test('InstrTestV5 - 11 - Stack', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/11-stack.nes'));
test('InstrTestV5 - 12 - JMP/JSR', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/12-jmp_jsr.nes'));
test('InstrTestV5 - 13 - RTS', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/13-rts.nes'));
test('InstrTestV5 - 14 - RTI', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/14-rti.nes'));
test('InstrTestV5 - 15 - BRK', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/15-brk.nes'));
test('InstrTestV5 - 16 - Special', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/16-special.nes'));

test('CPU Dummy Reads', () => testPPURomWithImage('nes-test-roms/cpu_dummy_reads/cpu_dummy_reads.nes', 'nes-test-images/cpu_dummy_reads.nes.png', 50));
test('CPU dummy writes OAM', () => testInstructionTestRom('nes-test-roms/cpu_dummy_writes/cpu_dummy_writes_oam.nes'));
test('CPU dummy writes PPU', () => testInstructionTestRom('nes-test-roms/cpu_dummy_writes/cpu_dummy_writes_ppumem.nes'));

// These ROM:s are invalid, they use PRG ram but the header specifies that there is no such RAM. Patch settings after parse.
test('Branch Basics', () => testPPURomWithImage('nes-test-roms/branch_timing_tests/1.Branch_Basics.nes', 'nes-test-images/1.Branch_Basics.nes.png', 15, rom => {
  rom.settings.chrRamSize = 0x2000
}));

test('Backward Branch', () => testPPURomWithImage('nes-test-roms/branch_timing_tests/2.Backward_Branch.nes', 'nes-test-images/2.Backward_Branch.nes.png', 15, rom => {
  rom.settings.chrRamSize = 0x2000
}));

test('Forward branch', () => testPPURomWithImage('nes-test-roms/branch_timing_tests/3.Forward_Branch.nes', 'nes-test-images/3.Forward_Branch.nes.png', 15, rom => {
  rom.settings.chrRamSize = 0x2000
}));


// We don't run the APU exec space test. Very esoteric, APU open bus is not well documented and we are not done with APU yet.
test('CPU exec space PPUIO', () => testPPURomWithImage('nes-test-roms/cpu_exec_space/test_cpu_exec_space_ppuio.nes', 'nes-test-images/test_cpu_exec_space_ppuio.nes.png', 45));

test('CPU Timing test6', () => testPPURomWithImage('nes-test-roms/cpu_timing_test6/cpu_timing_test.nes', 'nes-test-images/cpu_timing_test.nes.png', 60 * 16, rom => {
  rom.settings.chrRamSize = 0x2000
}));



test('InstrMisc - 01 - Abs X Wrap', () => testInstructionTestRom('nes-test-roms/instr_misc/rom_singles/01-abs_x_wrap.nes'));
test('InstrMisc - 02 - Branch Wrap', () => testInstructionTestRom('nes-test-roms/instr_misc/rom_singles/02-branch_wrap.nes'));
test('InstrMisc - 03 - Dummy Reads', () => testInstructionTestRom('nes-test-roms/instr_misc/rom_singles/03-dummy_reads.nes'));

// test('InstrMisc - 04 - Dummy Reads APU', () => testInstructionTestRom('nes-test-roms/instr_misc/rom_singles/04-dummy_reads_apu.nes'));
