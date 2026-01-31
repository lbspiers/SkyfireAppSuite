import React from 'react';
import styles from './CompactToggle.module.css';

/**
 * CompactToggle - Ultra-compact A/B toggle for tight grid layouts
 * Designed to match dropdown height and fit in narrow columns
 */
const CompactToggle = ({ value, onChange, label }) => {
  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.toggleWrapper}>
        <button
          type="button"
          className={`${styles.toggleButton} ${value === 'A' ? styles.active : ''}`}
          onClick={() => onChange('A')}
        >
          A
        </button>
        <button
          type="button"
          className={`${styles.toggleButton} ${value === 'B' ? styles.active : ''}`}
          onClick={() => onChange('B')}
        >
          B
        </button>
      </div>
    </div>
  );
};

export default CompactToggle;
