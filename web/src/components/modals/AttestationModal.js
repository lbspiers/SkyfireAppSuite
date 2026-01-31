import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import styles from './AttestationModal.module.css';
import { DOCUMENT_TYPE_LABELS } from '../../constants/generationConstants';

/**
 * AttestationModal - Confirmation modal before plan generation
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onConfirm: () => void
 * - documentType: 'plan_set' | 'survey_report' | 'both'
 * - projectInfo: { address, customerName }
 */
const AttestationModal = ({ isOpen, onClose, onConfirm, documentType, projectInfo = {} }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!isConfirmed) return;
    onConfirm();
    // Reset checkbox for next time
    setIsConfirmed(false);
  };

  const handleClose = () => {
    setIsConfirmed(false);
    onClose();
  };

  const documentLabel = DOCUMENT_TYPE_LABELS[documentType] || 'Document';
  const { address, customerName } = projectInfo;

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleConfirm} disabled={!isConfirmed}>
        Confirm & Generate
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Confirm Generation"
      size="md"
      footer={footer}
    >
      <div className={styles.body}>
          <p className={styles.description}>
            You are about to generate <strong>{documentLabel}</strong> for:
          </p>

          <div className={styles.projectInfo}>
            {customerName && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Customer:</span>
                <span className={styles.infoValue}>{customerName}</span>
              </div>
            )}
            {address && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Address:</span>
                <span className={styles.infoValue}>{address}</span>
              </div>
            )}
          </div>

          <div className={styles.warningBox}>
            <p className={styles.warningText}>
              Please ensure all project information is accurate and complete before proceeding.
              This action will trigger the automated generation process.
            </p>
          </div>

          {/* Confirmation Checkbox */}
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className={styles.checkbox}
            />
            <span className={styles.checkboxText}>
              I confirm all information is accurate and complete
            </span>
          </label>
        </div>
    </Modal>
  );
};

export default AttestationModal;
