import { test } from 'vitest'
import { testInstructionTestRom, testPPURomWithImage, testPPURomWithImageAndResetImage, testPPURomWithImageAndResetImageTwice } from './testutil';

test('blargg - 01 - Length Control', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/01.len_ctr.nes', 'nes-test-images/ok_blargg_apu.png', 25));
test('blargg - 02 - Length Table', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/02.len_table.nes', 'nes-test-images/ok_blargg_apu.png', 25));
test('blargg - 03 - IRQ flag', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/03.irq_flag.nes', 'nes-test-images/ok_blargg_apu.png', 25));
test('blargg - 04 - Clock jitter', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/04.clock_jitter.nes', 'nes-test-images/ok_blargg_apu.png', 25));
test('blargg - 05 - Length timing mode 0', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/05.len_timing_mode0.nes', 'nes-test-images/ok_blargg_apu.png', 30));
test('blargg - 06 - Length timing mode 1', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/06.len_timing_mode1.nes', 'nes-test-images/ok_blargg_apu.png', 30));
test('blargg - 07 - IRQ flag timing', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/07.irq_flag_timing.nes', 'nes-test-images/ok_blargg_apu.png', 25));
test('blargg - 08 - IRQ timing', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/08.irq_timing.nes', 'nes-test-images/ok_blargg_apu.png', 25));
test('blargg - 09 - Reset timing', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/09.reset_timing.nes', 'nes-test-images/ok_blargg_apu.png', 25));
test('blargg - 10 - Length halt timing', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/10.len_halt_timing.nes', 'nes-test-images/ok_blargg_apu.png', 25));
test('blargg - 11 - Length reload timing', () => testPPURomWithImage('nes-test-roms/blargg_apu_2005.07.30/11.len_reload_timing.nes', 'nes-test-images/ok_blargg_apu.png', 25));


const apuTestRoot = 'nes-test-roms/apu_test/rom_singles/';

test('apu_test - Length Control', () => testInstructionTestRom(apuTestRoot + '1-len_ctr.nes'));
test('apu_test - Length Table', () => testInstructionTestRom(apuTestRoot + '2-len_table.nes'));
test('apu_test - IRQ Flag', () => testInstructionTestRom(apuTestRoot + '3-irq_flag.nes'));
test('apu_test - Jitter', () => testInstructionTestRom(apuTestRoot + '4-jitter.nes'));
test('apu_test - Length timing', () => testInstructionTestRom(apuTestRoot + '5-len_timing.nes'));
test('apu_test - IRQ Flag Timing', () => testInstructionTestRom(apuTestRoot + '6-irq_flag_timing.nes'));
test('apu_test - DMC Basics', () => testInstructionTestRom(apuTestRoot + '7-dmc_basics.nes'));
test('apu_test - DMC Rates', () => testInstructionTestRom(apuTestRoot + '8-dmc_rates.nes'));


const dmcDmaDuringReadTestRoot = 'nes-test-roms/dmc_dma_during_read4/';

// Checksum OK according to https://tasvideos.org/EmulatorResources/NESAccuracyTests/TestCriteria
test('DMC DMA During Read4 - dma_2007 read', () => testPPURomWithImage(dmcDmaDuringReadTestRoot + '/dma_2007_read.nes', 'nes-test-images/dmc_dma_during_read4_dma_2007_read.nes.png', 25));
test('DMC DMA During Read4 - dma_2007 write', () => testPPURomWithImage(dmcDmaDuringReadTestRoot + '/dma_2007_write.nes', 'nes-test-images/dmc_dma_during_read4_dma_2007_write.nes.png', 35));
test('DMC DMA During Read4 - dma_2007 readwrite', () => testPPURomWithImage(dmcDmaDuringReadTestRoot + '/read_write_2007.nes', 'nes-test-images/dmc_dma_during_read4_read_write_2007.nes.png', 35));
test('DMC DMA During Read4 - double 2007 read', () => testPPURomWithImage(dmcDmaDuringReadTestRoot + '/double_2007_read.nes', 'nes-test-images/dmc_dma_during_read4_double_2007_read.nes.png', 35));
test('DMC DMA During Read4 - dma 4016 read', () => testPPURomWithImage(dmcDmaDuringReadTestRoot + '/dma_4016_read.nes', 'nes-test-images/dmc_dma_during_read4_dma_4016_read.nes.png', 25));

const apuResetRoot = 'nes-test-roms/apu_reset/';
test('apu_reset - 4015_cleared.nes', () => testPPURomWithImageAndResetImage(apuResetRoot + '/4015_cleared.nes', 'nes-test-images/reset_image.png', 30, 'nes-test-images/apu_reset_4015_cleared.nes.png', 30));
test('apu_reset - 4017_timing.nes', () => testPPURomWithImageAndResetImage(apuResetRoot + '/4017_timing.nes', 'nes-test-images/reset_image_4017_timing.nes.png', 30, 'nes-test-images/apu_reset_4017_timing.nes.png', 30));
test('apu_reset - 4017_written.nes', () => testPPURomWithImageAndResetImageTwice(apuResetRoot + '/4017_written.nes', 'nes-test-images/reset_image.png', 'nes-test-images/reset_image_again.png', 30, 'nes-test-images/apu_reset_4017_written.nes.png', 30));
test('apu_reset - irq_flag_cleared.nes', () => testPPURomWithImageAndResetImage(apuResetRoot + '/irq_flag_cleared.nes', 'nes-test-images/reset_image.png', 30, 'nes-test-images/apu_reset_irq_flag_cleared.nes.png', 30));
test('apu_reset - len_ctrs_enabled.nes', () => testPPURomWithImageAndResetImage(apuResetRoot + '/len_ctrs_enabled.nes', 'nes-test-images/reset_image.png', 30, 'nes-test-images/apu_reset_len_ctrs_enabled.nes.png', 30));
test('apu_reset - works_immediately.nes', () => testPPURomWithImageAndResetImage(apuResetRoot + '/works_immediately.nes', 'nes-test-images/reset_image.png', 30, 'nes-test-images/apu_reset_works_immediately.nes.png', 30));