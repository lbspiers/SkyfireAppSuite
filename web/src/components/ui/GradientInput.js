import React, { useState } from 'react';
import styles from '../../styles/Login.module.css';
import eyeIcon from '../../assets/images/icons/eye.png';

/**
 * GradientInput - Reusable gradient-styled input component
 *
 * @param {Object} props
 * @param {string} props.label - Label text for the input
 * @param {string} props.type - Input type (text, password, email, etc.)
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Change handler
 * @param {function} props.onBlur - Blur handler
 * @param {string} props.error - Error message to display
 * @param {boolean} props.showPasswordToggle - Whether to show password toggle (for password fields)
 * @param {string} props.name - Input name attribute
 * @param {string} props.id - Input id attribute
 */
const GradientInput = ({
  label,
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  onBlur,
  error,
  showPasswordToggle = false,
  name,
  id,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = showPasswordToggle && showPassword ? 'text' : type;
  const isActive = isFocused || value;

  return (
    <div className={styles.inputGroup}>
      {label && (
        <label htmlFor={id} className={styles.inputLabel}>
          {label}
        </label>
      )}

      <div className={`${styles.gradientInput} ${isActive ? styles.active : ''}`}>
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          onFocus={() => setIsFocused(true)}
          name={name}
          id={id}
          {...rest}
        />

        {showPasswordToggle && (
          <button
            type="button"
            className={styles.eyeIconButton}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <img src={eyeIcon} alt="" className={styles.eyeIcon} />
          </button>
        )}
      </div>

      {error && <div className={styles.errorText}>{error}</div>}
    </div>
  );
};

export default GradientInput;
