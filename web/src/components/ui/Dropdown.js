import React, { useState, useRef, useEffect } from 'react';
import styles from './Dropdown.module.css';

const Dropdown = ({
  trigger,             // React node for trigger button
  children,            // Dropdown content
  align = 'left',      // left, right
  position = 'bottom', // top, bottom
  closeOnClick = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleContentClick = () => {
    if (closeOnClick) setIsOpen(false);
  };

  return (
    <div className={`${styles.wrapper} ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className={styles.trigger}>
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`${styles.content} ${styles[align]} ${styles[position]}`}
          onClick={handleContentClick}
        >
          {children}
        </div>
      )}
    </div>
  );
};

const DropdownItem = ({
  children,
  onClick,
  icon,
  disabled = false,
  danger = false,
  className = '',
}) => (
  <button
    className={`${styles.item} ${disabled ? styles.disabled : ''} ${danger ? styles.danger : ''} ${className}`}
    onClick={onClick}
    disabled={disabled}
  >
    {icon && <span className={styles.itemIcon}>{icon}</span>}
    {children}
  </button>
);

const DropdownDivider = () => <div className={styles.divider} />;

const DropdownLabel = ({ children }) => (
  <div className={styles.labelItem}>{children}</div>
);

Dropdown.Item = DropdownItem;
Dropdown.Divider = DropdownDivider;
Dropdown.Label = DropdownLabel;

export default Dropdown;
