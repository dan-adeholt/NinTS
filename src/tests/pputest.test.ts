import { testInstructionTestRom, testPPURom, testPPURomWithImage } from './testutil';
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

test('blargg - Palette RAM', () => testPPURomWithImage('nes-test-roms/blargg_ppu_tests_2005.09.15b/palette_ram.nes', 'nes-test-images/palette_ram.nes.png', 25));
test('blargg - Power up palette', () => testPPURomWithImage('nes-test-roms/blargg_ppu_tests_2005.09.15b/power_up_palette.nes', 'nes-test-images/power_up_palette.nes.png', 25));
test('blargg - Sprite RAM', () => testPPURomWithImage('nes-test-roms/blargg_ppu_tests_2005.09.15b/sprite_ram.nes', 'nes-test-images/sprite_ram.nes.png', 25));
test('blargg - VBL clear time', () => testPPURomWithImage('nes-test-roms/blargg_ppu_tests_2005.09.15b/vbl_clear_time.nes', 'nes-test-images/vbl_clear_time.nes.png', 25));
test('blargg - VRAM access', () => testPPURomWithImage('nes-test-roms/blargg_ppu_tests_2005.09.15b/vram_access.nes', 'nes-test-images/vram_access.nes.png', 25));


test('PPU Read Buffer', () => testInstructionTestRom('nes-test-roms/ppu_read_buffer/test_ppu_read_buffer.nes'));

test('OAM read', () => testInstructionTestRom('nes-test-roms/oam_read/oam_read.nes'));

// Failed:
// PPU open bus
// OAM stress

const vblRoot = 'nes-test-roms/ppu_vbl_nmi/rom_singles/';
test('PPU VBL NMI - Basics', () => testInstructionTestRom(vblRoot + '01-vbl_basics.nes'));
test('PPU VBL NMI - Set time', () => testInstructionTestRom(vblRoot + '02-vbl_set_time.nes'));
test('PPU VBL NMI - Set time', () => testInstructionTestRom(vblRoot + '02-vbl_set_time.nes'));
test('PPU VBL NMI - Clear time', () => testInstructionTestRom(vblRoot + '03-vbl_clear_time.nes'));
test('PPU VBL NMI - NMI Control', () => testInstructionTestRom(vblRoot + '04-nmi_control.nes'));
test('PPU VBL NMI - NMI Timing', () => testInstructionTestRom(vblRoot + '05-nmi_timing.nes'));
test('PPU VBL NMI - Suppression', () => testInstructionTestRom(vblRoot + '06-suppression.nes'));
test('PPU VBL NMI - NMI On Timing', () => testInstructionTestRom(vblRoot + '07-nmi_on_timing.nes'));
test('PPU VBL NMI - NMI Off Timing', () => testInstructionTestRom(vblRoot + '08-nmi_off_timing.nes'));
test('PPU VBL NMI - Even odd frames', () => testInstructionTestRom(vblRoot + '09-even_odd_frames.nes'));
test('PPU VBL NMI - Even odd timing', () => testInstructionTestRom(vblRoot + '10-even_odd_timing.nes'));

const spriteHitRoot = 'nes-test-roms/sprite_hit_tests_2005.10.05/';
test('Sprite hit tests - Basics', () => testPPURomWithImage(spriteHitRoot + '01.basics.nes', 'nes-test-images/sprite_hit_tests-01.basics.nes.png', 35));
test('Sprite hit tests - Alignment', () => testPPURomWithImage(spriteHitRoot + '02.alignment.nes', 'nes-test-images/sprite_hit_tests-02.alignment.nes.png', 35));
test('Sprite hit tests - Corners', () => testPPURomWithImage(spriteHitRoot + '03.corners.nes', 'nes-test-images/sprite_hit_tests-03.corners.nes.png', 35));
test('Sprite hit tests - Flip', () => testPPURomWithImage(spriteHitRoot + '04.flip.nes', 'nes-test-images/sprite_hit_tests-04.flip.nes.png', 35));
test('Sprite hit tests - Left clip', () => testPPURomWithImage(spriteHitRoot + '05.left_clip.nes', 'nes-test-images/sprite_hit_tests-05.left_clip.nes.png', 35));
test('Sprite hit tests - Right edge', () => testPPURomWithImage(spriteHitRoot + '06.right_edge.nes', 'nes-test-images/sprite_hit_tests-06.right_edge.nes.png', 35));
test('Sprite hit tests - Screen bottom', () => testPPURomWithImage(spriteHitRoot + '07.screen_bottom.nes', 'nes-test-images/sprite_hit_tests-07.screen_bottom.nes.png', 35));
test('Sprite hit tests - Double height', () => testPPURomWithImage(spriteHitRoot + '08.double_height.nes', 'nes-test-images/sprite_hit_tests-08.double_height.nes.png', 35));
test('Sprite hit tests - Timing basics', () => testPPURomWithImage(spriteHitRoot + '09.timing_basics.nes', 'nes-test-images/sprite_hit_tests-09.timing_basics.nes.png', 65));
test('Sprite hit tests - Timing order', () => testPPURomWithImage(spriteHitRoot + '10.timing_order.nes', 'nes-test-images/sprite_hit_tests-10.timing_order.nes.png', 65));
test('Sprite hit tests - Edge timing', () => testPPURomWithImage(spriteHitRoot + '11.edge_timing.nes', 'nes-test-images/sprite_hit_tests-11.edge_timing.nes.png', 75));

const vblNMITimingRoot = 'nes-test-roms/vbl_nmi_timing/';

test('VBL NMI Timing - Frame basics', () => testPPURomWithImage(vblNMITimingRoot + '1.frame_basics.nes', 'nes-test-images/vbl_nmi_timing-1.frame_basics.nes.png', 178));
test('VBL NMI Timing - VBL Timing', () => testPPURomWithImage(vblNMITimingRoot + '2.vbl_timing.nes', 'nes-test-images/vbl_nmi_timing-2.vbl_timing.nes.png', 155));
test('VBL NMI Timing - Even/Odd frames', () => testPPURomWithImage(vblNMITimingRoot + '3.even_odd_frames.nes', 'nes-test-images/vbl_nmi_timing-3.even_odd_frames.nes.png', 95));
test('VBL NMI Timing - VBL Clear Timing', () => testPPURomWithImage(vblNMITimingRoot + '4.vbl_clear_timing.nes', 'nes-test-images/vbl_nmi_timing-4.vbl_clear_timing.nes.png', 125));
test('VBL NMI Timing - NMI Suppression', () => testPPURomWithImage(vblNMITimingRoot + '5.nmi_suppression.nes', 'nes-test-images/vbl_nmi_timing-5.nmi_suppression.nes.png', 185));
test('VBL NMI Timing - NMI Disable', () => testPPURomWithImage(vblNMITimingRoot + '6.nmi_disable.nes', 'nes-test-images/vbl_nmi_timing-6.nmi_disable.nes.png', 105));
test('VBL NMI Timing - NMI Timing', () => testPPURomWithImage(vblNMITimingRoot + '7.nmi_timing.nes', 'nes-test-images/vbl_nmi_timing-7.nmi_timing.nes.png', 105));
