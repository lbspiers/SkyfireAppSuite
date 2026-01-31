import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../../styles/ProjectAdd.module.css';
import dashboardStyles from '../../styles/Dashboard.module.css';
import equipStyles from './EquipmentForm.module.css';
import axios from '../../config/axios';
import { toast } from 'react-toastify';
import logger from '../../services/devLogger';

// Common jurisdictions (AHJs)
const JURISDICTIONS = [
  'Los Angeles County',
  'San Diego County',
  'Orange County',
  'Riverside County',
  'San Bernardino County',
  'Sacramento County',
  'Alameda County',
  'Santa Clara County',
  'Contra Costa County',
  'Fresno County',
];

// Common utilities
const UTILITIES = [
  // Arizona
  'Arizona Public Service (APS)',
  'Salt River Project (SRP)',
  'Tucson Electric Power (TEP)',
  'Trico Electric Cooperative (TRICO)',
  'UniSource Energy Services (UniSource)',
  'Sulphur Springs Valley Electric Cooperative',
  // California
  'Pacific Gas & Electric (PG&E)',
  'Southern California Edison (SCE)',
  'San Diego Gas & Electric (SDG&E)',
  'Los Angeles Department of Water and Power (LADWP)',
  'Sacramento Municipal Utility District (SMUD)',
  'Imperial Irrigation District (IID)',
  'Anaheim Public Utilities',
  'Riverside Public Utilities',
  'Pasadena Water and Power',
  'Glendale Water & Power',
];

/**
 * SiteForm - Form for site information with auto-save
 * Saves automatically after 800ms of inactivity or on blur
 */
const SiteForm = ({ projectUuid, projectData }) => {
  const [formData, setFormData] = useState({
    jurisdiction: '',
    utility: '',
    apn: '',
    squareFootage: '',
  });

  const [addressFormData, setAddressFormData] = useState({
    address: '',
    city: '',
    state: '',
    zip: ''
  });

  const [errors, setErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [isHydrating, setIsHydrating] = useState(true);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [planSetVersion, setPlanSetVersion] = useState(1); // Next version to be generated

  const saveTimeoutRef = useRef(null);
  const lastSavedDataRef = useRef(null);

  // Auto-save function
  const saveData = useCallback(async (data) => {
    if (!projectUuid || isHydrating) {
      return;
    }

    // Check if data actually changed
    const dataString = JSON.stringify(data);
    if (dataString === lastSavedDataRef.current) {
      return; // No changes, skip save
    }

    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const companyId = userData?.company?.uuid;

    try {
      setSaveStatus('saving');

      if (!companyId) {
        throw new Error('Company information not found');
      }

      // Save site info (jurisdiction, utility, apn) to site-info endpoint
      await axios.put(`/project/${projectUuid}/site-info`, {
        companyId: companyId,
        address: addressFormData.address || '',
        city: addressFormData.city || '',
        state: addressFormData.state || '',
        zipCode: addressFormData.zip || '',
        ahj: data.jurisdiction,
        utility: data.utility,
        apn: data.apn,
      });

      // Save house_sqft separately to system-details endpoint
      if (data.squareFootage !== undefined) {
        await axios.patch(`/project/${projectUuid}/system-details`, {
          house_sqft: data.squareFootage ? parseFloat(data.squareFootage) : null,
        });
      }

      lastSavedDataRef.current = dataString;
      setSaveStatus('saved');

      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      const errorDetails = {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        siteInfoPayload: {
          companyId,
          address: addressFormData.address || '',
          city: addressFormData.city || '',
          state: addressFormData.state || '',
          zipCode: addressFormData.zip || '',
          ahj: data.jurisdiction,
          utility: data.utility,
          apn: data.apn,
        },
        systemDetailsPayload: {
          house_sqft: data.squareFootage ? parseFloat(data.squareFootage) : null,
        }
      };

      console.error('🔥 SITE-INFO SAVE ERROR:', errorDetails);
      logger.error('Project', 'Error saving site information:', errorDetails);

      setSaveStatus('error');
      toast.error(error.response?.data?.message || 'Failed to save changes', {
        position: 'top-right',
        autoClose: 3000,
      });

      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [projectUuid, isHydrating, addressFormData]);

  // Initialize form data from project data
  useEffect(() => {
    if (projectData?.site) {
      setIsHydrating(true);

      const initialData = {
        jurisdiction: projectData.site.ahj || '',
        utility: projectData.site.utility || '',
        apn: projectData.site.apn || '',
        // Backend returns house_sqft, map it to squareFootage for the form
        squareFootage: projectData.site.house_sqft || projectData.site.squareFootage || '',
      };

      setFormData(initialData);
      lastSavedDataRef.current = JSON.stringify(initialData);

      // Allow saves after hydration completes
      setTimeout(() => setIsHydrating(false), 250);
    }
  }, [projectData]);

  // Debounced auto-save effect
  useEffect(() => {
    if (isHydrating) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (800ms debounce)
    saveTimeoutRef.current = setTimeout(() => {
      saveData(formData);
    }, 800);

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, isHydrating, saveData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      return newData;
    });

    // Clear error for this field if it has a value
    if (errors[name] && value.trim()) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Save on blur (when user leaves a field)
  const handleBlur = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveData(formData);
  };

  // Initialize address form data from project data
  useEffect(() => {
    if (projectData?.site) {
      setAddressFormData({
        address: projectData.site.address || '',
        city: projectData.site.city || '',
        state: projectData.site.state || '',
        zip: projectData.site.zip || ''
      });
    }
  }, [projectData]);

  // Fetch current version number to determine next version
  useEffect(() => {
    const fetchCurrentVersion = async () => {
      if (!projectUuid) {
        return;
      }

      try {
        const response = await axios.get(`/project/${projectUuid}/versions`);

        if (response.data.success && response.data.current_version) {
          // Next version will be current + 1
          setPlanSetVersion(response.data.current_version + 1);
        } else {
          // No versions exist yet, start with V1
          setPlanSetVersion(1);
        }
      } catch (error) {
        logger.error('Project', 'Error fetching current version:', error);
        // Default to V1 on error
        setPlanSetVersion(1);
      }
    };

    fetchCurrentVersion();
  }, [projectUuid]);

  const handleEditAddress = () => {
    setIsEditingAddress(!isEditingAddress);
  };

  const handleAddressChange = async (field, value) => {
    // Optimistic UI update
    setAddressFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Save to database
    try {
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      const companyId = userData?.company?.uuid;

      if (!companyId) {
        throw new Error('Company information not found');
      }

      // Build the payload with the new value
      const payload = {
        companyId: companyId,
      };

      // Map the field to the API field name
      if (field === 'address') payload.address = value;
      if (field === 'city') payload.city = value;
      if (field === 'state') payload.state = value;
      if (field === 'zip') payload.zipCode = value;

      await axios.put(`/project/${projectUuid}/site-info`, payload);
      logger.log('Project', `Address field ${field} saved successfully`);
    } catch (error) {
      logger.error('Project', `Error saving address field ${field}:`, error);
      toast.error(`Failed to save ${field}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handlePrintPlanSet = () => {
    // TODO: Trigger plan set generation automation
    logger.log('Project', 'Print plan set clicked, version:', planSetVersion);
  };

  const handlePrintSSReport = () => {
    // TODO: Trigger SS report generation
    logger.log('Project', 'Print SS report clicked');
  };

  // Check if Print Plans button should be enabled
  const isPrintPlansEnabled = () => {
    const hasAddress = addressFormData.address &&
                       addressFormData.city &&
                       addressFormData.state &&
                       addressFormData.zip;
    const hasJurisdiction = formData.jurisdiction;
    const hasUtility = formData.utility;

    // If state is CA, square footage is required
    const needsSquareFootage = addressFormData.state === 'CA';
    const hasSquareFootage = formData.squareFootage;

    if (needsSquareFootage) {
      return hasAddress && hasJurisdiction && hasUtility && hasSquareFootage;
    }

    return hasAddress && hasJurisdiction && hasUtility;
  };

  const canPrintPlans = isPrintPlansEnabled();

  return (
    <div className={dashboardStyles.siteFormContainer}>
      <form onSubmit={(e) => e.preventDefault()}>
        {/* Save Status Indicator */}
      {saveStatus !== 'idle' && (
        <div style={{
          padding: '0.5rem 1rem',
          marginBottom: '1rem',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: saveStatus === 'saving' ? '#FEF3C7' :
                          saveStatus === 'saved' ? '#D1FAE5' :
                          '#FEE2E2',
          color: saveStatus === 'saving' ? '#92400E' :
                 saveStatus === 'saved' ? '#065F46' :
                 '#991B1B'
        }}>
          {saveStatus === 'saving' && '💾 Saving...'}
          {saveStatus === 'saved' && '✓ Saved'}
          {saveStatus === 'error' && '⚠ Save failed'}
        </div>
      )}

      {/* Edit Address Button */}
      <button
        type="button"
        onClick={handleEditAddress}
        className={equipStyles.stringingButton}
        style={{ width: '100%', marginBottom: isEditingAddress ? '1rem' : '1.5rem' }}
      >
        Edit Address
      </button>

      {/* Address Fields - Shown when editing */}
      {isEditingAddress && (
        <div style={{ marginBottom: '1.5rem' }}>
          {/* Address Input */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Address</label>
            <input
              type="text"
              value={addressFormData.address}
              onChange={(e) => handleAddressChange('address', e.target.value)}
              placeholder="Address..."
              className={styles.input}
            />
          </div>

          {/* City, State, Zip Row */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>City</label>
              <input
                type="text"
                value={addressFormData.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                placeholder="City..."
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>State</label>
              <input
                type="text"
                value={addressFormData.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                placeholder="State..."
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Zip</label>
              <input
                type="text"
                value={addressFormData.zip}
                onChange={(e) => handleAddressChange('zip', e.target.value)}
                placeholder="Zip..."
                className={styles.input}
              />
            </div>
          </div>
        </div>
      )}

      {/* Jurisdiction */}
      <div className={styles.formGroup}>
        <label className={styles.label}>
          Jurisdiction
        </label>
        <select
          name="jurisdiction"
          value={formData.jurisdiction}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`${styles.select} ${formData.jurisdiction !== '' ? styles.selectFilled : ''}`}
          style={{ color: formData.jurisdiction === '' ? 'var(--gray-500)' : 'var(--gray-50)' }}
        >
          <option value="">Select Jurisdiction...</option>
          {JURISDICTIONS.map(jurisdiction => (
            <option key={jurisdiction} value={jurisdiction}>
              {jurisdiction}
            </option>
          ))}
        </select>
      </div>

      {/* Utility */}
      <div className={styles.formGroup}>
        <label className={styles.label}>
          Utility
        </label>
        <select
          name="utility"
          value={formData.utility}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`${styles.select} ${formData.utility !== '' ? styles.selectFilled : ''}`}
          style={{ color: formData.utility === '' ? 'var(--gray-500)' : 'var(--gray-50)' }}
        >
          <option value="">Select Utility...</option>
          {UTILITIES.map(utility => (
            <option key={utility} value={utility}>
              {utility}
            </option>
          ))}
        </select>
      </div>

      {/* APN and Square Footage - Side by Side */}
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            APN
          </label>
          <input
            type="text"
            name="apn"
            value={formData.apn}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="APN..."
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Square Footage
          </label>
          <input
            type="text"
            name="squareFootage"
            value={formData.squareFootage}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Square Footage..."
            className={styles.input}
          />
        </div>
      </div>

      {/* Print Buttons - Side by Side */}
      <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {/* Print Plan Set Button */}
        <button
          type="button"
          onClick={canPrintPlans ? handlePrintPlanSet : undefined}
          disabled={!canPrintPlans}
          className={canPrintPlans ? '' : equipStyles.stringingButton}
          style={{
            padding: '0.375rem 1rem',
            background: canPrintPlans ? 'linear-gradient(180deg, #FD7332 0%, #B92011 100%)' : 'transparent',
            border: canPrintPlans ? 'none' : '1px solid #888888',
            borderRadius: '1.5rem',
            color: canPrintPlans ? 'var(--text-primary)' : '#BBBBBB',
            fontSize: '0.875rem',
            fontWeight: canPrintPlans ? 700 : 400,
            cursor: canPrintPlans ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => {
            if (canPrintPlans) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(253, 115, 50, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (canPrintPlans) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          Print V{planSetVersion} Plan Set
        </button>

        {/* Print SS Report Button */}
        <button
          type="button"
          onClick={canPrintPlans ? handlePrintSSReport : undefined}
          disabled={!canPrintPlans}
          className={canPrintPlans ? '' : equipStyles.stringingButton}
          style={{
            padding: '0.375rem 1rem',
            background: canPrintPlans ? 'linear-gradient(180deg, #FD7332 0%, #B92011 100%)' : 'transparent',
            border: canPrintPlans ? 'none' : '1px solid #888888',
            borderRadius: '1.5rem',
            color: canPrintPlans ? 'var(--text-primary)' : '#BBBBBB',
            fontSize: '0.875rem',
            fontWeight: canPrintPlans ? 700 : 400,
            cursor: canPrintPlans ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            fontFamily: 'inherit'
          }}
          onMouseEnter={(e) => {
            if (canPrintPlans) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(253, 115, 50, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (canPrintPlans) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          Print SS Report
        </button>
      </div>

        {/* Error Message */}
        {Object.keys(errors).length > 0 && (
          <div className={styles.formErrorMessage}>
            Fill Required Fields
          </div>
        )}
      </form>
    </div>
  );
};

export default SiteForm;
