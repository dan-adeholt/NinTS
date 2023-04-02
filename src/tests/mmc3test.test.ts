import { testInstructionTestRom, testPPURomWithImage } from './testutil';
import { test } from 'vitest'

test('MMC3 IRQ tests - 1.Clocking', () => testPPURomWithImage('nes-test-roms/mmc3_irq_tests/1.Clocking.nes', 'nes-test-images/test_mmc3_irq_tests_1.Clocking.nes.png', 45));
test('MMC3 IRQ tests - 2.Details', () => testPPURomWithImage('nes-test-roms/mmc3_irq_tests/2.Details.nes', 'nes-test-images/test_mmc3_irq_tests_2.Details.nes.png', 35));
test('MMC3 IRQ tests - 3.A12_clocking', () => testPPURomWithImage('nes-test-roms/mmc3_irq_tests/3.A12_clocking.nes', 'nes-test-images/test_mmc3_irq_tests_3.A12_clocking.nes.png', 35));
test('MMC3 IRQ tests - 4.Scanline_timing', () => testPPURomWithImage('nes-test-roms/mmc3_irq_tests/4.Scanline_timing.nes', 'nes-test-images/test_mmc3_irq_tests_4.Scanline_timing.nes.png', 75));
// test('MMC3 IRQ tests - 5.MMC3_rev_A', () => testPPURomWithImage('nes-test-roms/mmc3_irq_tests/5.MMC3_rev_A.nes', 'nes-test-images/test_mmc3_irq_tests_5.MMC3_rev_A.nes.png', 35));
test('MMC3 IRQ tests - 6.MMC3_rev_B', () => testPPURomWithImage('nes-test-roms/mmc3_irq_tests/6.MMC3_rev_B.nes', 'nes-test-images/test_mmc3_irq_tests_6.MMC3_rev_B.nes.png', 35));

test('MMC3 Test 1 - Clocking', () => testInstructionTestRom('nes-test-roms/mmc3_test/1-clocking.nes'));
test('MMC3 Test 2 - Details', () => testInstructionTestRom('nes-test-roms/mmc3_test/2-details.nes'));
test('MMC3 Test 3 - A12 Clocking', () => testInstructionTestRom('nes-test-roms/mmc3_test/3-A12_clocking.nes'));
test('MMC3 Test 4 - Scanline timing', () => testInstructionTestRom('nes-test-roms/mmc3_test/4-scanline_timing.nes'));
test('MMC3 Test 5 - MMC3', () => testInstructionTestRom('nes-test-roms/mmc3_test/5-MMC3.nes'));
// test('MMC3 Test 6 - MMC6', () => testInstructionTestRom('nes-test-roms/mmc3_test/6-MMC6.nes'));