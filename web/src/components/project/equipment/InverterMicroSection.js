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
  Button,
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
import { POWERWALL_3_KILOWATT_OPTIONS } from '../../../utils/constants';
import logger from '../../../services/devLogger';
import { useSectionDelete, DELETE_BEHAVIOR } from '../../../hooks/useSectionDelete';
import {
  calculateInverterInputDistribution,
} from '../../../utils/stringingCalculations';
import PowerWallConfigurationSection from './PowerWallConfigurationSection';
import GatewayConfigurationSection from './GatewayConfigurationSection';

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

  // Track auto-population to prevent duplicate onChange calls
  const hasAutoPopulatedRef = useRef(false);
  const lastProcessedModelRef = useRef(null);

  // Stringing state
  const [activeStringInput, setActiveStringInput] = useState(null);

  // Preferred equipment modal state
  const [showPreferredModal, setShowPreferredModal] = useState(false);
  const [showOptimizerPreferredModal, setShowOptimizerPreferredModal] = useState(false);

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

  // Gateway Configuration visibility
  const showGatewayConfig = useMemo(() => {
    const gateway = formData.gateway || '';
    return isPowerWall && (gateway === 'Backup Gateway 2' || gateway === 'Gateway 3');
  }, [isPowerWall, formData.gateway]);

  // Load manufacturers on mount
  useEffect(() => {
    loadManufacturers();
  }, []);

  // Load models when manufacturer changes
  useEffect(() => {
    if (formData.inverter_make) {
      loadModels(formData.inverter_make);
    } else {
      setModels([]);
      setSelectedModelData(null);
      // Reset auto-population tracking when manufacturer is cleared
      hasAutoPopulatedRef.current = false;
      lastProcessedModelRef.current = null;
    }
  }, [formData.inverter_make]);

  // Check if optimizers should be shown
  useEffect(() => {
    const supportsOptimizers = manufacturerSupportsOptimizers(formData.inverter_make);
    const hasOptimizerData = formData.optimizer_make || formData.optimizer_model;

    logger.debug('Equipment', `🔍 Optimizer visibility check - inverter_make: ${formData.inverter_make}`);
    logger.debug('Equipment', `🔍 supportsOptimizers: ${supportsOptimizers}, hasOptimizerData: ${hasOptimizerData}`);

    if (supportsOptimizers || hasOptimizerData) {
      logger.debug('Equipment', `✅ Showing optimizer section`);
      setShowOptimizers(true);
      if (supportsOptimizers && !loadingOptimizerMakes && optimizerManufacturers.length === 0) {
        logger.debug('Equipment', `📞 Loading optimizer manufacturers...`);
        loadOptimizerManufacturers();
      } else {
        logger.debug('Equipment', `ℹ️ Optimizer manufacturers already loaded or loading. Count: ${optimizerManufacturers.length}`);
      }
    } else {
      logger.debug('Equipment', `❌ Hiding optimizer section`);
      setShowOptimizers(false);
    }
  }, [formData.inverter_make, formData.optimizer_make, formData.optimizer_model]);

  // Load optimizer models when optimizer manufacturer changes
  useEffect(() => {
    if (formData.optimizer_make) {
      loadOptimizerModelsData(formData.optimizer_make);
    } else {
      setOptimizerModels([]);
    }
  }, [formData.optimizer_make]);

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
      onChange('show_solar_panel_2', true);
    }
    // Auto-disable flag if Type 2 has no data
    else if (!hasSolarPanel2Data && formData.show_solar_panel_2) {
      onChange('show_solar_panel_2', false);
    }
  }, [
    formData.solar_panel_type2_manufacturer,
    formData.solar_panel_type2_model,
    formData.solar_panel_type2_quantity,
    formData.show_solar_panel_2,
  ]);

  const loadManufacturers = async () => {
    setLoadingMakes(true);
    try {
      const response = await getInverterManufacturers();
      setManufacturers(response.data || []);
    } catch (error) {
      logger.error('Equipment', 'Failed to load inverter manufacturers:', error);
    } finally {
      setLoadingMakes(false);
    }
  };

  const loadModels = async (manufacturer) => {
    setLoadingModels(true);
    try {
      const response = await getInverterModels(manufacturer);
      const modelsData = response.data || [];
      setModels(modelsData);

      // If current model is selected, find its data
      if (formData.inverter_model && lastProcessedModelRef.current !== formData.inverter_model) {
        const modelData = modelsData.find(m => m.model_number === formData.inverter_model);
        if (modelData && !hasAutoPopulatedRef.current) {
          // Mark as processed to prevent duplicate calls
          hasAutoPopulatedRef.current = true;
          lastProcessedModelRef.current = formData.inverter_model;

          setSelectedModelData(modelData);

          // Detect if this is a microinverter or string inverter
          const isMicroinverter = modelData.microinverter === true ||
                                 modelData.equipment_type?.toLowerCase().includes('micro') ||
                                 modelData.equipment_type?.toLowerCase() === 'microinverter';

          // Debug logging to help diagnose detection issues
          logger.debug('Inverter', 'Model detection:', {
            model: formData.inverter_model,
            microinverter_field: modelData.microinverter,
            equipment_type: modelData.equipment_type,
            detected_as: isMicroinverter ? 'microinverter' : 'inverter'
          });

          if (onBatchChange) {
            // Batch all auto-population updates
            const updates = [
              ['inverter_type', isMicroinverter ? 'microinverter' : 'inverter'],
              ['inverter_max_cont_output_amps', modelData.max_cont_output_amps],
            ];

            // Store max_strings_branches for string inverters
            if (!isMicroinverter && modelData.max_strings_branches) {
              updates.push(['inverter_max_strings_branches', modelData.max_strings_branches]);
            }

            // Store model ID for future reference
            if (modelData.id) {
              updates.push(['inverter_model_id', modelData.id]);
            }

            onBatchChange(updates, systemNumber);
          } else {
            // Fallback to sequential calls
            onChange('inverter_type', isMicroinverter ? 'microinverter' : 'inverter');
            onChange('inverter_max_cont_output_amps', modelData.max_cont_output_amps);

            // Store max_strings_branches for string inverters
            if (!isMicroinverter && modelData.max_strings_branches) {
              onChange('inverter_max_strings_branches', modelData.max_strings_branches);
            }

            // Store model ID for future reference
            if (modelData.id) {
              onChange('inverter_model_id', modelData.id);
            }
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

  // Wrapper to save toggle defaults when any field changes
  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value);

    // Also save New/Existing toggle default if make or model is selected
    // This ensures the value is saved even if user never interacts with the toggle
    if ((fieldName === 'inverter_make' || fieldName === 'inverter_model') && value) {
      const currentIsNew = formData.inverter_isnew !== false; // Default to true (New)
      onChange('inverter_isnew', currentIsNew);
    }
  };

  // Wrapper for optimizer fields
  const handleOptimizerFieldChange = (fieldName, value) => {
    if (onBatchChange && formData.optimizer_isnew === undefined) {
      onBatchChange([[fieldName, value], ['optimizer_isnew', true]], systemNumber);
    } else {
      onChange(fieldName, value);
      // Also save New/Existing toggle default if not already set
      if (formData.optimizer_isnew === undefined) {
        onChange('optimizer_isnew', true);
      }
    }
  };

  const handleManufacturerChange = (value) => {
    // Reset auto-population tracking when manufacturer changes
    hasAutoPopulatedRef.current = false;
    lastProcessedModelRef.current = null;

    if (onBatchChange) {
      const currentIsNew = formData.inverter_isnew !== false; // Default to true (New)
      const updates = [
        ['inverter_make', value],
        ['inverter_model', ''],
        ['inverter_type', ''],
        ['inverter_max_cont_output_amps', ''],
        ['inverter_isnew', currentIsNew], // Always include current toggle state
      ];
      onBatchChange(updates, systemNumber);
    } else {
      handleFieldChange('inverter_make', value);
      // Clear model when manufacturer changes
      onChange('inverter_model', '');
      onChange('inverter_type', '');
      onChange('inverter_max_cont_output_amps', '');
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
      if (modelData) {
        setSelectedModelData(modelData);
        if (onBatchChange) {
          const updates = [
            ['inverter_type', 'inverter'],
            ['inverter_max_cont_output_amps', modelData.max_cont_output_amps],
            ['inverter_max_vdc', modelData.voltage_maximum || modelData.max_vdc || ''],
            ['inverter_min_vdc', modelData.voltage_minimum || modelData.min_vdc || ''],
            ['inverter_max_input_isc', modelData.max_input_isc || modelData.max_isc_per_input || ''],
          ];
          if (modelData.id) {
            updates.push(['inverter_model_id', modelData.id]);
          }
          onBatchChange(updates, systemNumber);
        } else {
          onChange('inverter_type', 'inverter');
          onChange('inverter_max_cont_output_amps', modelData.max_cont_output_amps);
          onChange('inverter_max_vdc', modelData.voltage_maximum || modelData.max_vdc || '');
          onChange('inverter_min_vdc', modelData.voltage_minimum || modelData.min_vdc || '');
          onChange('inverter_max_input_isc', modelData.max_input_isc || modelData.max_isc_per_input || '');
          if (modelData.id) {
            onChange('inverter_model_id', modelData.id);
          }
        }
      }
      return;
    }

    handleFieldChange('inverter_model', value);

    // Find model data and update related fields
    const modelData = models.find(m => m.model_number === value);
    if (modelData) {
      setSelectedModelData(modelData);

      // Detect if this is a microinverter or string inverter
      const isMicroinverter = modelData.microinverter === true ||
                             modelData.equipment_type?.toLowerCase().includes('micro');

      if (onBatchChange) {
        const updates = [
          ['inverter_type', isMicroinverter ? 'microinverter' : 'inverter'],
          ['inverter_max_cont_output_amps', modelData.max_cont_output_amps],
          ['inverter_max_strings_branches', !isMicroinverter && modelData.max_strings_branches ? modelData.max_strings_branches : null],
          ['inverter_max_vdc', modelData.voltage_maximum || modelData.max_vdc || ''],
          ['inverter_min_vdc', modelData.voltage_minimum || modelData.min_vdc || ''],
          ['inverter_max_input_isc', modelData.max_input_isc || modelData.max_isc_per_input || ''],
        ];
        if (modelData.id) {
          updates.push(['inverter_model_id', modelData.id]);
        }
        onBatchChange(updates, systemNumber);
      } else {
        onChange('inverter_type', isMicroinverter ? 'microinverter' : 'inverter');
        onChange('inverter_max_cont_output_amps', modelData.max_cont_output_amps);

        // Store max_strings_branches for string inverters (used for stringing calculations)
        if (!isMicroinverter && modelData.max_strings_branches) {
          onChange('inverter_max_strings_branches', modelData.max_strings_branches);
        } else {
          onChange('inverter_max_strings_branches', null);
        }

        // Store electrical specs for stringing validation
        // Try both possible field names from database
        onChange('inverter_max_vdc', modelData.voltage_maximum || modelData.max_vdc || '');
        onChange('inverter_min_vdc', modelData.voltage_minimum || modelData.min_vdc || '');
        onChange('inverter_max_input_isc', modelData.max_input_isc || modelData.max_isc_per_input || '');

        // Store full model data ID for future reference
        if (modelData.id) {
          onChange('inverter_model_id', modelData.id);
        }
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

  // Get inverter electrical specs
  const inverterMaxContOutput = parseFloat(formData.inverter_max_cont_output_amps) || 0;
  const inverterMaxVdc = parseFloat(formData.inverter_max_vdc) || 0;
  const inverterMinVdc = parseFloat(formData.inverter_min_vdc) || 0;
  const inverterMaxIsc = parseFloat(formData.inverter_max_input_isc) || 0;
  const maxStringsBranches = parseInt(formData.inverter_max_strings_branches) || 0;

  // Get solar panel electrical specs
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

  // Max branches/strings for string inverters only
  const maxBranches = maxStringsBranches || 10;

  // Calculate max panels per string (for string inverters only)
  const maxPanelsPerBranch = useMemo(() => {
    // String inverters: calculate from voltage limits
    if (panelVoc > 0 && inverterMaxVdc > 0) {
      return Math.floor(inverterMaxVdc / panelVoc);
    }
    return 20; // Default fallback
  }, [panelVoc, inverterMaxVdc]);

  // Calculate total panels assigned across all strings (for string inverters only)
  const totalPanelsAssigned = useMemo(() => {
    let total = 0;
    // String inverters: branch_string_X now stores panels per string (strings is fixed to 1)
    for (let i = 1; i <= 10; i++) {
      const panelsPerString = parseInt(formData[`branch_string_${i}`]) || 0;
      total += panelsPerString; // Always 1 string per MPPT, so just add panels
    }
    return total;
  }, [formData]);

  const panelsRemaining = totalPanelQty - totalPanelsAssigned;

  // Stringing event handlers (for string inverters only)
  const handleStringingTypeChange = (type) => {
    onChange('stringing_type', type);

    // Clear all string data when switching to auto
    if (type === 'auto') {
      for (let i = 1; i <= 10; i++) {
        onChange(`branch_string_${i}`, '');
      }
    }
  };

  const handleBranchStringChange = (index, value) => {
    // Only allow numbers
    // This now stores panels per string directly (strings is fixed to 1)
    const numericValue = value.replace(/[^0-9]/g, '');
    onChange(`branch_string_${index}`, numericValue);
  };

  // Auto-calculate function (for string inverters only)
  const handleAutoCalculate = () => {
    if (totalPanelQty <= 0) return;

    // String inverters auto-distribution
    const distribution = calculateInverterInputDistribution({
      totalPanels: totalPanelQty,
      maxInputs: maxBranches,
      maxPanelsPerString: maxPanelsPerBranch,
      panelVoc,
      panelIsc,
      inverterMaxVdc,
      inverterMinVdc,
      inverterMaxIsc,
    });

    if (!distribution || !distribution.strings) return;

    // Clear all strings first
    for (let i = 1; i <= 10; i++) {
      onChange(`branch_string_${i}`, '');
    }

    // Populate with calculated values
    // branch_string_X now stores panels per string directly (strings is fixed to 1)
    distribution.strings.forEach((string, idx) => {
      const i = idx + 1;
      // Store only panels per string (numStrings should always be 1)
      onChange(`branch_string_${i}`, String(string.panelsPerString || 0));
    });
  };

  // Preferred equipment handlers
  const handlePreferredSelect = (selected) => {
    onChange('inverter_make', selected.make);
    onChange('inverter_model', selected.model);
  };

  const handleSelectOther = () => {
    // Clear selection to force user to choose from dropdowns
    onChange('inverter_make', '');
    onChange('inverter_model', '');
  };

  const handleOptimizerPreferredSelect = (selected) => {
    handleOptimizerFieldChange('optimizer_make', selected.make);
    handleOptimizerFieldChange('optimizer_model', selected.model);
  };

  const handleOptimizerSelectOther = () => {
    // Clear selection to force user to choose from dropdowns
    onChange('optimizer_make', '');
    onChange('optimizer_model', '');
  };

  // Dynamic title based on inverter type
  const getSectionTitle = () => {
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
      const statusLetter = formData.inverter_isnew !== false ? 'N' : 'E';
      parts.push(`${quantity} (${statusLetter})`);
    }

    // Make and Model
    parts.push(`${formData.inverter_make} ${formData.inverter_model}`);

    return parts.join(' ');
  };

  // Deduplicate PowerWall 3 models - show only "Powerwall 3" once
  const deduplicatedModels = useMemo(() => {
    const seen = new Set();
    return models.filter(model => {
      const modelNumber = model.model_number || '';

      // Check if this is a PowerWall 3 variant
      if (isPowerWall3(modelNumber)) {
        // Only keep the first PowerWall 3 entry, strip kW rating
        if (seen.has('powerwall_3')) {
          return false; // Skip duplicate
        }
        seen.add('powerwall_3');
        // Modify the model to show clean name without kW
        model.display_name = 'Powerwall 3';
        return true;
      }

      // Keep all other models as-is
      return true;
    });
  }, [models]);

  return (
    <div className={componentStyles.sectionWrapper}>
      <EquipmentRow
        title={getSectionTitle()}
        subtitle={getSubtitle()}
        showNewExistingToggle={true}
        isNew={formData.inverter_isnew !== false}
        onNewExistingChange={(isNew) => onChange('inverter_isnew', isNew)}
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
          value={isPW3 ? 'Powerwall 3' : formData.inverter_model || ''}
          onChange={handleModelChange}
          options={deduplicatedModels.map(m => ({
            value: m.display_name || m.model_number,
            label: m.display_name || m.model_number
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
                  label={`${option.label}kW`}
                  variant="outline"
                  active={currentPW3KW === option.value}
                  onClick={() => {
                    const updatedModel = updatePowerWall3ModelWithKW(formData.inverter_model, option.value);
                    onChange('inverter_model', updatedModel);
                  }}
                />
              ))}
            </div>
          </FormFieldRow>
        )}

        {/* PowerWall Configuration - Backup Option, Expansion Packs, Gateway Selection */}
        {isPowerWall && (
          <PowerWallConfigurationSection
            formData={formData}
            onChange={onChange}
          />
        )}

        {/* Breaker Size - Only for Hoymiles/Hoymiles Power/APSystems */}
        {(formData.inverter_make === 'Hoymiles' || formData.inverter_make === 'Hoymiles Power' || formData.inverter_make === 'APSystems') && (
          <TableDropdown
            label="Breaker Size"
            value={formData.sys1_ap_hoy_breaker_size || ''}
            onChange={(value) => onChange('sys1_ap_hoy_breaker_size', value)}
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
                {/* Panels Remaining Counter */}
                <div className={componentStyles.panelsRemainingCounter}>
                  <span className={componentStyles.panelsRemainingText}>
                    Remaining Panels:{' '}
                    <span className={`${componentStyles.panelsRemainingValue} ${
                      panelsRemaining === 0 ? componentStyles.panelsRemainingComplete :
                      panelsRemaining < 0 ? componentStyles.panelsRemainingError :
                      componentStyles.panelsRemainingWarning
                    }`}>
                      {panelsRemaining}
                    </span>
                  </span>
                </div>

                {/* Auto-Calculate Button */}
                {totalPanelQty > 0 && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleAutoCalculate}
                    className={componentStyles.autoCalculateButton}
                  >
                    Auto-Calculate Distribution
                  </Button>
                )}

                {/* String Inverter Input Rows */}
                <div className={componentStyles.stringInputContainer}>
                  {Array.from({ length: maxBranches }, (_, i) => {
                    const index = i + 1;
                    const panelsPerStringValue = formData[`branch_string_${index}`] || '';

                    // Only show row if it has values or if it's one of the first few rows
                    const shouldShowRow = panelsPerStringValue || index <= 3;

                    if (!shouldShowRow) return null;

                    return (
                      <div key={index} className={componentStyles.stringInputRow}>
                        <span className={componentStyles.mpptLabel}>
                          MPPT {index}
                        </span>
                        <input
                          type="text"
                          value="1"
                          disabled
                          placeholder="Strings"
                          className={componentStyles.stringInput}
                        />
                        <span className={componentStyles.multiplySymbol}>×</span>
                        <input
                          type="text"
                          value={panelsPerStringValue}
                          onChange={(e) => handleBranchStringChange(index, e.target.value)}
                          onFocus={() => setActiveStringInput(`panels_${index}`)}
                          onBlur={() => setActiveStringInput(null)}
                          placeholder="Panels/String"
                          className={componentStyles.panelsPerStringInput}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </EquipmentRow>

      {/* Add Inverter BOS Button - Show after Inverter when NO optimizer AND inverter configured
          Note: For microinverters, this button is inside the String Combiner Panel section */}
      {!showOptimizers && formData.inverter_type === 'inverter' && formData.inverter_make && formData.inverter_model && !formData.show_inverter_bos && (
        <AddSectionButton
          label="Inverter BOS (Type 1)"
          onClick={() => onChange('show_inverter_bos', true)}
        />
      )}

      {/* Optimizer Section - Only show for SolarEdge, SOL-ARK, TIGO */}
      {showOptimizers && (
        <div className={componentStyles.optimizerSection}>
          <EquipmentRow
            title="Optimizer"
            subtitle={
              formData.optimizer_make && formData.optimizer_model
                ? (() => {
                    const parts = [];
                    // Quantity with N/E indicator - For optimizers, typically 1:1 with solar panels
                    const solarPanelQty = parseInt(formData.solar_panel_quantity) || 0;
                    const solarPanelQty2 = parseInt(formData.solar_panel_type2_quantity) || 0;
                    const quantity = solarPanelQty + solarPanelQty2;
                    if (quantity > 0) {
                      const statusLetter = formData.optimizer_isnew !== false ? 'N' : 'E';
                      parts.push(`${quantity} (${statusLetter})`);
                    }
                    // Make and Model
                    parts.push(`${formData.optimizer_make} ${formData.optimizer_model}`);
                    return parts.join(' ');
                  })()
                : ''
            }
            showNewExistingToggle={true}
            isNew={formData.optimizer_isnew !== false}
            onNewExistingChange={(isNew) => onChange('optimizer_isnew', isNew)}
            onDelete={(e) => {
              // Stop propagation
              if (e && e.stopPropagation) e.stopPropagation();
              // Clear optimizer fields inline (optimizer is a sub-section, doesn't need full modal flow)
              onChange('optimizer_make', '');
              onChange('optimizer_model', '');
              onChange('optimizer_isnew', true);
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
                onChange('optimizer_model', ''); // Clear model when manufacturer changes
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
        </div>
      )}

      {/* Add Inverter BOS Button - Show after Optimizer when optimizer is configured */}
      {showOptimizers && formData.optimizer_make && formData.optimizer_model && !formData.show_inverter_bos && (
        <AddSectionButton
          label="Inverter BOS (Type 1)"
          onClick={() => onChange('show_inverter_bos', true)}
        />
      )}

      {/* Gateway Configuration - For Tesla PowerWall Gateway 2 or Gateway 3 */}
      {showGatewayConfig && (
        <div className={componentStyles.gatewayConfigSection}>
          <EquipmentRow
            title={`${formData.gateway === 'Gateway 3' ? 'Gateway 3' : 'Backup Gateway 2'} Configuration`}
            showNewExistingToggle={true}
            isNew={formData.gatewayConfigIsNew !== false}
            onNewExistingChange={(isNew) => onChange('gatewayConfigIsNew', isNew)}
          >
            <GatewayConfigurationSection
              formData={formData}
              onChange={onChange}
            />
          </EquipmentRow>
        </div>
      )}

      {/* Add Inverter BOS Button - Show after Gateway Configuration for Tesla PowerWall (Post-SMS BOS) */}
      {showGatewayConfig && !formData.show_inverter_bos && (
        <AddSectionButton
          label="Inverter BOS (Type 1)"
          onClick={() => onChange('show_inverter_bos', true)}
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
    </div>
  );
};

export default InverterMicroSection;
