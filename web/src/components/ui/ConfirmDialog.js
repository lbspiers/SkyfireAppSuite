import React from 'react';
import Modal from './Modal';
import Button from './Button';
import styles from './ConfirmDialog.module.css';

const ConfirmDialog = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',    // danger, warning, info
  loading = false,
  icon,                   // Optional icon/emoji
  contained = false,     // If true, renders within parent container instead of viewport
  scopedToPanel = false, // If true, position relative to parent panel
  children,              // Optional custom content to replace message
  size = 'sm',           // Modal size: sm, md, lg, xl
  showConfirm = true,    // Show confirm button
}) => {
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
  };

  const buttonVariant = variant === 'danger' ? 'primary' : 'primary';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      contained={contained}
      scopedToPanel={scopedToPanel}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          {showConfirm && (
            <Button
              variant={buttonVariant}
              onClick={handleConfirm}
              loading={loading}
              className={variant === 'danger' ? styles.dangerButton : ''}
            >
              {confirmText}
            </Button>
          )}
        </>
      }
    >
      {children || (
        <div className={styles.content}>
          {icon && <div className={styles.icon}>{icon}</div>}
          <p className={styles.message}>{message}</p>
        </div>
      )}
    </Modal>
  );
};

export default ConfirmDialog;
