import React from 'react';
import classNames from 'classnames';
import styles from './SegmentControl.module.css';

type SegmentControlOption = {
  title: React.ReactNode,
  view: React.ReactNode
}

type SegmentControlProps = {
  currentIndex: number,
  options: SegmentControlOption[],
  onClick: (number) => void,
  expand?: boolean
};

const SegmentControl = ({ currentIndex, options, onClick, expand = false } : SegmentControlProps) => {
  return (
    <>
      <div className={classNames(styles.segmentControl, expand && styles.expand)}>
        { options.map((option, idx) => (
          <div key={idx} className={classNames(styles.segmentControlItem, expand && styles.expand, idx === currentIndex && styles.selectedSegmentControlItem)} onClick={() => onClick(idx)}>
            { option.title }
          </div>)
        )}
      </div>
      { options[currentIndex].view }
    </>
  );
};

export default React.memo(SegmentControl);
