import React from 'react';
import styles from './ButtonGroup.module.css';
import equipStyles from '../project/EquipmentForm.module.css';

/**
 * ButtonGroup - Reusable multi-option toggle button component
 * Replaces repetitive button loops throughout equipment forms
 *
 * @param {Array} options - Array of { label: string, value: string|number }
 * @param {string|number} value - Currently selected value
 * @param {function} onChange - Callback with selected value
 * @param {boolean} fullWidth - If true, buttons take equal flex space (default: true)
 * @param {boolean} disabled - Disable all buttons
 * @param {string} className - Additional CSS class for container
 */
const ButtonGroup = ({
  options = [],
  value,
  onChange,
  fullWidth = true,
  disabled = false,
  className = '',
}) => {
  return (
    <div
      className={`
        ${styles.buttonGroup}
        ${fullWidth ? styles.fullWidth : ''}
        ${disabled ? styles.disabled : ''}
        ${className}
      `.trim()}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`
            ${equipStyles.stringingButton}
            ${styles.button}
            ${value === option.value ? equipStyles.stringingButtonSelected : ''}
          `.trim()}
          onClick={() => !disabled && onChange && onChange(option.value)}
          disabled={disabled}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default ButtonGroup;
