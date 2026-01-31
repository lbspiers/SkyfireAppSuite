import React from 'react';
import Modal from './Modal';
import Progress from './Progress';
import { useUploadManager } from '../../hooks/useUploadManager';
import styles from './UploadProgressModal.module.css';

/**
 * File processing stage labels
 */
const STAGE_LABELS = {
  pending: 'Waiting...',
  converting: 'Converting HEIC...',
  compressing: 'Compressing...',
  uploading: 'Uploading...',
  complete: 'Complete',
  error: 'Failed',
};

/**
 * Check icon for completed files
 */
const CheckIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      fill="currentColor"
    />
  </svg>
);

/**
 * Error icon for failed files
 */
const ErrorIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
      fill="currentColor"
    />
  </svg>
);

/**
 * Minimize icon
 */
const MinimizeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/**
 * Individual file progress row
 */
const FileProgressRow = ({ file }) => {
  const { name, stage, percent, error } = file;
  const isComplete = stage === 'complete';
  const isError = stage === 'error';

  // Truncate long filenames
  const displayName = name.length > 35
    ? `${name.slice(0, 16)}...${name.slice(-12)}`
    : name;

  return (
    <div className={`${styles.fileRow} ${isComplete ? styles.complete : ''} ${isError ? styles.error : ''}`}>
      <div className={styles.fileInfo}>
        <span className={styles.fileName} title={name}>{displayName}</span>
        <span className={styles.fileStage}>
          {isError ? (error || 'Upload failed') : STAGE_LABELS[stage] || stage}
        </span>
      </div>
      <div className={styles.fileProgress}>
        {isComplete ? (
          <CheckIcon className={styles.checkIcon} />
        ) : isError ? (
          <ErrorIcon className={styles.errorIcon} />
        ) : (
          <Progress
            value={percent}
            size="sm"
            variant={stage === 'uploading' ? 'primary' : 'info'}
            animated={stage !== 'pending'}
          />
        )}
      </div>
    </div>
  );
};

/**
 * UploadProgressModal - Shows upload progress for multiple files
 *
 * Connected to uploadManager singleton for global upload state.
 * Supports minimize to floating indicator and retry failed uploads.
 *
 * @param {boolean} isOpen - Whether modal is visible
 * @param {Function} onClose - Called when modal should close
 * @param {Function} onMinimize - Called when user clicks minimize button
 */
const UploadProgressModal = ({
  isOpen,
  onClose,
  onMinimize,
}) => {
  const { status, cancel, retryFailed } = useUploadManager();
  const { total, completed, failed, inProgress, queued, files } = status;

  const isProcessing = inProgress > 0 || queued > 0;
  const allDone = !isProcessing && total > 0;

  // Calculate overall progress
  const overallPercent = total > 0
    ? Math.round(files.reduce((sum, f) => sum + (f.percent || 0), 0) / total)
    : 0;

  // Determine summary variant
  const getSummaryVariant = () => {
    if (!allDone) return 'primary';
    if (failed > 0 && completed === 0) return 'error';
    if (failed > 0) return 'warning';
    return 'success';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={allDone ? onClose : undefined}
      title={
        <div className={styles.header}>
          <span>Uploading Files</span>
          {/* Minimize button - always show during uploads */}
          {total > 0 && onMinimize && (
            <button
              type="button"
              className={styles.minimizeButton}
              onClick={onMinimize}
              title="Minimize"
              aria-label="Minimize upload progress"
            >
              <MinimizeIcon />
            </button>
          )}
        </div>
      }
      size="sm"
      closeOnOverlay={false}
      closeOnEscape={false}
      showCloseButton={false}
    >
      <div className={styles.container}>
        {/* Overall Progress Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryText}>
            {isProcessing ? (
              <>Processing {completed} of {total} files...</>
            ) : failed > 0 ? (
              <>{completed} uploaded, {failed} failed</>
            ) : (
              <>All {total} file{total !== 1 ? 's' : ''} uploaded successfully!</>
            )}
          </div>
          <Progress
            value={overallPercent}
            size="md"
            variant={getSummaryVariant()}
            showLabel
            animated={isProcessing}
          />

          {/* Completion summary with stats */}
          {allDone && (
            <div className={styles.completionSummary}>
              <div className={styles.statItem}>
                <span className={styles.statIcon}>✅</span>
                <span className={styles.statValue}>{completed}</span>
                <span className={styles.statLabel}>Uploaded</span>
              </div>
              {failed > 0 && (
                <div className={styles.statItem}>
                  <span className={styles.statIcon}>❌</span>
                  <span className={styles.statValue}>{failed}</span>
                  <span className={styles.statLabel}>Failed</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Individual File Progress */}
        <div className={styles.fileList}>
          {files.map((file) => (
            <FileProgressRow key={file.id} file={file} />
          ))}
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          {allDone ? (
            <>
              {failed > 0 && (
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={retryFailed}
                >
                  Retry Failed ({failed})
                </button>
              )}
              <button
                type="button"
                className={styles.doneButton}
                onClick={onClose}
              >
                Done
              </button>
            </>
          ) : (
            <button
              type="button"
              className={styles.cancelButton}
              onClick={cancel}
            >
              Cancel Remaining
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UploadProgressModal;
