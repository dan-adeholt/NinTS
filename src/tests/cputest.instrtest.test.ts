import { testInstructionTestRom } from './testutil';
import { test } from 'vitest'

test('InstrTestV5 - 01 - Basics', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/01-basics.nes'));
test('InstrTestV5 - 02 - Implied', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/02-implied.nes'));
test('InstrTestV5 - 03 - Immediate', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/03-immediate.nes'));
test('InstrTestV5 - 04 - Zero Page', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/04-zero_page.nes'));
test('InstrTestV5 - 05 - Zero Page XY', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/05-zp_xy.nes'));
test('InstrTestV5 - 06 - Absolute', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/06-absolute.nes'));
test('InstrTestV5 - 07 - Absolute XY', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/07-abs_xy.nes'));
test('InstrTestV5 - 08 - Indirect X', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/08-ind_x.nes'));
