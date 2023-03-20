import { testInstructionTestRom } from './testutil';
import { test } from 'vitest'

test('Instruction Timing - Instructions', () => testInstructionTestRom('nes-test-roms/instr_timing/rom_singles/1-instr_timing.nes'));
test('Instruction Timing - Branch', () => testInstructionTestRom('nes-test-roms/instr_timing/rom_singles/2-branch_timing.nes'));
