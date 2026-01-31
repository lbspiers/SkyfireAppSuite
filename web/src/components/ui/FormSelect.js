import React, { forwardRef } from 'react';
import styles from './FormSelect.module.css';

const FormSelect = forwardRef(({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  error,
  hint,
  required = false,
  disabled = false,
  size = 'md',
  fullWidth = true,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const hasValue = value !== undefined && value !== '' && value !== null;

  return (
    <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.selectContainer}>
        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`${styles.select} ${styles[size]} ${error ? styles.error : ''} ${hasValue ? styles.filled : ''}`}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <span className={`${styles.chevron} ${hasValue ? styles.chevronFilled : ''}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>

      {error && <span className={styles.errorMessage}>{error}</span>}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
    </div>
  );
});

FormSelect.displayName = 'FormSelect';
export default FormSelect;
