import React from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({
  size = 'md',        // sm, md, lg, xl
  color = 'primary',  // primary (orange), blue, white, muted
  fullScreen = false, // Center in viewport with overlay
  overlay = false,    // Just the overlay background
  label = '',         // Accessible label
  className = '',
}) => {
  const spinner = (
    <div
      className={`${styles.spinner} ${styles[size]} ${styles[color]} ${className}`}
      role="status"
      aria-label={label || 'Loading'}
    >
      <div className={styles.ring}></div>
      <div className={styles.ring}></div>
      <div className={styles.ring}></div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className={styles.fullScreen}>
        <div className={styles.container}>
          {spinner}
          {label && <span className={styles.label}>{label}</span>}
        </div>
      </div>
    );
  }

  if (overlay) {
    return (
      <div className={styles.overlay}>
        <div className={styles.container}>
          {spinner}
          {label && <span className={styles.label}>{label}</span>}
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
