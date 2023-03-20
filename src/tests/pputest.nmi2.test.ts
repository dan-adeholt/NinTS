import { testInstructionTestRom } from './testutil';
import { test } from 'vitest'

const vblRoot = 'nes-test-roms/ppu_vbl_nmi/rom_singles/';

test('PPU VBL NMI - Suppression', () => testInstructionTestRom(vblRoot + '06-suppression.nes'));
test('PPU VBL NMI - NMI On Timing', () => testInstructionTestRom(vblRoot + '07-nmi_on_timing.nes'));
test('PPU VBL NMI - NMI Off Timing', () => testInstructionTestRom(vblRoot + '08-nmi_off_timing.nes'));
test('PPU VBL NMI - Even odd frames', () => testInstructionTestRom(vblRoot + '09-even_odd_frames.nes'));
test('PPU VBL NMI - Even odd timing', () => testInstructionTestRom(vblRoot + '10-even_odd_timing.nes'));