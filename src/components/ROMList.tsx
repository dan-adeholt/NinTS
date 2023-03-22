import React, { useCallback } from 'react';
import { LOCAL_STORAGE_ROM_PREFIX, RomEntry } from './types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFile } from '@fortawesome/free-solid-svg-icons'

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
          <FontAwesomeIcon icon={faFile}/> { rom.filename }
        </button>
      ))}
    </>
  );
};

export default React.memo(ROMList);
