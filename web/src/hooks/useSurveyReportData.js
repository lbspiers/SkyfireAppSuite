// src/hooks/useSurveyReportData.js

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSystemDetails } from './useSystemDetails';
import surveyService from '../services/surveyService';
import logger from '../services/devLogger';

/**
 * Hook to consolidate all data needed for the Site Survey Report
 *
 * @param {string} projectUuid - Project UUID
 * @param {Object} projectData - Optional project data from parent (for customer/site info)
 * @returns {Object} { loading, error, data, refresh }
 */
export const useSurveyReportData = (projectUuid, projectData = null) => {
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Fetch system details using existing hook
  const { data: systemDetails, loading: systemLoading, getField } = useSystemDetails({
    projectUuid,
    autoFetch: true
  });

  // Fetch photos and notes
  useEffect(() => {
    if (!projectUuid) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch photos
        logger.log('useSurveyReportData', '[Photos] Fetching photos for project:', projectUuid);
        const photosData = await surveyService.photos.list(projectUuid);
        logger.log('useSurveyReportData', '[Photos] Raw response:', photosData);
        logger.log('useSurveyReportData', '[Photos] Photo sections:', photosData.map(p => p.section));
        setPhotos(Array.isArray(photosData) ? photosData : []);

        // Fetch notes (currently mock data)
        logger.log('useSurveyReportData', '[Notes] Fetching notes for project:', projectUuid);
        const notesData = await surveyService.notes.list(projectUuid);
        logger.log('useSurveyReportData', '[Notes] Raw response:', notesData);
        setNotes(Array.isArray(notesData) ? notesData : []);

      } catch (err) {
        logger.error('useSurveyReportData', 'Failed to fetch survey data:', err);
        setError(err.message || 'Failed to load survey data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectUuid, refreshCounter]);

  // Refresh function
  const refresh = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  // Consolidate all data with fallback logic
  const data = useMemo(() => {
    if (!systemDetails && !projectData) {
      return null;
    }

    // Get session storage data
    let companyData = {};
    let userData = {};
    try {
      companyData = JSON.parse(sessionStorage.getItem('companyData') || '{}');
      userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      logger.log('useSurveyReportData', '[Session] Company data:', companyData);
      logger.log('useSurveyReportData', '[Session] User data:', userData);
    } catch (err) {
      logger.error('useSurveyReportData', 'Failed to parse session storage:', err);
    }

    // Helper to get field with fallback
    const getFieldWithFallback = (systemField, projectPath, defaultValue = '') => {
      const systemValue = getField ? getField(systemField) : null;
      const projectValue = projectPath ? projectPath.split('.').reduce((obj, key) => obj?.[key], projectData) : null;
      const result = systemValue || projectValue || defaultValue;

      // Log for debugging
      if (!systemValue && projectPath) {
        logger.debug('useSurveyReportData', `[Fallback] ${systemField} not in systemDetails, using projectData.${projectPath}: ${result}`);
      }

      return result;
    };

    // Company information
    const company = {
      name: companyData.name || companyData.company_name || 'Skyfire Solar',
      logo: companyData.logo_url || companyData.logoUrl || companyData.logo || null,
      address: companyData.address || '',
      city: companyData.city || '',
      state: companyData.state || '',
      zip: companyData.zip || companyData.zip_code || '',
      phone: companyData.phone || companyData.phone_number || '',
      email: companyData.email || '',
      license: companyData.license || companyData.license_number || '',
    };

    logger.log('useSurveyReportData', '[Company] Consolidated company data:', company);

    // Customer information (dual-source with fallback)
    const customer = {
      firstName: getFieldWithFallback('customer_first_name', 'customer.firstName'),
      lastName: getFieldWithFallback('customer_last_name', 'customer.lastName'),
      phone: getFieldWithFallback('customer_phone', 'customer.phone'),
      email: getFieldWithFallback('customer_email', 'customer.email'),
    };

    logger.log('useSurveyReportData', '[Customer] Consolidated customer data:', customer);

    // Site information (dual-source with fallback)
    const site = {
      address: getFieldWithFallback('site_address', 'site.address'),
      city: getFieldWithFallback('site_city', 'site.city'),
      state: getFieldWithFallback('site_state', 'site.state'),
      zip: getFieldWithFallback('site_zip', 'site.zip'),
      ahj: getFieldWithFallback('site_ahj', 'site.ahj'),
      utility: getFieldWithFallback('site_utility', 'site.utility'),
      apn: getFieldWithFallback('site_apn', 'site.apn'),
      squareFootage: getFieldWithFallback('site_square_footage', 'site.squareFootage'),
      stories: getFieldWithFallback('site_stories', 'site.stories'),
    };

    logger.log('useSurveyReportData', '[Site] Consolidated site data:', site);

    // Project metadata
    const project = {
      id: projectUuid,
      status: projectData?.status || projectData?.completed_step || 'Site Survey',
      createdAt: projectData?.created_at || new Date().toISOString(),
      surveyDate: projectData?.updated_at || projectData?.survey_date || new Date().toISOString(),
      surveyedBy: userData.first_name && userData.last_name
        ? `${userData.first_name} ${userData.last_name}`.trim()
        : userData.displayName || userData.name || 'Site Surveyor',
    };

    logger.log('useSurveyReportData', '[Project] Consolidated project data:', project);

    // Electrical configuration
    const electrical = {
      sesType: getField ? getField('ses_type') : null,
      mainCircuitBreakersQty: getField ? getField('main_circuit_breakers_qty') : null,
      mainPanel: {
        busBarRating: getField ? getField('ele_bus_bar_rating') : null,
        mainBreakerRating: getField ? getField('ele_main_circuit_breaker_rating') : null,
        feederLocation: getField ? getField('ele_feeder_location_on_bus_bar') : null,
        existing: getField ? getField('ele_existing') : null,
        derated: getField ? getField('ele_derated') : null,
      },
      subPanels: [],
      poi: {
        method: getField ? getField('ele_method_of_interconnection') : null,
        breakerRating: getField ? getField('el_poi_breaker_rating') : null,
        disconnectRating: getField ? getField('el_poi_disconnect_rating') : null,
        breakerLocation: getField ? getField('el_poi_breaker_location') : null,
      },
    };

    // Sub Panels (B, C, D)
    ['spb', 'spc', 'spd'].forEach((prefix, index) => {
      const busBar = getField ? getField(`${prefix}_bus_bar_rating`) : null;
      if (busBar) {
        electrical.subPanels.push({
          name: `Sub Panel ${String.fromCharCode(66 + index)}`, // B, C, D
          busBarRating: busBar,
          mainBreakerRating: getField ? getField(`${prefix}_main_breaker_rating`) : null,
          upstreamBreaker: getField ? getField(`${prefix}_upstream_breaker_rating`) : null,
          conductorSize: getField ? getField(`${prefix}_conductor_size`) : null,
          tieInLocation: getField ? getField(`${prefix}_tie_in_location`) : null,
        });
      }
    });

    logger.log('useSurveyReportData', '[Electrical] Consolidated electrical data:', electrical);

    // Systems (1-4)
    const systems = [];
    for (let i = 1; i <= 4; i++) {
      const prefix = `sys${i}`;
      const inverterMake = getField ? getField(`${prefix}_inverter_make`) : null;
      const panelMake = getField ? getField(`${prefix}_panel_make`) : null;

      // Only include system if it has inverter or panel data
      if (inverterMake || panelMake) {
        const panelWattage = getField ? getField(`${prefix}_panel_wattage`) : 0;
        const panelQty = getField ? getField(`${prefix}_panel_qty`) : 0;
        const totalSystemSize = (panelWattage * panelQty / 1000).toFixed(2); // kW

        const system = {
          id: i,
          name: getField ? getField(`${prefix}_name`) : `System ${i}`,
          inverter: {
            make: inverterMake,
            model: getField ? getField(`${prefix}_inverter_model`) : null,
            type: getField ? getField(`${prefix}_inverter_type`) : null,
            qty: getField ? getField(`${prefix}_inverter_qty`) : null,
            maxContinuousOutput: getField ? getField(`${prefix}_inverter_max_continuous_output`) : null,
          },
          panels: {
            make: panelMake,
            model: getField ? getField(`${prefix}_panel_model`) : null,
            wattage: panelWattage,
            qty: panelQty,
          },
          batteries: null,
          totalSystemSize,
        };

        // Check for battery data
        const battery1Make = getField ? getField(`${prefix}_battery1_make`) : null;
        if (battery1Make) {
          system.batteries = {
            battery1: {
              make: battery1Make,
              model: getField ? getField(`${prefix}_battery1_model`) : null,
              qty: getField ? getField(`${prefix}_battery1_qty`) : null,
              capacity: getField ? getField(`${prefix}_battery1_capacity`) : null,
            },
          };

          // Check for second battery
          const battery2Make = getField ? getField(`${prefix}_battery2_make`) : null;
          if (battery2Make) {
            system.batteries.battery2 = {
              make: battery2Make,
              model: getField ? getField(`${prefix}_battery2_model`) : null,
              qty: getField ? getField(`${prefix}_battery2_qty`) : null,
              capacity: getField ? getField(`${prefix}_battery2_capacity`) : null,
            };
          }
        }

        systems.push(system);
      }
    }

    logger.log('useSurveyReportData', '[Systems] Consolidated systems data:', systems);

    // Structural information
    const structural = {
      roofTypes: [],
      mountingHardware: [],
      mountingPlanes: [],
    };

    // Roof Types (A, B, C)
    ['rta', 'rtb', 'rtc'].forEach((prefix, index) => {
      const material = getField ? getField(`${prefix}_roofing_material`) : null;
      if (material) {
        structural.roofTypes.push({
          name: `Roof Type ${String.fromCharCode(65 + index)}`, // A, B, C
          material,
          framingSize: getField ? getField(`${prefix}_framing_size`) : null,
          framingSpacing: getField ? getField(`${prefix}_framing_spacing`) : null,
          areaSqft: getField ? getField(`${prefix}_area_sqft`) : null,
          framingType: getField ? getField(`${prefix}_framing_type`) : null,
        });

        // Mounting hardware for this roof type
        const railMake = getField ? getField(`${prefix}_rail_make`) : null;
        if (railMake) {
          structural.mountingHardware.push({
            roofType: `Roof Type ${String.fromCharCode(65 + index)}`,
            railMake,
            railModel: getField ? getField(`${prefix}_rail_model`) : null,
            attachmentMake: getField ? getField(`${prefix}_attachment_make`) : null,
            attachmentModel: getField ? getField(`${prefix}_attachment_model`) : null,
          });
        }
      }
    });

    // Mounting Planes (1-15)
    for (let i = 1; i <= 15; i++) {
      const prefix = `mp${i}`;
      const pitch = getField ? getField(`${prefix}_pitch`) : null;
      const azimuth = getField ? getField(`${prefix}_azimuth`) : null;

      if (pitch !== null || azimuth !== null) {
        structural.mountingPlanes.push({
          number: i,
          stories: getField ? getField(`${prefix}_stories`) : null,
          pitch,
          azimuth,
          roofType: getField ? getField(`${prefix}_roof_type`) : null,
          mode: getField ? getField(`${prefix}_mode`) : null,
          panelQty: getField ? getField(`${prefix}_panel_qty`) : null,
        });
      }
    }

    logger.log('useSurveyReportData', '[Structural] Consolidated structural data:', structural);

    // Group photos by section using actual photoSections.js values
    const photosBySection = {
      property: photos.filter(p => ['general', 'site'].includes(p.section)),
      electrical: photos.filter(p => ['main_panel', 'sub_panel', 'meter', 'disconnect', 'poi'].includes(p.section)),
      equipment: photos.filter(p => ['inverter', 'microinverter', 'solar_panel'].includes(p.section)),
      roof: photos.filter(p => ['roof', 'mounting_plane', 'racking', 'attachment'].includes(p.section)),
      storage: photos.filter(p => ['battery', 'battery_combiner', 'gateway', 'sms', 'backup_panel'].includes(p.section)),
    };

    logger.log('useSurveyReportData', '[Photos] Grouped photos by section:', photosBySection);

    // Group notes by section
    const notesBySection = notes.reduce((acc, note) => {
      const section = note.section || 'general';
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(note);
      return acc;
    }, {});

    logger.log('useSurveyReportData', '[Notes] Grouped notes by section:', notesBySection);

    return {
      company,
      project,
      customer,
      site,
      electrical,
      systems,
      structural,
      notes,
      notesBySection,
      photos: photosBySection,
      photosList: photos, // flat array for convenience
    };
  }, [systemDetails, projectData, photos, notes, getField, projectUuid]);

  return {
    loading: systemLoading || loading,
    error,
    data,
    refresh,
  };
};

export default useSurveyReportData;
