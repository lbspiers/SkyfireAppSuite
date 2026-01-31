import React from 'react';
import styles from './AddButton.module.css';

/**
 * AddButton Component
 * Simple "+ Label" button without divider line
 * Used for inline section additions and toggle selections
 *
 * @param {string} label - Button text (e.g., "Solar Panel Type 2")
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Whether button is disabled
 * @param {boolean} active - Whether button is in active/selected state
 * @param {boolean} showPlus - Whether to show the + icon (default: true)
 * @param {string} className - Additional CSS classes
 */
const AddButton = ({
  label,
  onClick,
  disabled = false,
  active = false,
  showPlus = true,
  className = ''
}) => {
  return (
    <button
      type="button"
      className={`${styles.button} ${active ? styles.active : ''} ${disabled ? styles.disabled : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {showPlus && <span className={styles.plus}>+</span>}
      <span className={styles.label}>{label}</span>
    </button>
  );
};

export default AddButton;
