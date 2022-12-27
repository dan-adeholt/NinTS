import { test } from 'vitest'
import { testPPURomWithImage } from './testutil';

test('blargg - 01 - Length Control', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/01.len_ctr.nes', 'nes-test-images/ok_blargg_apu.png', 25));
test('blargg - 02 - Length Table', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/02.len_table.nes', 'nes-test-images/ok_blargg_apu.png', 25));
test('blargg - 03 - IRQ flag', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/03.irq_flag.nes', 'nes-test-images/ok_blargg_apu.png', 25));
test('blargg - 04 - Clock jitter', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/04.clock_jitter.nes', 'nes-test-images/ok_blargg_apu.png', 25));
test('blargg - 05 - Length timing mode 0', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/05.len_timing_mode0.nes', 'nes-test-images/ok_blargg_apu.png', 25));
test('blargg - 06 - Length timing mode 1', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/06.len_timing_mode1.nes', 'nes-test-images/ok_blargg_apu.png', 25));
test('blargg - 07 - IRQ flag timing', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/07.irq_flag_timing.nes', 'nes-test-images/ok_blargg_apu.png', 25));
test('blargg - 08 - IRQ timing', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/08.irq_timing.nes', 'nes-test-images/ok_blargg_apu.png', 25));
test('blargg - 09 - Reset timing', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/09.reset_timing.nes', 'nes-test-images/ok_blargg_apu.png', 25));
test('blargg - 10 - Length halt timing', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/10.len_halt_timing.nes', 'nes-test-images/ok_blargg_apu.png', 25));
test('blargg - 11 - Length reload timing', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/10.len_halt_timing.nes', 'nes-test-images/ok_blargg_apu.png', 25));
