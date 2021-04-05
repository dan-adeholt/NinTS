const fs = require('fs');
let path = '../../fceux/output/palettes/FCEUX.pal';

const hex = num => num.toString(16).toUpperCase().padStart(2, '0');

console.log(path);

const data = fs.readFileSync(path);

for (let i = 0, addr = 0; addr < data.length; i++) {
  const b = data[addr++];
  const g = data[addr++];
  const r = data[addr++];
  console.log('0xFF' + hex(r) + hex(g) + hex(b) + ', //' + hex(i));
}


