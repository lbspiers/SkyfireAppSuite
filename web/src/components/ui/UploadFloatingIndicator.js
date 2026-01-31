/**
 * @fileoverview Upload Floating Indicator Component
 *
 * Small floating pill that shows minimized upload progress when the full
 * upload modal is dismissed. Displays upload count and mini progress bar.
 * Stays visible until user manually dismisses it.
 *
 * @module components/ui/UploadFloatingIndicator
 *
 * @example
 * <UploadFloatingIndicator
 *   isVisible={hasActiveUploads && !isModalOpen}
 *   completed={23}
 *   total={100}
 *   onClick={() => setIsModalOpen(true)}
 *   onDismiss={() => uploadManager.clearCompleted()}
 * />
 */

import React from 'react';
import styles from './UploadFloatingIndicator.module.css';

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/**
 * Upload Floating Indicator Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isVisible - Whether indicator should be shown
 * @param {number} props.completed - Number of completed uploads
 * @param {number} props.total - Total number of files
 * @param {Function} props.onClick - Callback when indicator body is clicked (restore modal)
 * @param {Function} props.onDismiss - Callback when dismiss button is clicked
 * @returns {JSX.Element|null}
 */
const UploadFloatingIndicator = ({
  isVisible,
  completed,
  total,
  onClick,
  onDismiss,
}) => {
  if (!isVisible) return null;

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = completed === total && total > 0;

  return (
    <div className={`${styles.indicator} ${isComplete ? styles.complete : ''}`}>
      {/* Main indicator body - clickable to restore modal */}
      <div className={styles.body} onClick={onClick}>
        <div className={styles.iconContainer}>
          <UploadIcon />
          {!isComplete && <div className={styles.pulse} />}
        </div>

        <div className={styles.content}>
          <div className={styles.text}>
            <span className={styles.count}>{completed}/{total}</span>
            <span className={styles.label}>
              {isComplete ? 'Complete' : 'Uploading'}
            </span>
          </div>

          {/* Mini progress bar */}
          <div className={styles.progressTrack}>
            <div
              className={styles.progressBar}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Dismiss button - only show when complete */}
      {isComplete && (
        <button
          className={styles.dismissButton}
          onClick={(e) => {
            e.stopPropagation();
            onDismiss?.();
          }}
          title="Dismiss"
          aria-label="Dismiss upload indicator"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
};

export default UploadFloatingIndicator;
