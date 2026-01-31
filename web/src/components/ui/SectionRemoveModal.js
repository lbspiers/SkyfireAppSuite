import React from 'react';
import Modal from './Modal';
import Button from './Button';
import styles from './ConfirmDialog.module.css';

/**
 * Modal for confirming section removal
 *
 * Shows when user clicks trash icon on an empty section.
 * Removes/hides the section from view (can be re-added later).
 */
const SectionRemoveModal = ({
  isOpen,
  onClose,
  onConfirm,
  sectionName = 'this section',
  scopedToPanel = true, // Default to true for left panel modals
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Remove Section?"
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
            Remove Section
          </Button>
        </>
      }
    >
      <div className={styles.content}>
        <p className={styles.message}>
          This will remove <strong>{sectionName}</strong> from this system.
        </p>
        <p
          style={{
            fontSize: 'var(--font-size-small)',
            color: 'var(--text-secondary)',
            marginTop: 'var(--spacing-tight)',
            margin: 0,
          }}
        >
          You can add it back using the "Add Section" button.
        </p>
      </div>
    </Modal>
  );
};

export default SectionRemoveModal;
