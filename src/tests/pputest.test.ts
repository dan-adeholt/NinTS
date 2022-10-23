import { testPPURom, testPPURomWithImage } from './testutil';
import { COLORS } from '../emulator/constants';
import _ from 'lodash';
import { expect, test } from 'vitest'
import EmulatorState from '../emulator/EmulatorState';


test('01 - Background', () => testPPURom(
  'ppu-tests/01-background/01-background',
  (emulator: EmulatorState) => {
    for (let colorIndex = 0; colorIndex < COLORS.length; colorIndex++) {
      const expectedColor = COLORS[colorIndex];
      expect(_.every(emulator.ppu.framebuffer, renderedColor => renderedColor === expectedColor)).toEqual(true);
      emulator.stepFrame(false);
    }
  })
);

test('02 - Sprites', () => testPPURomWithImage('ppu-tests/02-sprites/02-sprites'));
