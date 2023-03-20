import { testInstructionTestRom } from './testutil';
import { test } from 'vitest'

test('CPU Interrupts V2 - CLI Latency', () => testInstructionTestRom('nes-test-roms/cpu_interrupts_v2/rom_singles/1-cli_latency.nes'));
test('CPU Interrupts V2 - NMI and BRK', () => testInstructionTestRom('nes-test-roms/cpu_interrupts_v2/rom_singles/2-nmi_and_brk.nes'));
test('CPU Interrupts V2 - NMI and IRQ', () => testInstructionTestRom('nes-test-roms/cpu_interrupts_v2/rom_singles/3-nmi_and_irq.nes'));
test('CPU Interrupts V2 - IRQ and DMA', () => testInstructionTestRom('nes-test-roms/cpu_interrupts_v2/rom_singles/4-irq_and_dma.nes'));
test('CPU Interrupts V2 - Branch delays and IRQ', () => testInstructionTestRom('nes-test-roms/cpu_interrupts_v2/rom_singles/5-branch_delays_irq.nes'));