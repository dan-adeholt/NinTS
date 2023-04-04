import React, { useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFile, faClose, faFolderOpen } from '@fortawesome/free-solid-svg-icons'
import { RomFilenameEntry, ApplicationStorageContext } from './ApplicationStorage';
import { useMutation } from '@tanstack/react-query';
import { useContextWithErrorIfNull } from '../hooks/useSafeContext';
import styles from './ROMList.module.css';
import Dialog, { DialogVerticalPosition } from './Dialog';

type ROMListProps = {
  romList: RomFilenameEntry[]
  onClose: () => void
  onClearRoms: () => void
  loadRom: (rom: Uint8Array, filename: string) => void,
  handleFileClick: () => void
  handleFileSelected: (e : React.ChangeEvent<HTMLInputElement>) => void
}

const ROMList = ({ romList, loadRom, onClose, onClearRoms, handleFileClick, handleFileSelected } : ROMListProps) => {
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
    <Dialog
      fullScreen
      onClose={onClose}
      verticalPosition={DialogVerticalPosition.TOP}
      title={'Select game'}
    >
      <input id="file-upload" type="file" onClick={handleFileClick} onChange={handleFileSelected} />
      <label className="labelButton" htmlFor="file-upload"><FontAwesomeIcon icon={faFolderOpen} /><span>Open file</span></label>
      { romList.map((rom, idx) => (
        <button className={styles.button} key={idx} onClick={() => _loadRom(rom)}>
          <FontAwesomeIcon icon={faFile}/> { rom.filename }
        </button>
      ))}
      <button className={styles.button} onClick={onClearRoms}><FontAwesomeIcon icon={faClose} /> Clear all</button>
    </Dialog>
  );
};

export default React.memo(ROMList);
