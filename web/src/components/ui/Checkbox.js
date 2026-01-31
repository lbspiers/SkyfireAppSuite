import React from 'react';
import styles from './Checkbox.module.css';

const Checkbox = ({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  indeterminate = false,
  error,
  size = 'md',  // sm, md, lg
  className = '',
  id,
  ...props
}) => {
  const checkboxId = id || (label ? `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const handleChange = (e) => {
    if (!disabled && onChange) {
      onChange(e);
    }
  };

  return (
    <div className={`${styles.wrapper} ${error ? styles.hasError : ''} ${className}`}>
      <label
        className={`${styles.container} ${disabled ? styles.disabled : ''}`}
        htmlFor={checkboxId}
      >
        <div className={`${styles.checkbox} ${styles[size]} ${checked ? styles.checked : ''} ${indeterminate ? styles.indeterminate : ''}`}>
          <input
            type="checkbox"
            id={checkboxId}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className={styles.input}
            {...props}
          />
          <svg className={styles.icon} viewBox="0 0 16 16" fill="none">
            {indeterminate ? (
              <path d="M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            ) : (
              <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </div>

        {(label || description) && (
          <div className={styles.content}>
            {label && <span className={styles.label}>{label}</span>}
            {description && <span className={styles.description}>{description}</span>}
          </div>
        )}
      </label>

      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};

export default Checkbox;
