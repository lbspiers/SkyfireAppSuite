import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import { EquipmentRow, FormFieldRow, TableDropdown, TableRowButton, Alert, Button, Divider, PreferredButton, AddSectionButton } from '../../ui';
import Tooltip from '../../ui/Tooltip';
import { PreferredEquipmentModal } from '../../equipment';
import StringingGrid from './StringingGrid';
import flameIcon from '../../../assets/images/Skyfire Flame Icon.png';
import BOSEquipmentSection from './BOSEquipmentSection';
import styles from '../../../styles/ProjectAdd.module.css';
import equipStyles from '../EquipmentForm.module.css';
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

  // Ref to track if we've auto-set aggregate_pv_breaker to prevent loops
  const hasAutoSetAggregateBreaker = useRef(false);

  // Derived stringing values
  const totalPanelQty = solarPanelQty + solarPanelQty2;
  const stringingType = formData.stringing_type || 'auto';

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
      onChange('combiner_panel_main_breaker', 'MLO');
    }
  }, []);

  // Set default New/Existing toggle to New on mount if combiner panel is configured but toggle not set
  useEffect(() => {
    const hasCombiner = formData.combiner_panel_make || formData.combiner_panel_model;
    if (hasCombiner && formData.combiner_panel_isnew === undefined) {
      onChange('combiner_panel_isnew', true); // Default to New
    }
  }, [formData.combiner_panel_make, formData.combiner_panel_model, formData.combiner_panel_isnew, onChange]);

  // Auto-set Aggregate PV Breaker to 60A for IQ Combiner 6C (only once)
  useEffect(() => {
    if (is6C && !formData.aggregate_pv_breaker && !hasAutoSetAggregateBreaker.current) {
      hasAutoSetAggregateBreaker.current = true;
      console.log('🔥 useEffect: AUTO-SETTING aggregate_pv_breaker to 60A for 6C model');
      onChange('aggregate_pv_breaker', '60');
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
    onChange('combiner_panel_make', '');
    onChange('combiner_panel_model', '');
    onChange('combiner_panel_bus_amps', '');
    onChange('combiner_panel_main_breaker', 'MLO');
    onChange('combiner_panel_tie_in_breaker', '');
    onChange('combiner_panel_isnew', true);

    // NEW: Clear 6C state
    if (onEnphase6CChange) {
      onEnphase6CChange(false);
    }
  };

  // Preferred equipment handlers
  const handlePreferredSelect = (selected) => {
    onChange('combiner_panel_make', selected.make);
    onChange('combiner_panel_model', selected.model);
  };

  const handleSelectOther = () => {
    onChange('combiner_panel_make', '');
    onChange('combiner_panel_model', '');
  };

  const handleManufacturerChange = (value) => {
    if (onBatchChange) {
      // BATCH: Update manufacturer and related fields in single operation
      const updates = [
        ['combiner_panel_make', value],
        ['combiner_panel_model', ''],
      ];

      // Only include isnew if it's already been set by the user
      if (formData.combiner_panel_isnew !== undefined) {
        updates.push(['combiner_panel_isnew', formData.combiner_panel_isnew]);
      }

      // Clear Bus Amps and Main Breaker fields when Enphase is selected
      if (value === 'Enphase') {
        updates.push(['combiner_panel_bus_amps', '']);
        updates.push(['combiner_panel_main_breaker', '']);
      }

      onBatchChange(updates);
    } else {
      // Fallback: Sequential onChange (backwards compatibility)
      onChange('combiner_panel_make', value);
      onChange('combiner_panel_model', '');

      // Only save isnew if it's already been set
      if (formData.combiner_panel_isnew !== undefined) {
        onChange('combiner_panel_isnew', formData.combiner_panel_isnew);
      }

      if (value === 'Enphase') {
        onChange('combiner_panel_bus_amps', '');
        onChange('combiner_panel_main_breaker', '');
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
    onChange('combiner_panel_model', modelValue);

    // Auto-set bus amps if the model contains an amp rating (e.g., "200 Amps" -> 200)
    // Skip for Enphase since they don't use bus amps
    if (!isEnphase && modelValue) {
      const ampMatch = modelValue.match(/(\d+)\s*Amp/i);
      if (ampMatch) {
        const amps = ampMatch[1];
        onChange('combiner_panel_bus_amps', amps);
      }
    }

    // Auto-set Aggregate PV Breaker to 60A default when model is first selected (IQ Combiner 6C only)
    const is6CModel = isEnphase6CCombiner(formData.combiner_panel_make, modelValue);
    if (is6CModel && modelValue && !formData.aggregate_pv_breaker) {
      onChange('aggregate_pv_breaker', '60');
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
    onChange('combiner_panel_tie_in_breaker', '');
    setEditTieInBreaker(false);
  };

  // ============================================
  // STRINGING HANDLERS
  // ============================================

  // Handle stringing type change (auto/custom)
  const handleStringingTypeChange = (type) => {
    onChange('stringing_type', type);

    // Clear all branch data when switching to auto
    if (type === 'auto') {
      for (let i = 1; i <= 10; i++) {
        onChange(`branch_string_${i}`, '');
      }
    }
  };

  // Handle branch panel qty change
  const handleBranchStringChange = (index, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    onChange(`branch_string_${index}`, numericValue);
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
      onChange(`branch_string_${i}`, '');
    }

    // Populate with calculated values
    distribution.branches.forEach((branch) => {
      const i = branch.branchIndex;
      onChange(`branch_string_${i}`, String(branch.panelQty || 0));
    });
  };

  // Prepare rows for StringingGrid
  const prepareGridRows = () => {
    return Array.from({ length: maxBranches }, (_, i) => {
      const index = i + 1;
      const value = formData[`branch_string_${index}`] || '';
      const displayValue = value === '' || value === '0' ? '' : value;

      return {
        id: index,
        index,
        displayValue,
        panelQtyValue: isDualQtyMode ? displayValue : undefined,
        isNew: true,
      };
    });
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
    const statusLetter = formData.combiner_panel_isnew !== false ? 'N' : 'E';
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
        headerRightContent={
          <PreferredButton onClick={() => setShowPreferredModal(true)} />
        }
      >
        {/* Row 1: No String Combiner Panel Button - Show when no make is selected */}
        {!formData.combiner_panel_make && (
          <div style={{
            borderBottom: 'var(--border-thin) solid var(--border-subtle)',
          }}>
            <TableRowButton
              label="No String Combiner Panel"
              variant="outline"
              onClick={() => {
                onChange('combiner_panel_make', 'No String Combiner Panel');
                onChange('combiner_panel_model', '');
                onChange('combiner_panel_main_breaker', 'MLO');
              }}
              style={{ width: '100%' }}
            />
          </div>
        )}

        {/* Row 2: New/Existing Toggle - Always visible (except when "No String Combiner Panel") */}
        {!isNoCombiner && (
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-tight)',
            padding: 'var(--spacing-tight) var(--spacing)',
            borderBottom: 'var(--border-thin) solid var(--border-subtle)',
          }}>
            <TableRowButton
              label="New"
              variant="outline"
              active={formData.combiner_panel_isnew !== false}
              onClick={() => onChange('combiner_panel_isnew', true)}
            />
            <TableRowButton
              label="Existing"
              variant="outline"
              active={formData.combiner_panel_isnew === false}
              onClick={() => onChange('combiner_panel_isnew', false)}
            />
          </div>
        )}

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
            onChange={(value) => onChange('combiner_panel_bus_amps', value)}
            options={busAmpOptions.map(amps => ({ value: amps, label: amps.toString() }))}
            placeholder="Select amps"
          />
        )}

        {/* Main Circuit Breaker - Hidden for Enphase */}
        {!isEnphase && (
          <TableDropdown
            label="Main Circuit Breaker (Amps)"
            value={formData.combiner_panel_main_breaker || 'MLO'}
            onChange={(value) => onChange('combiner_panel_main_breaker', value)}
            options={mainBreakerOptions.map(option => ({ value: option, label: option.toString() }))}
            placeholder="Select breaker"
          />
        )}

        {/* Tie-in Breaker */}
        <FormFieldRow label="Tie-in Breaker">
          <TableRowButton
            label="Auto"
            variant="secondary"
            active={!editTieInBreaker}
            onClick={() => {
              handleClearTieInBreaker();
            }}
          />
          <TableRowButton
            label="Custom"
            variant="secondary"
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
            onChange={(value) => onChange('combiner_panel_tie_in_breaker', value)}
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
                variant="secondary"
                active={stringingType === 'auto'}
                onClick={() => handleStringingTypeChange('auto')}
              />
              <TableRowButton
                label="Custom"
                variant="secondary"
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

                {/* Auto-Calculate Button */}
                {totalPanelQty > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 'var(--spacing)' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAutoCalculate}
                    >
                      Auto-Calculate Distribution
                    </Button>
                  </div>
                )}

                {/* Stringing Grid */}
                <StringingGrid
                  rows={prepareGridRows()}
                  panelsRemaining={panelsRemaining}
                  columnLabels={columnLabels}
                  mode={isDualQtyMode ? 'dual-qty' : 'standard'}
                  maxPanelsPerBranch={maxPanelsPerBranch}
                  onToggle={undefined}
                  onChange={handleBranchStringChange}
                  onPanelQtyChange={undefined}
                  onFocus={setActiveStringInput}
                  onBlur={() => setActiveStringInput(null)}
                  activeInput={activeStringInput}
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
                onClick={() => onChange('aggregate_pv_breaker', '60')}
              />
              <TableRowButton
                label="80A"
                variant="outline"
                active={formData.aggregate_pv_breaker === '80'}
                onClick={() => onChange('aggregate_pv_breaker', '80')}
              />
              <TableRowButton
                label="100A"
                variant="outline"
                active={formData.aggregate_pv_breaker === '100'}
                onClick={() => onChange('aggregate_pv_breaker', '100')}
              />
            </FormFieldRow>

            {/* Aggregate EV Breaker */}
            {/* SUPPRESSED FOR NOW */}
            {/* <TableDropdown
              label="Aggregate EV Breaker"
              value={formData.aggregate_ev_breaker || ''}
              onChange={(value) => onChange('aggregate_ev_breaker', value)}
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
              onClick={() => onChange('show_inverter_bos', true)}
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
    </div>
  );
};

export default memo(StringCombinerPanelSection);
