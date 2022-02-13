import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './SegmentControl.module.css';

const SegmentControl = ({ currentIndex, options, onClick, expand = false }) => {
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

const OptionPropType = PropTypes.shape({
  title: PropTypes.string,
  view: PropTypes.node
});

SegmentControl.propTypes = {
  options: PropTypes.arrayOf(OptionPropType),
  currentIndex: PropTypes.number,
  onClick: PropTypes.func
};

export default React.memo(SegmentControl);
