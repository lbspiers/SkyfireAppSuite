import React, { useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import styles from './GenerateStatusModal.module.css';

/**
 * GenerateStatusModal - Status feedback during generation
 *
 * Props:
 * - isOpen: boolean
 * - status: 'sending' | 'success' | 'error'
 * - errorMessage?: string
 * - onClose: () => void
 * - autoCloseDelay?: number (default 2000ms for success)
 */
const GenerateStatusModal = ({
  isOpen,
  status,
  errorMessage = '',
  onClose,
  autoCloseDelay = 2000,
}) => {
  // Auto-close on success after delay
  useEffect(() => {
    if (status === 'success' && isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [status, isOpen, onClose, autoCloseDelay]);

  const renderContent = () => {
    switch (status) {
      case 'sending':
        return (
          <>
            <div className={styles.iconContainer}>
              <div className={styles.spinner} />
            </div>
            <h3 className={styles.title}>Submitting Request...</h3>
            <p className={styles.description}>
              Please wait while we process your generation request.
            </p>
          </>
        );

      case 'success':
        return (
          <>
            <div className={styles.iconContainer}>
              <div className={styles.successIcon}>
                <svg
                  className={styles.checkmark}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 52 52"
                >
                  <circle
                    className={styles.checkmarkCircle}
                    cx="26"
                    cy="26"
                    r="25"
                    fill="none"
                  />
                  <path
                    className={styles.checkmarkCheck}
                    fill="none"
                    d="M14.1 27.2l7.1 7.2 16.7-16.8"
                  />
                </svg>
              </div>
            </div>
            <h3 className={styles.title}>Request Sent Successfully!</h3>
            <p className={styles.description}>
              Your plan set generation has been queued. You'll receive a notification when it's ready.
            </p>
          </>
        );

      case 'error':
        return (
          <>
            <div className={styles.iconContainer}>
              <div className={styles.errorIcon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.errorSvg}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
            </div>
            <h3 className={styles.titleError}>Generation Failed</h3>
            <p className={styles.description}>
              {errorMessage || 'An unexpected error occurred. Please try again.'}
            </p>
            <Button variant="danger" onClick={onClose}>
              Close
            </Button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnOverlay={status !== 'sending'}
      closeOnEscape={status !== 'sending'}
    >
      <div className={styles.content}>
        {renderContent()}
      </div>
    </Modal>
  );
};

export default GenerateStatusModal;
