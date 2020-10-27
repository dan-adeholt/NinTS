import { testInstructionTestRom, runTestWithLogFile } from './testutil';

test('Nes test rom executes properly', () =>
  runTestWithLogFile(
    'public/tests/nestest.nes',
    'public/tests/nestest.log',
    state => {
      state.PC = 0xC000;
      state.CYC = 7; // For some reason the logs start at 7 ? Perhaps has to do with reset vector or something
      state.PPU_CYC = 21;
    },
    false)
);

test('InstrTestV5 - 01 - Basics', () => testInstructionTestRom('public/tests/instr-test/01-basics.nes'));
test('InstrTestV5 - 02 - Implied', () => testInstructionTestRom('public/tests/instr-test/02-implied.nes'));
test('InstrTestV5 - 03 - Immediate', () => testInstructionTestRom('public/tests/instr-test/03-immediate.nes'));
test('InstrTestV5 - 04 - Zero Page', () => testInstructionTestRom('public/tests/instr-test/04-zero_page.nes'));
test('InstrTestV5 - 05 - Zero Page XY', () => testInstructionTestRom('public/tests/instr-test/05-zp_xy.nes'));
test('InstrTestV5 - 06 - Absolute', () => testInstructionTestRom('public/tests/instr-test/06-absolute.nes'));
test('InstrTestV5 - 07 - Absolute XY', () => testInstructionTestRom('public/tests/instr-test/07-abs_xy.nes'));
test('InstrTestV5 - 08 - Indirect X', () => testInstructionTestRom('public/tests/instr-test/08-ind_x.nes'));
test('InstrTestV5 - 09 - Indirect Y', () => testInstructionTestRom('public/tests/instr-test/09-ind_y.nes'));
test('InstrTestV5 - 10 - Branches', () => testInstructionTestRom('public/tests/instr-test/10-branches.nes'));
test('InstrTestV5 - 11 - Stack', () => testInstructionTestRom('public/tests/instr-test/11-stack.nes'));
test('InstrTestV5 - 12 - JMP/JSR', () => testInstructionTestRom('public/tests/instr-test/12-jmp_jsr.nes'));
test('InstrTestV5 - 13 - RTS', () => testInstructionTestRom('public/tests/instr-test/13-rts.nes'));
test('InstrTestV5 - 14 - RTI', () => testInstructionTestRom('public/tests/instr-test/14-rti.nes'));
test('InstrTestV5 - 15 - BRK', () => testInstructionTestRom('public/tests/instr-test/15-brk.nes'));
test('InstrTestV5 - 16 - Special', () => testInstructionTestRom('public/tests/instr-test/16-special.nes'));
