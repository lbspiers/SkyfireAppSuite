import React from 'react';
import styles from './ComingSoon.module.css';

/**
 * Coming Soon Component
 * Displays a placeholder message for features under development
 *
 * @param {string} feature - Name of the feature (optional)
 * @param {string} description - Additional description (optional)
 */
const ComingSoon = ({ feature = 'This feature', description = 'We are working hard to bring this feature to you soon.' }) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h2 className={styles.title}>Coming Soon</h2>
        <p className={styles.description}>{description}</p>
        <div className={styles.badge}>
          Under Development
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
