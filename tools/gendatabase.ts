import fs from 'fs';
import xml2js from 'xml2js';

const file = fs.readFileSync('../nes20db.xml', 'utf8');
xml2js.parseString(file, (err, result) => {
  if (err) {
    console.error(err);
  }

  let database = {};

  for (const game of result.nes20db.game) {
    const region = parseInt(game.console[0].$.region, 10);;
    const type = parseInt(game.console[0].$.type, 10);
    const mapper = parseInt(game.pcb[0].$.mapper, 10);
    const submapper = parseInt(game.pcb[0].$.submapper, 10);
    const mirroring = game.pcb[0].$.mirroring;
    const battery = game.pcb[0].$.battery === '1';


    const prgRomSize = parseInt(game.prgrom?.[0]?.$?.size ?? '0', 10);
    const chrRomSize = parseInt(game.chrrom?.[0]?.$?.size ?? '0', 10);    
    
    const chrRamSize = parseInt(game.chrram?.[0]?.$?.size ?? '0', 10);
    const chrNVRamSize = parseInt(game.chrnvram?.[0]?.$?.size ?? '0', 10);
    const prgRamSize = parseInt(game.prgram?.[0]?.$?.size ?? '0', 10);
    const prgNVRamSize = parseInt(game.prgnvram?.[0]?.$?.size ?? '0', 10);
    
    const entry = [region, type, mapper, submapper, mirroring, battery, prgRomSize, chrRomSize, prgRamSize, prgNVRamSize, chrRamSize, chrNVRamSize];
    const sha = game.rom[0].$.sha1;
  
    database[sha] = entry;
  }

  const header = 'export type DatabaseEntry = [region: number, type: number, mapper: number, submapper: number, mirroring: string, battery: boolean, prgRomSize: number, chrRomSize: number, prgRamSize: number, prgNVRamSize: number, chrRamSize: number, chrNVRamSize: number];\n\n'
  const footer = 'export default database;\n';
  fs.writeFileSync('src/emulator/database/nes20db.ts', header + `const database: Record<string, DatabaseEntry> = ${JSON.stringify(database)}\n\n` + footer);  
  
  return result;
});

