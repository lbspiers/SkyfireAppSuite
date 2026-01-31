import React from 'react';
import styles from './SectionHeader.module.css';

const SectionHeader = ({ title, onClear, clearButtonText = 'Clear', className = '' }) => {
  return (
    <div className={`${styles.sectionHeader} ${className}`}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className={styles.clearButton}
        >
          {clearButtonText}
        </button>
      )}
    </div>
  );
};

export default SectionHeader;
