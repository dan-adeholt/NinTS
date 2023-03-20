import { testInstructionTestRom } from './testutil';
import { test } from 'vitest'

const vblRoot = 'nes-test-roms/ppu_vbl_nmi/rom_singles/';
test('PPU VBL NMI - Basics', () => testInstructionTestRom(vblRoot + '01-vbl_basics.nes'));
test('PPU VBL NMI - Set time', () => testInstructionTestRom(vblRoot + '02-vbl_set_time.nes'));
test('PPU VBL NMI - Set time', () => testInstructionTestRom(vblRoot + '02-vbl_set_time.nes'));
test('PPU VBL NMI - Clear time', () => testInstructionTestRom(vblRoot + '03-vbl_clear_time.nes'));
test('PPU VBL NMI - NMI Control', () => testInstructionTestRom(vblRoot + '04-nmi_control.nes'));
test('PPU VBL NMI - NMI Timing', () => testInstructionTestRom(vblRoot + '05-nmi_timing.nes'));
