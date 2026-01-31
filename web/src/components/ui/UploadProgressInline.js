import React from 'react';
import Progress from './Progress';
import { useUploadManager } from '../../hooks/useUploadManager';
import styles from './UploadProgressInline.module.css';

/**
 * Inline upload progress indicator with retry functionality
 * Displays next to upload button instead of in a modal
 */
const UploadProgressInline = () => {
  const { status, retryFailed } = useUploadManager();
  const { total, completed, failed, inProgress, queued } = status;

  const isProcessing = inProgress > 0 || queued > 0;
  const allDone = !isProcessing && total > 0;

  // Calculate overall progress
  const overallPercent = total > 0
    ? Math.round((completed / total) * 100)
    : 0;

  // Determine progress variant
  const getVariant = () => {
    if (!allDone) return 'primary';
    if (failed > 0 && completed === 0) return 'error';
    if (failed > 0) return 'warning';
    return 'success';
  };

  // Don't render if no uploads
  if (total === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.progressSection}>
        <div className={styles.statusText}>
          {isProcessing ? (
            <>Uploading {completed} of {total}...</>
          ) : failed > 0 ? (
            <>{completed} uploaded, {failed} failed</>
          ) : (
            <>All {total} file{total !== 1 ? 's' : ''} uploaded!</>
          )}
        </div>

        <Progress
          value={overallPercent}
          size="sm"
          variant={getVariant()}
          showLabel
          animated={isProcessing}
        />

        {allDone && completed > 0 && (
          <span className={styles.successIcon}>✓</span>
        )}
      </div>

      {allDone && failed > 0 && (
        <button
          type="button"
          className={styles.retryButton}
          onClick={retryFailed}
        >
          Retry ({failed})
        </button>
      )}
    </div>
  );
};

export default UploadProgressInline;
