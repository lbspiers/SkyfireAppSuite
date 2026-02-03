import React from 'react';
import styles from './EquipmentValidationModal.module.css';
import { Alert, Button } from '../ui';

const EquipmentValidationModal = ({
  isOpen,
  onClose,
  validationResults,
  onProceed,
  onSelect
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Equipment Validation</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <Alert variant="warning">
            Some equipment from the assessment could not be matched in our database.
            You can select a similar item from our suggestions or proceed with the original values.
          </Alert>

          {validationResults.map((result, idx) => (
            <div key={idx} className={styles.equipmentRow}>
              <div className={styles.equipmentHeader}>
                <span className={styles.equipmentType}>{result.type}</span>
                <div className={styles.equipmentOriginal}>
                  <span className={styles.label}>From Assessment:</span>
                  <span className={styles.value}>
                    {result.original.manufacturer} {result.original.model}
                  </span>
                </div>
              </div>

              {result.suggestions && result.suggestions.length > 0 ? (
                <div className={styles.suggestions}>
                  <p className={styles.suggestionsLabel}>Did you mean:</p>
                  <div className={styles.suggestionsList}>
                    {result.suggestions.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => onSelect(result.type, suggestion)}
                        className={styles.suggestionButton}
                      >
                        <span className={styles.suggestionText}>
                          {suggestion.manufacturer} {suggestion.model}
                        </span>
                        <span className={styles.suggestionBadge}>Select</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className={styles.noMatch}>
                  No similar equipment found in database
                </p>
              )}
            </div>
          ))}
        </div>

        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onProceed}>
            Proceed with Original Values
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentValidationModal;
