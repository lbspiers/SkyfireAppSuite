import React from 'react';
import styles from './CircleToggle.module.css';

/**
 * CircleToggle - Radio-style toggle button with circular indicator and label
 * Perfect for single yes/no toggles like "Keep Me Logged In"
 *
 * @param {boolean} checked - Whether the toggle is active
 * @param {function} onChange - Callback when toggled (receives new checked state)
 * @param {string} label - Label text displayed next to the circle
 * @param {string} description - Optional description text below label
 * @param {boolean} disabled - Whether the toggle is disabled
 * @param {string} size - Size variant: 'sm', 'md', 'lg' (default: 'md')
 * @param {string} className - Additional CSS classes
 * @param {string} id - Optional ID for the input element
 */
const CircleToggle = ({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className = '',
  id,
  ...props
}) => {
  const toggleId = id || (label ? `circle-toggle-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const handleChange = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <label
      className={`${styles.container} ${disabled ? styles.disabled : ''} ${className}`}
      htmlFor={toggleId}
    >
      <div className={`${styles.circle} ${styles[size]} ${checked ? styles.checked : ''}`}>
        <input
          type="checkbox"
          id={toggleId}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className={styles.input}
          role="switch"
          aria-checked={checked}
          {...props}
        />
        <div className={styles.dot} />
      </div>

      {(label || description) && (
        <div className={styles.content}>
          {label && <span className={styles.label}>{label}</span>}
          {description && <span className={styles.description}>{description}</span>}
        </div>
      )}
    </label>
  );
};

export default CircleToggle;
