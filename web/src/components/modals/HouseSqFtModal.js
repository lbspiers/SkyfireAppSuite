import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { FormInput, Button } from '../ui';
import styles from './UtilityValidationModal.module.css';

/**
 * HouseSqFtModal - Modal to prompt user to enter house square footage if missing
 * Shows when user tries to submit but house_sqft field is blank (required for CA projects)
 *
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close handler
 * @param {function} onSave - Save handler with entered square footage
 * @param {boolean} required - Whether this field is required (CA projects)
 * @param {boolean} scopedToPanel - Whether modal is scoped to panel
 * @param {boolean} contained - Whether modal is contained within parent
 */
const HouseSqFtModal = ({ isOpen, onClose, onSave, required = false, scopedToPanel = false, contained = false }) => {
  const [houseSqFt, setHouseSqFt] = useState('');
  const [error, setError] = useState(null);

  const handleSave = () => {
    const trimmedValue = houseSqFt.trim();

    if (!trimmedValue) {
      setError('Please enter the house square footage');
      return;
    }

    // Validate numeric value
    const numValue = parseFloat(trimmedValue);
    if (isNaN(numValue) || numValue <= 0) {
      setError('Please enter a valid positive number');
      return;
    }

    onSave(trimmedValue);
    setHouseSqFt(''); // Reset for next time
    setError(null);
  };

  const handleClose = () => {
    setHouseSqFt('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={required ? "House Sq Ft Required" : "Add House Sq Ft"}
      size="sm"
      scopedToPanel={scopedToPanel}
      contained={contained}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!houseSqFt.trim()}
          >
            Save & Continue
          </Button>
        </>
      }
    >
      <div>
        <p className={styles.description}>
          {required
            ? 'House square footage is required for California projects. Please enter it now.'
            : 'Enter the house square footage for this project.'}
        </p>

        {error && (
          <p className={styles.errorMessage}>
            {error}
          </p>
        )}

        <FormInput
          label="House Square Footage"
          value={houseSqFt}
          onChange={(e) => {
            setHouseSqFt(e.target.value);
            setError(null);
          }}
          placeholder="e.g., 2000"
          type="number"
          fullWidth
          autoFocus
        />

        <p className={styles.helperText}>
          Enter the total square footage of the house in square feet.
        </p>
      </div>
    </Modal>
  );
};

export default HouseSqFtModal;
