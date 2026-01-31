import React, { useState, useEffect } from 'react';
import { SERVICE_TYPE_OPTIONS } from '../../../utils/constants';
import { EquipmentRow, TableDropdown, SectionClearModal } from '../../ui';
import styles from './MainCircuitBreakersSection.module.css';
import axios from '../../../config/axios';
import logger from '../../../services/devLogger';

// Utility Service options for SolarAPP+
const UTILITY_SERVICE_RATING_OPTIONS = [
  { label: '100A', value: '100' },
  { label: '125A', value: '125' },
  { label: '150A', value: '150' },
  { label: '200A', value: '200' },
  { label: '225A', value: '225' },
  { label: '300A', value: '300' },
  { label: '320A', value: '320' },
  { label: '400A', value: '400' },
];

/**
 * Main Circuit Breakers Section (Electrical Service)
 * Captures utility service entrance information
 */
const MainCircuitBreakersSection = ({ formData, onChange, projectData }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [utilities, setUtilities] = useState([]);
  const [loadingUtilities, setLoadingUtilities] = useState(false);
  const mcbQuantityOptions = [0, 1, 2, 3];

  // Default to 1 if not set
  const currentQuantity = formData.ele_main_circuit_breakers_qty ?? 1;

  // Get zip code from projectData
  const zipCode = projectData?.site?.zip || projectData?.site?.zip_code;

  // DEBUGGING - Log everything
  console.log('🔍 MainCircuitBreakersSection - projectData:', projectData);
  console.log('🔍 MainCircuitBreakersSection - site:', projectData?.site);
  console.log('🔍 MainCircuitBreakersSection - zipCode:', zipCode);

  // Debug logging
  useEffect(() => {
    logger.debug('MainCircuitBreakersSection', 'ProjectData:', projectData);
    logger.debug('MainCircuitBreakersSection', 'Site data:', projectData?.site);
    logger.debug('MainCircuitBreakersSection', 'Zip code:', zipCode);
  }, [projectData, zipCode]);

  // Fetch utilities when zip code is available
  useEffect(() => {
    console.log('🔥 useEffect triggered! zipCode:', zipCode);

    const fetchUtilities = async () => {
      if (!zipCode) {
        console.log('❌ No zip code, exiting');
        logger.warn('MainCircuitBreakersSection', 'No zip code available, cannot fetch utilities');
        setUtilities([]);
        return;
      }

      console.log('🚀 Fetching utilities for ZIP:', zipCode);

      try {
        setLoadingUtilities(true);
        const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        const companyId = userData?.company?.uuid;

        console.log('📞 Making API call to:', `/utility-zipcodes/zips/${zipCode}/utilities`);
        const response = await axios.get(`/utility-zipcodes/zips/${zipCode}/utilities`, {
          params: {
            companyId,
            _: Date.now() // Cache-busting timestamp
          }
        });

        console.log('✅ API Response:', response);
        const utilityData = response.data?.data || response.data || [];
        console.log('📊 Utility Data:', utilityData);
        console.log('📊 Type check:', typeof utilityData, Array.isArray(utilityData));
        if (utilityData.length > 0) {
          console.log('📊 First item:', utilityData[0], typeof utilityData[0]);
        }
        logger.debug('MainCircuitBreakersSection', `Fetched ${utilityData.length} utilities for ZIP ${zipCode}`, utilityData);

        // Extract unique utility names
        // Handle both cases: array of strings OR array of objects
        const uniqueUtilities = [...new Set(
          utilityData.map(u => {
            // If it's already a string, use it directly
            let utilityName = typeof u === 'string' ? u : (u.abbreviation || u.utility_name);

            // Normalize "PSCo (Xcel Energy)" to "Xcel Energy" for display
            if (utilityName === 'PSCo (Xcel Energy)') {
              utilityName = 'Xcel Energy';
            }

            return utilityName;
          })
        )].filter(Boolean);
        console.log('🎯 Unique utilities:', uniqueUtilities);
        logger.debug('MainCircuitBreakersSection', `Unique utilities:`, uniqueUtilities);
        setUtilities(uniqueUtilities);

        // Auto-populate from projectData.site.utility if available and not already set
        console.log('🔍 Checking auto-populate:', {
          siteUtility: projectData?.site?.utility,
          currentUtilityCompany: formData.utility_company,
          shouldAutoPopulate: projectData?.site?.utility && !formData.utility_company
        });
        if (projectData?.site?.utility && !formData.utility_company) {
          // Normalize "PSCo (Xcel Energy)" to "Xcel Energy" before saving
          let utilityToSave = projectData.site.utility;
          if (utilityToSave === 'PSCo (Xcel Energy)') {
            utilityToSave = 'Xcel Energy';
          }
          console.log('✨ Auto-populating utility:', utilityToSave);
          onChange('utility_company', utilityToSave);
          logger.debug('MainCircuitBreakersSection', 'Auto-populated utility from site data');
        }
      } catch (error) {
        console.error('💥 Error fetching utilities:', error);
        logger.error('MainCircuitBreakersSection', 'Error fetching utilities:', error);
        setUtilities([]);
      } finally {
        setLoadingUtilities(false);
        console.log('✅ Fetch complete');
      }
    };

    fetchUtilities();
  }, [zipCode]); // Only depend on zipCode to avoid infinite loops

  // Wrapper to save toggle defaults when any field changes
  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value);
    // Also save MCB quantity default if not already set
    if (formData.ele_main_circuit_breakers_qty === undefined) {
      onChange('ele_main_circuit_breakers_qty', 1);
    }
  };

  const getSubtitle = () => {
    const parts = [];
    if (formData.ele_ses_type) {
      parts.push(formData.ele_ses_type);
    }
    if (currentQuantity !== undefined) {
      parts.push(`${currentQuantity} MCB${currentQuantity !== 1 ? 's' : ''}`);
    }
    if (formData.utility_service_amps) {
      parts.push(`${formData.utility_service_amps}A Service`);
    }
    if (formData.utility_company) {
      parts.push(formData.utility_company);
    }
    return parts.join(' | ');
  };

  const handleDelete = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClear = () => {
    onChange('ele_ses_type', '');
    onChange('ele_main_circuit_breakers_qty', 1);
    onChange('utility_service_amps', '');
    onChange('utility_company', '');
    setShowClearConfirm(false);
  };

  return (
    <div style={{ marginTop: 'var(--spacing)', marginBottom: 'var(--spacing)' }}>
      <EquipmentRow
        title="Electrical Service"
        subtitle={getSubtitle()}
        onDelete={handleDelete}
      >
        {/* Utility Company - Required for SolarAPP+ - MOVED TO TOP */}
        <TableDropdown
          label="Utility Company"
          value={formData.utility_company || ''}
          onChange={(value) => handleFieldChange('utility_company', value)}
          options={utilities.map(u => ({ label: u, value: u }))}
          placeholder={loadingUtilities ? "Loading utilities..." : zipCode ? "Select utility provider..." : "Enter zip code first..."}
          disabled={loadingUtilities || utilities.length === 0}
        />

        {/* Service Type */}
        <TableDropdown
          label="Service Type"
          value={formData.ele_ses_type || ''}
          onChange={(value) => handleFieldChange('ele_ses_type', value)}
          options={SERVICE_TYPE_OPTIONS}
          placeholder="Select service type..."
        />

        {/* Service Disconnects Quantity - Custom 2-row layout */}
        <div className={styles.serviceDisconnectsContainer}>
          <div className={styles.serviceDisconnectsQuestion}>
            How many Service Disconnects exist in Utility Meter Enclosure?
          </div>
          <div className={styles.serviceDisconnectsButtons}>
            {mcbQuantityOptions.map((qty) => (
              <button
                key={qty}
                type="button"
                className={`${styles.serviceDisconnectButton} ${currentQuantity === qty ? styles.active : ''}`}
                onClick={() => onChange('ele_main_circuit_breakers_qty', qty)}
              >
                {qty}
              </button>
            ))}
          </div>
        </div>

        {/* Utility Service - Required for SolarAPP+ */}
        <TableDropdown
          label="Utility Service"
          value={formData.utility_service_amps || ''}
          onChange={(value) => handleFieldChange('utility_service_amps', value)}
          options={UTILITY_SERVICE_RATING_OPTIONS}
          placeholder="Select service amperage..."
        />
      </EquipmentRow>

      <SectionClearModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleConfirmClear}
        sectionName="Electrical Service"
        fieldCount={4}
      />
    </div>
  );
};

export default MainCircuitBreakersSection;
