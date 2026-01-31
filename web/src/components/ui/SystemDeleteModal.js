import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import styles from './ConfirmDialog.module.css';

/**
 * High-security modal for deleting an entire system
 *
 * Requires user to type "DELETE" (case-insensitive) to confirm.
 * Only used for System 2+ deletion (System 1 cannot be deleted).
 */
const SystemDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  systemNumber,
  cascadeList = [], // Optional: list of sections that will be cleared
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmText('');
      setIsValid(false);
    }
  }, [isOpen]);

  // Check if typed text matches "DELETE" (case-insensitive)
  useEffect(() => {
    setIsValid(confirmText.toUpperCase() === 'DELETE');
  }, [confirmText]);

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
      setConfirmText('');
    }
  };

  // Handle Enter key in input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isValid) {
      handleConfirm();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete System ${systemNumber}?`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!isValid}
            className={styles.dangerButton}
          >
            Delete System
          </Button>
        </>
      }
    >
      <div className={styles.content}>
        <div className={styles.icon} style={{ fontSize: '2rem' }}>
          🚨
        </div>
        <p className={styles.message}>
          <strong>Warning:</strong> This will permanently delete{' '}
          <strong>System {systemNumber}</strong> and all its equipment data.
        </p>

        {cascadeList.length > 0 && (
          <div
            style={{
              marginTop: 'var(--spacing)',
              padding: 'var(--spacing-tight)',
              background: 'var(--background-subtle)',
              borderRadius: 'var(--border-radius)',
              width: '100%',
            }}
          >
            <p
              style={{
                fontSize: 'var(--font-size-small)',
                color: 'var(--text-secondary)',
                margin: '0 0 var(--spacing-tight) 0',
                fontWeight: 500,
              }}
            >
              This will clear:
            </p>
            <ul
              style={{
                margin: 0,
                padding: '0 0 0 var(--spacing)',
                fontSize: 'var(--font-size-small)',
                color: 'var(--text-secondary)',
              }}
            >
              {cascadeList.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: 'var(--spacing)', width: '100%' }}>
          <p
            style={{
              fontSize: 'var(--font-size-small)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--spacing-tight)',
              textAlign: 'left',
            }}
          >
            Type <strong style={{ color: 'var(--color-error)' }}>DELETE</strong>{' '}
            to confirm:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type DELETE to confirm"
            style={{
              width: '100%',
              padding: 'var(--spacing-tight)',
              border: `1px solid ${
                isValid ? 'var(--color-success)' : 'var(--border-color)'
              }`,
              borderRadius: 'var(--border-radius)',
              fontSize: 'var(--font-size)',
              outline: 'none',
            }}
            autoFocus
          />
        </div>

        <p
          style={{
            fontSize: 'var(--font-size-small)',
            color: 'var(--text-muted)',
            marginTop: 'var(--spacing)',
            fontStyle: 'italic',
            margin: 'var(--spacing) 0 0 0',
          }}
        >
          This action cannot be undone.
        </p>
      </div>
    </Modal>
  );
};

export default SystemDeleteModal;
