import React from 'react';
import TableRowButton from '../ui/TableRowButton';
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
        <TableRowButton
          label={newLabel}
          variant="outline"
          active={isNew}
          onClick={() => onToggle(true)}
        />
        <TableRowButton
          label={existingLabel}
          variant="outline"
          active={!isNew}
          onClick={() => onToggle(false)}
        />
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
