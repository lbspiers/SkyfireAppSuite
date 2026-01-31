import React from 'react';
import Button from './Button';
import styles from './ErrorState.module.css';

const ErrorState = ({
  title = 'Error Loading Data',
  message,
  onRetry,
  icon = '⚠️',
  size = 'medium' // 'small' | 'medium' | 'large'
}) => (
  <div className={`${styles.container} ${styles[size]}`}>
    <div className={styles.content}>
      <div className={styles.icon}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      {message && <p className={styles.message}>{message}</p>}
    </div>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try Again
      </Button>
    )}
  </div>
);

export default ErrorState;
