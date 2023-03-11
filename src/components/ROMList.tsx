import React, { useCallback } from 'react';
import { LOCAL_STORAGE_ROM_PREFIX, RomEntry } from './types';

type ROMListProps = {
  romList: RomEntry[]
  loadRom: (rom: Uint8Array, filename: string) => void,
}

const ROMList = ({ romList, loadRom } : ROMListProps) => {
  const _loadRom = useCallback((romEntry: RomEntry) => {
    const lastRomArray = localStorage.getItem(LOCAL_STORAGE_ROM_PREFIX + romEntry.sha);

    if (lastRomArray != null) {
      const romBuffer = new Uint8Array(JSON.parse(lastRomArray));
      loadRom(romBuffer, romEntry.filename);
    }
  }, []);

  return (
    <>
      { romList.map((rom, idx) => (
        <button key={idx} onClick={() => _loadRom(rom)}>
          { rom.filename }
        </button>
      ))}
    </>
  );
};

export default React.memo(ROMList);
