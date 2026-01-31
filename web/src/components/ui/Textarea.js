import React, { forwardRef } from 'react';
import styles from './Textarea.module.css';

const Textarea = forwardRef(({
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  required = false,
  disabled = false,
  readOnly = false,
  rows = 4,
  maxLength,
  showCount = false,
  resize = 'vertical',  // none, vertical, horizontal, both
  fullWidth = true,
  className = '',
  id,
  ...props
}, ref) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const charCount = value?.length || 0;

  return (
    <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
      {label && (
        <label htmlFor={textareaId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        rows={rows}
        maxLength={maxLength}
        className={`${styles.textarea} ${styles[`resize-${resize}`]} ${error ? styles.error : ''}`}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      />

      <div className={styles.footer}>
        {error && <span className={styles.errorMessage}>{error}</span>}
        {hint && !error && <span className={styles.hint}>{hint}</span>}
        {showCount && maxLength && (
          <span className={`${styles.count} ${charCount >= maxLength ? styles.countMax : ''}`}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
