import React from 'react';
import styles from './Button.module.css';

const Button = ({
  variant = 'primary',
  size = 'md',
  pill = false,
  active = false,
  disabled = false,
  loading = false,
  fullWidth = false,
  fixedWidth = false,
  className = '',
  children,
  onClick,
  type = 'button',
  ...props
}) => {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    pill && styles.pill,
    active && styles.active,
    disabled && styles.disabled,
    loading && styles.loading,
    fullWidth && styles.fullWidth,
    fixedWidth && styles.fixedWidth,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classNames}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className={styles.loadingSpinner}>
          <span className={styles.spinnerDot}></span>
          <span className={styles.spinnerDot}></span>
          <span className={styles.spinnerDot}></span>
        </span>
      ) : children}
    </button>
  );
};

export default Button;
