import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import FormInput from './FormInput';
import styles from './DeleteConfirmModal.module.css';

/**
 * DeleteConfirmModal - Requires user to type "Delete" to confirm deletion
 *
 * @param {boolean} isOpen - Modal visibility
 * @param {function} onClose - Close handler
 * @param {function} onConfirm - Confirm handler (called after validation)
 * @param {number} itemCount - Number of items being deleted
 * @param {string} itemType - Type of items (e.g., "files", "photos", "projects")
 */
const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemCount = 0,
  itemType = 'items',
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isValid = confirmText === 'Delete';

  // Reset input when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmText('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!isValid || isDeleting) return;

    setIsDeleting(true);
    try {
      await onConfirm();
      setConfirmText('');
      onClose();
    } catch (error) {
      // Error handling done by parent
    } finally {
      setIsDeleting(false);
    }
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
        disabled={!isValid || isDeleting}
        loading={isDeleting}
      >
        Delete {itemCount} {itemType}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion" footer={footer}>
      <div className={styles.content}>
        <div className={styles.warningIcon}>⚠️</div>

        <p className={styles.warning}>
          You are about to delete <strong>{itemCount}</strong> {itemType}.
        </p>

        <p className={styles.subwarning}>
          This action will archive the {itemType} and remove them from view.
          Contact support if you need to recover deleted items.
        </p>

        <FormInput
          label={
            <>
              Type <strong>Delete</strong> to confirm:
            </>
          }
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Type 'Delete' here"
          autoFocus
          disabled={isDeleting}
        />
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;
