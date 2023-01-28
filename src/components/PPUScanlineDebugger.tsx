import React, { useMemo } from 'react';
import styles from './PPUDebugging.module.css';
import { DebugDialogProps } from '../DebugDialog';
import Dialog, { DialogHorizontalPosition } from '../Dialog';
import classNames from 'classnames';

const PPUScanlineDebugger = ({ emulator, refresh, isOpen, onClose } : DebugDialogProps) => {
  const lines = useMemo(() => {
    const lines = emulator.ppu.scanlineLogger.getLines();

    let ret = '';

    for (let i = 0; i < lines.length; i++) {
      ret += lines[i] + '\n';
    }

    return ret;
  }, [refresh, emulator])

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={"PPU Scanline logs"} horizontalPosition={DialogHorizontalPosition.RIGHT}>
      <div className={classNames(styles.ppuScanlineDebugger, styles.hexViewer)}>
        { lines }
      </div>
    </Dialog>
  );
};

export default React.memo(PPUScanlineDebugger);
