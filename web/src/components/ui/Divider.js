import React from 'react';
import styles from './Divider.module.css';

const Divider = ({
  orientation = 'horizontal', // horizontal, vertical
  variant = 'default',        // default, subtle, strong
  spacing = 'md',             // none, sm, md, lg
  label,                      // Optional text in center
  className = '',
}) => {
  if (label) {
    return (
      <div className={`${styles.wrapper} ${styles[`spacing-${spacing}`]} ${className}`}>
        <div className={`${styles.line} ${styles[variant]}`} />
        <span className={styles.label}>{label}</span>
        <div className={`${styles.line} ${styles[variant]}`} />
      </div>
    );
  }

  return (
    <div
      className={`
        ${styles.divider}
        ${styles[orientation]}
        ${styles[variant]}
        ${styles[`spacing-${spacing}`]}
        ${className}
      `.trim()}
      role="separator"
    />
  );
};

export default Divider;
