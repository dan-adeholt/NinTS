import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const SegmentControl = ({ currentIndex, options, onClick, expand = false }) => {
  return (
    <>
      <div className={classNames("segmentControl", expand && "expand")}>
        { options.map((option, idx) => (
          <div key={idx} className={classNames("segmentControlItem", expand && "expand", idx === currentIndex && "selectedSegmentControlItem")} onClick={() => onClick(idx)}>
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
