import React, { useState, useEffect, useRef } from 'react';
import { EquipmentRow, FormFieldRow, TableRowButton, TableDropdown, AddButton, ConfirmDialog, SectionClearModal, SectionRemoveModal, PreferredButton, ActionSectionButton, Tooltip } from '../../ui';
import { PreferredEquipmentModal } from '../../equipment';
import styles from '../../../styles/ProjectAdd.module.css';
import logger from '../../../services/devLogger';
import { useEquipmentCatalog } from '../../../hooks/useEquipmentCatalog';
import { useSectionDelete, DELETE_BEHAVIOR } from '../../../hooks/useSectionDelete';
import flameIcon from '../../../assets/images/Skyfire Flame Icon.png';

/**
 * Solar Panel Section
 * Handles solar panel configuration with EquipmentRow display
 * Fields are always editable dropdowns (no edit mode)
 */
const SolarPanelSection = ({ formData, onChange, onBatchChange, systemNumber = 1 }) => {
  // Render counter for diagnostics
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current += 1;
  });

  // Use shared equipment catalog
  const {
    solarPanelMakes,
    solarPanelMakesLoading,
    loadSolarPanelMakes,
    getSolarPanelModels,
    loadSolarPanelModels
  } = useEquipmentCatalog();

  const [selectedModelData, setSelectedModelData] = useState(null);
  const hasAutoPopulatedRef = useRef(false);
  const lastProcessedModelRef = useRef(null);

  // Component-level field names (unprefixed)
  // EquipmentForm's handleFieldChange will map these to the correct database field names
  // using the field mapping and getSchemaField for system-specific handling
  const batteryOnlyField = 'batteryonly';
  const solarPanelMakeField = 'solar_panel_make';
  const solarPanelModelField = 'solar_panel_model';
  const solarPanelModelIdField = 'solar_panel_model_id';
  const solarPanelQuantityField = 'solar_panel_quantity';
  const solarPanelWattageField = 'solar_panel_wattage';
  const solarPanelExistingField = 'solar_panel_existing';
  const solarPanelVocField = 'solar_panel_voc';
  const solarPanelIscField = 'solar_panel_isc';
  const solarPanelVmpField = 'solar_panel_vmp';
  const solarPanelImpField = 'solar_panel_imp';
  const solarPanelTempCoeffField = 'solar_panel_temp_coeff_voc';
  const systemTypeField = 'system_type';

  const [batteryOnlyMode, setBatteryOnlyMode] = useState(formData[batteryOnlyField] === true);
  const [showBatteryOnlyConfirm, setShowBatteryOnlyConfirm] = useState(false);
  const [showType2Confirm, setShowType2Confirm] = useState(false);
  const [showPreferredModal, setShowPreferredModal] = useState(false);
  const [useFullCatalog, setUseFullCatalog] = useState(false);
  const [showSystemTypeChangeConfirm, setShowSystemTypeChangeConfirm] = useState(false);
  const [pendingSystemType, setPendingSystemType] = useState(null);

  // Check if we have a solar panel configured
  const hasSolarPanel = formData[solarPanelMakeField] && formData[solarPanelModelField];

  // Determine title based on Battery Only mode and Type 2 visibility
  const sectionTitle = batteryOnlyMode
    ? "Battery Only"
    : (formData.show_solar_panel_2
        ? "Solar Panel (Type 1)"
        : "Solar Panel");

  // Sync batteryOnlyMode state with formData battery only field when it changes (for persistence)
  useEffect(() => {
    setBatteryOnlyMode(formData[batteryOnlyField] === true);
  }, [formData[batteryOnlyField], batteryOnlyField]);

  // Load manufacturers on mount using shared catalog
  useEffect(() => {
    loadSolarPanelMakes();
  }, [loadSolarPanelMakes]);

  // Set default New/Existing toggle to New on mount if solar panel is configured but toggle not set
  useEffect(() => {
    const hasSolarPanel = formData[solarPanelMakeField] || formData[solarPanelModelField];
    // Use == null to catch both undefined AND null
    if (hasSolarPanel && formData[solarPanelExistingField] == null) {
      onChange(solarPanelExistingField, true); // Default to New
    }
  }, [formData[solarPanelMakeField], formData[solarPanelModelField], formData[solarPanelExistingField], onChange, solarPanelMakeField, solarPanelModelField, solarPanelExistingField]);

  // Load models when manufacturer changes using shared catalog
  useEffect(() => {
    if (formData[solarPanelMakeField]) {
      // Reset auto-populate flag when manufacturer changes
      hasAutoPopulatedRef.current = false;
      loadSolarPanelModels(formData[solarPanelMakeField]);
    } else {
      setSelectedModelData(null);
      hasAutoPopulatedRef.current = false;
      lastProcessedModelRef.current = null;
    }
  }, [formData[solarPanelMakeField], loadSolarPanelModels]);

  // Get current models from shared catalog
  const currentModels = getSolarPanelModels(formData[solarPanelMakeField]);

  // Extract model data when models change and auto-populate wattage
  // Use ref to prevent infinite re-population loops
  useEffect(() => {
    if (formData[solarPanelModelField] && currentModels.length > 0 && lastProcessedModelRef.current !== formData[solarPanelModelField]) {
      const modelData = currentModels.find(m =>
        m.model === formData[solarPanelModelField] || m.model_number === formData[solarPanelModelField]
      );

      if (modelData && !hasAutoPopulatedRef.current) {
        // Mark as processed to prevent duplicate calls
        hasAutoPopulatedRef.current = true;
        lastProcessedModelRef.current = formData[solarPanelModelField];

        setSelectedModelData(modelData);

        // Auto-populate wattage and model ID
        // Use parseFloat comparison to handle string/number type mismatches
        const updates = [];
        const currentWattage = parseFloat(formData[solarPanelWattageField]) || 0;
        const newWattage = parseFloat(modelData.nameplate_pmax) || 0;

        if (newWattage && Math.abs(currentWattage - newWattage) > 0.01) {
          updates.push([solarPanelWattageField, String(modelData.nameplate_pmax)]);
        }

        const currentModelId = formData[solarPanelModelIdField];
        if (modelData.id && modelData.id !== currentModelId) {
          updates.push([solarPanelModelIdField, modelData.id]);
        }

        // Batch update if we have changes
        if (updates.length > 0) {
          if (onBatchChange) {
            onBatchChange(updates, systemNumber);
          } else {
            // Fallback to individual calls if no batch handler
            updates.forEach(([field, value]) => onChange(field, value, systemNumber));
          }
        }
      } else if (!modelData) {
        setSelectedModelData(null);
      }
    }
  }, [formData[solarPanelModelField], currentModels, formData[solarPanelWattageField], formData[solarPanelModelIdField], onBatchChange, onChange]);

  // Wrapper to save toggle defaults when any field changes
  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value, systemNumber);
    // Also save New/Existing toggle default if not already set
    // Use == null to catch both undefined AND null
    if (formData[solarPanelExistingField] == null) {
      onChange(solarPanelExistingField, true, systemNumber);
    }
  };

  const handleManufacturerChange = (value) => {
    // Reset auto-populate tracking when make changes
    hasAutoPopulatedRef.current = false;
    lastProcessedModelRef.current = null;

    if (onBatchChange) {
      // Batch all updates into a single call
      const updates = [
        [solarPanelMakeField, value],
        [solarPanelModelField, ''],
        [solarPanelWattageField, ''],
        // ALWAYS include toggle - use existing value or default to true (nullish coalescing)
        [solarPanelExistingField, formData[solarPanelExistingField] ?? true],
      ];
      onBatchChange(updates, systemNumber);
    } else {
      handleFieldChange(solarPanelMakeField, value);
      onChange(solarPanelModelField, '', systemNumber); // Clear model when manufacturer changes
      onChange(solarPanelWattageField, '', systemNumber); // Clear wattage
    }
    setSelectedModelData(null);
  };

  const handleModelChange = (value) => {
    // Find model data and auto-populate wattage and electrical specs
    const modelData = currentModels.find(m => m.model_number === value || m.model === value);

    if (modelData && onBatchChange) {
      // BATCH all updates into a single call to parent
      setSelectedModelData(modelData);

      const voc = modelData.nameplate_voc || modelData.voc || modelData.open_circuit_voltage || '';
      const isc = modelData.nameplate_isc || modelData.isc || modelData.short_circuit_current || '';
      const vmp = modelData.nameplate_vpmax || modelData.vmp || modelData.voltage_max_power || '';
      const imp = modelData.nameplate_ipmax || modelData.imp || modelData.current_max_power || '';
      const tempCoeff = modelData.temp_coeff_voc || modelData.temperature_coefficient_voc || '';

      const updates = [
        [solarPanelModelField, value],
        [solarPanelWattageField, modelData.nameplate_pmax || ''],
        [solarPanelModelIdField, modelData.id || ''],
        [solarPanelVocField, voc],
        [solarPanelIscField, isc],
        [solarPanelVmpField, vmp],
        [solarPanelImpField, imp],
      ];

      if (tempCoeff) {
        updates.push([solarPanelTempCoeffField, tempCoeff]);
      }

      // ALWAYS include toggle - use existing value or default to true (nullish coalescing)
      updates.push([solarPanelExistingField, formData[solarPanelExistingField] ?? true]);

      onBatchChange(updates, systemNumber);
    } else {
      // Fallback to sequential onChange calls if no batch handler
      handleFieldChange(solarPanelModelField, value);

      if (modelData) {
        setSelectedModelData(modelData);

        // Auto-populate wattage from nameplate_pmax
        if (modelData.nameplate_pmax) {
          onChange(solarPanelWattageField, modelData.nameplate_pmax, systemNumber);
        }

        // Store model ID for future reference
        if (modelData.id) {
          onChange(solarPanelModelIdField, modelData.id, systemNumber);
        }

        // Store electrical specs for stringing calculations
        const voc = modelData.nameplate_voc || modelData.voc || modelData.open_circuit_voltage || '';
        const isc = modelData.nameplate_isc || modelData.isc || modelData.short_circuit_current || '';
        const vmp = modelData.nameplate_vpmax || modelData.vmp || modelData.voltage_max_power || '';
        const imp = modelData.nameplate_ipmax || modelData.imp || modelData.current_max_power || '';
        const tempCoeff = modelData.temp_coeff_voc || modelData.temperature_coefficient_voc || '';

        onChange(solarPanelVocField, voc, systemNumber);
        onChange(solarPanelIscField, isc, systemNumber);
        onChange(solarPanelVmpField, vmp, systemNumber);
        onChange(solarPanelImpField, imp, systemNumber);

        // Temperature coefficient (if available)
        if (tempCoeff) {
          onChange(solarPanelTempCoeffField, tempCoeff, systemNumber);
        }
      }
    }
  };

  // Handle preferred equipment selection
  const handlePreferredSelect = (selected) => {
    onChange(solarPanelMakeField, selected.make, systemNumber);
    onChange(solarPanelModelField, selected.model, systemNumber);
    if (selected.wattage) {
      onChange(solarPanelWattageField, selected.wattage, systemNumber);
    }
    setUseFullCatalog(false);
  };

  // Handle "Other" selection - switch to full catalog mode
  const handleSelectOther = () => {
    setUseFullCatalog(true);
    // Clear current selection to force user to choose from dropdowns
    onChange(solarPanelMakeField, '', systemNumber);
    onChange(solarPanelModelField, '', systemNumber);
  };

  const clearType2Fields = () => {
    if (onBatchChange) {
      // BATCH: Clear all Type 2 fields in single operation (14 fields → 1 call)
      const updates = [
        ['solar_panel_type2_manufacturer', ''],
        ['solar_panel_type2_model', ''],
        ['solar_panel_type2_quantity', ''],
        ['solar_panel_type2_wattage', ''],
        ['solar_panel_type2_is_new', true],
        ['solar_panel_type2_voc', ''],
        ['solar_panel_type2_isc', ''],
        ['solar_panel_type2_vmp', ''],
        ['solar_panel_type2_imp', ''],
        ['solar_panel_type2_temp_coeff_voc', ''],
        ['solar_panel_type2_model_id', ''],
        // Clear Type 2 optimizer fields
        ['optimizer_type2_make', ''],
        ['optimizer_type2_model', ''],
        ['optimizer_type2_existing', false],
      ];
      onBatchChange(updates, systemNumber);
    } else {
      // Fallback: Sequential onChange (backwards compatibility)
      onChange('solar_panel_type2_manufacturer', '', systemNumber);
      onChange('solar_panel_type2_model', '', systemNumber);
      onChange('solar_panel_type2_quantity', '', systemNumber);
      onChange('solar_panel_type2_wattage', '', systemNumber);
      onChange('solar_panel_type2_is_new', true, systemNumber);
      onChange('solar_panel_type2_voc', '', systemNumber);
      onChange('solar_panel_type2_isc', '', systemNumber);
      onChange('solar_panel_type2_vmp', '', systemNumber);
      onChange('solar_panel_type2_imp', '', systemNumber);
      onChange('solar_panel_type2_temp_coeff_voc', '', systemNumber);
      onChange('solar_panel_type2_model_id', '', systemNumber);
      // Clear Type 2 optimizer fields
      onChange('optimizer_type2_make', '', systemNumber);
      onChange('optimizer_type2_model', '', systemNumber);
      onChange('optimizer_type2_existing', false, systemNumber);
    }
  };

  const handleBatteryOnlyClick = () => {
    // Check if ANY solar panel data exists (Type 1 OR Type 2)
    const hasData = !!(
      formData[solarPanelMakeField] ||
      formData[solarPanelModelField] ||
      formData[solarPanelQuantityField] ||
      formData.solar_panel_type2_manufacturer ||
      formData.solar_panel_type2_model ||
      formData.solar_panel_type2_quantity
    );

    if (hasData) {
      setShowBatteryOnlyConfirm(true);
    } else {
      activateBatteryOnly();
    }
  };

  const activateBatteryOnly = () => {
    setBatteryOnlyMode(true);

    if (onBatchChange) {
      // BATCH: Clear all solar panel fields in single operation (22 fields → 1 call)
      // This is critical for production - prevents 22 re-renders and 22 potential API calls
      const updates = [
        // Set battery-only flag
        [batteryOnlyField, true],
        // Clear ALL Type 1 fields
        [solarPanelMakeField, null],
        [solarPanelModelField, null],
        [solarPanelModelIdField, null],
        [solarPanelQuantityField, null],
        [solarPanelWattageField, null],
        [solarPanelExistingField, null],
        [solarPanelVocField, null],
        [solarPanelIscField, null],
        [solarPanelVmpField, null],
        [solarPanelImpField, null],
        [solarPanelTempCoeffField, null],
        // Hide Type 2 and clear ALL Type 2 fields
        ['show_solar_panel_2', false],
        ['solar_panel_type2_manufacturer', null],
        ['solar_panel_type2_model', null],
        ['solar_panel_type2_model_id', null],
        ['solar_panel_type2_quantity', null],
        ['solar_panel_type2_wattage', null],
        ['solar_panel_type2_is_new', null],
        ['solar_panel_type2_voc', null],
        ['solar_panel_type2_isc', null],
        ['solar_panel_type2_vmp', null],
        ['solar_panel_type2_imp', null],
        ['solar_panel_type2_temp_coeff_voc', null],
      ];
      onBatchChange(updates, systemNumber);
    } else {
      // Fallback: Sequential onChange (backwards compatibility)
      onChange(batteryOnlyField, true, systemNumber);
      onChange(solarPanelMakeField, null, systemNumber);
      onChange(solarPanelModelField, null, systemNumber);
      onChange(solarPanelModelIdField, null, systemNumber);
      onChange(solarPanelQuantityField, null, systemNumber);
      onChange(solarPanelWattageField, null, systemNumber);
      onChange(solarPanelExistingField, null, systemNumber);
      onChange(solarPanelVocField, null, systemNumber);
      onChange(solarPanelIscField, null, systemNumber);
      onChange(solarPanelVmpField, null, systemNumber);
      onChange(solarPanelImpField, null, systemNumber);
      onChange(solarPanelTempCoeffField, null, systemNumber);
      onChange('show_solar_panel_2', false, systemNumber);
      onChange('solar_panel_type2_manufacturer', null, systemNumber);
      onChange('solar_panel_type2_model', null, systemNumber);
      onChange('solar_panel_type2_model_id', null, systemNumber);
      onChange('solar_panel_type2_quantity', null, systemNumber);
      onChange('solar_panel_type2_wattage', null, systemNumber);
      onChange('solar_panel_type2_is_new', null, systemNumber);
      onChange('solar_panel_type2_voc', null, systemNumber);
      onChange('solar_panel_type2_isc', null, systemNumber);
      onChange('solar_panel_type2_vmp', null, systemNumber);
      onChange('solar_panel_type2_imp', null, systemNumber);
      onChange('solar_panel_type2_temp_coeff_voc', null, systemNumber);
    }

    setShowBatteryOnlyConfirm(false);
  };

  const deactivateBatteryOnly = () => {
    setBatteryOnlyMode(false);
    onChange(batteryOnlyField, false, systemNumber);
    // Form is now empty and ready for input
  };

  const handleToggleType2 = () => {
    console.log('[SolarPanelSection] handleToggleType2 clicked', {
      systemNumber,
      'formData.show_solar_panel_2': formData.show_solar_panel_2,
      'will call onChange with': !formData.show_solar_panel_2
    });

    if (formData.show_solar_panel_2) {
      // Hide Type 2 - check if data exists
      const hasType2Data = formData.solar_panel_type2_manufacturer ||
                          formData.solar_panel_type2_model ||
                          formData.solar_panel_type2_quantity;

      if (hasType2Data) {
        setShowType2Confirm(true);
      } else {
        onChange('show_solar_panel_2', false, systemNumber);
      }
    } else {
      // Show Type 2
      console.log('[SolarPanelSection] Calling onChange to show Panel Type 2');
      onChange('show_solar_panel_2', true, systemNumber);
    }
  };

  const handleConfirmHideType2 = () => {
    onChange('show_solar_panel_2', false, systemNumber);
    clearType2Fields();
    setShowType2Confirm(false);
  };

  // System Type Change Handlers
  const hasInverterData = () => {
    // Check for inverter/microinverter data
    return formData.inverter_make ||
           formData.inverter_model ||
           formData.inverter_quantity;
  };

  const hasStringCombinerData = () => {
    // Check for string combiner panel data (branch strings)
    for (let i = 1; i <= 20; i++) {
      if (formData[`branch_string_${i}`] ||
          formData[`branch_string_${i}_panel_type`] ||
          formData[`branch_string_${i}_type1`] ||
          formData[`branch_string_${i}_type2`]) {
        return true;
      }
    }
    return false;
  };

  const hasOptimizerData = () => {
    // Check for optimizer data
    return formData.optimizer_make ||
           formData.optimizer_model ||
           formData.optimizer_quantity;
  };

  const clearInverterMicroData = () => {
    // Clear all inverter/microinverter fields
    const updates = [
      ['inverter_make', null],
      ['inverter_model', null],
      ['inverter_model_id', null],
      ['inverter_quantity', null],
      ['inverter_type', null],
      ['inverter_max_ac_output_current', null],
      ['show_inverter_bos', false],
    ];

    if (onBatchChange) {
      onBatchChange(updates, systemNumber);
    } else {
      updates.forEach(([field, value]) => onChange(field, value, systemNumber));
    }
  };

  const clearStringCombinerData = () => {
    // Clear all string combiner panel fields
    const updates = [];
    for (let i = 1; i <= 20; i++) {
      updates.push([`branch_string_${i}`, '']);
      updates.push([`branch_string_${i}_panel_type`, '']);
      updates.push([`branch_string_${i}_type1`, '']);
      updates.push([`branch_string_${i}_type2`, '']);
      updates.push([`branch_string_${i}_micro_type1`, '']);
      updates.push([`branch_string_${i}_micro_type2`, '']);
    }

    if (onBatchChange) {
      onBatchChange(updates, systemNumber);
    } else {
      updates.forEach(([field, value]) => onChange(field, value, systemNumber));
    }
  };

  const clearOptimizerData = () => {
    // Clear all optimizer fields
    const updates = [
      ['optimizer_make', null],
      ['optimizer_model', null],
      ['optimizer_existing', null],
      ['optimizer_type2_make', null],
      ['optimizer_type2_model', null],
      ['optimizer_type2_existing', null],
    ];

    if (onBatchChange) {
      onBatchChange(updates, systemNumber);
    } else {
      updates.forEach(([field, value]) => onChange(field, value, systemNumber));
    }
  };

  const handleSystemTypeChange = (newSystemType) => {
    const currentSystemType = formData[systemTypeField];

    // If clicking the same type, do nothing
    if (currentSystemType === newSystemType) {
      return;
    }

    // Check if there's data to clear based on current system type
    let hasData = false;

    if (currentSystemType === 'microinverter') {
      hasData = hasInverterData() || hasStringCombinerData();
    } else if (currentSystemType === 'inverter') {
      hasData = hasInverterData();
    } else if (currentSystemType === 'optimizer') {
      hasData = hasOptimizerData() || hasInverterData();
    }

    if (hasData) {
      // Show confirmation modal
      setPendingSystemType(newSystemType);
      setShowSystemTypeChangeConfirm(true);
    } else {
      // No data, just change the system type
      onChange(systemTypeField, newSystemType, systemNumber);
    }
  };

  const handleConfirmSystemTypeChange = () => {
    const currentSystemType = formData[systemTypeField];

    // Clear data based on current system type
    if (currentSystemType === 'microinverter') {
      clearInverterMicroData();
      clearStringCombinerData();
    } else if (currentSystemType === 'inverter') {
      clearInverterMicroData();
    } else if (currentSystemType === 'optimizer') {
      clearOptimizerData();
      clearInverterMicroData();
    }

    // Set the new system type
    onChange(systemTypeField, pendingSystemType, systemNumber);

    // Close modal and reset pending state
    setShowSystemTypeChangeConfirm(false);
    setPendingSystemType(null);
  };

  const getSystemTypeChangeMessage = () => {
    const currentSystemType = formData[systemTypeField];

    if (currentSystemType === 'microinverter') {
      return 'Switching from Microinverter will clear all Microinverter and String Combiner Panel data. This action cannot be undone.';
    } else if (currentSystemType === 'inverter') {
      return 'Switching from Inverter will clear all Inverter data. This action cannot be undone.';
    } else if (currentSystemType === 'optimizer') {
      return 'Switching from Optimizer will clear all Optimizer and Inverter data. This action cannot be undone.';
    }

    return 'Switching system type will clear existing equipment data. This action cannot be undone.';
  };

  // Use the section delete hook with CLEAR_ONLY behavior (System 1 Solar Panel can never be removed)
  const {
    showClearModal,
    showRemoveModal,
    handleTrashClick,
    handleClearConfirm,
    handleRemoveConfirm,
    closeClearModal,
    closeRemoveModal,
  } = useSectionDelete({
    sectionName: 'solarPanel',
    formData,
    onChange,
    onBatchChange,
    behavior: DELETE_BEHAVIOR.CLEAR_ONLY,
    visibilityFlag: null, // No visibility flag - section always visible
  });

  // Legacy handleDelete removed - now using useSectionDelete hook

  // Build comprehensive subtitle with all selections
  const getSubtitle = () => {
    if (batteryOnlyMode) return null;
    if (!hasSolarPanel) return '';

    const parts = [];

    // Quantity with New/Existing indicator
    if (formData[solarPanelQuantityField]) {
      const statusLetter = formData[solarPanelExistingField] === true ? 'E' : 'N';
      parts.push(`${formData[solarPanelQuantityField]} (${statusLetter})`);
    }

    // Make and Model
    if (formData[solarPanelMakeField] && formData[solarPanelModelField]) {
      parts.push(`${formData[solarPanelMakeField]} ${formData[solarPanelModelField]}`);
    }

    return parts.join(' ');
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-xs)' }}>
        <EquipmentRow
          title={sectionTitle}
          subtitle={getSubtitle()}
          showNewExistingToggle={!batteryOnlyMode}
          isExisting={formData[solarPanelExistingField]}
          onExistingChange={(val) => {
            onChange(solarPanelExistingField, val, systemNumber);
          }}
          onEdit={!batteryOnlyMode ? () => {} : undefined}
          onCamera={!batteryOnlyMode ? () => {} : undefined}
          onDelete={!batteryOnlyMode ? handleTrashClick : undefined}
          headerRightContent={
            !batteryOnlyMode ? (
              <PreferredButton onClick={() => setShowPreferredModal(true)} />
            ) : null
          }
          toggleRowRightContent={
            !batteryOnlyMode ? (
              <TableRowButton
                label="Battery Only"
                variant="outline"
                active={false}
                onClick={handleBatteryOnlyClick}
              />
            ) : null
          }
        >
          {batteryOnlyMode ? (
            /* Battery Only Active State - Clean Centered UI */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--spacing-loose)',
              gap: 'var(--spacing)'
            }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)' }}>
                Battery Only
              </span>
              <TableRowButton
                label="Switch to Solar"
                variant="outline"
                active={false}
                onClick={() => {
                  deactivateBatteryOnly();
                }}
              />
            </div>
          ) : (
            /* Normal Solar Panel Form */
            <>
              {/* Quantity field */}
              <FormFieldRow label="Quantity">
                <input
                  type="text"
                  value={formData[solarPanelQuantityField] || ''}
                  onChange={(e) => handleFieldChange(solarPanelQuantityField, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Enter quantity"
                />
              </FormFieldRow>

              {/* Make dropdown */}
              <TableDropdown
                label="Make"
                value={formData[solarPanelMakeField] || ''}
                onChange={handleManufacturerChange}
                options={solarPanelMakes.map(m => ({ value: m, label: m }))}
                placeholder={solarPanelMakesLoading ? 'Loading...' : 'Select make'}
                disabled={solarPanelMakesLoading}
              />

              {/* Model dropdown */}
              <TableDropdown
                label="Model"
                value={formData[solarPanelModelField] || ''}
                onChange={handleModelChange}
                options={currentModels.map(m => ({ value: m.model_number || m.model, label: m.model_number || m.model }))}
                placeholder={
                  currentModels.length === 0 && formData[solarPanelMakeField] ? 'Loading...' :
                  formData[solarPanelMakeField] ? 'Select model' :
                  'Select make first'
                }
                disabled={!formData[solarPanelMakeField] || (currentModels.length === 0 && formData[solarPanelMakeField])}
              />

              {/* System Type Selection */}
              <FormFieldRow label="System Type">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', alignItems: 'flex-start' }}>
                  <TableRowButton
                    label="Microinverter"
                    variant="outline"
                    active={formData[systemTypeField] === 'microinverter'}
                    onClick={() => handleSystemTypeChange('microinverter')}
                    style={{ width: 'auto' }}
                  />
                  <TableRowButton
                    label="Inverter With Optimizer"
                    variant="outline"
                    active={formData[systemTypeField] === 'optimizer'}
                    onClick={() => handleSystemTypeChange('optimizer')}
                    style={{ width: 'auto' }}
                  />
                  <TableRowButton
                    label="Inverter No Optimizer"
                    variant="outline"
                    active={formData[systemTypeField] === 'inverter'}
                    onClick={() => handleSystemTypeChange('inverter')}
                    style={{ width: 'auto' }}
                  />
                </div>
              </FormFieldRow>

              {/* + 2nd Solar Panel Type Button */}
              <div style={{
                paddingLeft: 'var(--spacing)',
                paddingRight: 'var(--spacing)',
                paddingTop: 'var(--spacing-tight)',
                paddingBottom: 'var(--spacing-tight)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)'
              }}>
                <ActionSectionButton
                  label="+ 2nd Solar Panel Type"
                  variant="orange"
                  onClick={handleToggleType2}
                />
                <Tooltip
                  content={
                    <>
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '0 var(--spacing) 0 0' }}>
                        <img src={flameIcon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                      </div>
                      <div style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
                        Add second Solar Panel Type to system {systemNumber} to inverter or String Combiner Panel
                      </div>
                    </>
                  }
                  position="bottom"
                  className="alertTooltip"
                >
                  <img src={flameIcon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', cursor: 'help' }} />
                </Tooltip>
              </div>
            </>
          )}
        </EquipmentRow>
      </div>

      {/* Battery Only Confirmation Modal */}
      <ConfirmDialog
        isOpen={showBatteryOnlyConfirm}
        onClose={() => setShowBatteryOnlyConfirm(false)}
        onConfirm={activateBatteryOnly}
        title="Activate Battery Only Mode"
        message="This will clear all solar panel data. Continue?"
        confirmText="Continue"
        cancelText="Cancel"
        variant="warning"
        scopedToPanel={true}
      />

      {/* Type 2 Hide Confirmation Modal */}
      <ConfirmDialog
        isOpen={showType2Confirm}
        onClose={() => setShowType2Confirm(false)}
        onConfirm={handleConfirmHideType2}
        title={`Clear Solar Panel ${systemNumber} (Type 2)`}
        message={`Are you sure you want to clear Solar Panel ${systemNumber} (Type 2)?`}
        confirmText="Clear"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Section Clear Modal */}
      <SectionClearModal
        isOpen={showClearModal}
        onClose={closeClearModal}
        onConfirm={handleClearConfirm}
        sectionName="Solar Panel"
      />

      {/* Section Remove Modal - Not used for CLEAR_ONLY behavior, but included for completeness */}
      <SectionRemoveModal
        isOpen={showRemoveModal}
        onClose={closeRemoveModal}
        onConfirm={handleRemoveConfirm}
        sectionName="Solar Panel"
      />

      {/* Preferred Equipment Modal */}
      <PreferredEquipmentModal
        isOpen={showPreferredModal}
        onClose={() => setShowPreferredModal(false)}
        onSelect={handlePreferredSelect}
        onSelectOther={handleSelectOther}
        equipmentType="solar-panels"
        title="Select Solar Panel"
      />

      {/* System Type Change Confirmation Modal */}
      <ConfirmDialog
        isOpen={showSystemTypeChangeConfirm}
        onClose={() => {
          setShowSystemTypeChangeConfirm(false);
          setPendingSystemType(null);
        }}
        onConfirm={handleConfirmSystemTypeChange}
        title="Confirm System Type Change"
        message={getSystemTypeChangeMessage()}
        confirmText="Clear and Continue"
        cancelText="Cancel"
        contained={true}
      />
    </div>
  );
};

// Custom comparison - only re-render when solar panel-specific fields change
const arePropsEqual = (prevProps, nextProps) => {
  const { systemNumber } = prevProps;
  const prefix = systemNumber === 1 ? '' : `sys${systemNumber}_`;

  const relevantFields = [
    `${prefix}solar_panel_make`,
    `${prefix}solar_panel_model`,
    `${prefix}solar_panel_wattage`,
    `${prefix}solar_panel_quantity`,
    `${prefix}solar_panel_existing`,
    `${prefix}batteryonly`,
    `${prefix}system_type`,
    'show_solar_panel_2',
  ];

  for (const field of relevantFields) {
    if (prevProps.formData?.[field] !== nextProps.formData?.[field]) {
      return false;
    }
  }

  if (prevProps.systemNumber !== nextProps.systemNumber) return false;
  if (prevProps.onChange !== nextProps.onChange) return false;
  if (prevProps.onBatchChange !== nextProps.onBatchChange) return false;

  return true;
};

export default React.memo(SolarPanelSection, arePropsEqual);
