import { testInstructionTestRom, testPPURomWithImage } from './testutil';
import { test } from 'vitest'

test('CPU Dummy Reads', () => testPPURomWithImage('nes-test-roms/cpu_dummy_reads/cpu_dummy_reads.nes', 'nes-test-images/cpu_dummy_reads.nes.png', 50));
test('CPU dummy writes OAM', () => testInstructionTestRom('nes-test-roms/cpu_dummy_writes/cpu_dummy_writes_oam.nes'));
test('CPU dummy writes PPU', () => testInstructionTestRom('nes-test-roms/cpu_dummy_writes/cpu_dummy_writes_ppumem.nes'));