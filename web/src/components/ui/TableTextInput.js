import React from 'react';
import styles from './TableTextInput.module.css';

/**
 * TableTextInput - Text input matching TableDropdown styling
 * 25% label, 75% text input field
 *
 * @param {string} label - Field label (left side, 25%)
 * @param {string} value - Input value
 * @param {function} onChange - Change handler (receives the value directly)
 * @param {string} placeholder - Placeholder text
 * @param {boolean} disabled - Disable the input
 * @param {string} type - Input type (default: 'text')
 */
const TableTextInput = ({
  label,
  value,
  onChange,
  placeholder = '',
  disabled = false,
  type = 'text',
}) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <div className={styles.inputWrapper}>
        <input
          type={type}
          className={`${styles.input} ${disabled ? styles.disabled : ''}`}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default TableTextInput;
