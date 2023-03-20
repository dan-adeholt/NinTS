import { test } from 'vitest'
import { testInstructionTestRom } from './testutil';

test('PPU Read Buffer', () => testInstructionTestRom('nes-test-roms/ppu_read_buffer/test_ppu_read_buffer.nes'));
