import { testInstructionTestRom } from './testutil';
import { test } from 'vitest'

test('InstrTestV5 - 09 - Indirect Y', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/09-ind_y.nes'));
test('InstrTestV5 - 10 - Branches', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/10-branches.nes'));
test('InstrTestV5 - 11 - Stack', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/11-stack.nes'));
test('InstrTestV5 - 12 - JMP/JSR', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/12-jmp_jsr.nes'));
test('InstrTestV5 - 13 - RTS', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/13-rts.nes'));
test('InstrTestV5 - 14 - RTI', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/14-rti.nes'));
test('InstrTestV5 - 15 - BRK', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/15-brk.nes'));
test('InstrTestV5 - 16 - Special', () => testInstructionTestRom('nes-test-roms/instr_test-v5/rom_singles/16-special.nes'));