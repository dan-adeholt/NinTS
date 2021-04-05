const fs = require('fs');

const sprite = (page, x, y, tile, palette = 0, priority = 0, flipVertical = 0, flipHorizontal = 0) => {
  const attributes = palette | (priority << 5) | (flipHorizontal << 6) | (flipVertical << 7);
  console.log(attributes);
  page.push(y);
  page.push(tile);
  page.push(attributes);
  page.push(x);
}

const appendPage = (pageBuffer, page) => {
  for (let i = 0; i < 256; i++) {
    pageBuffer.push(i < page.length ? page[i] : 0xFF);
  }
}

const writePageBuffer = (pageBuffer, path) => {
  const array = Uint8Array.from(pageBuffer);
  fs.writeFileSync(path, array, )
}

const genTestROM = () => {
  const pageBuffer = [];

  const page = [];
  let pos = 8;

  for (let i = 0; i < 13; i++) {
    sprite(page, 30, pos, 3, i % 4 , 0, 0, i % 2 === 0);
    pos += 18;
  }
  pos = 8;

  for (let i = 0; i < 13; i++) {
    sprite(page, 100, pos, 4, i % 4 , 0, i % 2 === 0, 0);
    pos += 18;
  }

  sprite(page, 120, 20, 0x10, 0);
  sprite(page, 128, 20, 0x11, 0);
  sprite(page, 120, 28, 0x20, 0);
  sprite(page, 128, 28, 0x21, 0);

  appendPage(pageBuffer, page);
  writePageBuffer(pageBuffer, '../src/tests/roms/ppu-tests/util/sprite_tests.bin');
}


genTestROM();
