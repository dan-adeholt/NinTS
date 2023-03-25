import React from 'react';
import classNames from 'classnames';
import styles from './Dropdown.module.css';

type DropdownProps = {
  children: React.ReactNode,
  isOpen: boolean
  alignLeft?: boolean
}

const Dropdown = ({ children, isOpen, alignLeft = false } : DropdownProps) => {
  return (
    <div className={classNames(styles.dropdown, isOpen && styles.open, alignLeft && styles.alignLeft)}>
      { children }
    </div>
  );
};

export default React.memo(Dropdown);
