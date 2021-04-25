const fs = require('fs');

let buffer = new Uint8Array(1024).fill(0);

const add = (x, y, tile) => {
  buffer[y * 32 + x] = tile;
}

for (let y = 0; y < 30; y++) {
  for (let x = 0; x < 32; x++) {
    add(x, y, (x % 10) + 1);
  }
}

for (let i = 960; i < 1024; i++) {
  let p1 = (i % 4);
  let p2 = ((i + 1) % 4);
  let p3 = ((i + 2) % 4);
  let p4 = ((i + 3) % 4);

  buffer[i] = p1 | (p4 << 2) | (p3 << 4) | (p2 << 6);
}

fs.writeFileSync('../src/tests/roms/ppu-tests/03-tiles/tiles.bin', buffer);

/*

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
*/
