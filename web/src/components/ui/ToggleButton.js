import React from 'react';
import styles from './ToggleButton.module.css';

/**
 * ToggleButton Component
 * Styled button for toggle/selector functionality with active state
 * Matches system selector button design
 *
 * @param {string} label - Button text
 * @param {boolean} active - Whether this button is active/selected
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Whether button is disabled
 * @param {string} className - Additional CSS classes
 */
const ToggleButton = ({
  label,
  active = false,
  onClick,
  disabled = false,
  className = ''
}) => {
  return (
    <button
      type="button"
      className={`${styles.button} ${active ? styles.active : ''} ${disabled ? styles.disabled : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default ToggleButton;
