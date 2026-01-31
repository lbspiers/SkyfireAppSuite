import React from 'react';
import styles from './TripleToggle.module.css';

/**
 * Triple Toggle Component
 * A three-option toggle where only one can be selected at a time
 *
 * @param {string} value - Currently selected value ('mpu', 'existing', or 'derate')
 * @param {function} onChange - Callback when selection changes
 */
const TripleToggle = ({ value, onChange }) => {
  return (
    <div className={styles.tripleToggle}>
      <button
        type="button"
        className={`${styles.toggleButton} ${value === 'mpu' ? styles.selected : ''}`}
        onClick={() => onChange('mpu')}
      >
        MPU
      </button>
      <button
        type="button"
        className={`${styles.toggleButton} ${value === 'existing' ? styles.selected : ''}`}
        onClick={() => onChange('existing')}
      >
        Existing
      </button>
      <button
        type="button"
        className={`${styles.toggleButton} ${value === 'derate' ? styles.selected : ''}`}
        onClick={() => onChange('derate')}
      >
        Derate
      </button>
    </div>
  );
};

export default TripleToggle;
