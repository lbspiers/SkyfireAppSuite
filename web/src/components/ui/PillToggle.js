import React from 'react';
import PillButton from './PillButton';
import styles from './PillToggle.module.css';

/**
 * PillToggle - Two PillButtons side by side for New/Existing toggles
 *
 * Common pattern: New/Existing, Yes/No, etc.
 * Just two PillButtons with simple wrapper.
 *
 * @param {string} value - Current selected value ('option1' or 'option2')
 * @param {Function} onChange - Called with selected value
 * @param {string} option1 - First option label (e.g., 'New')
 * @param {string} option2 - Second option label (e.g., 'Existing')
 * @param {boolean} disabled - Disable both buttons
 */
const PillToggle = ({
  value,
  onChange,
  option1 = 'New',
  option2 = 'Existing',
  disabled = false
}) => {
  return (
    <div className={styles.toggleContainer}>
      <PillButton
        active={value === option1}
        onClick={() => onChange(option1)}
        disabled={disabled}
      >
        {option1}
      </PillButton>
      <PillButton
        active={value === option2}
        onClick={() => onChange(option2)}
        disabled={disabled}
      >
        {option2}
      </PillButton>
    </div>
  );
};

export default PillToggle;
