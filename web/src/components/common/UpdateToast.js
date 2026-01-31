import React from 'react';
import styles from './UpdateToast.module.css';

/**
 * Update Toast Component
 * Shows when a new version of the app is available
 *
 * Props:
 * - visible: boolean - whether to show the toast
 * - onUpdate: function - called when user clicks update
 * - onDismiss: function - called when user dismisses
 */
export function UpdateToast({ visible, onUpdate, onDismiss }) {
  if (!visible) return null;

  return (
    <div className={styles.container}>
      <div className={styles.toast}>
        <div className={styles.iconContainer}>
          <svg
            className={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>

        <div className={styles.content}>
          <span className={styles.title}>Update Available</span>
          <span className={styles.description}>
            A new version of Skyfire is ready
          </span>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.laterButton}
            onClick={onDismiss}
            title="Update later"
          >
            Later
          </button>
          <button
            className={styles.updateButton}
            onClick={onUpdate}
          >
            Update Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpdateToast;
