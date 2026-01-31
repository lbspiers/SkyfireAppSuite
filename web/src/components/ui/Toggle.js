import React from 'react';
import styles from './Toggle.module.css';

const Toggle = ({
  checked = false,
  onChange,
  label,
  labelPosition = 'right',  // left, right
  disabled = false,
  size = 'md',              // sm, md, lg
  className = '',
  id,
  ...props
}) => {
  const toggleId = id || (label ? `toggle-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled && onChange) {
        onChange({ target: { checked: !checked } });
      }
    }
  };

  return (
    <label
      className={`
        ${styles.container}
        ${styles[labelPosition]}
        ${disabled ? styles.disabled : ''}
        ${className}
      `.trim()}
      htmlFor={toggleId}
    >
      {label && labelPosition === 'left' && (
        <span className={styles.label}>{label}</span>
      )}

      <div className={`${styles.track} ${styles[size]} ${checked ? styles.checked : ''}`}>
        <input
          type="checkbox"
          id={toggleId}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={styles.input}
          onKeyDown={handleKeyDown}
          {...props}
        />
        <div className={styles.thumb} />
      </div>

      {label && labelPosition === 'right' && (
        <span className={styles.label}>{label}</span>
      )}
    </label>
  );
};

export default Toggle;
