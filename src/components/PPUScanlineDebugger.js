import React, { useMemo } from 'react';
import _ from 'lodash';
import logger from '../emulator/logger';
import styles from './PPUDebugging.module.css';

const PPUScanlineDebugger = ({ refresh }) => {
  const lines = useMemo(() => {
    _.noop(refresh);
    const lines = logger.getLines();

    let ret = '';

    for (let i = 0; i < lines.length; i++) {
      ret += lines[i] + '\n';
    }

    return ret;
  }, [refresh])

  return (
    <>
      <div className={styles.hexViewer}>
        { lines }
      </div>
    </>
  );
};

PPUScanlineDebugger.propTypes = {};

export default PPUScanlineDebugger;
