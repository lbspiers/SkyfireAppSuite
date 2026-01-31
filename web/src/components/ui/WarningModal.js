import React from 'react';
import Modal from './Modal';
import Button from './Button';
import styles from './WarningModal.module.css';

/**
 * WarningModal - Reusable confirmation/warning modal
 * Shows a warning message with Cancel and Confirm actions
 */
const WarningModal = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  size = 'sm',
  scopedToPanel = false,
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    }
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={handleCancel}>
        {cancelText}
      </Button>
      <Button variant={confirmVariant} onClick={handleConfirm}>
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size={size}
      scopedToPanel={scopedToPanel}
      footer={footer}
    >
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
      </div>
    </Modal>
  );
};

export default WarningModal;
