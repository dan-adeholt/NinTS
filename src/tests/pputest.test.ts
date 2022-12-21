import { testInstructionTestRom, testPPURom, testPPURomWithImage } from './testutil';
import { COLORS } from '../emulator/constants';
import _ from 'lodash';
import { expect, test } from 'vitest'
import EmulatorState from '../emulator/EmulatorState';
import { Rom } from '../emulator/parseROM';

const romRootPath = 'src/tests/roms/ppu-tests/';

test('01 - Background', () => testPPURom(
  romRootPath + '01-background/01-background',
  (emulator: EmulatorState) => {
    for (let colorIndex = 0; colorIndex < COLORS.length; colorIndex++) {
      const expectedColor = COLORS[colorIndex];
      expect(_.every(emulator.ppu.framebuffer, renderedColor => renderedColor === expectedColor)).toEqual(true);
      emulator.stepFrame(false);
    }
  })
);

const patchROM = (rom: Rom) => {
  rom.settings.chrRamSize = 0x2000;
}

test('02 - Sprites', () => testPPURomWithImage(romRootPath + '02-sprites/02-sprites.nes', romRootPath + '02-sprites/02-sprites.png'));

test('blargg - Palette RAM', () => testPPURomWithImage('nes-test-roms/blargg_ppu_tests_2005.09.15b/palette_ram.nes', 'nes-test-images/palette_ram.nes.png', 25, patchROM));
test('blargg - Power up palette', () => testPPURomWithImage('nes-test-roms/blargg_ppu_tests_2005.09.15b/power_up_palette.nes', 'nes-test-images/power_up_palette.nes.png', 25, patchROM));
test('blargg - Sprite RAM', () => testPPURomWithImage('nes-test-roms/blargg_ppu_tests_2005.09.15b/sprite_ram.nes', 'nes-test-images/sprite_ram.nes.png', 25, patchROM));
test('blargg - VBL clear time', () => testPPURomWithImage('nes-test-roms/blargg_ppu_tests_2005.09.15b/vbl_clear_time.nes', 'nes-test-images/vbl_clear_time.nes.png', 25, patchROM));
test('blargg - VRAM access', () => testPPURomWithImage('nes-test-roms/blargg_ppu_tests_2005.09.15b/vram_access.nes', 'nes-test-images/vram_access.nes.png', 25, patchROM));
test('PPU Read Buffer', () => testInstructionTestRom('nes-test-roms/ppu_read_buffer/test_ppu_read_buffer.nes'));
