import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import styles from './UpdateModal.module.css';

/**
 * Update Modal with progress bar
 * Shows download progress during PWA update
 */
export function UpdateModal({ visible, onUpdate, onDismiss, updateSize = '2.5 MB' }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isUpdating) {
      // Simulate progress based on typical update time
      // Real progress tracking requires custom SW implementation
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95; // Hold at 95% until actual completion
          }
          // Ease-out progression
          const increment = Math.max(1, (100 - prev) / 10);
          return Math.min(95, prev + increment);
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isUpdating]);

  const handleUpdate = () => {
    setIsUpdating(true);
    setProgress(0);

    // Give visual feedback before triggering update
    setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        onUpdate();
      }, 300);
    }, 2000);
  };

  const footer = !isUpdating ? (
    <>
      <Button variant="secondary" onClick={onDismiss}>
        Later
      </Button>
      <Button variant="primary" onClick={handleUpdate}>
        Update Now
      </Button>
    </>
  ) : null;

  return (
    <Modal
      isOpen={visible}
      onClose={onDismiss}
      title={!isUpdating ? "Update Available" : "Updating Skyfire..."}
      size="sm"
      footer={footer}
      showCloseButton={!isUpdating}
      closeOnOverlay={!isUpdating}
      closeOnEscape={!isUpdating}
    >
      <div className={styles.content}>
        {!isUpdating ? (
          <>
            <div className={styles.iconContainer}>
              <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>

            <p className={styles.description}>
              A new version of Skyfire is ready to install.
            </p>

            <div className={styles.sizeInfo}>
              <span className={styles.sizeLabel}>Download size:</span>
              <span className={styles.sizeValue}>{updateSize}</span>
            </div>
          </>
        ) : (
          <>
            <div className={styles.iconContainer}>
              <svg className={`${styles.icon} ${styles.iconSpinning}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>

            <p className={styles.description}>
              Please wait while we install the latest version.
            </p>

            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={styles.progressText}>{Math.round(progress)}%</span>
            </div>

            <p className={styles.progressHint}>
              {progress < 50 ? 'Downloading update...' :
               progress < 95 ? 'Installing...' :
               'Finishing up...'}
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}

export default UpdateModal;
