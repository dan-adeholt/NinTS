import { testInstructionTestRom, runTestWithLogFile } from './testutil';

test('Nes test rom executes properly', () =>
  runTestWithLogFile(
    'nestest.nes',
    'nestest.log',
    state => {
      state.PC = 0xC000;
      state.memory[0x4015] = 0x00;
    },
    false)
);

test('InstrTestV5 - 01 - Basics', () => testInstructionTestRom('instr-test/01-basics.nes'));
test('InstrTestV5 - 02 - Implied', () => testInstructionTestRom('instr-test/02-implied.nes'));
test('InstrTestV5 - 03 - Immediate', () => testInstructionTestRom('instr-test/03-immediate.nes'));
test('InstrTestV5 - 04 - Zero Page', () => testInstructionTestRom('instr-test/04-zero_page.nes'));
test('InstrTestV5 - 05 - Zero Page XY', () => testInstructionTestRom('instr-test/05-zp_xy.nes'));
test('InstrTestV5 - 06 - Absolute', () => testInstructionTestRom('instr-test/06-absolute.nes'));
test('InstrTestV5 - 07 - Absolute XY', () => testInstructionTestRom('instr-test/07-abs_xy.nes'));
test('InstrTestV5 - 08 - Indirect X', () => testInstructionTestRom('instr-test/08-ind_x.nes'));
test('InstrTestV5 - 09 - Indirect Y', () => testInstructionTestRom('instr-test/09-ind_y.nes'));
test('InstrTestV5 - 10 - Branches', () => testInstructionTestRom('instr-test/10-branches.nes'));
test('InstrTestV5 - 11 - Stack', () => testInstructionTestRom('instr-test/11-stack.nes'));
test('InstrTestV5 - 12 - JMP/JSR', () => testInstructionTestRom('instr-test/12-jmp_jsr.nes'));
test('InstrTestV5 - 13 - RTS', () => testInstructionTestRom('instr-test/13-rts.nes'));
test('InstrTestV5 - 14 - RTI', () => testInstructionTestRom('instr-test/14-rti.nes'));
test('InstrTestV5 - 15 - BRK', () => testInstructionTestRom('instr-test/15-brk.nes'));
test('InstrTestV5 - 16 - Special', () => testInstructionTestRom('instr-test/16-special.nes'));
