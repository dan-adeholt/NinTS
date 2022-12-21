import { test } from 'vitest'
import { patchROMToAllowWritableCHR, testPPURomWithImage } from './testutil';

test('blargg - 01 - Length Control', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/01.len_ctr.nes', 'nes-test-images/ok_blargg_apu.png', 25, patchROMToAllowWritableCHR));
test('blargg - 02 - Length Table', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/02.len_table.nes', 'nes-test-images/ok_blargg_apu.png', 25, patchROMToAllowWritableCHR));
test('blargg - 03 - IRQ flag', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/03.irq_flag.nes', 'nes-test-images/ok_blargg_apu.png', 25, patchROMToAllowWritableCHR));
