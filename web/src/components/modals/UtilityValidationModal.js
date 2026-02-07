import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { FormSelect, FormInput, Button } from '../ui';
import axios from '../../config/axios';
import logger from '../../services/devLogger';
import styles from './UtilityValidationModal.module.css';

/**
 * UtilityValidationModal - Modal to prompt user to select utility if missing
 * Shows when user tries to print draft but utility field is blank OR on create project page
 *
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close handler
 * @param {function} onSave - Save handler with selected utility (or custom utility object)
 * @param {string} zipCode - Project zip code to fetch utilities
 * @param {string} projectUuid - Project UUID for saving (optional for create page)
 * @param {boolean} autoSelectMultiple - Auto-select if multiple options (default: false)
 */
const UtilityValidationModal = ({ isOpen, onClose, onSave, zipCode, projectUuid, autoSelectMultiple = false }) => {
  const [selectedUtility, setSelectedUtility] = useState('');
  const [utilities, setUtilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAbbreviation, setCustomAbbreviation] = useState('');
  const [customOfficialName, setCustomOfficialName] = useState('');

  // Fetch utilities when modal opens
  useEffect(() => {
    if (isOpen && zipCode) {
      fetchUtilities();
    }
  }, [isOpen, zipCode]);

  const fetchUtilities = async () => {
    try {
      setLoading(true);
      setError(null);

      logger.log('UtilityValidationModal', 'Fetching utilities for ZIP:', zipCode);

      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      const companyId = userData?.company?.uuid;

      if (!companyId) {
        throw new Error('Company ID not found');
      }

      const response = await axios.get(`/utility-zipcodes/zips/${zipCode}/utilities`, {
        params: {
          companyId,
          _: Date.now() // Cache-busting timestamp
        }
      });

      const utilityData = response.data?.data || response.data || [];
      logger.log('UtilityValidationModal', 'Fetched utilities:', utilityData);

      // Remove duplicates, normalize names, and sort
      const uniqueUtilities = [...new Set(utilityData.map(u => {
        // Normalize "PSCo (Xcel Energy)" to "Xcel Energy"
        return u === 'PSCo (Xcel Energy)' ? 'Xcel Energy' : u;
      }))].sort();
      setUtilities(uniqueUtilities);

      // Auto-select only if one option (not multiple)
      if (uniqueUtilities.length === 1) {
        setSelectedUtility(uniqueUtilities[0]);
      } else if (uniqueUtilities.length === 0) {
        setError(`No utilities found for ZIP code ${zipCode}`);
      }
      // Do NOT auto-select if multiple options
    } catch (err) {
      logger.error('UtilityValidationModal', 'Failed to fetch utilities:', err);
      setError('Failed to load utilities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Custom utility entry
    if (showCustomInput) {
      if (!customAbbreviation.trim() || !customOfficialName.trim()) {
        setError('Please enter both abbreviation and official name');
        return;
      }

      setLoading(true);
      try {
        // Save custom utility to database and notify admin
        const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        const response = await axios.post('/utility-zipcodes/custom', {
          zipCode,
          abbreviation: customAbbreviation.trim(),
          officialName: customOfficialName.trim(),
          state: '', // Will be filled by admin
          userUuid: userData.uuid,
          userEmail: userData.email,
          userName: `${userData.firstName} ${userData.lastName}`,
          companyName: userData.company?.name || ''
        });

        logger.log('UtilityValidationModal', 'Custom utility saved:', response.data);

        // Return custom utility info to parent
        onSave({
          isCustom: true,
          abbreviation: customAbbreviation.trim(),
          officialName: customOfficialName.trim()
        });
      } catch (err) {
        logger.error('UtilityValidationModal', 'Failed to save custom utility:', err);
        setError('Failed to save custom utility. Please try again.');
        setLoading(false);
      }
      return;
    }

    // Standard utility selection
    if (!selectedUtility) {
      setError('Please select a utility before continuing');
      return;
    }

    onSave(selectedUtility);
  };

  const handleNotListedClick = () => {
    setShowCustomInput(true);
    setSelectedUtility('');
    setError(null);
  };

  const utilityOptions = utilities.map(utility => ({
    label: utility,
    value: utility
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Utility Required"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!selectedUtility || loading}
          >
            Save & Continue
          </Button>
        </>
      }
    >
      <div>
        <p className={styles.description}>
          {projectUuid ? 'This project is missing the utility. Please add it now.' : 'Select the utility for this project.'}
        </p>

        {loading ? (
          <p className={styles.loadingMessage}>
            Loading utilities...
          </p>
        ) : error ? (
          <p className={styles.errorMessage}>
            {error}
          </p>
        ) : null}

        {!showCustomInput ? (
          <>
            <FormSelect
              label="Utility"
              options={utilityOptions}
              value={selectedUtility}
              onChange={(e) => setSelectedUtility(e.target.value)}
              placeholder="Select Utility..."
              disabled={loading || utilities.length === 0}
              fullWidth
            />

            {utilities.length > 0 && (
              <p className={styles.helperText}>
                {utilities.length === 1
                  ? 'Only one utility available - auto-selected'
                  : `${utilities.length} utilities available for ZIP code ${zipCode}`
                }
              </p>
            )}

            {/* Not Listed Link */}
            {utilities.length > 0 && (
              <div className={styles.linkContainer}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNotListedClick}
                >
                  Not Listed?
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <p className={styles.customInputLabel}>
              Enter the custom utility information:
            </p>
            <FormInput
              label="Abbreviation"
              value={customAbbreviation}
              onChange={(e) => setCustomAbbreviation(e.target.value)}
              placeholder="e.g., APS, SRP"
              fullWidth
            />
            <div className={styles.formField}>
              <FormInput
                label="Official Name"
                value={customOfficialName}
                onChange={(e) => setCustomOfficialName(e.target.value)}
                placeholder="e.g., Arizona Public Service"
                fullWidth
              />
            </div>
            <p className={styles.helperText}>
              An admin will be notified to review this new utility.
            </p>
            {/* Back to list button */}
            <div className={styles.linkContainer}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomAbbreviation('');
                  setCustomOfficialName('');
                  setError(null);
                }}
              >
                ← Back to list
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default UtilityValidationModal;
