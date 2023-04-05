import React, { useState, useRef, useEffect } from 'react';
import styles from './Dialog.module.css';
import classNames from 'classnames';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { DragOffset, useDrag } from '../hooks/useDrag';

export type BaseDialogProps = {
  onClose: () => void
}

export enum DialogHorizontalPosition {
  LEFT = '0%',
  CENTER = '50%',
  RIGHT = '100%',
}

export enum DialogVerticalPosition {
  TOP = '0%',
  CENTER = '50%',
  BOTTOM = '100%',
}

type DialogProps = BaseDialogProps & {
  children: React.ReactNode,
  title: string,
  fullScreen?: boolean
  horizontalPosition?: DialogHorizontalPosition
  verticalPosition?: DialogVerticalPosition
  withoutPadding?: boolean
}

let curZIndex = 10;


const Dialog = (
  {
    children,
    title,
    onClose,
    fullScreen = false,
    withoutPadding = false,
    horizontalPosition = DialogHorizontalPosition.CENTER,
    verticalPosition = DialogVerticalPosition.CENTER
  } : DialogProps) => {
  const [offset, setOffset] = useState<DragOffset>({
    x: 0, y: 0
  });

  const dialogRef = useRef<HTMLDivElement>(null);
  const [zIndex, setZIndex] = useState(curZIndex+1);
  const transform = 'translate(calc(-' + horizontalPosition + ' + ' + offset.x + 'px), calc(-' + verticalPosition + ' + ' + offset.y + 'px)';

  const { onMouseDown } = useDrag(offset, setOffset, !fullScreen);

  // Used to add fade-in effect immediately after node has been added to DOM.
  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.className = classNames(styles.dialog, styles.isOpen, fullScreen && styles.fullScreen);
    }
  }, []);

  const content = (
    <div
      ref={dialogRef}
      style={{ transform, zIndex, left: horizontalPosition, top: verticalPosition }}
      onMouseDown={() => setZIndex(curZIndex++)}
      className={classNames(styles.dialog, fullScreen && styles.fullScreen)}>
      <div
        className={styles.header}
        onMouseDown={onMouseDown}
      >
        <div className={styles.headerText}>
          { title }
        </div>
        <div className={styles.flexSpace}/>
        <div className={styles.closeButton}>
          <button onClick={() => onClose()}>
            <FontAwesomeIcon icon={faXmark}/>
          </button>
        </div>
      </div>
      <div className={classNames(styles.body, withoutPadding && styles.withoutPadding)}>
        { children }
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default React.memo(Dialog);
