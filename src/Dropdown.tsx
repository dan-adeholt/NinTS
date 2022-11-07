import React from 'react';
import classNames from 'classnames';
import styles from './Dropdown.module.css';

type DropdownProps = {
  children: React.ReactNode,
  isOpen: boolean
}

const Dropdown = ({ children, isOpen } : DropdownProps) => {
  return (
    <div className={classNames(styles.dropdown, isOpen && styles.open)}>
      { children }
    </div>
  );
};

export default React.memo(Dropdown);
