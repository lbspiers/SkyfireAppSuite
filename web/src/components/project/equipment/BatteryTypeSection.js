import React, { useState, useEffect, memo } from 'react';
import { EquipmentRow, FormFieldRow, TableDropdown, AddSectionButton, PreferredButton, ConfirmDialog, TableRowButton, AddButton } from '../../ui';
import Tooltip from '../../ui/Tooltip';
import { PreferredEquipmentModal } from '../../equipment';
import BOSEquipmentSection from './BOSEquipmentSection';
import { useEquipmentCatalog } from '../../../hooks/useEquipmentCatalog';
import logger from '../../../services/devLogger';
import { ENPHASE_6C_CONFIG, isEnphase6CCombiner, BATTERY_MOUNT_TYPES } from '../../../utils/constants';
import { Alert } from '../../ui';
import flameIcon from '../../../assets/images/Skyfire Flame Icon.png';

/**
 * Battery Type Section
 * Handles battery configuration with optional Battery Type 2
 */
const BatteryTypeSection = ({
  formData,
  onChange,
  onBatchChange,
  batteryNumber = 1,
  showAddButton = false,
  onAddBatteryType2 = null,
  systemNumber = 1,
  // NEW: 6C combiner mode props
  isEnphase6CMode = false,
  combinerPanelMake = '',
  combinerPanelModel = '',
  // BOS auto-sizing props
  maxContinuousOutputAmps = null,
  loadingMaxOutput = false,
}) => {
  // console.log('🔋 BatteryTypeSection RENDER - Battery', batteryNumber); // Commented out - causing console spam

  // Use shared equipment catalog
  const {
    batteryMakes,
    batteryMakesLoading,
    loadBatteryMakes,
    getBatteryModels,
    loadBatteryModels
  } = useEquipmentCatalog();

  const [showPreferredModal, setShowPreferredModal] = useState(false);

  // Mount type validation modal state
  const [showMountValidationModal, setShowMountValidationModal] = useState(false);
  const [mountValidationData, setMountValidationData] = useState(null);

  // Track if user manually cleared data (prevents auto-select from re-triggering)
  const [manuallyCleared, setManuallyCleared] = useState(false);

  // Derive 6C mode from props or combiner data
  const is6CMode = isEnphase6CMode || isEnphase6CCombiner(combinerPanelMake, combinerPanelModel);

  const prefix = batteryNumber === 1 ? 'battery1' : 'battery2';
  const makeField = `${prefix}_make`;
  const modelField = `${prefix}_model`;
  const quantityField = `${prefix}_quantity`;
  const tieInLocationField = `${prefix}_tie_in_location`;
  const mountTypeField = `${prefix}_mount_type`;

  const quantity = parseInt(formData[quantityField]) || 0;
  const mountType = formData[mountTypeField] || '';

  // Load manufacturers on mount using shared catalog
  useEffect(() => {
    loadBatteryMakes();
  }, [loadBatteryMakes]);

  // Load models when manufacturer changes using shared catalog
  useEffect(() => {
    if (formData[makeField]) {
      loadBatteryModels(formData[makeField]);
    }
  }, [formData[makeField], loadBatteryModels]);

  // Set default New/Existing toggle to New on mount if battery is configured but toggle not set
  useEffect(() => {
    const hasBattery = formData[makeField] || formData[modelField] || formData[quantityField];
    const isNewField = `${prefix}_isnew`;
    // Use == null to catch both undefined AND null
    if (hasBattery && formData[isNewField] == null) {
      onChange(isNewField, true); // Default to New
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData[makeField], formData[modelField], formData[quantityField], formData[`${prefix}_isnew`], makeField, modelField, quantityField, prefix]);

  // Auto-select Enphase 10C battery when in 6C mode and quantity is entered
  useEffect(() => {
    if (!is6CMode) return;

    const currentQty = parseInt(formData[quantityField]) || 0;

    logger.log('BatteryTypeSection', `Battery Input ${batteryNumber} - 6C Mode Active`, {
      quantity: currentQty,
      currentMake: formData[makeField],
      currentModel: formData[modelField],
      targetMake: ENPHASE_6C_CONFIG.compatibleBattery.make,
      targetModel: ENPHASE_6C_CONFIG.compatibleBattery.model,
    });

    if (currentQty > 0) {
      // Auto-select make if not already Enphase
      if (formData[makeField] !== ENPHASE_6C_CONFIG.compatibleBattery.make) {
        logger.log('BatteryTypeSection', `Battery Input ${batteryNumber}: Auto-selecting make "${ENPHASE_6C_CONFIG.compatibleBattery.make}"`);
        onChange(makeField, ENPHASE_6C_CONFIG.compatibleBattery.make);
      }
      // Auto-select model if not already IQBATTERY-10C
      if (formData[modelField] !== ENPHASE_6C_CONFIG.compatibleBattery.model) {
        logger.log('BatteryTypeSection', `Battery Input ${batteryNumber}: Auto-selecting model "${ENPHASE_6C_CONFIG.compatibleBattery.model}"`);
        onChange(modelField, ENPHASE_6C_CONFIG.compatibleBattery.model);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [is6CMode, formData[quantityField], formData[makeField], formData[modelField], quantityField, makeField, modelField, batteryNumber]);

  // Validation: Reset to compatible battery if user somehow sets incompatible in 6C mode
  useEffect(() => {
    if (!is6CMode) return;

    const currentMake = formData[makeField];
    const currentModel = formData[modelField];
    const currentQty = parseInt(formData[quantityField]) || 0;

    // Only validate if there's a quantity set
    if (currentQty > 0) {
      const isCompatible =
        currentMake === ENPHASE_6C_CONFIG.compatibleBattery.make &&
        currentModel === ENPHASE_6C_CONFIG.compatibleBattery.model;

      if (!isCompatible && (currentMake || currentModel)) {
        // Reset to compatible battery
        logger.warn('Equipment', `Incompatible battery for 6C mode: ${currentMake} ${currentModel}. Resetting.`);
        onChange(makeField, ENPHASE_6C_CONFIG.compatibleBattery.make);
        onChange(modelField, ENPHASE_6C_CONFIG.compatibleBattery.model);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [is6CMode, formData[makeField], formData[modelField], formData[quantityField], makeField, modelField, quantityField]);

  // Get current models from shared catalog
  const currentModels = getBatteryModels(formData[makeField]);

  // Normalize manufacturers to { label, value } format
  const normalizedManufacturers = batteryMakes.map(item => {
    if (typeof item === 'string') {
      return { label: item, value: item };
    }
    const name = item.manufacturer || item.name || item.label || String(item);
    return { label: name, value: name };
  });

  // Normalize models to { label, value } format
  const normalizedModels = currentModels.map(item => {
    if (typeof item === 'string') {
      return { label: item, value: item };
    }
    const modelName = item.model || item.model_number || item.name || item.label || String(item);
    return { label: modelName, value: modelName };
  });

  const handleToggle = (isNew) => {
    onChange(`${prefix}_isnew`, isNew);
  };

  const handleMakeChange = (value) => {
    console.log(`[Battery${batteryNumber}] Make changed to:`, value);

    if (onBatchChange) {
      // BATCH: Update make, model, and isnew in single operation
      const updates = [
        [`${prefix}_make`, value],
        [`${prefix}_model`, ''],
      ];

      // Save isnew default if not already set - use == null to catch both undefined AND null
      if (formData[`${prefix}_isnew`] == null) {
        updates.push([`${prefix}_isnew`, true]);
      }

      console.log(`[Battery${batteryNumber}] Calling onBatchChange with:`, updates);
      onBatchChange(updates);
    } else {
      // Fallback: Sequential onChange
      if (formData[`${prefix}_isnew`] == null) {
        onChange(`${prefix}_isnew`, true);
      }
      onChange(`${prefix}_make`, value);
      onChange(`${prefix}_model`, '');
    }

    // Reset manually cleared flag when user selects new equipment
    setManuallyCleared(false);
  };

  const handleModelChange = (value) => {
    console.log(`[Battery${batteryNumber}] Model changed to:`, value);

    if (onBatchChange) {
      // BATCH: Update model and isnew in single operation
      const updates = [
        [`${prefix}_model`, value],
      ];

      // Save isnew default if not already set - use == null to catch both undefined AND null
      if (formData[`${prefix}_isnew`] == null) {
        updates.push([`${prefix}_isnew`, true]);
      }

      console.log(`[Battery${batteryNumber}] Calling onBatchChange with:`, updates);
      onBatchChange(updates);
    } else {
      // Fallback: Sequential onChange
      if (formData[`${prefix}_isnew`] == null) {
        onChange(`${prefix}_isnew`, true);
      }
      onChange(`${prefix}_model`, value);
    }
  };

  const handleQuantityChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');

    // Enforce max 4 batteries per input in 6C mode
    if (is6CMode && parseInt(value) > ENPHASE_6C_CONFIG.maxBatteriesPerInput) {
      value = String(ENPHASE_6C_CONFIG.maxBatteriesPerInput);
    }

    // Check mount type quantity limits
    const currentMountType = formData[mountTypeField];
    if (currentMountType && parseInt(value) > 0) {
      const mountConfig = BATTERY_MOUNT_TYPES.find(m => m.value === currentMountType);
      if (mountConfig && parseInt(value) > mountConfig.maxQuantity) {
        // Quantity exceeds mount limit - show validation modal
        setMountValidationData({
          mountType: currentMountType,
          requestedQty: parseInt(value),
          maxQty: mountConfig.maxQuantity,
          trigger: 'quantity_change'
        });
        setShowMountValidationModal(true);
        return; // Don't save yet - wait for user confirmation
      }
    }

    onChange(quantityField, value);
  };

  const handleMountTypeChange = (newMountType) => {
    const currentQty = parseInt(formData[quantityField]) || 0;

    if (currentQty > 0 && newMountType) {
      const mountConfig = BATTERY_MOUNT_TYPES.find(m => m.value === newMountType);
      if (mountConfig && currentQty > mountConfig.maxQuantity) {
        // Quantity exceeds mount limit - show validation modal
        setMountValidationData({
          mountType: newMountType,
          requestedQty: currentQty,
          maxQty: mountConfig.maxQuantity,
          trigger: 'mount_type_change'
        });
        setShowMountValidationModal(true);
        return; // Don't save yet - wait for user confirmation
      }
    }

    onChange(mountTypeField, newMountType);
  };

  const handleMountValidationConfirm = () => {
    if (!mountValidationData) return;

    const { mountType, maxQty, trigger } = mountValidationData;

    // Save the adjusted quantity and mount type
    onChange(quantityField, String(maxQty));
    onChange(mountTypeField, mountType);

    logger.log('BatteryTypeSection', `Mount validation confirmed - adjusted to ${maxQty} for ${mountType}`);

    // Close modal and reset
    setShowMountValidationModal(false);
    setMountValidationData(null);
  };

  const handleMountValidationCancel = () => {
    // Clear both quantity and mount type
    onChange(quantityField, '');
    onChange(mountTypeField, '');

    logger.log('BatteryTypeSection', 'Mount validation cancelled - cleared quantity and mount type');

    // Close modal and reset
    setShowMountValidationModal(false);
    setMountValidationData(null);
  };

  const configOptions = [
    { label: 'Daisy Chain', value: 'Daisy Chain' },
    { label: 'Battery Combiner Panel', value: 'Battery Combiner Panel' },
  ];

  // Use sys{N}_combination_method as the shared field for both battery types
  const combinationMethodField = `sys${systemNumber}_combination_method`;
  const configurationField = `${prefix}_configuration`;

  // Show configuration when quantity > 1 for either battery type
  const showConfiguration = quantity > 1;

  // Check if Franklin aPower battery with qty > 1 (requires Battery Combiner Panel)
  // Multiple aPower batteries on an Agate force the battery combiner panel
  const isFranklinAPower =
    formData[makeField]?.toLowerCase().includes('franklin') &&
    formData[modelField]?.toLowerCase().includes('apower') &&
    quantity > 1;

  // Debug logging for Franklin aPower detection
  useEffect(() => {
    console.log('🔍 Battery Detection - Batt' + batteryNumber, {
      make: formData[makeField],
      model: formData[modelField],
      quantity,
      isFranklinAPower,
      currentConfig: formData[configurationField],
      combinationMethod: formData[combinationMethodField],
    });
  }, [formData[makeField], formData[modelField], quantity, isFranklinAPower, makeField, modelField, batteryNumber, configurationField, formData[configurationField], formData[combinationMethodField], combinationMethodField, systemNumber]);

  // Auto-select Battery Combiner Panel for Franklin aPower with multiple batteries
  // Also save to sys{N}_combination_method
  useEffect(() => {
    if (isFranklinAPower) {
      console.log('🚨 FRANKLIN APOWER DETECTED - Batt' + batteryNumber, {
        systemNumber,
        combinationMethodField,
        configField: configurationField,
        currentConfigValue: formData[configurationField],
        currentMethodValue: formData[combinationMethodField],
      });

      const needsConfigUpdate = formData[configurationField] !== 'Battery Combiner Panel';
      const needsMethodUpdate = formData[combinationMethodField] !== 'Battery Combiner Panel';

      if (needsConfigUpdate || needsMethodUpdate) {
        console.log('💾 UPDATING - Batt' + batteryNumber, {
          needsConfigUpdate,
          needsMethodUpdate,
          willSetField: combinationMethodField,
        });

        // Batch both updates to avoid multiple re-renders
        if (needsConfigUpdate) {
          onChange(configurationField, 'Battery Combiner Panel');
        }
        if (needsMethodUpdate) {
          console.log(`💾 Setting ${combinationMethodField} to Battery Combiner Panel`);
          onChange(combinationMethodField, 'Battery Combiner Panel');
        }
      } else {
        console.log('✅ Already set correctly - Batt' + batteryNumber);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFranklinAPower, formData[configurationField], formData[combinationMethodField], configurationField, combinationMethodField, batteryNumber, systemNumber]);

  const isComplete = formData[makeField] && formData[modelField] && formData[quantityField];

  // Helper function for display name
  const getBatteryDisplayName = (model) => {
    if (is6CMode && model === ENPHASE_6C_CONFIG.compatibleBattery.model) {
      return ENPHASE_6C_CONFIG.compatibleBattery.displayName;
    }
    return model;
  };

  const getSubtitle = () => {
    const parts = [];

    // Quantity with New/Existing indicator
    if (formData[quantityField]) {
      const statusLetter = formData[`${prefix}_isnew`] !== false ? 'N' : 'E';
      parts.push(`${formData[quantityField]} (${statusLetter})`);
    }

    if (formData[makeField] && formData[modelField]) {
      const displayModel = getBatteryDisplayName(formData[modelField]);
      parts.push(`${formData[makeField]} ${displayModel}`);
    }
    return parts.join(' ');
  };

  const handleDelete = () => {
    // Check if there's any data to clear
    const hasData = !!(
      formData[makeField] ||
      formData[modelField] ||
      formData[quantityField] ||
      formData[tieInLocationField] ||
      formData[configurationField] ||
      formData[mountTypeField]
    );

    if (hasData) {
      // First click: Clear all data
      onChange(makeField, '');
      onChange(modelField, '');
      onChange(quantityField, '');
      onChange(tieInLocationField, '');
      onChange(configurationField, '');
      onChange(combinationMethodField, '');
      onChange(mountTypeField, '');
      onChange(`${prefix}_isnew`, true); // Reset to default
      // Also hide BOS if it was showing
      onChange(`show_battery${batteryNumber}_bos`, false);
      // Mark as manually cleared to prevent auto-select from re-triggering
      setManuallyCleared(true);
    } else {
      // Second click: Hide the entire section (only for Battery Type 2)
      if (batteryNumber === 2) {
        onChange('show_battery_type_2', false);
      }
    }
  };

  const handlePreferredSelect = (selected) => {
    onChange(makeField, selected.make);
    onChange(modelField, selected.model);
  };

  const handleSelectOther = () => {
    onChange(makeField, '');
    onChange(modelField, '');
  };

  // Handler for tie-in location changes
  const handleTieInLocationChange = (value) => {
    // Check if the selected value is the SMS device
    const isSMS = formData.sms_make && formData.sms_model &&
                  value === `${formData.sms_make} ${formData.sms_model}`;

    // Save "SMS" if it's the SMS device, "Inverter" is already in correct format
    const valueToSave = isSMS ? 'SMS' : value;

    console.log('🔌 Tie-In Location Change:', {
      selectedValue: value,
      isSMS,
      valueToSave,
    });

    onChange(tieInLocationField, valueToSave);
  };

  // Build Battery Tie-In Location options based on available equipment
  const tieInLocationOptions = React.useMemo(() => {
    const options = [];

    console.log('🔌 Building Tie-In Location options:', {
      inverter_make: formData.inverter_make,
      inverter_model: formData.inverter_model,
      inverter_type: formData.inverter_type,
      combiner_panel_make: formData.combiner_panel_make,
      combiner_panel_model: formData.combiner_panel_model,
      sms_make: formData.sms_make,
      sms_model: formData.sms_model,
      battery_combiner_panel_make: formData.battery_combiner_panel_make,
      battery_combiner_panel_model: formData.battery_combiner_panel_model,
    });

    // Check for String Combiner Panel
    if (formData.combiner_panel_make && formData.combiner_panel_model) {
      options.push({
        value: `${formData.combiner_panel_make} ${formData.combiner_panel_model}`,
        label: `${formData.combiner_panel_make} ${formData.combiner_panel_model}`,
      });
    }

    // Check for Inverter (only if NOT a microinverter)
    // Allow if inverter_type is explicitly 'inverter' OR if inverter_type is not set (backward compatibility)
    const inverterCheck = formData.inverter_make && formData.inverter_model &&
        (formData.inverter_type === 'inverter' || !formData.inverter_type || formData.inverter_type === '');

    console.log('🔌 Inverter check result:', inverterCheck, {
      hasMake: !!formData.inverter_make,
      hasModel: !!formData.inverter_model,
      typeCheck: formData.inverter_type === 'inverter' || !formData.inverter_type || formData.inverter_type === '',
    });

    if (inverterCheck) {
      options.push({
        value: 'Inverter',
        label: 'Inverter',
      });
    }

    // Check for Storage Management System (SMS)
    if (formData.sms_make && formData.sms_model && formData.sms_make !== 'No SMS') {
      options.push({
        value: `${formData.sms_make} ${formData.sms_model}`,
        label: `${formData.sms_make} ${formData.sms_model}`,
      });
    }

    // Check for Battery Combiner Panel
    if (formData.battery_combiner_panel_make && formData.battery_combiner_panel_model) {
      options.push({
        value: `${formData.battery_combiner_panel_make} ${formData.battery_combiner_panel_model}`,
        label: `${formData.battery_combiner_panel_make} ${formData.battery_combiner_panel_model}`,
      });
    }

    console.log('🔌 Final tie-in options:', options);

    return options;
  }, [
    formData.combiner_panel_make,
    formData.combiner_panel_model,
    formData.inverter_make,
    formData.inverter_model,
    formData.inverter_type,
    formData.sms_make,
    formData.sms_model,
    formData.battery_combiner_panel_make,
    formData.battery_combiner_panel_model,
  ]);

  // Auto-select if only one option (unless user manually cleared)
  useEffect(() => {
    if (tieInLocationOptions.length === 1 && !formData[tieInLocationField] && !manuallyCleared) {
      console.log('🔌 Auto-selecting tie-in location:', tieInLocationOptions[0].value);
      onChange(tieInLocationField, tieInLocationOptions[0].value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tieInLocationOptions, formData[tieInLocationField], tieInLocationField, manuallyCleared]);

  // Determine section title based on 6C mode
  const sectionTitle = is6CMode
    ? `Battery Input ${batteryNumber}`
    : `Battery (Type ${batteryNumber})`;

  return (
    <div style={{ marginBottom: 'var(--spacing-xs)' }}>
      <EquipmentRow
        title={sectionTitle}
        subtitle={getSubtitle()}
        showNewExistingToggle={true}
        isNew={formData[`${prefix}_isnew`] !== false}
        onNewExistingChange={handleToggle}
        onDelete={handleDelete}
        toggleRowRightContent={
          <Tooltip
            content={
              is6CMode
                ? "The 6C combiner has integrated energy storage capability with two battery inputs. Each input supports up to 4 Enphase IQ Battery 10C units (max 8 total). Battery make/model are automatically configured for compatibility."
                : "Configure battery storage for your system. Select the battery manufacturer and model, specify quantity, and choose the tie-in location. For multiple battery types, use the \"Add Battery Type 2\" button."
            }
            position="bottom"
            className="alertTooltip"
          >
            <img src={flameIcon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', cursor: 'help' }} />
          </Tooltip>
        }
        headerRightContent={
          <PreferredButton onClick={() => setShowPreferredModal(true)} />
        }
      >
        {/* Quantity */}
        <FormFieldRow label="Quantity">
          <input
            type="text"
            inputMode="numeric"
            placeholder="00"
            value={formData[quantityField] || ''}
            onChange={handleQuantityChange}
            maxLength={2}
          />
        </FormFieldRow>

        <TableDropdown
          label="Make"
          value={formData[makeField] || ''}
          onChange={handleMakeChange}
          options={normalizedManufacturers}
          placeholder={batteryMakesLoading ? 'Loading...' : 'Select make...'}
          disabled={batteryMakesLoading || is6CMode}
        />

        <TableDropdown
          label="Model"
          value={formData[modelField] || ''}
          onChange={handleModelChange}
          options={normalizedModels}
          placeholder={!formData[makeField] ? 'Select make' : normalizedModels.length === 0 ? 'Loading...' : 'Select model'}
          disabled={!formData[makeField] || normalizedModels.length === 0 || is6CMode}
        />

        {/* Mount Type - Only show for Duracell batteries */}
        {formData[makeField]?.toLowerCase() === 'duracell' && formData[modelField] && (
          <FormFieldRow label="Mount Type">
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
              {BATTERY_MOUNT_TYPES.map((option) => (
                <TableRowButton
                  key={option.value}
                  label={option.label}
                  variant="outline"
                  active={mountType === option.value}
                  onClick={() => handleMountTypeChange(option.value)}
                />
              ))}
            </div>
          </FormFieldRow>
        )}

        {/* Tie-In Location */}
        {tieInLocationOptions.length > 0 && (
          <TableDropdown
            label="Tie-In Location"
            value={
              // If stored value is "SMS", display the full SMS name for the dropdown
              formData[tieInLocationField] === 'SMS'
                ? `${formData.sms_make} ${formData.sms_model}`
                : formData[tieInLocationField] || ''
            }
            onChange={handleTieInLocationChange}
            options={tieInLocationOptions}
            placeholder="Select tie-in location..."
          />
        )}

        {/* Configuration - Show when qty > 1 for either battery type */}
        {showConfiguration && (
          <TableDropdown
            label="Configuration"
            value={formData[combinationMethodField] || ''}
            onChange={(value) => {
              // Save to both the individual battery configuration field and the shared combination_method field
              onChange(configurationField, value);
              onChange(combinationMethodField, value);
            }}
            options={isFranklinAPower ? [{ label: 'Battery Combiner Panel', value: 'Battery Combiner Panel' }] : configOptions}
            placeholder="Select configuration..."
            disabled={isFranklinAPower}
            showSearch={false}
          />
        )}
        {/* Add Battery BOS Button - Show inside when battery is configured but BOS not yet added */}
        {isComplete && !formData[`show_battery${batteryNumber}_bos`] && (
          <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--spacing-tight) var(--spacing)' }}>
            <TableRowButton
              label={`+ Battery Type ${batteryNumber} BOS`}
              variant="outline"
              onClick={() => onChange(`show_battery${batteryNumber}_bos`, true)}
              style={{ width: '100%' }}
            />
          </div>
        )}
      </EquipmentRow>

      {/* BOS Equipment - Only show if flag is set */}
      {isComplete && formData[`show_battery${batteryNumber}_bos`] && (
        <BOSEquipmentSection
          formData={formData}
          onChange={onChange}
          section={batteryNumber === 1 ? 'battery1' : 'battery2'}
          systemNumber={systemNumber}
          maxContinuousOutputAmps={maxContinuousOutputAmps}
          loadingMaxOutput={loadingMaxOutput}
        />
      )}

      {/* Battery Type 2 Button - Show when Battery Type 1 is complete and BT2 hasn't been added */}
      {batteryNumber === 1 && showAddButton && (
        <AddButton
          label="Battery (Type 2)"
          onClick={onAddBatteryType2}
          disabled={!isComplete}
        />
      )}

      {/* Preferred Equipment Modal */}
      <PreferredEquipmentModal
        isOpen={showPreferredModal}
        onClose={() => setShowPreferredModal(false)}
        onSelect={handlePreferredSelect}
        onSelectOther={handleSelectOther}
        equipmentType="batteries"
        title="Select Battery"
      />

      {/* Mount Type Quantity Validation Modal */}
      <ConfirmDialog
        isOpen={showMountValidationModal}
        onClose={handleMountValidationCancel}
        onConfirm={handleMountValidationConfirm}
        title="Battery Quantity Limit Exceeded"
        message={
          mountValidationData
            ? `You can only install ${mountValidationData.maxQty} ${
                mountValidationData.maxQty === 1 ? 'battery' : 'batteries'
              } in a ${mountValidationData.mountType} configuration. We have adjusted the quantity to ${
                mountValidationData.maxQty
              } to remain in compliance.`
            : ''
        }
        confirmText="Confirm"
        cancelText="Cancel"
        variant="warning"
        contained={true}
      />
    </div>
  );
};

// Custom comparison - only re-render when battery-specific fields change
const arePropsEqual = (prevProps, nextProps) => {
  const { batteryNumber } = prevProps;
  const prefix = batteryNumber === 1 ? 'battery1' : 'battery2';

  // Check only battery-relevant fields
  const relevantFields = [
    `${prefix}_isnew`,
    `${prefix}_make`,
    `${prefix}_model`,
    `${prefix}_quantity`,
    `${prefix}_tie_in_location`,
    `${prefix}_mount_type`,
    'show_battery_type_2',
    'show_battery1_bos',
    'show_battery2_bos',
  ];

  // Compare relevant formData fields
  for (const field of relevantFields) {
    if (prevProps.formData?.[field] !== nextProps.formData?.[field]) {
      return false; // Field changed, re-render
    }
  }

  // Compare other props
  if (prevProps.batteryNumber !== nextProps.batteryNumber) return false;
  if (prevProps.showAddButton !== nextProps.showAddButton) return false;
  if (prevProps.onAddBatteryType2 !== nextProps.onAddBatteryType2) return false;
  if (prevProps.systemNumber !== nextProps.systemNumber) return false;
  if (prevProps.isEnphase6CMode !== nextProps.isEnphase6CMode) return false;
  if (prevProps.combinerPanelMake !== nextProps.combinerPanelMake) return false;
  if (prevProps.combinerPanelModel !== nextProps.combinerPanelModel) return false;
  if (prevProps.onChange !== nextProps.onChange) return false;

  return true; // Props equal, skip re-render
};

export default memo(BatteryTypeSection, arePropsEqual);
