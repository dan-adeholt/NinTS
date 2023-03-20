import { testPPURomWithImage } from './testutil';
import { test } from 'vitest'

test('CPU Timing test6', () => testPPURomWithImage('nes-test-roms/cpu_timing_test6/cpu_timing_test.nes', 'nes-test-images/cpu_timing_test.nes.png', 60 * 16, rom => {
  rom.settings.chrRamSize = 0x2000
}));
