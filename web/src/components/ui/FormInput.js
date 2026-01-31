import React, { forwardRef, useState } from 'react';
import styles from './FormInput.module.css';

/**
 * Capitalizes the first letter of each word in a string
 * @param {string} str - The string to capitalize
 * @returns {string} - The capitalized string
 */
const capitalizeWords = (str) => {
  if (!str) return str;
  return str
    .split(' ')
    .map(word => {
      if (!word) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

const FormInput = forwardRef(({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  error,
  hint,
  required = false,
  disabled = false,
  readOnly = false,
  size = 'md',
  fullWidth = true,
  showPasswordToggle = false,
  autoCapitalize = false, // New prop for automatic capitalization
  className = '',
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const inputType = (type === 'password' && showPasswordToggle && showPassword) ? 'text' : type;
  const showToggle = type === 'password' && showPasswordToggle;

  const handleChange = (e) => {
    if (autoCapitalize && type === 'text') {
      const capitalizedValue = capitalizeWords(e.target.value);
      // Create a new event object with the capitalized value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: capitalizedValue
        }
      };
      onChange(syntheticEvent);
    } else {
      onChange(e);
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={`${styles.inputContainer} ${isFocused || value ? styles.focused : ''}`}>
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={`${styles.input} ${styles[size]} ${error ? styles.error : ''}`}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />

        {showToggle && (
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              {showPassword ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </>
              )}
            </svg>
          </button>
        )}
      </div>

      {error && <span className={styles.errorMessage}>{error}</span>}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
    </div>
  );
});

FormInput.displayName = 'FormInput';
export default FormInput;
