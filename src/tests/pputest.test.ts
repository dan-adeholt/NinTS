import { testInstructionTestRom, testPPURom, testPPURomWithImage } from './testutil';
import { COLORS } from '../emulator/constants';
import { expect, test } from 'vitest'

const romRootPath = 'src/tests/roms/ppu-tests/';

test('01 - Background', () => testPPURom(
  romRootPath + '01-background/01-background',
  (emulator) => {
    emulator.stepFrame(false);

    for (let colorIndex = 0; colorIndex < COLORS.length; colorIndex++) {
      const expectedColor = COLORS[colorIndex];
      expect(emulator.ppu.framebuffer.every(renderedColor => renderedColor === expectedColor)).toEqual(true);
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

test('sprdma_and_dmc_dma - base', () => testInstructionTestRom('nes-test-roms/sprdma_and_dmc_dma/sprdma_and_dmc_dma.nes'));
test('sprdma_and_dmc_dma - 512', () => testInstructionTestRom('nes-test-roms/sprdma_and_dmc_dma/sprdma_and_dmc_dma_512.nes'));

test('nmi_sync NTSC', () => testPPURomWithImage('nes-test-roms/nmi_sync/demo_ntsc.nes', 'nes-test-images/nmi_sync_demo_ntsc.nes.png', 25));



test('OAM read', () => testInstructionTestRom('nes-test-roms/oam_read/oam_read.nes'));

// Failed:
// PPU open bus
// OAM stress


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


const spriteOverflowTests = 'nes-test-roms/sprite_overflow_tests/';
test('Sprite overflow tests - Basics', () => testPPURomWithImage(spriteOverflowTests + '1.Basics.nes', 'nes-test-images/sprite_overflow_tests-1.Basics.nes.png', 35));
test('Sprite overflow tests - Details', () => testPPURomWithImage(spriteOverflowTests + '2.Details.nes', 'nes-test-images/sprite_overflow_tests-2.Details.nes.png', 35));
test('Sprite overflow tests - Emulator', () => testPPURomWithImage(spriteOverflowTests + '5.Emulator.nes', 'nes-test-images/sprite_overflow_tests-5.Emulator.nes.png', 35));

