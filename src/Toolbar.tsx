import React, { useState } from 'react';
import styles from './Toolbar.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSave, faRefresh, faFile, faCogs, faTools, faClock } from '@fortawesome/free-solid-svg-icons'
import Dropdown from './Dropdown';
import { DebugDialog, DebugDialogHotkeysComponents } from './DebugDialog';

type ToolbarProps = {
  toggleOpenDialog: (dialog : DebugDialog) => void
};

enum DropdownMenu {
  Settings = 1,
  Profile = 2
}

const Toolbar = ({ toggleOpenDialog } : ToolbarProps) => {
  const [menuState, setMenuState] = useState<Record<number, boolean>>({});
  const toggleOpen = (menu: DropdownMenu) => setMenuState(oldState => ({ [menu]: !oldState[menu]}));

  return (
    <div className={styles.toolbar}>
      <div className={styles.item}>
        <h1>JSNES</h1>
      </div>
      <div className={styles.item}>
        <button><FontAwesomeIcon icon={faFile}/>Open file...</button>
      </div>
      <div className={styles.item}>
        <button><FontAwesomeIcon icon={faSave}/>Save state</button>
      </div>
      <div className={styles.item}>
        <button><FontAwesomeIcon icon={faRefresh}/>Load state</button>
      </div>
      <div className={styles.item}>
        <button><FontAwesomeIcon icon={faCogs}/>Settings</button>
      </div>
      <div className={styles.item}>
        <button onClick={() => toggleOpen(DropdownMenu.Settings)}><FontAwesomeIcon icon={faTools}/>Debug</button>
        <Dropdown isOpen={menuState[DropdownMenu.Settings]}>
          { Object.values(DebugDialog).map(dialog => (
            <button onClick={() => {
              toggleOpen(DropdownMenu.Settings);
              toggleOpenDialog(dialog);
            }} key={dialog}>{ dialog } <div className={styles.buttonSpace}/> { DebugDialogHotkeysComponents[dialog] } </button>
          ))}
        </Dropdown>
      </div>
      <div className={styles.item}>
        <button onClick={() => toggleOpen(DropdownMenu.Profile)}><FontAwesomeIcon icon={faClock}/>Profile</button>
        <Dropdown isOpen={menuState[DropdownMenu.Profile]}>
          <button> Profile APU </button>
          <button> Profile PPU </button>
          <button> Profile CPU </button>
        </Dropdown>
      </div>
    </div>
  );
};

export default React.memo(Toolbar);
