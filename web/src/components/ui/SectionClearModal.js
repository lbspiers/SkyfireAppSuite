import React from 'react';
import Modal from './Modal';
import Button from './Button';
import styles from './ConfirmDialog.module.css';

/**
 * Modal for confirming section data clearing
 *
 * Shows when user clicks trash icon on a section with data.
 * Clears all fields in the section but keeps section visible.
 */
const SectionClearModal = ({
  isOpen,
  onClose,
  onConfirm,
  sectionName = 'this section',
  fieldCount = 0,
  scopedToPanel = true, // Default to true for left panel modals
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clear Section Data?"
      size="sm"
      scopedToPanel={scopedToPanel}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className={styles.dangerButton}
          >
            Clear Data
          </Button>
        </>
      }
    >
      <div className={styles.content}>
        <p className={styles.message}>
          This will clear all data from <strong>{sectionName}</strong>.
          {fieldCount > 0 && ` (${fieldCount} field${fieldCount === 1 ? '' : 's'} will be reset)`}
        </p>
        <p className={styles.secondaryMessage}>
          You can enter new data after clearing.
        </p>
      </div>
    </Modal>
  );
};

export default SectionClearModal;
