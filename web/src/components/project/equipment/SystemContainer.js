import React from 'react';
import styles from './SystemContainer.module.css';

/**
 * SystemContainer - Visually distinct container for each system
 * Features an orange border with system number/label breaking the top border
 * @param {number|string|null} systemNumber - System number, custom label (e.g., "Combine Systems"), or null for no label
 */
const SystemContainer = ({ systemNumber, children, onDelete }) => {
  // Determine the label text
  const labelText = typeof systemNumber === 'number'
    ? `System ${systemNumber}`
    : systemNumber;

  return (
    <div className={styles.container}>
      {systemNumber !== null && (
        <div className={styles.header}>
          <span className={styles.systemLabel}>{labelText}</span>
          {onDelete && (
            <button
              type="button"
              className={styles.deleteButton}
              onClick={onDelete}
              aria-label={typeof systemNumber === 'number' ? `Delete System ${systemNumber}` : `Delete ${systemNumber}`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
              </svg>
            </button>
          )}
        </div>
      )}
      <div className={styles.content} style={systemNumber === null ? { paddingTop: 'var(--spacing-tight)' } : {}}>
        {children}
      </div>
    </div>
  );
};

export default SystemContainer;
