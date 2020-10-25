import { testInstructionTestRom } from './testutil';

test('InstrTestV5 - 01 - Basics', () => testInstructionTestRom('public/tests/instr-test/01-basics.nes'));
test('InstrTestV5 - 02 - Implied', () => testInstructionTestRom('public/tests/instr-test/02-implied.nes'));
test('InstrTestV5 - 03 - Immediate', () => testInstructionTestRom('public/tests/instr-test/03-immediate.nes'));
