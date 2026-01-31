import React from 'react';
import styles from './EmptyState.module.css';

const EmptyState = ({
  icon = '📭',           // Emoji or React component
  title = 'No data',
  description = '',
  action = null,         // React node (usually a Button)
  size = 'md',           // sm, md, lg
  className = '',
}) => {
  return (
    <div className={`${styles.container} ${styles[size]} ${className}`}>
      {icon && (
        <div className={styles.icon}>
          {typeof icon === 'string' ? icon : icon}
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
};

export default EmptyState;
