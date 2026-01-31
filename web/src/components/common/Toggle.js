import React from 'react';
import styles from './Toggle.module.css';

/**
 * Toggle - Reusable toggle button component (matches mobile app NewExistingToggle)
 * Commonly used for New/Existing, Yes/No, etc.
 *
 * @param {boolean} isNew - True if first option is selected (default true)
 * @param {function} onToggle - Callback with boolean value
 * @param {string} newLabel - Label for first option (default "New")
 * @param {string} existingLabel - Label for second option (default "Existing")
 * @param {function} onClear - Optional clear/trash handler
 */
const Toggle = ({
  isNew = true,
  onToggle,
  newLabel = "New",
  existingLabel = "Existing",
  onClear
}) => {
  return (
    <div className={styles.toggleRow}>
      <div className={styles.toggleContainer}>
        <button
          type="button"
          onClick={() => onToggle(true)}
          className={`${styles.toggleButton} ${isNew ? styles.toggleButtonActive : ''}`}
        >
          {newLabel}
        </button>
        <button
          type="button"
          onClick={() => onToggle(false)}
          className={`${styles.toggleButton} ${!isNew ? styles.toggleButtonActive : ''}`}
        >
          {existingLabel}
        </button>
      </div>

      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className={styles.clearButton}
        >
          Clear
        </button>
      )}
    </div>
  );
};

export default Toggle;
