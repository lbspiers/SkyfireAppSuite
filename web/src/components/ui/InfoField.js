import React from 'react';
import styles from './InfoField.module.css';

const InfoField = ({
  label,
  value,
  emptyText = '—',
  size = 'md',        // sm, md, lg
  layout = 'vertical', // vertical, horizontal, inline
  className = '',
}) => {
  const displayValue = value || emptyText;

  return (
    <div className={`${styles.field} ${styles[layout]} ${styles[size]} ${className}`}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} ${!value ? styles.empty : ''}`}>
        {displayValue}
      </span>
    </div>
  );
};

export default InfoField;
