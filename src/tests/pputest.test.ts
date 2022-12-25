import { patchROMToAllowWritableCHR, testInstructionTestRom, testPPURom, testPPURomWithImage } from './testutil';
import { COLORS } from '../emulator/constants';
import _ from 'lodash';
import { expect, test } from 'vitest'

const romRootPath = 'src/tests/roms/ppu-tests/';

test('01 - Background', () => testPPURom(
  romRootPath + '01-background/01-background',
  (emulator) => {
    emulator.stepFrame(false);

    for (let colorIndex = 0; colorIndex < COLORS.length; colorIndex++) {
      const expectedColor = COLORS[colorIndex];
      expect(_.every(emulator.ppu.framebuffer, renderedColor => renderedColor === expectedColor)).toEqual(true);
      emulator.stepFrame(false);
    }
  })
);


test('02 - Sprites', () => testPPURomWithImage(romRootPath + '02-sprites/02-sprites.nes', romRootPath + '02-sprites/02-sprites.png'));

test('blargg - Palette RAM', () => testPPURomWithImage('nes-test-roms/blargg_ppu_tests_2005.09.15b/palette_ram.nes', 'nes-test-images/palette_ram.nes.png', 25, patchROMToAllowWritableCHR));
test('blargg - Power up palette', () => testPPURomWithImage('nes-test-roms/blargg_ppu_tests_2005.09.15b/power_up_palette.nes', 'nes-test-images/power_up_palette.nes.png', 25, patchROMToAllowWritableCHR));
test('blargg - Sprite RAM', () => testPPURomWithImage('nes-test-roms/blargg_ppu_tests_2005.09.15b/sprite_ram.nes', 'nes-test-images/sprite_ram.nes.png', 25, patchROMToAllowWritableCHR));
test('blargg - VBL clear time', () => testPPURomWithImage('nes-test-roms/blargg_ppu_tests_2005.09.15b/vbl_clear_time.nes', 'nes-test-images/vbl_clear_time.nes.png', 25, patchROMToAllowWritableCHR));
test('blargg - VRAM access', () => testPPURomWithImage('nes-test-roms/blargg_ppu_tests_2005.09.15b/vram_access.nes', 'nes-test-images/vram_access.nes.png', 25, patchROMToAllowWritableCHR));


test('PPU Read Buffer', () => testInstructionTestRom('nes-test-roms/ppu_read_buffer/test_ppu_read_buffer.nes'));

test('OAM read', () => testInstructionTestRom('nes-test-roms/oam_read/oam_read.nes'));

// Failed:
// PPU open bus
// OAM stress

test('PPU VBL NMI - Basics', () => testInstructionTestRom('nes-test-roms/ppu_vbl_nmi/rom_singles/01-vbl_basics.nes'));
test('PPU VBL NMI - Set time', () => testInstructionTestRom('nes-test-roms/ppu_vbl_nmi/rom_singles/02-vbl_set_time.nes'));
test('PPU VBL NMI - Set time', () => testInstructionTestRom('nes-test-roms/ppu_vbl_nmi/rom_singles/02-vbl_set_time.nes'));
test('PPU VBL NMI - Clear time', () => testInstructionTestRom('nes-test-roms/ppu_vbl_nmi/rom_singles/03-vbl_clear_time.nes'));
test('PPU VBL NMI - NMI Control', () => testInstructionTestRom('nes-test-roms/ppu_vbl_nmi/rom_singles/04-nmi_control.nes'));
test('PPU VBL NMI - NMI Timing', () => testInstructionTestRom('nes-test-roms/ppu_vbl_nmi/rom_singles/05-nmi_timing.nes'));
test('PPU VBL NMI - Suppression', () => testInstructionTestRom('nes-test-roms/ppu_vbl_nmi/rom_singles/06-suppression.nes'));
test('PPU VBL NMI - NMI On Timing', () => testInstructionTestRom('nes-test-roms/ppu_vbl_nmi/rom_singles/07-nmi_on_timing.nes'));
test('PPU VBL NMI - NMI Off Timing', () => testInstructionTestRom('nes-test-roms/ppu_vbl_nmi/rom_singles/08-nmi_off_timing.nes'));
test('PPU VBL NMI - Even odd frames', () => testInstructionTestRom('nes-test-roms/ppu_vbl_nmi/rom_singles/09-even_odd_frames.nes'));
