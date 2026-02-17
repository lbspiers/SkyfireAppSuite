import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  EquipmentRow,
  TableDropdown,
  SectionClearModal,
  SectionRemoveModal,
  Divider,
  FormFieldRow,
  TableRowButton,
  Alert,
  PreferredButton,
  Tooltip,
  AddSectionButton
} from '../../ui';
import { PreferredEquipmentModal } from '../../equipment';
import flameIcon from '../../../assets/images/Skyfire Flame Icon.png';
import styles from '../../../styles/ProjectAdd.module.css';
import formStyles from '../../../styles/FormSections.module.css';
import componentStyles from './InverterMicroSection.module.css';
import {
  getInverterManufacturers,
  getInverterModels,
  getOptimizerManufacturers,
  getOptimizerModels,
  manufacturerSupportsOptimizers,
} from '../../../services/equipmentService';
import { isPowerWall3, extractPowerWall3KW, updatePowerWall3ModelWithKW, isTeslaPowerWall } from '../../../utils/powerWallDetection';
import {
  isSolarEdgeMultiKW,
  extractSolarEdgePartNumber,
  extractSolarEdgeSetting,
  buildSolarEdgeModelNumber,
  getSolarEdgeKWOptions,
  isSolarEdgeWithKWOptions,
  deduplicateSolarEdgeModels,
  wattsToKW,
} from '../../../utils/solaredgeDetection';
import { POWERWALL_3_KILOWATT_OPTIONS } from '../../../utils/constants';
import logger from '../../../services/devLogger';
import axios from '../../../config/axios';
import { useSectionDelete, DELETE_BEHAVIOR } from '../../../hooks/useSectionDelete';
import {
  calculateInverterInputDistribution,
} from '../../../utils/stringingCalculations';
import PowerWallConfigurationSection from './PowerWallConfigurationSection';
import GatewayConfigurationSection from './GatewayConfigurationSection';
import SolarPanel2Section from './SolarPanel2Section';

/**
 * Inverter/Microinverter Section
 * Determines equipment type from model number, then loads appropriate configuration
 *
 * @param {number|null} maxContinuousOutputAmps - Raw max output amps from inverter (passed to BOS)
 * @param {boolean} loadingMaxOutput - Loading state for max output calculation
 */
const InverterMicroSection = ({
  formData,
  onChange,
  onBatchChange,
  systemNumber = 1,
  maxContinuousOutputAmps = null,
  loadingMaxOutput = false,
  siteZipCode = '',
}) => {
  const [manufacturers, setManufacturers] = useState([]);
  const [models, setModels] = useState([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedModelData, setSelectedModelData] = useState(null);
  const [showOptimizers, setShowOptimizers] = useState(false);
  const [optimizerManufacturers, setOptimizerManufacturers] = useState([]);
  const [optimizerModels, setOptimizerModels] = useState([]);
  const [loadingOptimizerMakes, setLoadingOptimizerMakes] = useState(false);
  const [loadingOptimizerModels, setLoadingOptimizerModels] = useState(false);

  // Type 2 optimizer state (for second panel type)
  const [optimizerType2Manufacturers, setOptimizerType2Manufacturers] = useState([]);
  const [optimizerType2Models, setOptimizerType2Models] = useState([]);
  const [loadingOptimizerType2Makes, setLoadingOptimizerType2Makes] = useState(false);
  const [loadingOptimizerType2Models, setLoadingOptimizerType2Models] = useState(false);

  // Track auto-population to prevent duplicate onChange calls
  const hasAutoPopulatedRef = useRef(false);
  const lastProcessedModelRef = useRef(null);

  // Stringing state
  const [activeStringInput, setActiveStringInput] = useState(null);

  // Preferred equipment modal state
  const [showPreferredModal, setShowPreferredModal] = useState(false);
  const [showOptimizerPreferredModal, setShowOptimizerPreferredModal] = useState(false);
  const [showOptimizerType2PreferredModal, setShowOptimizerType2PreferredModal] = useState(false);

  // NEC 690.7 Temperature Correction Factor (fetched from API)
  const [correctionFactor, setCorrectionFactor] = useState(null);

  // PowerWall 3 Detection
  const isPW3 = useMemo(() => {
    return isPowerWall3(formData.inverter_model);
  }, [formData.inverter_model]);

  // Extract current kW rating from PowerWall 3 model name
  const currentPW3KW = useMemo(() => {
    if (!isPW3) return null;
    return extractPowerWall3KW(formData.inverter_model);
  }, [isPW3, formData.inverter_model]);

  // PowerWall Detection (any PowerWall model)
  const isPowerWall = useMemo(() => {
    return isTeslaPowerWall(formData.inverter_make, formData.inverter_model);
  }, [formData.inverter_make, formData.inverter_model]);

  // SolarEdge Multi-kW Detection
  const isSolarEdgeKW = useMemo(() => {
    return isSolarEdgeWithKWOptions(formData.inverter_make, formData.inverter_model, models);
  }, [formData.inverter_make, formData.inverter_model, models]);

  // Extract current SolarEdge part number and setting
  const currentSEPartNumber = useMemo(() => {
    if (!isSolarEdgeKW) return null;
    return extractSolarEdgePartNumber(formData.inverter_model) || formData.inverter_model;
  }, [isSolarEdgeKW, formData.inverter_model]);

  const currentSESetting = useMemo(() => {
    if (!isSolarEdgeKW) return null;
    return extractSolarEdgeSetting(formData.inverter_model);
  }, [isSolarEdgeKW, formData.inverter_model]);

  // Get available kW options for current SolarEdge part number
  const solarEdgeKWOptions = useMemo(() => {
    if (!currentSEPartNumber) return [];
    return getSolarEdgeKWOptions(models, currentSEPartNumber);
  }, [models, currentSEPartNumber]);

  // Gateway Configuration visibility
  const showGatewayConfig = useMemo(() => {
    const gateway = formData.gateway || '';
    return isPowerWall && (gateway === 'Backup Gateway 2' || gateway === 'Gateway 3');
  }, [isPowerWall, formData.gateway]);

  // Load manufacturers on mount and when system_type changes
  // Support both sys1_system_type (from DB) and system_type (local state)
  const systemTypeValue = formData.sys1_system_type || formData.system_type;

  useEffect(() => {
    logger.log('InverterMfg', '🔄 useEffect triggered - system_type changed to:', systemTypeValue, {
      sys1_system_type: formData.sys1_system_type,
      system_type: formData.system_type
    });

    // Clear manufacturers when system type changes to force fresh load
    setManufacturers([]);

    loadManufacturers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemTypeValue]);

  // Fetch NEC 690.7 Temperature Correction Factor from API based on ZIP code
  useEffect(() => {
    if (!siteZipCode) {
      setCorrectionFactor(null);
      return;
    }

    const fetchCorrectionFactor = async () => {
      try {
        const response = await axios.get(`/api/weather/correction-factor/${siteZipCode}`);
        const factor = parseFloat(response.data.correction_factor);
        setCorrectionFactor(factor);
        logger.log('NEC690.7', `✅ Correction factor for ZIP ${siteZipCode}: ${factor}`, response.data);
      } catch (error) {
        logger.error('NEC690.7', `❌ Failed to fetch correction factor for ZIP ${siteZipCode}:`, error);
        setCorrectionFactor(null);
      }
    };

    fetchCorrectionFactor();
  }, [siteZipCode]);

  // Set default New/Existing toggle to New on mount if equipment is configured but toggle not set
  useEffect(() => {
    const hasInverter = formData.inverter_make || formData.inverter_model;
    // Use == null to catch both undefined AND null
    if (hasInverter && formData.inverter_existing == null) {
      onChange('inverter_existing', false, systemNumber); // Default to New
    }
  }, [formData.inverter_make, formData.inverter_model, formData.inverter_existing, onChange]);

  // Load models when manufacturer or system_type changes
  useEffect(() => {
    logger.debug('Equipment', `🔄 Manufacturer or system_type changed: ${formData.inverter_make}, ${formData.system_type}`);
    if (formData.inverter_make) {
      logger.debug('Equipment', `📞 Calling loadModels for: ${formData.inverter_make}`);
      loadModels(formData.inverter_make);
    } else {
      logger.debug('Equipment', `❌ No manufacturer, clearing models`);
      setModels([]);
      setSelectedModelData(null);
      // Reset auto-population tracking when manufacturer is cleared
      hasAutoPopulatedRef.current = false;
      lastProcessedModelRef.current = null;
    }
  }, [formData.inverter_make, formData.system_type]);

  // Check if optimizers should be shown
  useEffect(() => {
    const supportsOptimizers = manufacturerSupportsOptimizers(formData.inverter_make);
    const hasOptimizerData = formData.optimizer_make || formData.optimizer_model;
    const isOptimizerSystemType = formData.system_type === 'optimizer';

    logger.debug('Equipment', `🔍 Optimizer visibility check - inverter_make: ${formData.inverter_make}`);
    logger.debug('Equipment', `🔍 supportsOptimizers: ${supportsOptimizers}, hasOptimizerData: ${hasOptimizerData}, system_type: ${formData.system_type}`);

    if (supportsOptimizers || hasOptimizerData || isOptimizerSystemType) {
      logger.debug('Equipment', `✅ Showing optimizer section`);
      setShowOptimizers(true);
      if ((supportsOptimizers || isOptimizerSystemType) && !loadingOptimizerMakes && optimizerManufacturers.length === 0) {
        logger.debug('Equipment', `📞 Loading optimizer manufacturers...`);
        loadOptimizerManufacturers();
      } else {
        logger.debug('Equipment', `ℹ️ Optimizer manufacturers already loaded or loading. Count: ${optimizerManufacturers.length}`);
      }
    } else {
      logger.debug('Equipment', `❌ Hiding optimizer section`);
      setShowOptimizers(false);
    }
  }, [formData.inverter_make, formData.optimizer_make, formData.optimizer_model, formData.system_type]);

  // Set default New/Existing toggle for optimizer to New on mount if configured but toggle not set
  useEffect(() => {
    const hasOptimizer = formData.optimizer_make || formData.optimizer_model;
    // Use == null to catch both undefined AND null
    if (hasOptimizer && formData.optimizer_existing == null) {
      onChange('optimizer_existing', false, systemNumber); // Default to New
    }
  }, [formData.optimizer_make, formData.optimizer_model, formData.optimizer_existing, onChange]);

  // Set default New/Existing toggle for Type 2 optimizer to New (existing=false) on mount if configured but toggle not set
  useEffect(() => {
    const hasOptimizerType2 = formData.optimizer_type2_make || formData.optimizer_type2_model;
    // Use == null to catch both undefined AND null
    if (hasOptimizerType2 && formData.optimizer_type2_existing == null) {
      onChange('optimizer_type2_existing', false, systemNumber); // Default to New (existing=false)
    }
  }, [formData.optimizer_type2_make, formData.optimizer_type2_model, formData.optimizer_type2_existing, onChange]);

  // Load optimizer models when optimizer manufacturer changes
  useEffect(() => {
    if (formData.optimizer_make) {
      loadOptimizerModelsData(formData.optimizer_make);
    } else {
      setOptimizerModels([]);
    }
  }, [formData.optimizer_make]);

  // Load Type 2 optimizer manufacturers when second panel type is enabled and optimizers are supported
  useEffect(() => {
    if (showOptimizers && formData.show_solar_panel_2) {
      if (!loadingOptimizerType2Makes && optimizerType2Manufacturers.length === 0) {
        loadOptimizerType2Manufacturers();
      }
    }
  }, [showOptimizers, formData.show_solar_panel_2]);

  // Load Type 2 optimizer models when Type 2 optimizer manufacturer changes
  useEffect(() => {
    if (formData.optimizer_type2_make) {
      loadOptimizerType2ModelsData(formData.optimizer_type2_make);
    } else {
      setOptimizerType2Models([]);
    }
  }, [formData.optimizer_type2_make]);

  // Auto-set show_solar_panel_2 flag when Type 2 data is detected
  useEffect(() => {
    const solarPanelQty2 = parseInt(formData.solar_panel_type2_quantity) || 0;
    const hasSolarPanel2Data = !!(
      formData.solar_panel_type2_manufacturer ||
      formData.solar_panel_type2_model ||
      solarPanelQty2 > 0
    );

    // Auto-enable flag if Type 2 has data
    if (hasSolarPanel2Data && !formData.show_solar_panel_2) {
      onChange('show_solar_panel_2', true, systemNumber);
    }
    // Note: Removed auto-disable - it reset show_solar_panel_2 to false when Type 2
    // had no data, which fought the user toggle click (section opens empty before data entry)
  }, [
    formData.solar_panel_type2_manufacturer,
    formData.solar_panel_type2_model,
    formData.solar_panel_type2_quantity,
    formData.show_solar_panel_2,
  ]);

  // Auto-sync inverter quantity based on type
  // - String inverters: Always qty = 1
  // - Microinverters (non-Hoymiles/APSystems): qty = solar panel count (1:1 ratio)
  // - Hoymiles/APSystems microinverters: Manual entry (2:1, 4:1 ratios)
  useEffect(() => {
    const inverterType = formData.inverter_type;
    const inverterMake = formData.inverter_make;
    const solarPanelQty = parseInt(formData.solar_panel_quantity) || 0;
    const currentQty = parseInt(formData.inverter_qty) || 0;

    // Skip if no inverter is selected yet
    if (!formData.inverter_make || !formData.inverter_model) {
      return;
    }

    // String inverters: Always set qty to 1
    if (
      inverterType === 'inverter' ||
      (inverterType && inverterType !== 'microinverter')
    ) {
      if (currentQty !== 1) {
        onChange('inverter_qty', 1, systemNumber);
        logger.log('InverterMicroSection', `Auto-set string inverter qty to 1 (System ${systemNumber})`);
      }
      return;
    }

    // Microinverters: Auto-sync with panel count (except Hoymiles/APSystems)
    if (inverterType === 'microinverter') {
      // Skip for Hoymiles/APSystems - they have variable ratios (2:1, 4:1)
      const isDualQtyManufacturer =
        inverterMake === 'Hoymiles' ||
        inverterMake === 'Hoymiles Power' ||
        inverterMake === 'APSystems';

      if (isDualQtyManufacturer) {
        return;
      }

      // For standard microinverters (Enphase, etc.), qty = solar panel count
      // Only update if different to avoid unnecessary saves
      if (currentQty !== solarPanelQty) {
        onChange('inverter_qty', solarPanelQty, systemNumber);
        logger.log(
          'InverterMicroSection',
          `Auto-synced microinverter qty to ${solarPanelQty} (matches solar panel count) (System ${systemNumber})`,
        );
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.solar_panel_quantity,
    formData.inverter_type,
    formData.inverter_make,
    formData.inverter_model,
  ]);

  const loadManufacturers = async () => {
    setLoadingMakes(true);
    try {
      // Filter manufacturers based on system_type
      // Support both sys1_system_type (from DB) and system_type (local state)
      const systemType = formData.sys1_system_type || formData.system_type;
      let equipmentTypeFilter = null;

      if (systemType === 'microinverter') {
        equipmentTypeFilter = 'microinverter';
      } else if (systemType === 'inverter' || systemType === 'optimizer') {
        equipmentTypeFilter = 'inverter';
      }

      logger.log('InverterMfg', `🔍 Loading manufacturers with filter:`, {
        systemType,
        equipmentTypeFilter,
        sys1_system_type: formData.sys1_system_type,
        system_type: formData.system_type
      });

      const response = await getInverterManufacturers(equipmentTypeFilter);

      logger.log('InverterMfg', `✅ Received manufacturers:`, {
        count: response.data?.length || 0,
        filter: equipmentTypeFilter || 'none',
        manufacturers: response.data?.slice(0, 5) // Show first 5
      });

      setManufacturers(response.data || []);
    } catch (error) {
      logger.error('Equipment', 'Failed to load inverter manufacturers:', error);
    } finally {
      setLoadingMakes(false);
    }
  };

  const loadModels = async (manufacturer) => {
    logger.debug('Equipment', `🚀 loadModels CALLED for manufacturer: ${manufacturer}`);
    setLoadingModels(true);
    try {
      logger.debug('Equipment', `📡 About to call getInverterModels for: ${manufacturer}`);
      const response = await getInverterModels(manufacturer);
      let modelsData = response.data || [];
      logger.debug('Equipment', `✅ Received ${modelsData.length} models from API`);

      // Filter models based on system_type
      const systemType = formData.system_type;
      if (systemType === 'microinverter') {
        // Only show microinverters
        modelsData = modelsData.filter(m =>
          m.microinverter === true ||
          m.equipment_type?.toLowerCase().includes('micro') ||
          m.equipment_type?.toLowerCase() === 'microinverter'
        );
        logger.debug('Equipment', `🔍 Filtered to ${modelsData.length} microinverter models`);
      } else if (systemType === 'inverter' || systemType === 'optimizer') {
        // Only show string inverters (not microinverters)
        modelsData = modelsData.filter(m =>
          m.microinverter !== true &&
          !m.equipment_type?.toLowerCase().includes('micro') &&
          m.equipment_type?.toLowerCase() !== 'microinverter'
        );
        logger.debug('Equipment', `🔍 Filtered to ${modelsData.length} string inverter models`);
      }

      setModels(modelsData);

      // If current model is selected, find its data
      if (formData.inverter_model && lastProcessedModelRef.current !== formData.inverter_model) {
        const modelData = modelsData.find(m => m.model_number === formData.inverter_model);
        if (modelData && !hasAutoPopulatedRef.current) {
          // Mark as processed to prevent duplicate calls
          hasAutoPopulatedRef.current = true;
          lastProcessedModelRef.current = formData.inverter_model;

          setSelectedModelData(modelData);

          const updates = buildInverterFieldUpdates(modelData);
          updates.push(['inverter_existing', formData.inverter_existing ?? false]);

          if (onBatchChange) {
            onBatchChange(updates, systemNumber);
          } else {
            updates.forEach(([field, val]) => onChange(field, val, systemNumber));
          }
        }
      }
    } catch (error) {
      logger.error('Equipment', 'Failed to load inverter models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const loadOptimizerManufacturers = async () => {
    setLoadingOptimizerMakes(true);
    try {
      const response = await getOptimizerManufacturers();
      setOptimizerManufacturers(response.data || []);
    } catch (error) {
      logger.error('Equipment', 'Failed to load optimizer manufacturers:', error);
    } finally {
      setLoadingOptimizerMakes(false);
    }
  };

  const loadOptimizerModelsData = async (manufacturer) => {
    setLoadingOptimizerModels(true);
    try {
      const response = await getOptimizerModels(manufacturer);
      const models = response.data || [];
      setOptimizerModels(models);
    } catch (error) {
      logger.error('Equipment', 'Failed to load optimizer models:', error);
      setOptimizerModels([]);
    } finally {
      setLoadingOptimizerModels(false);
    }
  };

  const loadOptimizerType2Manufacturers = async () => {
    setLoadingOptimizerType2Makes(true);
    try {
      const response = await getOptimizerManufacturers();
      setOptimizerType2Manufacturers(response.data || []);
    } catch (error) {
      logger.error('Equipment', 'Failed to load Type 2 optimizer manufacturers:', error);
    } finally {
      setLoadingOptimizerType2Makes(false);
    }
  };

  const loadOptimizerType2ModelsData = async (manufacturer) => {
    setLoadingOptimizerType2Models(true);
    try {
      const response = await getOptimizerModels(manufacturer);
      const models = response.data || [];
      setOptimizerType2Models(models);
    } catch (error) {
      logger.error('Equipment', 'Failed to load Type 2 optimizer models:', error);
      setOptimizerType2Models([]);
    } finally {
      setLoadingOptimizerType2Models(false);
    }
  };

  // Wrapper to save toggle defaults when any field changes
  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value, systemNumber);

    // Also save New/Existing toggle default if not already set
    // Use == null to catch both undefined AND null
    if ((fieldName === 'inverter_make' || fieldName === 'inverter_model') && value && formData.inverter_existing == null) {
      onChange('inverter_existing', false, systemNumber);
    }
  };

  // Wrapper for optimizer fields
  const handleOptimizerFieldChange = (fieldName, value) => {
    // Use == null to catch both undefined AND null
    if (onBatchChange && formData.optimizer_existing == null) {
      onBatchChange([[fieldName, value], ['optimizer_existing', false]], systemNumber);
    } else {
      onChange(fieldName, value, systemNumber);
      // Also save New/Existing toggle default if not already set
      // Use == null to catch both undefined AND null
      if (formData.optimizer_existing == null) {
        onChange('optimizer_existing', false, systemNumber);
      }
    }
  };

  // Wrapper for Type 2 optimizer fields
  const handleOptimizerType2FieldChange = (fieldName, value) => {
    // Use == null to catch both undefined AND null
    if (onBatchChange && formData.optimizer_type2_existing == null) {
      onBatchChange([[fieldName, value], ['optimizer_type2_existing', false]], systemNumber);
    } else {
      onChange(fieldName, value, systemNumber);
      // Also save New/Existing toggle default if not already set
      // Use == null to catch both undefined AND null
      if (formData.optimizer_type2_existing == null) {
        onChange('optimizer_type2_existing', false, systemNumber);
      }
    }
  };

  /**
   * Handle SolarEdge kW button click
   * Updates inverter_model combined value + separate DB fields + specs from matching variant
   */
  const handleSolarEdgeKWChange = (setting) => {
    if (!currentSEPartNumber) return;

    const combinedModel = buildSolarEdgeModelNumber(currentSEPartNumber, setting);

    // Find the matching model variant for this setting
    const matchedOption = solarEdgeKWOptions.find(o => o.value === setting);
    const modelData = matchedOption?.modelData;

    const updates = [
      ['inverter_model', combinedModel],
      ['solaredge_partnumber', currentSEPartNumber],
      ['solaredge_setting', setting],
    ];

    // Update specs from the matched variant
    if (modelData) {
      setSelectedModelData(modelData);
      updates.push(['inverter_max_cont_output_amps', modelData.max_cont_output_amps || '']);
      if (modelData.id) {
        updates.push(['inverter_model_id', modelData.id]);
      }
    }

    if (onBatchChange) {
      onBatchChange(updates, systemNumber);
    } else {
      updates.forEach(([field, value]) => onChange(field, value, systemNumber));
    }
  };

  const handleManufacturerChange = (value) => {
    // Reset auto-population tracking when manufacturer changes
    hasAutoPopulatedRef.current = false;
    lastProcessedModelRef.current = null;

    if (onBatchChange) {
      const updates = [
        ['inverter_make', value],
        ['inverter_model', ''],
        ['inverter_type', ''],
        ['inverter_max_cont_output_amps', ''],
        ['inverter_model_id', ''],
        ['solaredge_partnumber', ''],
        ['solaredge_setting', ''],
        // ALWAYS include toggle - use existing value or default to true (nullish coalescing)
        ['inverter_existing', formData.inverter_existing ?? false],
      ];

      onBatchChange(updates, systemNumber);
    } else {
      handleFieldChange('inverter_make', value);
      // Clear model when manufacturer changes
      onChange('inverter_model', '', systemNumber);
      onChange('inverter_type', '', systemNumber);
      onChange('inverter_max_cont_output_amps', '', systemNumber);
      onChange('inverter_model_id', '', systemNumber);
      onChange('solaredge_partnumber', '', systemNumber);
      onChange('solaredge_setting', '', systemNumber);
    }
  };

  // Use the section delete hook with CLEAR_ONLY behavior (Inverter can never be removed - Battery Only mode exists as alternative)
  const {
    showClearModal,
    showRemoveModal,
    handleTrashClick,
    handleClearConfirm,
    handleRemoveConfirm,
    closeClearModal,
    closeRemoveModal,
  } = useSectionDelete({
    sectionName: 'inverter',
    formData,
    onChange,
    behavior: DELETE_BEHAVIOR.CLEAR_ONLY,
    visibilityFlag: null, // No visibility flag - section always visible
  });

  // Legacy handleDelete removed - now using useSectionDelete hook

  // Shared helper: builds the complete field update array from model data.
  // All three selection paths (auto-populate, PW3, regular) use this to stay in sync.
  const buildInverterFieldUpdates = (modelData) => {
    const isMicro = modelData.microinverter === true ||
      modelData.equipment_type?.toLowerCase().includes('micro') ||
      modelData.equipment_type?.toLowerCase() === 'microinverter';

    const updates = [
      ['inverter_type', isMicro ? 'microinverter' : 'inverter'],
      ['inverter_max_cont_output_amps', modelData.max_cont_output_amps || ''],
      ['inverter_max_strings_branches', !isMicro && modelData.max_strings_branches ? modelData.max_strings_branches : null],
      ['inverter_max_vdc', modelData.max_dc_voltage || modelData.max_vdc || modelData.voltage_maximum || ''],
      ['inverter_mppt_voltage_max', modelData.voltage_maximum || modelData.mppt_voltage_max || ''],
      ['inverter_min_vdc', modelData.voltage_minimum || modelData.min_vdc || ''],
      ['inverter_max_input_isc', modelData.max_input_isc || modelData.max_isc_per_input || ''],
    ];

    if (modelData.id) {
      updates.push(['inverter_model_id', modelData.id]);
    }

    return updates;
  };

  const handleModelChange = (value) => {
    // Special handling for PowerWall 3
    if (value === 'Powerwall 3' || isPowerWall3(value)) {
      // If no kW rating exists, initialize with default 11.5 kW
      const currentKW = extractPowerWall3KW(formData.inverter_model);
      const modelWithKW = currentKW
        ? formData.inverter_model
        : updatePowerWall3ModelWithKW('Powerwall 3', '11.5');

      handleFieldChange('inverter_model', modelWithKW);

      // Find any PowerWall 3 model data (they all have same specs except kW)
      const modelData = models.find(m => isPowerWall3(m.model_number));
      console.log('🔋 [PowerWall 3] Special handler triggered:', {
        value,
        modelWithKW,
        foundModelData: !!modelData,
        max_strings_branches: modelData?.max_strings_branches
      });

      if (modelData) {
        setSelectedModelData(modelData);
        const updates = buildInverterFieldUpdates(modelData);
        updates.push(['inverter_existing', formData.inverter_existing ?? false]);
        if (onBatchChange) {
          onBatchChange(updates, systemNumber);
        } else {
          updates.forEach(([field, val]) => onChange(field, val, systemNumber));
        }
      }
      return;
    }

    handleFieldChange('inverter_model', value);

    // Find model data and update related fields
    const modelData = models.find(m => m.model_number === value);
    if (modelData) {
      console.log('🔧 [InverterMicroSection] Model selected:', {
        model: value,
        modelData: modelData,
        max_strings_branches: modelData.max_strings_branches,
        microinverter: modelData.microinverter,
        equipment_type: modelData.equipment_type
      });

      setSelectedModelData(modelData);

      const updates = buildInverterFieldUpdates(modelData);
      updates.push(['inverter_existing', formData.inverter_existing ?? false]);

      if (onBatchChange) {
        onBatchChange(updates, systemNumber);
      } else {
        updates.forEach(([field, val]) => onChange(field, val, systemNumber));
      }
    }
  };

  // Check if we have inverter configured
  const hasInverter = formData.inverter_make && formData.inverter_model;

  // ============================================
  // STRINGING LOGIC
  // ============================================

  // Get solar panel data
  const solarPanelQty = parseInt(formData.solar_panel_quantity) || 0;
  const solarPanelQty2 = parseInt(formData.solar_panel_type2_quantity) || 0;
  const totalPanelQty = solarPanelQty + solarPanelQty2;
  const isBatteryOnly = formData.batteryonly === true;

  // Check if Solar Panel Type 2 has data
  const hasSolarPanel2Data = !!(
    formData.solar_panel_type2_manufacturer ||
    formData.solar_panel_type2_model ||
    solarPanelQty2 > 0
  );

  // Get stringing type (force custom if Type 2 is active)
  const stringingType = hasSolarPanel2Data ? 'custom' : (formData.stringing_type || 'auto');

  // Determine inverter type
  const inverterType = formData.inverter_type || 'string'; // Default to string
  const isMicroinverter = inverterType === 'microinverter';

  // Get inverter electrical specs - DERIVE FROM MODEL DATA, NOT FORMDATA
  // These specs don't exist in DB (sys1_inv_max_vdc, sys1_inv_min_vdc don't exist)
  // Same issue as maxBranches - values get lost on DB round-trip
  const inverterSpecs = useMemo(() => {
    // Try selectedModelData first (set on model selection)
    let modelData = selectedModelData || models.find(m => m.model_number === formData.inverter_model);
    // PW3 fuzzy match: formData stores "Powerwall 3 (11.5kW)" but models array has "Powerwall 3"
    if (!modelData && isPowerWall3(formData.inverter_model)) {
      modelData = models.find(m => isPowerWall3(m.model_number));
    }

    if (!modelData) {
      return {
        maxVdc: 0,
        minVdc: 0,
        maxIsc: 0,
        maxContOutput: 0,
        mpptVoltageMax: 0,
        mpptVoltageMin: 0,
        maxDcVoltage: 0,
        numMppts: 0,
        stringSizingMethod: '',
      };
    }

    return {
      // Hard ceiling: absolute max DC voltage (e.g. 600V for PW3)
      maxVdc: parseFloat(modelData.max_dc_voltage || modelData.max_vdc || modelData.voltage_maximum || 0),
      minVdc: parseFloat(modelData.voltage_minimum || modelData.min_vdc || 0),
      maxIsc: parseFloat(modelData.max_input_isc_1 || modelData.max_input_isc || modelData.max_isc_per_input || 0),
      maxContOutput: parseFloat(modelData.max_cont_output_amps || 0),
      // MPPT optimal operating range (e.g. 480V for PW3 — use voltage_maximum which stores this)
      mpptVoltageMax: parseFloat(modelData.voltage_maximum || modelData.mppt_voltage_max || 0),
      mpptVoltageMin: parseFloat(modelData.mppt_voltage_min || modelData.voltage_minimum || 0),
      maxDcVoltage: parseFloat(modelData.max_dc_voltage || 0),
      numMppts: parseInt(modelData.num_mppts || 0, 10),
      stringSizingMethod: modelData.string_sizing_method || '',
    };
  }, [selectedModelData, models, formData.inverter_model]);

  const {
    maxVdc: inverterMaxVdc,
    minVdc: inverterMinVdc,
    maxIsc: inverterMaxIsc,
    mpptVoltageMax: inverterMpptVoltageMax,
    mpptVoltageMin: inverterMpptVoltageMin,
    maxDcVoltage: inverterMaxDcVoltage,
    numMppts: inverterNumMppts,
    stringSizingMethod: inverterStringSizingMethod,
  } = inverterSpecs;

  // Get solar panel electrical specs
  // TODO: Check if solar_panel_voc/isc exist in DB (sys1_solar_panel_voc, sys1_solar_panel_isc)
  // If not, these will also need to be derived from panel model data
  const panelVoc = parseFloat(formData.solar_panel_voc) || 0;
  const panelIsc = parseFloat(formData.solar_panel_isc) || 0;

  // Determine if stringing should be shown
  // Only show stringing in InverterMicroSection for STRING INVERTERS
  // Microinverter stringing is now in StringCombinerPanelSection
  const shouldShowStringing = !!(
    hasInverter &&
    totalPanelQty > 0 &&
    !isBatteryOnly &&
    !isMicroinverter
  );

  // Max branches/strings for string inverters - READ FROM MODEL DATA, NOT FORMDATA
  // This is a local-only derived value from the selected model specs
  // DO NOT store in formData as sys1_inv_max_strings_branches doesn't exist in DB
  const maxBranches = useMemo(() => {
    // First try: selectedModelData in local state (set when model is chosen)
    if (selectedModelData?.max_strings_branches) {
      return parseInt(selectedModelData.max_strings_branches, 10) || 10;
    }
    // Second try: find current model in models array (exact match first)
    let currentModel = models.find(m => m.model_number === formData.inverter_model);
    // For PowerWall 3, formData stores kW-suffixed name (e.g. "Powerwall 3 (11.5kW)")
    // but models array has base model_number "Powerwall 3" — exact match fails, use isPowerWall3 fallback
    if (!currentModel && isPowerWall3(formData.inverter_model)) {
      currentModel = models.find(m => isPowerWall3(m.model_number));
    }
    if (currentModel?.max_strings_branches) {
      return parseInt(currentModel.max_strings_branches, 10) || 10;
    }
    // Fallback
    return 10;
  }, [selectedModelData, models, formData.inverter_model]);

  // NEC 690.7 corrected Voc (shared across all panel-count calculations)
  const vocCorrected = panelVoc > 0 ? panelVoc * (correctionFactor || 1.18) : 0;

  // Hard ceiling: absolute max DC panels per string (e.g. 600V / corrected Voc)
  const maxPanelsPerBranch = useMemo(() => {
    if (vocCorrected <= 0) return 20;
    const hardMax = inverterMaxVdc > 0 ? inverterMaxVdc : 600;
    return Math.floor(hardMax / vocCorrected);
  }, [vocCorrected, inverterMaxVdc]);

  // Optimal ceiling: MPPT range max panels per string (e.g. 480V / corrected Voc)
  // Auto-distribute targets this for best efficiency; manual mode allows up to hard ceiling
  const optimalPanelsPerBranch = useMemo(() => {
    if (vocCorrected <= 0) return maxPanelsPerBranch;
    if (inverterMpptVoltageMax > 0) return Math.floor(inverterMpptVoltageMax / vocCorrected);
    return maxPanelsPerBranch;
  }, [vocCorrected, inverterMpptVoltageMax, maxPanelsPerBranch]);

  // Calculate total panels assigned across all strings (for string inverters only)
  const totalPanelsAssigned = useMemo(() => {
    let total = 0;
    // String inverters: branch_string_X now stores panels per string (strings is fixed to 1)
    for (let i = 1; i <= 10; i++) {
      const panelsPerString = parseInt(formData[`branch_string_${i}`]) || 0;
      total += panelsPerString; // Always 1 string per input, so just add panels
    }
    return total;
  }, [formData]);

  const panelsRemaining = totalPanelQty - totalPanelsAssigned;

  // NEC 690.7 corrected Voc for Type 2 panel
  const panelVoc2 = parseFloat(formData.solar_panel_type2_voc) || 0;
  const vocCorrected2 = panelVoc2 > 0 ? panelVoc2 * (correctionFactor || 1.18) : 0;

  // Three-tier voltage limits for string validation (NEC 690.7 compliant)
  // Includes per-type hard limits for Type 1 and Type 2
  const voltageLimits = useMemo(() => {
    const hardMax = inverterMaxVdc > 0 ? inverterMaxVdc : 600;

    return {
      vocCorrected,
      hardMax,
      // Type 1 hard ceiling
      maxPanelsHard: vocCorrected > 0 ? Math.floor(hardMax / vocCorrected) : 20,
      // Type 2 hard ceiling (uses Type 2 Voc if available, falls back to Type 1)
      maxPanelsHard2: vocCorrected2 > 0 ? Math.floor(hardMax / vocCorrected2) : (vocCorrected > 0 ? Math.floor(hardMax / vocCorrected) : 20),
    };
  }, [vocCorrected, vocCorrected2, inverterMaxVdc]);

  // Stringing event handlers (for string inverters only)
  const handleStringingTypeChange = (type) => {
    onChange('stringing_type', type, systemNumber);

    // Clear all string data when switching to auto
    if (type === 'auto') {
      for (let i = 1; i <= 10; i++) {
        onChange(`branch_string_${i}`, '', systemNumber);
        onChange(`branch_string_${i}_panel_type`, '', systemNumber);
      }
    }
  };

  const handleBranchStringChange = (index, value) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    const parsed = parseInt(numericValue, 10);

    // HARD CLAMP: Never allow more panels than NEC 690.7 withstand limit
    // Use per-type ceiling: Type 2 strings use Type 2 Voc, otherwise Type 1
    if (!isNaN(parsed)) {
      const panelType = formData[`branch_string_${index}_panel_type`];
      const hardCap = panelType === '2' ? voltageLimits.maxPanelsHard2 : voltageLimits.maxPanelsHard;
      if (parsed > hardCap) {
        onChange(`branch_string_${index}`, String(hardCap), systemNumber);
        return;
      }
    }

    onChange(`branch_string_${index}`, numericValue, systemNumber);
  };

  const handleBranchPanelTypeChange = (index, panelType) => {
    // Store which panel type this string uses (1 or 2)
    onChange(`branch_string_${index}_panel_type`, panelType, systemNumber);
  };

  // Auto-calculate function (for string inverters only)
  const handleAutoCalculate = () => {
    if (totalPanelQty <= 0) return;

    console.log('🌡️ [AUTO-CALC DEBUG]', {
      panelVoc,
      correctionFactor: correctionFactor || 'fallback (1.18)',
      vocCorrected,
      inverterMaxVdc,
      inverterMpptVoltageMax,
      maxPanelsPerBranch,
      optimalPanelsPerBranch,
    });

    // String inverters auto-distribution — targets MPPT range (optimalPanelsPerBranch) for efficiency
    const distribution = calculateInverterInputDistribution({
      totalPanels: totalPanelQty,
      maxInputs: maxBranches,
      maxPanelsPerString: optimalPanelsPerBranch,
      panelVoc,
      panelIsc,
      inverterMaxVdc: inverterMpptVoltageMax || inverterMaxVdc,
      inverterMinVdc,
      inverterMaxIsc,
      inverterMpptVoltageMax,
      inverterMpptVoltageMin,
      correctionFactor,
    });

    if (!distribution || !distribution.strings) return;

    // Clear all strings first
    for (let i = 1; i <= 10; i++) {
      onChange(`branch_string_${i}`, '', systemNumber);
    }

    // Populate with calculated values
    // branch_string_X now stores panels per string directly (strings is fixed to 1)
    distribution.strings.forEach((string, idx) => {
      const i = idx + 1;
      // Store only panels per string (numStrings should always be 1)
      onChange(`branch_string_${i}`, String(string.panelsPerString || 0), systemNumber);
    });

    // Log warnings if any validation issues
    if (distribution.warnings && distribution.warnings.length > 0) {
      console.warn('⚠️ [Auto-Calculate] Validation warnings:', distribution.warnings);
      distribution.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  };

  // Preferred equipment handlers
  const handlePreferredSelect = (selected) => {
    // Reset auto-population tracking so loadModels will re-process
    hasAutoPopulatedRef.current = false;
    lastProcessedModelRef.current = null;

    // Set manufacturer and model — loadModels useEffect will auto-populate specs
    onChange('inverter_make', selected.make, systemNumber);
    onChange('inverter_model', selected.model, systemNumber);
  };

  const handleSelectOther = () => {
    // Clear selection to force user to choose from dropdowns
    onChange('inverter_make', '', systemNumber);
    onChange('inverter_model', '', systemNumber);
  };

  const handleOptimizerPreferredSelect = (selected) => {
    handleOptimizerFieldChange('optimizer_make', selected.make);
    handleOptimizerFieldChange('optimizer_model', selected.model);
  };

  const handleOptimizerSelectOther = () => {
    // Clear selection to force user to choose from dropdowns
    onChange('optimizer_make', '', systemNumber);
    onChange('optimizer_model', '', systemNumber);
  };

  const handleOptimizerType2PreferredSelect = (selected) => {
    handleOptimizerType2FieldChange('optimizer_type2_make', selected.make);
    handleOptimizerType2FieldChange('optimizer_type2_model', selected.model);
  };

  const handleOptimizerType2SelectOther = () => {
    // Clear selection to force user to choose from dropdowns
    onChange('optimizer_type2_make', '', systemNumber);
    onChange('optimizer_type2_model', '', systemNumber);
  };

  // Dynamic title based on system_type (preferred) or inverter type (fallback)
  const getSectionTitle = () => {
    // Use system_type if set
    if (formData.system_type === 'microinverter') {
      return 'Microinverter';
    } else if (formData.system_type === 'inverter' || formData.system_type === 'optimizer') {
      return 'Inverter';
    }

    // Fallback to existing logic if system_type not set
    if (!hasInverter) return 'Micro/Inverter';
    return isMicroinverter ? 'Microinverter' : 'Inverter';
  };

  // Build comprehensive subtitle with all selections
  const getSubtitle = () => {
    if (!hasInverter) return '';

    const parts = [];

    // Quantity - For microinverters, use solar panel qty (1:1 ratio for most brands)
    // For string inverters, quantity is always 1
    let quantity = 1;
    if (isMicroinverter) {
      // Get total panel quantity for microinverters
      const solarPanelQty = parseInt(formData.solar_panel_quantity) || 0;
      const solarPanelQty2 = parseInt(formData.solar_panel_type2_quantity) || 0;
      quantity = solarPanelQty + solarPanelQty2;
    }

    // Quantity with New/Existing indicator
    if (quantity > 0) {
      const statusLetter = formData.inverter_existing !== true ? 'N' : 'E';
      parts.push(`${quantity} (${statusLetter})`);
    }

    // Make and Model
    parts.push(`${formData.inverter_make} ${formData.inverter_model}`);

    // Gateway type for Tesla PowerWall
    if (isPowerWall && formData.gateway) {
      parts.push(`- ${formData.gateway}`);
    }

    // Custom stringing summary — each string on its own indented row
    if (!isMicroinverter && stringingType === 'custom') {
      const type1Rows = [];
      const type2Rows = [];
      const ungroupedRows = [];

      for (let i = 1; i <= maxBranches; i++) {
        const panels = parseInt(formData[`branch_string_${i}`]) || 0;
        if (panels > 0) {
          const panelType = formData[`branch_string_${i}_panel_type`];
          const row = <div key={i} style={{ paddingLeft: '8px' }}>String {i} - {panels} panels</div>;
          if (panelType === '1') type1Rows.push(row);
          else if (panelType === '2') type2Rows.push(row);
          else ungroupedRows.push(row);
        }
      }

      const hasGroups = type1Rows.length > 0 || type2Rows.length > 0;

      if (hasGroups || ungroupedRows.length > 0) {
        return (
          <>
            <div>{parts.join(' ')}</div>
            {hasGroups ? (
              <>
                {type1Rows.length > 0 && (
                  <>
                    <div style={{ paddingTop: '2px' }}>Type 1</div>
                    {type1Rows}
                  </>
                )}
                {type2Rows.length > 0 && (
                  <>
                    <div style={{ paddingTop: '2px' }}>Type 2</div>
                    {type2Rows}
                  </>
                )}
              </>
            ) : ungroupedRows}
          </>
        );
      }
    }

    return parts.join(' ');
  };

  // Deduplicate PowerWall 3 models - show only "Powerwall 3" once
  // Deduplicate PowerWall 3 AND SolarEdge multi-kW models
  const deduplicatedModels = useMemo(() => {
    const seen = new Set();

    // First pass: deduplicate SolarEdge multi-kW models
    let result = deduplicateSolarEdgeModels(models);

    // Second pass: deduplicate PowerWall 3 models
    result = result.filter(model => {
      const modelNumber = model.model_number || '';

      if (isPowerWall3(modelNumber)) {
        if (seen.has('powerwall_3')) {
          return false;
        }
        seen.add('powerwall_3');
        // Don't mutate state - display_name will be handled in options mapping
        return true;
      }

      return true;
    });

    return result;
  }, [models]);

  // Determine section rendering order based on system_type
  const isOptimizerFirst = formData.system_type === 'optimizer';

  return (
    <div className={componentStyles.sectionWrapper}>
      {/* Render Optimizer first when system_type is 'optimizer' */}
      {isOptimizerFirst && showOptimizers && (
        <div className={componentStyles.optimizerSection}>
          <EquipmentRow
            title="Optimizer"
            titleSubline={formData.show_solar_panel_2 ? "(Type 1)" : undefined}
            subtitle={
              formData.optimizer_make && formData.optimizer_model
                ? (() => {
                    const parts = [];
                    // Quantity with N/E indicator - For optimizers, typically 1:1 with solar panels
                    const solarPanelQty = parseInt(formData.solar_panel_quantity) || 0;
                    const quantity = formData.show_solar_panel_2 ? solarPanelQty : (solarPanelQty + (parseInt(formData.solar_panel_type2_quantity) || 0));
                    if (quantity > 0) {
                      const statusLetter = formData.optimizer_existing !== true ? 'N' : 'E';
                      parts.push(`${quantity} (${statusLetter})`);
                    }
                    // Make and Model
                    parts.push(`${formData.optimizer_make} ${formData.optimizer_model}`);
                    return parts.join(' ');
                  })()
                : ''
            }
            showNewExistingToggle={true}
            isExisting={formData.optimizer_existing}
            onExistingChange={(val) => onChange('optimizer_existing', val, systemNumber)}
            onDelete={(e) => {
              // Stop propagation
              if (e && e.stopPropagation) e.stopPropagation();
              // Clear optimizer fields inline (optimizer is a sub-section, doesn't need full modal flow)
              onChange('optimizer_make', '', systemNumber);
              onChange('optimizer_model', '', systemNumber);
              onChange('optimizer_existing', false, systemNumber);
            }}
            headerRightContent={
              <PreferredButton onClick={() => setShowOptimizerPreferredModal(true)} />
            }
          >
            {/* Make dropdown */}
            <TableDropdown
              label="Make"
              value={formData.optimizer_make || ''}
              onChange={(value) => {
                handleOptimizerFieldChange('optimizer_make', value);
                onChange('optimizer_model', '', systemNumber); // Clear model when manufacturer changes
              }}
              options={optimizerManufacturers.map(m => ({ value: m, label: m }))}
              placeholder={loadingOptimizerMakes ? 'Loading...' : 'Select make'}
              disabled={loadingOptimizerMakes}
            />

            {/* Model dropdown */}
            <TableDropdown
              label="Model"
              value={formData.optimizer_model || ''}
              onChange={(value) => handleOptimizerFieldChange('optimizer_model', value)}
              options={optimizerModels
                .filter(m => m.model || m.model_number) // Optimizers use 'model', inverters use 'model_number'
                .map(m => ({
                  value: m.model || m.model_number,
                  label: m.model || m.model_number
                }))
              }
              placeholder={
                loadingOptimizerModels ? 'Loading...' :
                formData.optimizer_make ? 'Select model' :
                'Select make first'
              }
              disabled={!formData.optimizer_make || loadingOptimizerModels}
            />
          </EquipmentRow>

          {formData.show_solar_panel_2 && (
            <SolarPanel2Section
              formData={formData}
              onChange={onChange}
              systemNumber={systemNumber}
            />
          )}

          {/* Type 2 Optimizer - Only when second panel type is active */}
          {formData.show_solar_panel_2 && (
            <div className={componentStyles.optimizerType2}>
              <EquipmentRow
                title="Optimizer"
                titleSubline="(Type 2)"
                subtitle={
                  formData.optimizer_type2_make && formData.optimizer_type2_model
                    ? (() => {
                        const parts = [];
                        const solarPanelQty2 = parseInt(formData.solar_panel_type2_quantity) || 0;
                        if (solarPanelQty2 > 0) {
                          const statusLetter = formData.optimizer_type2_existing !== true ? 'N' : 'E';
                          parts.push(`${solarPanelQty2} (${statusLetter})`);
                        }
                        parts.push(`${formData.optimizer_type2_make} ${formData.optimizer_type2_model}`);
                        return parts.join(' ');
                      })()
                    : ''
                }
                showNewExistingToggle={true}
                isExisting={formData.optimizer_type2_existing}
                onExistingChange={(val) => onChange('optimizer_type2_existing', val, systemNumber)}
                onDelete={(e) => {
                  if (e && e.stopPropagation) e.stopPropagation();
                  onChange('optimizer_type2_make', '', systemNumber);
                  onChange('optimizer_type2_model', '', systemNumber);
                  onChange('optimizer_type2_existing', false, systemNumber);
                }}
                headerRightContent={
                  <PreferredButton onClick={() => setShowOptimizerType2PreferredModal(true)} />
                }
              >
                <TableDropdown
                  label="Make"
                  value={formData.optimizer_type2_make || ''}
                  onChange={(value) => {
                    handleOptimizerType2FieldChange('optimizer_type2_make', value);
                    onChange('optimizer_type2_model', '', systemNumber);
                  }}
                  options={optimizerType2Manufacturers.map(m => ({ value: m, label: m }))}
                  placeholder={loadingOptimizerType2Makes ? 'Loading...' : 'Select make'}
                  disabled={loadingOptimizerType2Makes}
                />

                <TableDropdown
                  label="Model"
                  value={formData.optimizer_type2_model || ''}
                  onChange={(value) => handleOptimizerType2FieldChange('optimizer_type2_model', value)}
                  options={optimizerType2Models
                    .filter(m => m.model || m.model_number)
                    .map(m => ({
                      value: m.model || m.model_number,
                      label: m.model || m.model_number
                    }))
                  }
                  placeholder={
                    loadingOptimizerType2Models ? 'Loading...' :
                    formData.optimizer_type2_make ? 'Select model' :
                    'Select make first'
                  }
                  disabled={!formData.optimizer_type2_make || loadingOptimizerType2Models}
                />
              </EquipmentRow>
            </div>
          )}
        </div>
      )}

      {/* Main Inverter/Microinverter Section */}
      <div style={isOptimizerFirst ? { marginTop: 'var(--spacing-xs)' } : {}}>
      <EquipmentRow
        title={getSectionTitle()}
        subtitle={getSubtitle()}
        showNewExistingToggle={true}
        isExisting={formData.inverter_existing}
        onExistingChange={(val) => onChange('inverter_existing', val, systemNumber)}
        onDelete={handleTrashClick}
        headerRightContent={
          <PreferredButton onClick={() => setShowPreferredModal(true)} />
        }
      >
        {/* Make dropdown */}
        <TableDropdown
          label="Make"
          value={formData.inverter_make || ''}
          onChange={handleManufacturerChange}
          options={manufacturers.map(m => ({ value: m, label: m }))}
          placeholder={loadingMakes ? 'Loading...' : 'Select make'}
          disabled={loadingMakes}
        />

        {/* Model dropdown */}
        <TableDropdown
          label="Model"
          value={isPW3 ? 'Powerwall 3' : (currentSEPartNumber || formData.inverter_model || '')}
          onChange={handleModelChange}
          options={deduplicatedModels.map(m => ({
            value: isPowerWall3(m.model_number) ? 'Powerwall 3' : m.model_number,
            label: isPowerWall3(m.model_number) ? 'Powerwall 3' : m.model_number
          }))}
          placeholder={
            loadingModels ? 'Loading...' :
            formData.inverter_make ? 'Select model' :
            'Select make first'
          }
          disabled={!formData.inverter_make || loadingModels}
        />

        {/* PowerWall 3 Power Output Selector - Only shown for PowerWall 3 */}
        {isPW3 && (
          <FormFieldRow label="Power Output">
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
              {POWERWALL_3_KILOWATT_OPTIONS.map((option) => (
                <TableRowButton
                  key={option.value}
                  label={option.label}
                  variant="outline"
                  active={currentPW3KW === option.value}
                  onClick={() => {
                    const updatedModel = updatePowerWall3ModelWithKW(formData.inverter_model, option.value);
                    onChange('inverter_model', updatedModel, systemNumber);
                  }}
                />
              ))}
            </div>
          </FormFieldRow>
        )}

        {/* SolarEdge Power Output Selector - Only shown for multi-kW SolarEdge models */}
        {isSolarEdgeKW && solarEdgeKWOptions.length > 0 && (
          <FormFieldRow label="Power Output">
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
              {solarEdgeKWOptions.map((option) => (
                <TableRowButton
                  key={option.value}
                  label={option.label}
                  variant="outline"
                  active={currentSESetting === option.value}
                  onClick={() => handleSolarEdgeKWChange(option.value)}
                />
              ))}
            </div>
          </FormFieldRow>
        )}

        {/* PowerWall Configuration - Backup Option, Expansion Packs, Gateway Selection */}
        {isPowerWall && (
          <PowerWallConfigurationSection
            backupOption={formData.backup_option || ''}
            expansionPacks={formData.expansionPacks ?? 0}
            gateway={formData.gateway || ''}
            backupSwitchLocation={formData.backupSwitchLocation || ''}
            batteryExisting={formData.batteryExisting || false}
            meterCollarSetting={formData.meter_collar_setting || ''}
            onChange={(field, value) => onChange(field, value, systemNumber)}
          />
        )}

        {/* Add Inverter BOS Button - Tesla PowerWall specific placement (inside Inverter section) */}
        {isPowerWall && !formData.show_inverter_bos && (
          <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--spacing-tight) var(--spacing)' }}>
            <TableRowButton
              label="+ Inverter BOS (Type 1)"
              variant="outline"
              onClick={() => onChange('show_inverter_bos', true, systemNumber)}
              style={{ width: '100%' }}
            />
          </div>
        )}

        {/* Breaker Size - Only for Hoymiles/Hoymiles Power/APSystems */}
        {(formData.inverter_make === 'Hoymiles' || formData.inverter_make === 'Hoymiles Power' || formData.inverter_make === 'APSystems') && (
          <TableDropdown
            label="Breaker Size"
            value={formData.sys1_ap_hoy_breaker_size || ''}
            onChange={(value) => onChange('sys1_ap_hoy_breaker_size', value, systemNumber)}
            options={[
              { label: '20', value: '20' },
              { label: '30', value: '30' },
            ]}
            placeholder="Select breaker size..."
          />
        )}

        {/* STRINGING SECTION */}
        {shouldShowStringing && (
          <>
            {/* Auto/Custom Toggle */}
            <FormFieldRow label="Stringing">
              <TableRowButton
                label="Auto"
                variant="outline"
                active={stringingType === 'auto'}
                onClick={() => handleStringingTypeChange('auto')}
                disabled={hasSolarPanel2Data}
              />
              <TableRowButton
                label="Custom"
                variant="outline"
                active={stringingType === 'custom'}
                onClick={() => handleStringingTypeChange('custom')}
              />
              {stringingType === 'auto' && (
                <div style={{ display: 'inline-flex', marginLeft: 'var(--spacing-tight)' }}>
                  <Tooltip
                    content={
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
                        Stringing will auto size to distribute total quantity in Solar Panel 1
                        {solarPanelQty2 > 0 && ' and Type 2'} and to stay within manufacturer stringing requirements and limits.
                      </div>
                    }
                    position="bottom"
                    className="alertTooltip"
                  >
                    <img src={flameIcon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', cursor: 'help' }} />
                  </Tooltip>
                </div>
              )}
            </FormFieldRow>

            {/* Type 2 Forces Custom Notice */}
            {hasSolarPanel2Data && (
              <div className={componentStyles.autoStringingInfo}>
                <Alert variant="info" collapsible={false}>
                  Custom stringing is required when using mixed panel types.
                </Alert>
              </div>
            )}

            {/* Custom Stringing Interface */}
            {stringingType === 'custom' && (
              <div className={componentStyles.customStringingSection}>
                {/* Toolbar: remaining counts + min/max per type, Auto-Distribute on right */}
                <div className={componentStyles.stringingToolbar}>
                  {/* Left: info blocks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-tight)', flex: 1 }}>
                    {hasSolarPanel2Data ? (
                      (() => {
                        const assigned1 = Array.from({ length: maxBranches }, (_, i) => {
                          const pt = formData[`branch_string_${i + 1}_panel_type`];
                          return pt === '1' ? (parseInt(formData[`branch_string_${i + 1}`]) || 0) : 0;
                        }).reduce((a, b) => a + b, 0);
                        const assigned2 = Array.from({ length: maxBranches }, (_, i) => {
                          const pt = formData[`branch_string_${i + 1}_panel_type`];
                          return pt === '2' ? (parseInt(formData[`branch_string_${i + 1}`]) || 0) : 0;
                        }).reduce((a, b) => a + b, 0);
                        const rem1 = solarPanelQty - assigned1;
                        const rem2 = solarPanelQty2 - assigned2;
                        const make1 = formData.solar_panel_make || '';
                        const model1 = formData.solar_panel_model || '';
                        const make2 = formData.solar_panel_type2_manufacturer || '';
                        const model2 = formData.solar_panel_type2_model || '';

                        const minPanels1 = inverterMinVdc > 0 && vocCorrected > 0 ? Math.ceil(inverterMinVdc / vocCorrected) : null;
                        const hardMax1 = vocCorrected > 0 ? Math.floor((inverterMaxVdc || 600) / vocCorrected) : maxPanelsPerBranch;
                        const range1 = minPanels1 !== null ? `${minPanels1}–${hardMax1}` : `Max ${hardMax1}`;

                        const minPanels2 = inverterMinVdc > 0 && vocCorrected2 > 0 ? Math.ceil(inverterMinVdc / vocCorrected2) : null;
                        const hardMax2 = vocCorrected2 > 0 ? Math.floor((inverterMaxVdc || 600) / vocCorrected2) : maxPanelsPerBranch;
                        const range2 = minPanels2 !== null ? `${minPanels2}–${hardMax2}` : `Max ${hardMax2}`;

                        return (
                          <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 'var(--font-medium)' }}>
                                Type 1: {rem1} remaining{range1 ? ` | ${range1} panels per string` : ''}
                              </span>
                              {(make1 || model1) && (
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                  {[make1, model1].filter(Boolean).join(' ')}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 'var(--font-medium)' }}>
                                Type 2: {rem2} remaining{range2 ? ` | ${range2} panels per string` : ''}
                              </span>
                              {(make2 || model2) && (
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                  {[make2, model2].filter(Boolean).join(' ')}
                                </span>
                              )}
                            </div>
                          </>
                        );
                      })()
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 'var(--font-medium)' }}>
                          {panelsRemaining} remaining
                          {panelVoc > 0 && (() => {
                            const min = inverterMinVdc > 0 && vocCorrected > 0 ? Math.ceil(inverterMinVdc / vocCorrected) : null;
                            const range = min !== null ? `${min}–${maxPanelsPerBranch}` : `Max ${maxPanelsPerBranch}`;
                            return ` | ${range} panels per string`;
                          })()}
                        </span>
                        {(formData.solar_panel_make || formData.solar_panel_model) && (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                            {[formData.solar_panel_make, formData.solar_panel_model].filter(Boolean).join(' ')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Right: Auto-Distribute button */}
                  {totalPanelQty > 0 && (
                    hasSolarPanel2Data ? (
                      <Tooltip
                        content={
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                            Auto-Distribute is disabled when multiple panel types are in use. Assign strings manually using the Type 1 / Type 2 buttons.
                          </div>
                        }
                        position="bottom"
                      >
                        <TableRowButton
                          variant="outline"
                          label="Auto-Distribute"
                          disabled={true}
                          style={{ opacity: 0.4, cursor: 'not-allowed' }}
                        />
                      </Tooltip>
                    ) : (
                      <TableRowButton
                        variant="outline"
                        onClick={handleAutoCalculate}
                        label="Auto-Distribute"
                      />
                    )
                  )}
                </div>

                {/* String Inverter Input Rows */}
                {Array.from({ length: maxBranches }, (_, i) => {
                  const index = i + 1;
                  const panelsPerStringValue = formData[`branch_string_${index}`] || '';
                  const panelType = formData[`branch_string_${index}_panel_type`] || '';

                  return (
                    <FormFieldRow
                      key={index}
                      label={`Input ${index}`}
                      noBorder={index === maxBranches && !hasSolarPanel2Data}
                    >
                      <input
                        type="text"
                        value={panelsPerStringValue}
                        onChange={(e) => handleBranchStringChange(index, e.target.value)}
                        onFocus={() => setActiveStringInput(`panels_${index}`)}
                        onBlur={() => setActiveStringInput(null)}
                        placeholder="—"
                        className={componentStyles.stringQtyInput}
                      />
                      {/* Panel Type Toggle - Only show when Type 2 is active */}
                      {hasSolarPanel2Data && (
                        <div className={componentStyles.panelTypeToggle}>
                          <TableRowButton
                            label="Type 1"
                            variant="outline"
                            size="sm"
                            active={panelType === '1'}
                            onClick={() => handleBranchPanelTypeChange(index, '1')}
                          />
                          <TableRowButton
                            label="Type 2"
                            variant="outline"
                            size="sm"
                            active={panelType === '2'}
                            onClick={() => handleBranchPanelTypeChange(index, '2')}
                          />
                        </div>
                      )}
                    </FormFieldRow>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Add Inverter BOS Button - Show inside Inverter section when inverter configured (regardless of optimizer)
            Note: For microinverters, this button is inside the String Combiner Panel section
            Note: For Tesla PowerWall, this button is rendered after PowerWallConfigurationSection below */}
        {formData.inverter_type === 'inverter' && formData.inverter_make && formData.inverter_model && !isPowerWall && !formData.show_inverter_bos && (
          <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--spacing-tight) var(--spacing)' }}>
            <TableRowButton
              label="+ Inverter BOS (Type 1)"
              variant="outline"
              onClick={() => onChange('show_inverter_bos', true, systemNumber)}
              style={{ width: '100%' }}
            />
          </div>
        )}
      </EquipmentRow>
      </div>

      {/* Optimizer Section - Only show for SolarEdge, SOL-ARK, TIGO (when not already rendered first) */}
      {!isOptimizerFirst && showOptimizers && (
        <div className={componentStyles.optimizerSection}>
          <EquipmentRow
            title="Optimizer"
            titleSubline={formData.show_solar_panel_2 ? "(Type 1)" : undefined}
            subtitle={
              formData.optimizer_make && formData.optimizer_model
                ? (() => {
                    const parts = [];
                    // Quantity with N/E indicator - For optimizers, typically 1:1 with solar panels
                    const solarPanelQty = parseInt(formData.solar_panel_quantity) || 0;
                    const quantity = formData.show_solar_panel_2 ? solarPanelQty : (solarPanelQty + (parseInt(formData.solar_panel_type2_quantity) || 0));
                    if (quantity > 0) {
                      const statusLetter = formData.optimizer_existing !== true ? 'N' : 'E';
                      parts.push(`${quantity} (${statusLetter})`);
                    }
                    // Make and Model
                    parts.push(`${formData.optimizer_make} ${formData.optimizer_model}`);
                    return parts.join(' ');
                  })()
                : ''
            }
            showNewExistingToggle={true}
            isExisting={formData.optimizer_existing}
            onExistingChange={(val) => onChange('optimizer_existing', val, systemNumber)}
            onDelete={(e) => {
              // Stop propagation
              if (e && e.stopPropagation) e.stopPropagation();
              // Clear optimizer fields inline (optimizer is a sub-section, doesn't need full modal flow)
              onChange('optimizer_make', '', systemNumber);
              onChange('optimizer_model', '', systemNumber);
              onChange('optimizer_existing', false, systemNumber);
            }}
            headerRightContent={
              <PreferredButton onClick={() => setShowOptimizerPreferredModal(true)} />
            }
          >
            {/* Make dropdown */}
            <TableDropdown
              label="Make"
              value={formData.optimizer_make || ''}
              onChange={(value) => {
                handleOptimizerFieldChange('optimizer_make', value);
                onChange('optimizer_model', '', systemNumber); // Clear model when manufacturer changes
              }}
              options={optimizerManufacturers.map(m => ({ value: m, label: m }))}
              placeholder={loadingOptimizerMakes ? 'Loading...' : 'Select make'}
              disabled={loadingOptimizerMakes}
            />

            {/* Model dropdown */}
            <TableDropdown
              label="Model"
              value={formData.optimizer_model || ''}
              onChange={(value) => handleOptimizerFieldChange('optimizer_model', value)}
              options={optimizerModels
                .filter(m => m.model || m.model_number) // Optimizers use 'model', inverters use 'model_number'
                .map(m => ({
                  value: m.model || m.model_number,
                  label: m.model || m.model_number
                }))
              }
              placeholder={
                loadingOptimizerModels ? 'Loading...' :
                formData.optimizer_make ? 'Select model' :
                'Select make first'
              }
              disabled={!formData.optimizer_make || loadingOptimizerModels}
            />
          </EquipmentRow>

          {formData.show_solar_panel_2 && (
            <SolarPanel2Section
              formData={formData}
              onChange={onChange}
              systemNumber={systemNumber}
            />
          )}

          {/* Type 2 Optimizer - Only when second panel type is active */}
          {formData.show_solar_panel_2 && (
            <div className={componentStyles.optimizerType2}>
              <EquipmentRow
                title="Optimizer"
                titleSubline="(Type 2)"
              subtitle={
                formData.optimizer_type2_make && formData.optimizer_type2_model
                  ? (() => {
                      const parts = [];
                      // Quantity with N/E indicator - For Type 2 optimizers, use Type 2 panel quantity
                      const solarPanelQty2 = parseInt(formData.solar_panel_type2_quantity) || 0;
                      if (solarPanelQty2 > 0) {
                        const statusLetter = formData.optimizer_type2_existing ? 'E' : 'N';
                        parts.push(`${solarPanelQty2} (${statusLetter})`);
                      }
                      // Make and Model
                      parts.push(`${formData.optimizer_type2_make} ${formData.optimizer_type2_model}`);
                      return parts.join(' ');
                    })()
                  : ''
              }
              showNewExistingToggle={true}
              isNew={!formData.optimizer_type2_existing}
              onNewExistingChange={(isNew) => onChange('optimizer_type2_existing', !isNew, systemNumber)}
              onDelete={(e) => {
                // Stop propagation
                if (e && e.stopPropagation) e.stopPropagation();
                // Clear Type 2 optimizer fields inline
                onChange('optimizer_type2_make', '', systemNumber);
                onChange('optimizer_type2_model', '', systemNumber);
                onChange('optimizer_type2_existing', false, systemNumber);
              }}
              headerRightContent={
                <PreferredButton onClick={() => setShowOptimizerType2PreferredModal(true)} />
              }
            >
              {/* Make dropdown */}
              <TableDropdown
                label="Make"
                value={formData.optimizer_type2_make || ''}
                onChange={(value) => {
                  handleOptimizerType2FieldChange('optimizer_type2_make', value);
                  onChange('optimizer_type2_model', '', systemNumber); // Clear model when manufacturer changes
                }}
                options={optimizerType2Manufacturers.map(m => ({ value: m, label: m }))}
                placeholder={loadingOptimizerType2Makes ? 'Loading...' : 'Select make'}
                disabled={loadingOptimizerType2Makes}
              />

              {/* Model dropdown */}
              <TableDropdown
                label="Model"
                value={formData.optimizer_type2_model || ''}
                onChange={(value) => handleOptimizerType2FieldChange('optimizer_type2_model', value)}
                options={optimizerType2Models
                  .filter(m => m.model || m.model_number) // Optimizers use 'model', inverters use 'model_number'
                  .map(m => ({
                    value: m.model || m.model_number,
                    label: m.model || m.model_number
                  }))
                }
                placeholder={
                  loadingOptimizerType2Models ? 'Loading...' :
                  formData.optimizer_type2_make ? 'Select model' :
                  'Select make first'
                }
                disabled={!formData.optimizer_type2_make || loadingOptimizerType2Models}
              />
            </EquipmentRow>
            </div>
          )}
        </div>
      )}

      {/* Gateway Configuration - For Tesla PowerWall Gateway 2 or Gateway 3 */}
      {showGatewayConfig && (
        <div className={componentStyles.gatewayConfigSection}>
          <EquipmentRow
            title={`${formData.gateway === 'Gateway 3' ? 'Gateway 3' : 'Backup Gateway 2'} Configuration`}
            showNewExistingToggle={true}
            isNew={formData.gatewayConfigIsNew !== false}
            onNewExistingChange={(isNew) => onChange('gatewayConfigIsNew', isNew, systemNumber)}
          >
            <GatewayConfigurationSection
              gatewayConfigMainBreakerMode={formData.gatewayConfigMainBreakerMode}
              gatewayConfigMainBreaker={formData.gatewayConfigMainBreaker}
              gatewayConfigBackupSubPanelMode={formData.gatewayConfigBackupSubPanelMode}
              gatewayConfigBackupSubPanel={formData.gatewayConfigBackupSubPanel}
              gatewayConfigPVBreakerMode={formData.gatewayConfigPVBreakerMode}
              gatewayConfigPVBreaker={formData.gatewayConfigPVBreaker}
              gatewayConfigESSBreakerMode={formData.gatewayConfigESSBreakerMode}
              gatewayConfigESSBreaker={formData.gatewayConfigESSBreaker}
              gatewayConfigTieInBreakerMode={formData.gatewayConfigTieInBreakerMode}
              gatewayConfigTieInBreaker={formData.gatewayConfigTieInBreaker}
              gatewayConfigActivatePCS={formData.gatewayConfigActivatePCS}
              gatewayConfigPCSAmps={formData.gatewayConfigPCSAmps}
              onChange={(field, value) => onChange(field, value, systemNumber)}
            />
          </EquipmentRow>
        </div>
      )}

      {/* Add Inverter BOS Button - Show after Gateway Configuration for Tesla PowerWall (Post-SMS BOS) */}
      {showGatewayConfig && !formData.show_inverter_bos && (
        <AddSectionButton
          label="Inverter BOS (Type 1)"
          onClick={() => onChange('show_inverter_bos', true, systemNumber)}
        />
      )}

      {/* Section Clear Modal */}
      <SectionClearModal
        isOpen={showClearModal}
        onClose={closeClearModal}
        onConfirm={handleClearConfirm}
        sectionName={formData.inverter_type === 'microinverter' ? 'Microinverter' : 'Inverter'}
      />

      {/* Section Remove Modal - Not used for CLEAR_ONLY behavior, but included for completeness */}
      <SectionRemoveModal
        isOpen={showRemoveModal}
        onClose={closeRemoveModal}
        onConfirm={handleRemoveConfirm}
        sectionName={formData.inverter_type === 'microinverter' ? 'Microinverter' : 'Inverter'}
      />

      {/* Preferred Equipment Modal */}
      <PreferredEquipmentModal
        isOpen={showPreferredModal}
        onClose={() => setShowPreferredModal(false)}
        onSelect={handlePreferredSelect}
        onSelectOther={handleSelectOther}
        equipmentType="inverters"
        title="Select Inverter"
      />

      {/* Optimizer Preferred Equipment Modal */}
      <PreferredEquipmentModal
        isOpen={showOptimizerPreferredModal}
        onClose={() => setShowOptimizerPreferredModal(false)}
        onSelect={handleOptimizerPreferredSelect}
        onSelectOther={handleOptimizerSelectOther}
        equipmentType="optimizers"
        title="Select Optimizer"
      />

      {/* Type 2 Optimizer Preferred Equipment Modal */}
      <PreferredEquipmentModal
        isOpen={showOptimizerType2PreferredModal}
        onClose={() => setShowOptimizerType2PreferredModal(false)}
        onSelect={handleOptimizerType2PreferredSelect}
        onSelectOther={handleOptimizerType2SelectOther}
        equipmentType="optimizers"
        title="Select Type 2 Optimizer"
      />
    </div>
  );
};

// Custom comparison - only re-render when inverter-relevant fields change
const areInverterPropsEqual = (prevProps, nextProps) => {
  // Always re-render if systemNumber changes
  if (prevProps.systemNumber !== nextProps.systemNumber) return false;
  if (prevProps.maxContinuousOutputAmps !== nextProps.maxContinuousOutputAmps) return false;
  if (prevProps.loadingMaxOutput !== nextProps.loadingMaxOutput) return false;

  // Check inverter-relevant formData fields
  const relevantFields = [
    // Inverter fields
    'inverter_make', 'inverter_model', 'inverter_type', 'inverter_isnew',
    'inverter_max_cont_output_amps', 'inverter_model_id', 'inverter_existing',
    // Solar panel fields (needed for stringing)
    'solar_panel_quantity', 'solar_panel_make', 'solar_panel_model',
    'solar_panel_voc', 'solar_panel_isc', 'solar_panel_existing',
    'solar_panel_type2_manufacturer', 'solar_panel_type2_model',
    'solar_panel_type2_quantity', 'solar_panel_type2_voc', 'solar_panel_type2_isc',
    'show_solar_panel_2',
    // Stringing fields
    'stringing_type',
    'branch_string_1', 'branch_string_2', 'branch_string_3', 'branch_string_4', 'branch_string_5',
    'branch_string_6', 'branch_string_7', 'branch_string_8', 'branch_string_9', 'branch_string_10',
    'branch_string_1_panel_type', 'branch_string_2_panel_type', 'branch_string_3_panel_type',
    'branch_string_4_panel_type', 'branch_string_5_panel_type', 'branch_string_6_panel_type',
    'branch_string_7_panel_type', 'branch_string_8_panel_type', 'branch_string_9_panel_type',
    'branch_string_10_panel_type',
    // PowerWall / Tesla fields
    'backup_option', 'expansionPacks', 'gateway', 'backupSwitchLocation', 'batteryExisting',
    'teslagatewaytype', 'meter_collar_setting',
    // Gateway config fields
    'gatewayConfigMainBreakerMode', 'gatewayConfigMainBreaker',
    'gatewayConfigBackupSubPanelMode', 'gatewayConfigBackupSubPanel',
    'gatewayConfigPVBreakerMode', 'gatewayConfigPVBreaker',
    'gatewayConfigESSBreakerMode', 'gatewayConfigESSBreaker',
    'gatewayConfigTieInBreakerMode', 'gatewayConfigTieInBreaker',
    'gatewayConfigActivatePCS', 'gatewayConfigPCSAmps', 'gatewayConfigIsNew',
    // Optimizer fields
    'optimizer_make', 'optimizer_model', 'optimizer_isnew', 'optimizer_existing',
    'optimizer_type2_make', 'optimizer_type2_model', 'optimizer_type2_existing',
    // Solar Panel Type 2 fields (SP2 renders inside InverterMicroSection for optimizer systems)
    'solar_panel_type2_is_new', 'solar_panel_type2_manufacturer', 'solar_panel_type2_model',
    'solar_panel_type2_quantity',
    // System flags
    'batteryonly', 'system_type', 'show_inverter_bos',
    // Hoymiles/APSystems breaker
    'sys1_ap_hoy_breaker_size',
  ];

  for (const field of relevantFields) {
    if (prevProps.formData?.[field] !== nextProps.formData?.[field]) {
      return false;
    }
  }

  return true; // Props equal, skip re-render
};

export default React.memo(InverterMicroSection, areInverterPropsEqual);
