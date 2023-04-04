import React, { useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFile } from '@fortawesome/free-solid-svg-icons'
import { RomFilenameEntry, ApplicationStorageContext } from './ApplicationStorage';
import { useMutation } from '@tanstack/react-query';
import { useContextWithErrorIfNull } from '../hooks/useSafeContext';

type ROMListProps = {
  romList: RomFilenameEntry[]
  loadRom: (rom: Uint8Array, filename: string) => void,
}

const ROMList = ({ romList, loadRom } : ROMListProps) => {
  const appStorage = useContextWithErrorIfNull(ApplicationStorageContext);
  const { mutate: loadRomFromBackend } = useMutation(appStorage.getRomData,
    {
      onSuccess: (romEntry) => {
        if (romEntry != null) {
          loadRom(romEntry.data, romEntry.filename);
        }
      }
    });
  
  const _loadRom = useCallback((romEntry: RomFilenameEntry) => {
    loadRomFromBackend(romEntry.sha);  
  }, [loadRomFromBackend]);

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
