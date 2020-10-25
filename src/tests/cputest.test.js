import { runTestWithLogFile } from './testutil';

test('Nes test rom executes properly', () =>
  runTestWithLogFile(
    'public/tests/nestest.nes',
    'public/tests/nestest.log',
    state => {
      state.PC = 0xC000;
      state.CYC = 7; // For some reason the logs start at 7 ? Perhaps has to do with reset vector or something
      state.PPU_CYC = 21;
    },
    false)
);

