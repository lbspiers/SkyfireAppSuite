import React from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui';
import styles from './ChatterDeleteModal.module.css';

/**
 * ChatterDeleteModal - Confirmation modal for deleting chatter messages
 *
 * @param {boolean} isOpen - Modal visibility
 * @param {function} onClose - Close handler
 * @param {function} onConfirm - Confirm handler
 * @param {string} messagePreview - Preview of message being deleted (first 100 chars)
 * @param {boolean} isDeleting - Loading state during deletion
 * @param {string} itemType - 'thread' or 'reply'
 * @param {number} replyCount - Number of replies (for threads only)
 */
const ChatterDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  messagePreview = '',
  isDeleting = false,
  itemType = 'message',
  replyCount = 0,
}) => {
  const handleConfirm = async () => {
    if (isDeleting) return;
    await onConfirm();
  };

  const footer = (
    <>
      <Button
        variant="secondary"
        onClick={onClose}
        disabled={isDeleting}
      >
        Cancel
      </Button>
      <Button
        variant="danger"
        onClick={handleConfirm}
        disabled={isDeleting}
        loading={isDeleting}
      >
        Delete
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete ${itemType}?`}
      footer={footer}
      size="sm"
      contained={true}
    >
      <div className={styles.content}>
        <div className={styles.warningIcon}>⚠️</div>

        <p className={styles.warning}>
          This action cannot be undone. The message will be permanently removed.
        </p>

        {messagePreview && (
          <div className={styles.preview}>
            <div className={styles.previewLabel}>Message preview:</div>
            <div className={styles.previewText}>
              "{messagePreview.substring(0, 100)}{messagePreview.length > 100 ? '...' : ''}"
            </div>
          </div>
        )}

        {itemType === 'thread' && replyCount > 0 && (
          <p className={styles.replyWarning}>
            This will also delete <strong>{replyCount}</strong> {replyCount === 1 ? 'reply' : 'replies'}.
          </p>
        )}
      </div>
    </Modal>
  );
};

export default ChatterDeleteModal;
