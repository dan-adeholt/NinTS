import React, { useState, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFile, faClose, faFolderOpen, faCaretDown } from '@fortawesome/free-solid-svg-icons'
import { RomFilenameEntry, ApplicationStorageContext } from './ApplicationStorage';
import { useMutation } from '@tanstack/react-query';
import { useContextWithErrorIfNull } from '../hooks/useSafeContext';
import styles from './ROMList.module.css';
import Dialog, { DialogVerticalPosition } from './Dialog';
import classNames from 'classnames';

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
  const [endIndex, setEndIndex] = useState(100);
  const [searchFilter, setSearchFilter] = useState('');

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

  const listToUse = useMemo(() => {
    if (searchFilter.length > 0) {
      return romList.filter(rom => rom.filename.toLowerCase().includes(searchFilter.toLowerCase()));
    }
  
    return romList.slice(0, endIndex);
  }, [romList, romList, endIndex, searchFilter]);

  const promptClearRoms = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all loaded ROMs?')) {
      onClearRoms();
    }  
  }, []);  

  const loadMore = () => {
    setEndIndex(old => old + 100);
  }

  return (
    <Dialog
      fullScreen
      onClose={onClose}
      verticalPosition={DialogVerticalPosition.TOP}
      title={'Select game'}
    >
      <input id="file-upload" type="file" onClick={handleFileClick} onChange={handleFileSelected} />
      <label className={classNames("labelButton", styles.button)} htmlFor="file-upload"><FontAwesomeIcon icon={faFolderOpen} /><span>Open new file</span></label>
      <button className={styles.button} onClick={promptClearRoms}><FontAwesomeIcon icon={faClose} /> Clear all roms</button>
      <div className={styles.searchBar}>
        <input type="text" placeholder="Search roms" value={searchFilter} onChange={e => setSearchFilter(e.target.value)} />
      </div>
      { listToUse.map((rom, idx) => (
        <button className={styles.button} key={idx} onClick={() => _loadRom(rom)}>
          <FontAwesomeIcon icon={faFile}/> { rom.filename }
        </button>
      ))}
      { (searchFilter === '' && endIndex < romList.length) && <button className={styles.button} onClick={loadMore}><FontAwesomeIcon icon={faCaretDown} />Load more</button> }
      
    </Dialog>
  );
};

export default React.memo(ROMList);
