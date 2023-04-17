import React, { useRef } from 'react';
import styles from './TouchControls.module.css';
import { faLeftLong, faUpLong, faDownLong, faRightLong } from '@fortawesome/free-solid-svg-icons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import EmulatorState, { INPUT_START, INPUT_SELECT, INPUT_A, INPUT_B, INPUT_DOWN, INPUT_LEFT, INPUT_RIGHT, INPUT_UP } from '../emulator/EmulatorState';

type TouchControlsProps = {
  emulator: EmulatorState
  sideWidth: number
}

const TouchControls = ({ emulator, sideWidth } : TouchControlsProps) => {
  const setButton = (button: number, value: boolean) => {
    emulator.setInputController(button, value, 0);
  }

  const clearDpad = () => {
    setButton(INPUT_UP, false);
    setButton(INPUT_DOWN, false);
    setButton(INPUT_LEFT, false);
    setButton(INPUT_RIGHT, false);
  }

  const dpad = useRef<HTMLDivElement>(null);

  const updateDpad = (event: React.TouchEvent<HTMLDivElement>) => {
    clearDpad();
    const rect = dpad.current?.getBoundingClientRect();
    if (rect == null) {
      return;
    }

    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      if (y < rect.height && x < rect.width) {
        if (y < rect.height / 3) {
          setButton(INPUT_UP, true);
          return;
        } else if (y < (2 * (rect.height / 3))) {
          if (x < rect.width / 2) {
            setButton(INPUT_LEFT, true);
            return;
          } else {
            setButton(INPUT_RIGHT, true);
            return;
          }
        } else {
          setButton(INPUT_DOWN, true);
          return;
        }
      }
    }
  }  

  const stopPropagation = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()

  return (
    <>
      <div className={styles.leftSide} style={{ width: sideWidth }} onMouseMove={stopPropagation}>
        <div className={styles.directionControls} ref={dpad} onTouchEnd={clearDpad} onTouchStart={updateDpad} onTouchMove={updateDpad}>
          <div className={styles.up}>
            <FontAwesomeIcon icon={faUpLong} />
          </div>
          <div className={styles.left}>
            <FontAwesomeIcon icon={faLeftLong} />
          </div>
          <div className={styles.right}>
            <FontAwesomeIcon icon={faRightLong} />
          </div>
          <div className={styles.down}>
            <FontAwesomeIcon icon={faDownLong} />
          </div>
        </div>
      </div>

      <div className={styles.rightSide} style={{ width: sideWidth }} onMouseMove={stopPropagation}>
        <div className={styles.select} onTouchStart={() => setButton(INPUT_SELECT, true)} onTouchEnd={() => setButton(INPUT_SELECT, false)}>
          SELECT
        </div>
        <div className={styles.space} />
        <div className={styles.primaryButtons}>
          <div className={styles.a} onTouchStart={() => setButton(INPUT_A, true)} onTouchEnd={() => setButton(INPUT_A, false)}>
            A
          </div>
          <div className={styles.b} onTouchStart={() => setButton(INPUT_B, true)} onTouchEnd={() => setButton(INPUT_B, false)}>
            B
          </div>
        </div>
        <div className={styles.space} />
        <div className={styles.start} onTouchStart={() => setButton(INPUT_START, true)} onTouchEnd={() => setButton(INPUT_START, false)}>
          START
        </div>
      </div>
    </>
  );
};

export default React.memo(TouchControls);
