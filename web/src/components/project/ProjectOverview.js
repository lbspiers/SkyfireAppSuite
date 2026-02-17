import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button, FormFieldRow, TableDropdown, EquipmentRow } from '../ui';
import SystemContainer from './equipment/SystemContainer';
import axios from '../../config/axios';
import logger from '../../services/devLogger';
import { toast } from 'react-toastify';
import { extractAllEquipment, groupEquipmentByCategory } from '../../utils/equipmentExtractor';
import styles from './ProjectOverview.module.css';

// Common jurisdictions (AHJs)
const JURISDICTIONS = [
  // Arizona
  'Phoenix',
  'Tucson',
  'Mesa',
  'Chandler',
  'Scottsdale',
  'Glendale',
  'Gilbert',
  'Tempe',
  'Peoria',
  'Surprise',
  'Maricopa County',
  'Pima County',
  // California
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
 * DisplayRow - Read-only row for displaying data
 */
const DisplayRow = ({ label, value }) => {
  // Convert value to string for validation
  const stringValue = value != null ? String(value) : '';
  if (!stringValue || stringValue.trim() === '' || stringValue === '-') return null;
  return (
    <FormFieldRow label={label}>
      <div className={styles.displayRowValue}>
        {value}
      </div>
    </FormFieldRow>
  );
};

/**
 * ProjectOverview - Reusable project overview component
 * Shows site information (editable) and system details (read-only)
 *
 * @param {object} projectData - Full project data object
 * @param {object} systemDetails - System details from useSystemDetails hook
 * @param {boolean} readOnly - If true, site fields are read-only (default: false)
 */
const ProjectOverview = ({ projectData, systemDetails, readOnly = false }) => {
  // Safe defaults
  const site = projectData?.site || {};
  const details = projectData?.details || {};
  const projectUuid = projectData?.uuid;

  // Site form state
  const [siteFormData, setSiteFormData] = useState({
    jurisdiction: '',
    utility: '',
    apn: '',
    squareFootage: '',
  });

  // Customer form state
  const [customerFormData, setCustomerFormData] = useState({
    firstName: '',
    lastName: '',
  });

  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [customerSaveStatus, setCustomerSaveStatus] = useState('idle');
  const [isHydrating, setIsHydrating] = useState(true);

  // Lookup states
  const [jurisdictions, setJurisdictions] = useState([]);
  const [utilities, setUtilities] = useState([]);
  const [jurisdictionLoading, setJurisdictionLoading] = useState(false);
  const [utilityLoading, setUtilityLoading] = useState(false);
  const [jurisdictionError, setJurisdictionError] = useState(null);
  const [utilityError, setUtilityError] = useState(null);

  const saveTimeoutRef = useRef(null);
  const lastSavedDataRef = useRef(null);
  const currentFormValuesRef = useRef(siteFormData);

  // Auto-save function
  const saveData = useCallback(async (data) => {
    if (!projectUuid || isHydrating || readOnly) {
      return;
    }

    // Check if data actually changed
    const dataString = JSON.stringify(data);
    if (dataString === lastSavedDataRef.current) {
      return; // No changes, skip save
    }

    try {
      setSaveStatus('saving');

      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      const companyId = userData?.company?.uuid;

      if (!companyId) {
        throw new Error('Company information not found');
      }

      // Save site info (jurisdiction, utility, apn) to site-info endpoint
      const siteInfoPayload = {
        companyId: companyId,
        address: projectData?.site?.address || '',
        city: projectData?.site?.city || '',
        state: projectData?.site?.state || '',
        zipCode: projectData?.site?.zip_code || projectData?.site?.zip || '',
        ahj: data.jurisdiction,
        utility: data.utility,
        apn: data.apn,
      };

      console.log('🔥 ProjectOverview SAVING - data.squareFootage:', data.squareFootage);

      await axios.put(`/project/${projectUuid}/site-info`, siteInfoPayload);

      // Save house_sqft separately to system-details endpoint
      if (data.squareFootage !== undefined) {
        const systemDetailsPayload = {
          house_sqft: data.squareFootage ? parseFloat(data.squareFootage) : null,
        };
        console.log('🔥 ProjectOverview PATCH system-details:', systemDetailsPayload);
        await axios.patch(`/project/${projectUuid}/system-details`, systemDetailsPayload);
      } else {
        console.log('🔥 ProjectOverview SKIPPED system-details PATCH - squareFootage is undefined');
      }

      lastSavedDataRef.current = dataString;
      setSaveStatus('saved');

      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      // Silently fail - validation errors expected for new projects
      setSaveStatus('idle');

      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [projectUuid, isHydrating, readOnly]);

  // Save customer data function
  const saveCustomerData = useCallback(async (data) => {
    if (!projectUuid || isHydrating || readOnly) {
      return;
    }

    try {
      setCustomerSaveStatus('saving');

      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      const companyId = userData?.company?.uuid;

      if (!companyId) {
        throw new Error('Company information not found');
      }

      await axios.put(`/project/${projectUuid}`, {
        companyId: companyId,
        customer_first_name: data.firstName,
        customer_last_name: data.lastName,
      });

      setCustomerSaveStatus('saved');
      setTimeout(() => setCustomerSaveStatus('idle'), 2000);
    } catch (error) {
      logger.error('Project', 'Error saving customer information:', error);
      setCustomerSaveStatus('error');
      toast.error(`Failed to save customer: ${error.response?.data?.message || error.message}`, {
        position: 'top-right',
        autoClose: 3000,
      });
      setTimeout(() => setCustomerSaveStatus('idle'), 3000);
    }
  }, [projectUuid, isHydrating, readOnly]);

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

      setSiteFormData(initialData);
      currentFormValuesRef.current = initialData;
      lastSavedDataRef.current = JSON.stringify(initialData);

      // Allow saves after hydration completes
      setTimeout(() => setIsHydrating(false), 250);
    }

    // Hydrate customer data
    if (projectData?.details) {
      setCustomerFormData({
        firstName: projectData.details.customer_first_name || '',
        lastName: projectData.details.customer_last_name || '',
      });
    }
  }, [projectData]);

  // Fetch utilities by zip code
  // Add refresh counter to force re-fetch (increments on mount to bypass stale React state)
  const [utilityRefreshKey] = useState(() => Date.now());

  useEffect(() => {
    if (readOnly) {
      return; // Skip API calls in read-only mode
    }

    const zipCode = site.zip_code;
    if (!zipCode) {
      setUtilities([]);
      setUtilityError('Enter ZIP to load utilities');
      return;
    }

    let isCancelled = false;

    const fetchUtilities = async () => {
      console.log('[Utility Fetch] 🚀 Starting fetch for ZIP:', zipCode);
      console.log('[Utility Fetch] 🔑 Refresh key:', utilityRefreshKey);

      setUtilityLoading(true);
      setUtilityError(null);

      try {
        const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        const companyId = userData?.company?.uuid;

        console.log('[Utility Fetch] 🏢 Company ID:', companyId);
        console.log('[Utility Fetch] 📡 Request URL:', `/utility-zipcodes/zips/${zipCode}/utilities`);
        const requestParams = {
          _: Date.now(),
          refresh: utilityRefreshKey
        };
        console.log('[Utility Fetch] 📋 Request params:', requestParams);

        const response = await axios.get(`/utility-zipcodes/zips/${zipCode}/utilities`, {
          params: requestParams,
          headers: companyId ? { 'X-Company-ID': companyId } : {},
        });

        console.log('[Utility Fetch] ✅ Response received');
        console.log('[Utility Fetch] 📊 Response status:', response.status);
        console.log('[Utility Fetch] 📦 Response data:', response.data);

        if (isCancelled) return;

        const utilityData = response.data?.data || response.data || [];
        console.log('[Utility Fetch] 🔍 Raw utility data:', utilityData);
        console.log('[Utility Fetch] 🔍 Data type:', typeof utilityData);
        console.log('[Utility Fetch] 🔍 Is array:', Array.isArray(utilityData));
        console.log('[Utility Fetch] 🔍 Length:', utilityData.length);

        // Remove duplicates, normalize names, and sort
        const uniqueUtilities = [...new Set(utilityData.map(u => {
          // Normalize "PSCo (Xcel Energy)" to "Xcel Energy"
          return u === 'PSCo (Xcel Energy)' ? 'Xcel Energy' : u;
        }))].sort();

        console.log('[Utility Fetch] ✨ Unique utilities after processing:', uniqueUtilities);
        setUtilities(uniqueUtilities);
        console.log('[Utility Fetch] 💾 State updated with', uniqueUtilities.length, 'utilities');

        // Auto-select if only one utility and no current value (only in edit mode)
        if (!readOnly) {
          const currentUtility = currentFormValuesRef.current.utility;
          if (uniqueUtilities.length === 1 && !currentUtility) {
            const onlyUtility = uniqueUtilities[0];

            // Update ref immediately to prevent loss during saves
            currentFormValuesRef.current = {
              ...currentFormValuesRef.current,
              utility: onlyUtility,
            };

            setSiteFormData(prev => ({
              ...prev,
              utility: onlyUtility,
            }));
          }
        }

        if (uniqueUtilities.length === 0) {
          console.log('[Utility Fetch] ⚠️ No utilities found for ZIP:', zipCode);
          setUtilityError(`No utilities for ${zipCode}`);
        } else {
          console.log('[Utility Fetch] ✅ SUCCESS - Loaded', uniqueUtilities.length, 'utilities');
        }
      } catch (error) {
        if (isCancelled) {
          console.log('[Utility Fetch] ❌ Request cancelled');
          return;
        }

        console.error('[Utility Fetch] ❌ ERROR fetching utilities:', error);
        console.error('[Utility Fetch] ❌ Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        setUtilityError('Failed to load utilities');
        setUtilities([]);
      } finally {
        if (!isCancelled) {
          console.log('[Utility Fetch] 🏁 Fetch complete, loading=false');
          setUtilityLoading(false);
        }
      }
    };

    fetchUtilities();

    return () => {
      isCancelled = true;
    };
  }, [site.zip_code, readOnly, utilityRefreshKey]);

  // Fetch jurisdictions by zip code
  useEffect(() => {
    if (readOnly) return; // Skip API calls in read-only mode

    const zipCode = site.zip_code;
    const state = site.state;

    if (!zipCode) {
      setJurisdictions([]);
      setJurisdictionError('Enter ZIP to load jurisdictions');
      return;
    }

    let isCancelled = false;

    const getHardcodedJurisdictions = (zip) => {
      // Arizona zip codes
      if (zip.startsWith('850') || zip.startsWith('852') || zip.startsWith('853') ||
          zip.startsWith('855') || zip.startsWith('856') || zip.startsWith('857') ||
          zip.startsWith('859') || zip.startsWith('860') || zip.startsWith('863') ||
          zip.startsWith('864')) {
        return ['Phoenix', 'Scottsdale', 'Tempe', 'Mesa', 'Chandler', 'Glendale', 'Gilbert'];
      }

      // California zip codes (900-961)
      if (zip.startsWith('90') || zip.startsWith('91') || zip.startsWith('92') ||
          zip.startsWith('93') || zip.startsWith('94') || zip.startsWith('95') ||
          zip.startsWith('96')) {
        return ['Los Angeles', 'San Diego', 'San Francisco', 'San Jose', 'Sacramento'];
      }

      // Default fallback
      return ['County Jurisdiction', 'City Jurisdiction'];
    };

    const fetchJurisdictions = async () => {
      setJurisdictionLoading(true);
      setJurisdictionError(null);

      try {
        const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        const companyId = userData?.company?.uuid;

        // Try zip code lookup first
        const response = await axios.get('/ahj/by-zip', {
          params: { zip_code: zipCode },
          headers: companyId ? { 'X-Company-ID': companyId } : {},
        });

        if (isCancelled) return;

        const ahjData = response.data?.data || [];

        if (ahjData.length > 0) {
          // Remove duplicates by ahj_name and sort
          const uniqueAhjs = [...new Map(ahjData.map(ahj => [ahj.ahj_name, ahj])).values()]
            .map(ahj => ahj.ahj_name)
            .sort();

          setJurisdictions(uniqueAhjs);
        } else {
          // Fallback to state-level lookup

          if (state) {
            try {
              const stateResponse = await axios.get('/ahj', {
                params: { state: state },
                headers: companyId ? { 'X-Company-ID': companyId } : {},
              });

              if (!isCancelled) {
                const stateAhjData = stateResponse.data?.data || [];
                const uniqueAhjs = [...new Map(stateAhjData.map(ahj => [ahj.ahj_name, ahj])).values()]
                  .map(ahj => ahj.ahj_name)
                  .sort();

                setJurisdictions(uniqueAhjs.length > 0 ? uniqueAhjs : getHardcodedJurisdictions(zipCode));
              }
            } catch (stateError) {
              if (!isCancelled) {
                setJurisdictions(getHardcodedJurisdictions(zipCode));
              }
            }
          } else {
            setJurisdictions(getHardcodedJurisdictions(zipCode));
          }
        }
      } catch (error) {
        if (isCancelled) return;

        console.error('[Site] Error fetching jurisdictions:', error);
        setJurisdictions(getHardcodedJurisdictions(zipCode));
      } finally {
        if (!isCancelled) {
          setJurisdictionLoading(false);
        }
      }
    };

    fetchJurisdictions();

    return () => {
      isCancelled = true;
    };
  }, [site.zip_code, site.state, readOnly]);

  // Debounced auto-save effect
  useEffect(() => {
    // CRITICAL: Skip all save logic in read-only mode
    if (readOnly) {
      return;
    }

    if (isHydrating) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (800ms debounce)
    saveTimeoutRef.current = setTimeout(() => {
      saveData(siteFormData);
    }, 800);

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [siteFormData, isHydrating, saveData, readOnly]);

  // Handle change for regular text inputs
  const handleSiteChange = (e) => {
    if (readOnly) return;
    const { name, value } = e.target;
    const newData = { ...currentFormValuesRef.current, [name]: value };
    currentFormValuesRef.current = newData;
    setSiteFormData(newData);
  };

  // Handle change for TableDropdown components (receives value directly)
  const handleJurisdictionChange = (value) => {
    if (readOnly) return;
    const newData = { ...currentFormValuesRef.current, jurisdiction: value };
    currentFormValuesRef.current = newData;
    setSiteFormData(newData);
  };

  const handleUtilityChange = (value) => {
    if (readOnly) return;
    const newData = { ...currentFormValuesRef.current, utility: value };
    currentFormValuesRef.current = newData;
    setSiteFormData(newData);
  };

  // Save on blur (when user leaves a field)
  const handleSiteBlur = () => {
    if (readOnly) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveData(siteFormData);
  };

  // Customer change handlers
  const handleCustomerChange = (e) => {
    if (readOnly) return;
    const { name, value } = e.target;
    setCustomerFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomerBlur = () => {
    if (readOnly) return;
    saveCustomerData(customerFormData);
  };

  // Customer & Address
  const customerName = details.customer_first_name && details.customer_last_name
    ? `${details.customer_first_name} ${details.customer_last_name}`
    : null;

  const address = site.address
    ? `${site.address}, ${site.city || ''} ${site.state || ''} ${site.zip_code || ''}`.trim()
    : null;

  // ===== EXTRACT ALL EQUIPMENT =====
  const allEquipment = useMemo(() => {
    return extractAllEquipment(systemDetails);
  }, [systemDetails]);

  const groupedEquipment = useMemo(() => {
    return groupEquipmentByCategory(allEquipment);
  }, [allEquipment]);

  // Group equipment by system number for system containers
  const equipmentBySystem = useMemo(() => {
    const bySystem = {};

    allEquipment.forEach(item => {
      const sysNum = item.systemNumber || 'shared';
      if (!bySystem[sysNum]) {
        bySystem[sysNum] = [];
      }
      bySystem[sysNum].push(item);
    });

    return bySystem;
  }, [allEquipment]);

  // Get list of systems that have equipment
  const getVisibleSystems = () => {
    const systems = Object.keys(equipmentBySystem)
      .filter(key => key !== 'shared' && parseInt(key) >= 1 && parseInt(key) <= 4)
      .map(key => parseInt(key))
      .sort();

    return systems.length > 0 ? systems : [1]; // Always show at least System 1
  };

  // Prepare options for dropdowns from dynamically loaded data
  const jurisdictionOptions = jurisdictions.length > 0
    ? jurisdictions.map(j => ({ value: j, label: j }))
    : JURISDICTIONS.map(j => ({ value: j, label: j })); // Fallback to hardcoded list

  const utilityOptions = utilities.length > 0
    ? utilities.map(u => ({ value: u, label: u }))
    : UTILITIES.map(u => ({ value: u, label: u })); // Fallback to hardcoded list

  // Helper text for dropdowns
  const jurisdictionHelper = (() => {
    if (!site?.zip_code) return 'Enter ZIP to load jurisdictions';
    if (jurisdictionLoading) return 'Loading jurisdictions...';
    if (jurisdictionError) return jurisdictionError;
    return '';
  })();

  const utilityHelper = (() => {
    if (!site?.zip_code) return 'Enter ZIP to load utilities';
    if (utilityLoading) return 'Loading utilities...';
    if (utilityError) return utilityError;
    return '';
  })();

  return (
    <div>
      {/* ===== PROJECT INFO CONTAINER ===== */}
      <SystemContainer systemNumber="Project Info">
        {/* Customer Save Status */}
        {!readOnly && customerSaveStatus !== 'idle' && (
          <div style={{
            padding: '0.5rem 1rem',
            marginBottom: '1rem',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: customerSaveStatus === 'saving' ? '#FEF3C7' :
                            customerSaveStatus === 'saved' ? '#D1FAE5' :
                            '#FEE2E2',
            color: customerSaveStatus === 'saving' ? '#92400E' :
                   customerSaveStatus === 'saved' ? '#065F46' :
                   '#991B1B'
          }}>
            {customerSaveStatus === 'saving' && '💾 Saving customer...'}
            {customerSaveStatus === 'saved' && '✓ Customer saved'}
            {customerSaveStatus === 'error' && '⚠ Customer save failed'}
          </div>
        )}

        {/* Customer Section */}
        <div style={{ marginBottom: '1rem' }}>
          <EquipmentRow
            title="Customer"
            subtitle={`${customerFormData.firstName} ${customerFormData.lastName}`.trim() || 'Empty'}
            showNewExistingToggle={false}
            initiallyExpanded={false}
          >
          {readOnly ? (
            <>
              <DisplayRow label="First Name" value={customerFormData.firstName} />
              <DisplayRow label="Last Name" value={customerFormData.lastName} />
            </>
          ) : (
            <>
              <FormFieldRow label="First Name">
                <input
                  type="text"
                  name="firstName"
                  value={customerFormData.firstName}
                  onChange={handleCustomerChange}
                  onBlur={handleCustomerBlur}
                  placeholder="First Name..."
                />
              </FormFieldRow>

              <FormFieldRow label="Last Name">
                <input
                  type="text"
                  name="lastName"
                  value={customerFormData.lastName}
                  onChange={handleCustomerChange}
                  onBlur={handleCustomerBlur}
                  placeholder="Last Name..."
                />
              </FormFieldRow>
            </>
          )}
        </EquipmentRow>
        </div>

        {/* Site Save Status */}
        {!readOnly && saveStatus !== 'idle' && (
          <div style={{
            padding: '0.5rem 1rem',
            marginBottom: '1rem',
            marginTop: 'var(--spacing)',
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
            {saveStatus === 'saving' && '💾 Saving site...'}
            {saveStatus === 'saved' && '✓ Site saved'}
            {saveStatus === 'error' && '⚠ Site save failed'}
          </div>
        )}

        {/* Site Information Section */}
        <EquipmentRow
          title="Site Information"
          subtitle={address || `${site.city || ''} ${site.state || ''}`.trim() || 'Empty'}
          showNewExistingToggle={false}
          initiallyExpanded={true}
        >
          {/* Address - Read Only */}
          <DisplayRow label="Address" value={address} />

          {/* Editable Fields */}
          {readOnly ? (
            <>
              <DisplayRow label="Jurisdiction" value={siteFormData.jurisdiction} />
              <DisplayRow label="Utility" value={siteFormData.utility} />
              <DisplayRow label="APN" value={siteFormData.apn} />
              <DisplayRow label="Square Footage" value={siteFormData.squareFootage} />
            </>
          ) : (
            <>
              <TableDropdown
                label="Jurisdiction"
                value={siteFormData.jurisdiction}
                onChange={handleJurisdictionChange}
                options={jurisdictionOptions}
                placeholder={jurisdictionHelper || "Select Jurisdiction..."}
                disabled={jurisdictionLoading || !site?.zip_code}
              />

              <TableDropdown
                label="Utility"
                value={siteFormData.utility}
                onChange={handleUtilityChange}
                options={utilityOptions}
                placeholder={utilityHelper || "Select Utility..."}
                disabled={utilityLoading || !site?.zip_code || utilities.length === 0}
              />

              <FormFieldRow label="APN">
                <input
                  type="text"
                  name="apn"
                  value={siteFormData.apn}
                  onChange={handleSiteChange}
                  onBlur={handleSiteBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="APN..."
                />
              </FormFieldRow>

              <FormFieldRow label="Square Footage">
                <input
                  type="text"
                  name="squareFootage"
                  value={siteFormData.squareFootage}
                  onChange={handleSiteChange}
                  onBlur={handleSiteBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Square Footage..."
                />
              </FormFieldRow>
            </>
          )}
        </EquipmentRow>
      </SystemContainer>

      {/* ===== SYSTEMS (Dynamic - 1 to 4) ===== */}
      {getVisibleSystems().map((sysNum) => {
        const systemEquipment = equipmentBySystem[sysNum] || [];

        return (
          <SystemContainer key={sysNum} systemNumber={sysNum}>
            {/* Display all equipment for this system */}
            {systemEquipment.map((item, idx) => {
              const subtitle = item.quantity
                ? `${item.quantity} - ${item.manufacturer} ${item.model}`
                : `${item.manufacturer} ${item.model}`;

              return (
                <EquipmentRow
                  key={`${item.key || idx}`}
                  title={item.type}
                  subtitle={subtitle}
                  showNewExistingToggle={false}
                  initiallyExpanded={false}
                />
              );
            })}
          </SystemContainer>
        );
      })}

      {/* ===== SHARED EQUIPMENT (No system number) ===== */}
      {equipmentBySystem.shared && equipmentBySystem.shared.length > 0 && (
        <SystemContainer systemNumber="Shared Equipment">
          {equipmentBySystem.shared.map((item, idx) => {
            const subtitle = item.quantity
              ? `${item.quantity} - ${item.manufacturer} ${item.model}`
              : `${item.manufacturer} ${item.model}`;

            return (
              <EquipmentRow
                key={`${item.key || idx}`}
                title={item.type}
                subtitle={subtitle}
                showNewExistingToggle={false}
                initiallyExpanded={false}
              />
            );
          })}
        </SystemContainer>
      )}
    </div>
  );
};

export default ProjectOverview;
