import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import { EquipmentRow, FormFieldRow, TableDropdown, TableRowButton, Alert, Button, Divider, PreferredButton, AddSectionButton, ConfirmActionModal } from '../../ui';
import Tooltip from '../../ui/Tooltip';
import { PreferredEquipmentModal } from '../../equipment';
import StringingGrid from './StringingGrid';
import { HelpCircle } from 'lucide-react';
import flameIcon from '../../../assets/images/Skyfire Flame Icon.png';
import BOSEquipmentSection from './BOSEquipmentSection';
import styles from '../../../styles/ProjectAdd.module.css';
import equipStyles from '../EquipmentForm.module.css';
import gridStyles from './StringingGrid.module.css';
import {
  getCombinerPanelManufacturers,
  getCombinerPanelModels,
} from '../../../services/equipmentService';
import logger from '../../../services/devLogger';
import {
  getStringingSpecs,
  getMaxBranches as getMaxBranchesUtil,
} from '../../../utils/stringingConstants';
import {
  calculateMaxPanelsPerBranch,
  distributeStandardMicros,
  calculateDualQtyDistribution,
  getStringingMode,
} from '../../../utils/stringingCalculations';
import { isEnphase6CCombiner } from '../../../utils/constants';

/**
 * String Combiner Panel Section
 * Used for microinverter systems to combine strings before main panel
 * Special handling for Enphase (no bus amps or main breaker required)
 * Now includes microinverter stringing configuration
 */
const StringCombinerPanelSection = ({
  formData,
  onChange,
  onBatchChange,
  systemNumber = 1,
  // Stringing props
  solarPanelQty = 0,      // Primary panel quantity
  solarPanelQty2 = 0,     // Type 2 panel quantity (if mixed system)
  inverterMake = '',      // For stringing mode detection
  inverterModel = '',     // For specs lookup
  inverterMaxContOutput = 0,  // Max continuous output amps per microinverter
  onEnphase6CChange,      // NEW: Callback when 6C combiner is selected/deselected
  // BOS auto-sizing props
  maxContinuousOutputAmps = null,
  loadingMaxOutput = false,
}) => {
  const [manufacturers, setManufacturers] = useState([]);
  const [models, setModels] = useState([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [editTieInBreaker, setEditTieInBreaker] = useState(false);

  // Stringing state
  const [activeStringInput, setActiveStringInput] = useState(null);

  // Preferred equipment modal state
  const [showPreferredModal, setShowPreferredModal] = useState(false);

  // Confirmation modal state for switching from Custom to Auto
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // Ref to track if we've auto-set aggregate_pv_breaker to prevent loops
  const hasAutoSetAggregateBreaker = useRef(false);

  // Derived stringing values
  const totalPanelQty = solarPanelQty + solarPanelQty2;
  const stringingType = formData.stringing_type || 'auto';

  // Solar panel make/model for display in dropdown
  const panelType1Make = formData.solar_panel_make || '';
  const panelType1Model = formData.solar_panel_model || '';
  const panelType2Make = formData.solar_panel_type2_manufacturer || '';
  const panelType2Model = formData.solar_panel_type2_model || '';

  // Create panel labels for dropdown
  const panelType1Label = panelType1Make && panelType1Model
    ? `${panelType1Make} ${panelType1Model}`
    : 'Type 1';
  const panelType2Label = panelType2Make && panelType2Model
    ? `${panelType2Make} ${panelType2Model}`
    : 'Type 2';

  // Calculate total max continuous output for all microinverters
  // Total panels × max continuous output per microinverter
  const totalMaxContOutput = totalPanelQty * (parseFloat(inverterMaxContOutput) || 0);

  // Check if 6C model (125A max tie-in breaker limit)
  const is6C = formData.combiner_panel_model?.includes('6C');
  const maxTieInBreaker = is6C ? 125 : 250;

  // Auto-size tie-in breaker: round up to next standard breaker size
  const getAutoTieInBreaker = () => {
    if (totalMaxContOutput <= 0) return null;

    // Standard breaker sizes
    const breakerSizes = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250];

    // Find the smallest breaker that can handle the load (125% of continuous)
    const requiredRating = totalMaxContOutput * 1.25;

    for (const size of breakerSizes) {
      if (size >= requiredRating && size <= maxTieInBreaker) {
        return size;
      }
    }

    return maxTieInBreaker; // Max fallback (125A for 6C, 250A for others)
  };

  const autoTieInBreaker = getAutoTieInBreaker();

  // Stringing mode (Enphase = standard, Hoymiles/APSystems = dual-qty)
  const stringingMode = getStringingMode('microinverter', inverterMake);
  const isDualQtyMode = stringingMode === 'dual-qty';

  // Get specs for dual-qty manufacturers
  const specs = useMemo(() => {
    return isDualQtyMode ? getStringingSpecs(inverterMake, inverterModel) : null;
  }, [isDualQtyMode, inverterMake, inverterModel]);

  // Max branches from combiner panel model
  const maxBranches = getMaxBranchesUtil(
    formData.combiner_panel_make,
    formData.combiner_panel_model
  );

  // Max panels per branch
  const maxPanelsPerBranch = useMemo(() => {
    if (isDualQtyMode && specs) {
      return specs.maxPanelsBranch;
    }
    return 25; // Default for standard microinverters
  }, [isDualQtyMode, specs]);

  // Calculate total panels assigned
  const totalPanelsAssigned = useMemo(() => {
    let total = 0;
    for (let i = 1; i <= 10; i++) {
      const panelQty = parseInt(formData[`branch_string_${i}`]) || 0;
      total += panelQty;
    }
    return total;
  }, [formData]);

  const panelsRemaining = totalPanelQty - totalPanelsAssigned;

  // Bus amps options (40-250 in increments of 10)
  const busAmpOptions = Array.from({ length: 22 }, (_, i) => 40 + i * 10);

  // Main breaker options
  const mainBreakerOptions = ['MLO', 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600];

  // Tie-in breaker options - limit to 125A for 6C model
  const allTieInBreakerOptions = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250];
  const tieInBreakerOptions = is6C
    ? allTieInBreakerOptions.filter(rating => rating <= 125)
    : allTieInBreakerOptions;

  // Check if Enphase is selected
  const isEnphase = formData.combiner_panel_make === 'Enphase';
  const isNoCombiner = formData.combiner_panel_make === 'No String Combiner Panel';

  // Load manufacturers on mount
  // Load manufacturers on mount (once only)
  // CRITICAL: Guard prevents multiple API calls during re-renders
  useEffect(() => {
    if (manufacturers.length === 0 && !loadingMakes) {
      loadManufacturers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = run once on mount only

  // Load models from API when manufacturer changes
  useEffect(() => {
    if (formData.combiner_panel_make) {
      loadModels(formData.combiner_panel_make);
    } else {
      setModels([]);
    }
  }, [formData.combiner_panel_make]);

  // Set default MLO on mount
  useEffect(() => {
    if (!formData.combiner_panel_main_breaker) {
      onChange('combiner_panel_main_breaker', 'MLO', systemNumber);
    }
  }, []);

  // Set default New/Existing toggle to New on mount if combiner panel is configured but toggle not set
  useEffect(() => {
    const hasCombiner = formData.combiner_panel_make || formData.combiner_panel_model;
    if (hasCombiner && formData.combiner_panel_existing == null) {
      onChange('combiner_panel_existing', false, systemNumber); // Default to New
    }
  }, [formData.combiner_panel_make, formData.combiner_panel_model, formData.combiner_panel_existing, onChange]);

  // Auto-set Aggregate PV Breaker to 60A for IQ Combiner 6C (only once)
  useEffect(() => {
    if (is6C && !formData.aggregate_pv_breaker && !hasAutoSetAggregateBreaker.current) {
      hasAutoSetAggregateBreaker.current = true;
      console.log('🔥 useEffect: AUTO-SETTING aggregate_pv_breaker to 60A for 6C model');
      onChange('aggregate_pv_breaker', '60', systemNumber);
      logger.log('StringCombinerPanel', 'Auto-set Aggregate PV Breaker to 60A (default) via useEffect');
    }
    // Reset ref when not 6C or when breaker is manually set
    if (!is6C || formData.aggregate_pv_breaker) {
      hasAutoSetAggregateBreaker.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [is6C, formData.aggregate_pv_breaker]);

  const loadManufacturers = async () => {
    setLoadingMakes(true);
    try {
      const response = await getCombinerPanelManufacturers();
      setManufacturers(response.data || []);
    } catch (error) {
      logger.error('Equipment', 'Failed to load combiner panel manufacturers:', error);
    } finally {
      setLoadingMakes(false);
    }
  };

  const loadModels = async (manufacturer) => {
    setLoadingModels(true);
    try {
      const response = await getCombinerPanelModels(manufacturer);
      const modelsData = response.data || [];

      // Normalize models data to ensure consistent format
      const normalizedModels = modelsData.map(model => {
        if (typeof model === 'string') {
          return { value: model, label: model };
        }
        // Handle object format from API: {model, manufacturer, equipment_type, is_validated, uuid}
        const modelValue = model.model || model.model_number || model.value || model;
        return { value: modelValue, label: modelValue };
      });

      setModels(normalizedModels);
    } catch (error) {
      logger.error('Equipment', 'Failed to load combiner panel models:', error);
    } finally {
      setLoadingModels(false);
    }
  };


  const handleDelete = () => {
    onChange('combiner_panel_make', '', systemNumber);
    onChange('combiner_panel_model', '', systemNumber);
    onChange('combiner_panel_bus_amps', '', systemNumber);
    onChange('combiner_panel_main_breaker', 'MLO', systemNumber);
    onChange('combiner_panel_tie_in_breaker', '', systemNumber);
    onChange('combiner_panel_existing', false, systemNumber);

    // NEW: Clear 6C state
    if (onEnphase6CChange) {
      onEnphase6CChange(false);
    }
  };

  // Preferred equipment handlers
  const handlePreferredSelect = (selected) => {
    onChange('combiner_panel_make', selected.make, systemNumber);
    onChange('combiner_panel_model', selected.model, systemNumber);
  };

  const handleSelectOther = () => {
    onChange('combiner_panel_make', '', systemNumber);
    onChange('combiner_panel_model', '', systemNumber);
  };

  const handleManufacturerChange = (value) => {
    console.log('[StringCombinerPanel] handleManufacturerChange called:', { value, hasOnBatchChange: !!onBatchChange });
    if (onBatchChange) {
      // BATCH: Update manufacturer and related fields in single operation
      const updates = [
        ['combiner_panel_make', value],
        ['combiner_panel_model', ''],
      ];

      // ALWAYS include toggle - use existing value or default to false (New)
      updates.push(['combiner_panel_existing', formData.combiner_panel_existing ?? false]);



      // Clear Bus Amps and Main Breaker fields when Enphase is selected
      if (value === 'Enphase') {
        updates.push(['combiner_panel_bus_amps', '']);
        updates.push(['combiner_panel_main_breaker', '']);
      }

      console.log('[StringCombinerPanel] Calling onBatchChange with updates:', updates);
      onBatchChange(updates);
    } else {
      // Fallback: Sequential onChange (backwards compatibility)
      onChange('combiner_panel_make', value, systemNumber);
      onChange('combiner_panel_model', '', systemNumber);

      // ALWAYS save toggle - use existing value or default to false (New)
      onChange('combiner_panel_existing', formData.combiner_panel_existing ?? false, systemNumber);

      if (value === 'Enphase') {
        onChange('combiner_panel_bus_amps', '', systemNumber);
        onChange('combiner_panel_main_breaker', '', systemNumber);
      }
    }

    // NEW: Clear 6C state when manufacturer changes (not a form field, so call separately)
    if (onEnphase6CChange) {
      logger.log('StringCombinerPanel', `Manufacturer changed to "${value}", clearing 6C state`);
      onEnphase6CChange(false);
    }
  };

  const handleModelChange = (value) => {
    const modelValue = value;
    onChange('combiner_panel_model', modelValue, systemNumber);

    // Auto-set bus amps if the model contains an amp rating (e.g., "200 Amps" -> 200)
    // Skip for Enphase since they don't use bus amps
    if (!isEnphase && modelValue) {
      const ampMatch = modelValue.match(/(\d+)\s*Amp/i);
      if (ampMatch) {
        const amps = ampMatch[1];
        onChange('combiner_panel_bus_amps', amps, systemNumber);
      }
    }

    // Auto-set Aggregate PV Breaker to 60A default when model is first selected (IQ Combiner 6C only)
    const is6CModel = isEnphase6CCombiner(formData.combiner_panel_make, modelValue);
    if (is6CModel && modelValue && !formData.aggregate_pv_breaker) {
      onChange('aggregate_pv_breaker', '60', systemNumber);
      logger.log('StringCombinerPanel', 'Auto-set Aggregate PV Breaker to 60A (default)');
    }

    // NEW: Notify parent of 6C combiner selection
    if (onEnphase6CChange) {
      const is6C = is6CModel;
      logger.log('StringCombinerPanel', `6C Detection: make="${formData.combiner_panel_make}", model="${modelValue}", is6C=${is6C}`);
      onEnphase6CChange(is6C);
    }
  };

  const handleClearTieInBreaker = () => {
    onChange('combiner_panel_tie_in_breaker', '', systemNumber);
    setEditTieInBreaker(false);
  };

  // ============================================
  // STRINGING HANDLERS
  // ============================================

  // Handle stringing type change (auto/custom)
  const handleStringingTypeChange = (type) => {
    // If switching from custom to auto, check if there's data to clear
    if (type === 'auto' && stringingType === 'custom') {
      // Check if there's any custom data
      let hasCustomData = false;
      for (let i = 1; i <= 10; i++) {
        if (formData[`branch_string_${i}`] ||
            formData[`branch_string_${i}_type1`] ||
            formData[`branch_string_${i}_type2`] ||
            formData[`branch_string_${i}_panel_type`]) {
          hasCustomData = true;
          break;
        }
      }

      if (hasCustomData) {
        // Show confirmation modal
        setShowResetConfirmModal(true);
        return;
      }
    }

    // Proceed with the change
    confirmStringingTypeChange(type);
  };

  // Confirm and execute stringing type change
  const confirmStringingTypeChange = (type) => {
    onChange('stringing_type', type, systemNumber);

    // Clear all branch data when switching to auto
    if (type === 'auto') {
      for (let i = 1; i <= 10; i++) {
        onChange(`branch_string_${i}`, '', systemNumber);
        onChange(`branch_string_${i}_panel_type`, '', systemNumber);
        onChange(`branch_string_${i}_type1`, '', systemNumber);
        onChange(`branch_string_${i}_type2`, '', systemNumber);
      }
    }

    setShowResetConfirmModal(false);
  };

  // Handle branch panel qty change
  const handleBranchStringChange = (index, value, subType = null) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (subType) {
      // For "Both" mode, update the specific type's quantity
      onChange(`branch_string_${index}_type${subType}`, numericValue, systemNumber);
    } else {
      onChange(`branch_string_${index}`, numericValue, systemNumber);
    }
  };

  // Handle branch panel type change
  const handleBranchPanelTypeChange = (index, panelType) => {
    const oldPanelType = formData[`branch_string_${index}_panel_type`];
    onChange(`branch_string_${index}_panel_type`, panelType, systemNumber);

    // If switching away from "Both", clear the split fields
    if (oldPanelType === 'both' && panelType !== 'both') {
      onChange(`branch_string_${index}_type1`, '', systemNumber);
      onChange(`branch_string_${index}_type2`, '', systemNumber);
      onChange(`branch_string_${index}_micro_type1`, '', systemNumber);
      onChange(`branch_string_${index}_micro_type2`, '', systemNumber);
    }

    // If switching to "Both", clear the single field
    if (panelType === 'both' && oldPanelType !== 'both') {
      onChange(`branch_string_${index}`, '', systemNumber);
    }
  };

  // Handle micro type change for "Both" mode sub-rows
  const handleMicroTypeChange = (branchIndex, microType, subType) => {
    onChange(`branch_string_${branchIndex}_micro_type${subType}`, microType, systemNumber);
  };

  // Auto-calculate distribution
  const handleAutoCalculate = () => {
    if (totalPanelQty <= 0) return;

    let distribution;

    if (isDualQtyMode && specs) {
      distribution = calculateDualQtyDistribution(totalPanelQty, specs, maxBranches);
    } else {
      distribution = distributeStandardMicros(totalPanelQty, maxPanelsPerBranch, maxBranches);
    }

    if (!distribution || !distribution.branches) return;

    // Clear all branches first
    for (let i = 1; i <= 10; i++) {
      onChange(`branch_string_${i}`, '', systemNumber);
    }

    // Populate with calculated values
    distribution.branches.forEach((branch) => {
      const i = branch.branchIndex;
      onChange(`branch_string_${i}`, String(branch.panelQty || 0), systemNumber);
    });
  };

  // Prepare rows for StringingGrid
  const prepareGridRows = () => {
    const rows = [];

    for (let i = 0; i < maxBranches; i++) {
      const index = i + 1;
      const panelType = formData[`branch_string_${index}_panel_type`] || '';

      if (panelType === 'both') {
        // Create a parent row with two sub-rows for "Both" - one for Type 1 and one for Type 2
        const type1Value = formData[`branch_string_${index}_type1`] || '';
        const type2Value = formData[`branch_string_${index}_type2`] || '';
        const microType1 = formData[`branch_string_${index}_micro_type1`] || '';
        const microType2 = formData[`branch_string_${index}_micro_type2`] || '';

        rows.push({
          id: `${index}_both`,
          index,
          panelType: 'both',
          isSplit: true,
          isParent: true,
          subRows: [
            {
              id: `${index}_type1`,
              index,
              subType: 1,
              displayValue: type1Value === '' || type1Value === '0' ? '' : type1Value,
              panelQtyValue: isDualQtyMode ? (type1Value === '' || type1Value === '0' ? '' : type1Value) : undefined,
              actualPanelType: '1',
              microType: microType1,
            },
            {
              id: `${index}_type2`,
              index,
              subType: 2,
              displayValue: type2Value === '' || type2Value === '0' ? '' : type2Value,
              panelQtyValue: isDualQtyMode ? (type2Value === '' || type2Value === '0' ? '' : type2Value) : undefined,
              actualPanelType: '2',
              microType: microType2,
            }
          ],
        });
      } else {
        // Single row for Type 1, Type 2, or no selection
        const value = formData[`branch_string_${index}`] || '';
        const displayValue = value === '' || value === '0' ? '' : value;

        rows.push({
          id: index,
          index,
          displayValue,
          panelQtyValue: isDualQtyMode ? displayValue : undefined,
          panelType,
          isSplit: false,
        });
      }
    }

    return rows;
  };

  // Column labels
  const columnLabels = isDualQtyMode
    ? { col1: 'Branch', col3: 'Panel Qty', col4: 'Micro Qty' }
    : { col1: 'Branch', col4: 'Panel Qty' };

  // Check if we have combiner panel configured
  const hasCombinerPanel = formData.combiner_panel_make && formData.combiner_panel_model;

  // Build comprehensive subtitle with all selections
  const getSubtitle = () => {
    if (isNoCombiner) return 'No String Combiner Panel';
    if (!hasCombinerPanel) return '';

    // Quantity (always 1) with New/Existing indicator
    const statusLetter = formData.combiner_panel_existing !== true ? 'N' : 'E';
    const parts = [`1 (${statusLetter}) ${formData.combiner_panel_make} ${formData.combiner_panel_model}`];

    // Custom Stringing Configuration
    if (stringingType === 'custom' && totalPanelQty > 0) {
      const branchConfigs = [];
      for (let i = 1; i <= maxBranches; i++) {
        const panelQty = formData[`branch_string_${i}`];
        if (panelQty && parseInt(panelQty) > 0) {
          branchConfigs.push(`B${i}: ${panelQty}`);
        }
      }

      if (branchConfigs.length > 0) {
        parts.push(branchConfigs.join(', '));
      }

      // Remaining panels (show in red if > 0)
      if (panelsRemaining !== 0) {
        const remainingText = panelsRemaining > 0 ? `R: ${panelsRemaining}` : `Over: ${Math.abs(panelsRemaining)}`;
        parts.push(remainingText);
      }
    }

    return parts.join(' | ');
  };

  // Debug logging
  logger.debug('StringCombinerPanel', `Stringing visibility check:`, {
    hasCombinerPanel,
    totalPanelQty,
    solarPanelQty,
    solarPanelQty2,
    shouldShow: hasCombinerPanel && totalPanelQty > 0,
    inverterMake,
    inverterModel,
  });

  return (
    <div style={{ marginBottom: 'var(--spacing-xs)' }}>
      <EquipmentRow
        title="String Combiner Panel"
        subtitle={getSubtitle()}
        onDelete={handleDelete}
        showNewExistingToggle={!isNoCombiner}
        isExisting={formData.combiner_panel_existing}
        onExistingChange={(val) => {
          console.log('[StringCombiner] Toggle changed to:', val ? 'Existing' : 'New');
          onChange('combiner_panel_existing', val, systemNumber);
        }}
        toggleRowRightContent={
          !isNoCombiner && !formData.combiner_panel_make ? (
            <TableRowButton
              label="No Combiner Panel"
              variant="outline"
              onClick={() => {
                onChange('combiner_panel_make', 'No String Combiner Panel', systemNumber);
                onChange('combiner_panel_model', '', systemNumber);
                onChange('combiner_panel_main_breaker', 'MLO', systemNumber);
              }}
            />
          ) : null
        }
        headerRightContent={
          <PreferredButton onClick={() => setShowPreferredModal(true)} />
        }
      >
        {/* Show "No String Combiner Panel Selected" indicator when selected */}
        {isNoCombiner && (
          <div style={{
            padding: 'var(--spacing-tight) var(--spacing)',
            borderBottom: 'var(--border-thin) solid var(--border-subtle)',
          }}>
            <Alert variant="info">
              This system does not require a String Combiner Panel. Microinverters connect directly to the main panel.
            </Alert>
          </div>
        )}

        {/* Make & Model - Hide when "No String Combiner Panel" is selected */}
        {!isNoCombiner && (
          <>
            <TableDropdown
              label="Make"
              value={formData.combiner_panel_make || ''}
              onChange={handleManufacturerChange}
              options={manufacturers.map(m => ({ value: m, label: m }))}
              placeholder={loadingMakes ? 'Loading...' : 'Select make'}
              disabled={loadingMakes}
              showSearch={true}
            />

            <TableDropdown
              label="Model"
              value={formData.combiner_panel_model || ''}
          onChange={handleModelChange}
          options={models.map(m => ({ value: m.value, label: m.label }))}
          placeholder={
            loadingModels ? 'Loading...' :
            formData.combiner_panel_make ? 'Select model' :
            'Select make first'
          }
          disabled={!formData.combiner_panel_make || loadingModels}
        />

        {/* Bus Amps - Hidden for Enphase */}
        {!isEnphase && (
          <TableDropdown
            label="Bus (Amps)"
            value={formData.combiner_panel_bus_amps || ''}
            onChange={(value) => onChange('combiner_panel_bus_amps', value, systemNumber)}
            options={busAmpOptions.map(amps => ({ value: amps, label: amps.toString() }))}
            placeholder="Select amps"
          />
        )}

        {/* Main Circuit Breaker - Hidden for Enphase */}
        {!isEnphase && (
          <TableDropdown
            label="Main Circuit Breaker (Amps)"
            value={formData.combiner_panel_main_breaker || 'MLO'}
            onChange={(value) => onChange('combiner_panel_main_breaker', value, systemNumber)}
            options={mainBreakerOptions.map(option => ({ value: option, label: option.toString() }))}
            placeholder="Select breaker"
            wrapLabel={true}
          />
        )}

        {/* Tie-in Breaker */}
        <FormFieldRow label="Tie-in Breaker">
          <TableRowButton
            label="Auto"
            variant="outline"
            active={!editTieInBreaker}
            onClick={() => {
              handleClearTieInBreaker();
            }}
          />
          <TableRowButton
            label="Custom"
            variant="outline"
            active={editTieInBreaker}
            onClick={() => setEditTieInBreaker(true)}
          />
          {!editTieInBreaker && (
            <div style={{ display: 'inline-flex' }}>
              <Tooltip
                content={
                  <>
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '0 var(--spacing) 0 0' }}>
                      <img src={flameIcon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
                      Tie-in Breaker will auto size to protect Max Continuous Output × 1.25.
                    </div>
                  </>
                }
                position="bottom"
                className="alertTooltip"
              >
                <img src={flameIcon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', cursor: 'help' }} />
              </Tooltip>
            </div>
          )}
        </FormFieldRow>
        {editTieInBreaker && (
          <TableDropdown
            label="Breaker Rating"
            value={formData.combiner_panel_tie_in_breaker || ''}
            onChange={(value) => onChange('combiner_panel_tie_in_breaker', value, systemNumber)}
            options={tieInBreakerOptions.map(rating => ({ value: rating, label: rating.toString() }))}
            placeholder="Select rating..."
          />
        )}

        {/* STRINGING SECTION - Only show if combiner panel is configured and panels exist */}
        {hasCombinerPanel && totalPanelQty > 0 && (
          <>
            {/* Auto/Custom Toggle */}
            <FormFieldRow label="Stringing">
              <TableRowButton
                label="Auto"
                variant="outline"
                active={stringingType === 'auto'}
                onClick={() => handleStringingTypeChange('auto')}
              />
              <TableRowButton
                label="Custom"
                variant="outline"
                active={stringingType === 'custom'}
                onClick={() => handleStringingTypeChange('custom')}
              />
              {stringingType === 'auto' && (
                <div style={{ display: 'inline-flex' }}>
                  <Tooltip
                    content={
                      <>
                        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '0 var(--spacing) 0 0' }}>
                          <img src={flameIcon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                        </div>
                        <div style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
                          Stringing will auto-size to distribute total quantity in Solar Panel 1
                          {solarPanelQty2 > 0 && ' and Type 2'} across branches within manufacturer limits.
                        </div>
                      </>
                    }
                    position="bottom"
                    className="alertTooltip"
                  >
                    <img src={flameIcon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', cursor: 'help' }} />
                  </Tooltip>
                </div>
              )}
            </FormFieldRow>

            {/* Custom Stringing Interface */}
            {stringingType === 'custom' && (
              <div style={{ padding: 'var(--spacing)' }}>
                {/* Specs Info Display (for dual-qty microinverters) */}
                {isDualQtyMode && specs && (
                  <Alert variant="info" collapsible={false} style={{ marginBottom: 'var(--spacing)' }}>
                    <strong>{inverterModel}</strong>: {specs.panelRatio} ratio •
                    Max {specs.maxUnitsBranch} micros/branch •
                    Max {specs.maxPanelsBranch} panels/branch
                  </Alert>
                )}

                {/* Panels Remaining & Auto Distribute Row */}
                {totalPanelQty > 0 && (
                  <>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: 'var(--spacing)',
                      paddingLeft: 0,
                      paddingRight: 0,
                      borderBottom: 'var(--border-thin) solid var(--border-subtle)',
                      marginBottom: '1rem'
                    }}>
                      <TableRowButton
                        variant="outline"
                        onClick={handleAutoCalculate}
                        label="Auto Distribute Remaining"
                      />
                      <div style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-medium)',
                        color: 'var(--text-secondary)'
                      }}>
                        Remaining Panels: <span style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-semibold)' }}>
                          {panelsRemaining >= 0 ? panelsRemaining : 0}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Stringing Grid */}
                <StringingGrid
                  rows={prepareGridRows()}
                  panelsRemaining={panelsRemaining}
                  columnLabels={columnLabels}
                  mode={isDualQtyMode ? 'dual-qty' : 'standard'}
                  maxPanelsPerBranch={maxPanelsPerBranch}
                  onChange={handleBranchStringChange}
                  onPanelQtyChange={undefined}
                  onPanelTypeChange={handleBranchPanelTypeChange}
                  onMicroTypeChange={handleMicroTypeChange}
                  showPanelType={solarPanelQty2 > 0}
                  panelType1Label={panelType1Label}
                  panelType2Label={panelType2Label}
                  onFocus={setActiveStringInput}
                  onBlur={() => setActiveStringInput(null)}
                  activeInput={activeStringInput}
                  hideRemainingPanels={true}
                />
              </div>
            )}
          </>
        )}

        {/* AGGREGATE BREAKER FIELDS - Show only for IQ Combiner 6C */}
        {is6C && (
          <>
            {/* Aggregate PV Breaker */}
            <FormFieldRow label="Aggregate PV Breaker">
              <TableRowButton
                label="60A"
                variant="outline"
                active={formData.aggregate_pv_breaker === '60'}
                onClick={() => onChange('aggregate_pv_breaker', '60', systemNumber)}
              />
              <TableRowButton
                label="80A"
                variant="outline"
                active={formData.aggregate_pv_breaker === '80'}
                onClick={() => onChange('aggregate_pv_breaker', '80', systemNumber)}
              />
              <TableRowButton
                label="100A"
                variant="outline"
                active={formData.aggregate_pv_breaker === '100'}
                onClick={() => onChange('aggregate_pv_breaker', '100', systemNumber)}
              />
            </FormFieldRow>

            {/* Aggregate EV Breaker */}
            {/* SUPPRESSED FOR NOW */}
            {/* <TableDropdown
              label="Aggregate EV Breaker"
              value={formData.aggregate_ev_breaker || ''}
              onChange={(value) => onChange('aggregate_ev_breaker', value, systemNumber)}
              options={[
                { value: '20', label: '20A' },
                { value: '40', label: '40A' },
                { value: '60', label: '60A' },
                { value: '80', label: '80A' },
                { value: '100', label: '100A' },
              ]}
              placeholder="Select breaker size"
            /> */}
          </>
        )}

        {/* Add String Combiner BOS Button - Show inside when combiner panel is configured but BOS not yet added */}
        {hasCombinerPanel && !formData.show_inverter_bos && (
          <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--spacing-tight) var(--spacing)' }}>
            <TableRowButton
              label="+ String Combiner BOS (Type 1)"
              variant="outline"
              onClick={() => onChange('show_inverter_bos', true, systemNumber)}
              style={{ width: '100%' }}
            />
          </div>
        )}
          </>
        )}
      </EquipmentRow>

      {/* BOS Equipment - Only show if flag is set */}
      {hasCombinerPanel && formData.show_inverter_bos && (
        <BOSEquipmentSection
          formData={formData}
          onChange={onChange}
          section="utility"
          systemNumber={systemNumber}
          maxContinuousOutputAmps={maxContinuousOutputAmps}
          loadingMaxOutput={loadingMaxOutput}
        />
      )}

      {/* Preferred Equipment Modal */}
      <PreferredEquipmentModal
        isOpen={showPreferredModal}
        onClose={() => setShowPreferredModal(false)}
        onSelect={handlePreferredSelect}
        onSelectOther={handleSelectOther}
        equipmentType="string-combiner"
        title="Select String Combiner Panel"
      />

      {/* Confirm Stringing Type Change Modal */}
      <ConfirmActionModal
        isOpen={showResetConfirmModal}
        onClose={() => setShowResetConfirmModal(false)}
        onConfirm={() => confirmStringingTypeChange('auto')}
        title="Reset Stringing Data?"
        message="Switching to Auto will reset all custom stringing data. This action cannot be undone."
        confirmText="Reset and Continue"
        cancelText="Cancel"
      />
    </div>
  );
};

const areCombinerPropsEqual = (prevProps, nextProps) => {
  if (prevProps.systemNumber !== nextProps.systemNumber) return false;

  const relevantFields = [
    'combiner_panel_make', 'combiner_panel_model', 'combiner_panel_existing',
    'combiner_panel_main_breaker', 'combiner_panel_bus_rating',
    'stringing_type', 'aggregate_pv_breaker',
    'solar_panel_make', 'solar_panel_model', 'solar_panel_quantity',
    'solar_panel_type2_manufacturer', 'solar_panel_type2_model', 'solar_panel_type2_quantity',
    'inverter_make', 'inverter_model', 'inverter_type',
    // Microinverter stringing (micro1Panels through micro25Panels)
    ...Array.from({ length: 25 }, (_, i) => `micro${i + 1}Panels`),
  ];

  for (const field of relevantFields) {
    if (prevProps.formData?.[field] !== nextProps.formData?.[field]) {
      return false;
    }
  }

  return true;
};

export default memo(StringCombinerPanelSection, areCombinerPropsEqual);
