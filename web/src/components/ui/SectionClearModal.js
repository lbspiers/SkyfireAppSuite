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
  contained = true, // Default to true - renders within parent container
  cascadeSections = [], // Array of section names that will also be cleared
  willRemove = false, // Whether the section will also be removed after clearing
}) => {
  const hasCascade = cascadeSections && cascadeSections.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={willRemove ? "Clear and Remove Section?" : "Clear Section Data?"}
      size="sm"
      scopedToPanel={scopedToPanel}
      contained={contained}
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
            {willRemove ? "Clear and Remove" : "Clear Data"}
          </Button>
        </>
      }
    >
      <div className={styles.content}>
        <p className={styles.message}>
          This will clear all data from <strong>{sectionName}</strong>{willRemove && ' and remove the section'}.
          {fieldCount > 0 && ` (${fieldCount} field${fieldCount === 1 ? '' : 's'} will be reset)`}
        </p>

        {!willRemove && (
          <p className={styles.secondaryMessage} style={{ marginTop: 'var(--spacing)' }}>
            You can enter new data after clearing.
          </p>
        )}

        {willRemove && (
          <p className={styles.secondaryMessage} style={{ marginTop: 'var(--spacing)', fontWeight: 'bold', color: 'var(--color-danger)' }}>
            ⚠️ This action cannot be undone.
          </p>
        )}
      </div>
    </Modal>
  );
};

export default SectionClearModal;
