import React from 'react';
import Modal from './Modal';
import Button from './Button';
import styles from './ConfirmDialog.module.css';

/**
 * Generic confirmation modal for actions
 * Similar to SectionClearModal but with customizable title, message, and button text
 */
const ConfirmActionModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  scopedToPanel = true, // Default to true for left panel modals
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      scopedToPanel={scopedToPanel}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className={styles.dangerButton}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className={styles.content}>
        <p className={styles.message}>
          {message}
        </p>
      </div>
    </Modal>
  );
};

export default ConfirmActionModal;
