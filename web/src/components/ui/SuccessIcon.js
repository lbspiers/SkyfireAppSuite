import React from 'react';
import styles from './SuccessIcon.module.css';

const SuccessIcon = ({ size = 'md' }) => {
  return (
    <div className={`${styles.wrapper} ${styles[size]}`}>
      <span className={styles.checkmark}>✓</span>
    </div>
  );
};

export default SuccessIcon;
