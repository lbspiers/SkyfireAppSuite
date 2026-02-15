import React, { useMemo } from 'react';
import { Alert, Button, EquipmentRow, FormFieldRow, TableRowButton } from '../../ui';
import styles from '../../../styles/ProjectAdd.module.css';
import equipStyles from '../EquipmentForm.module.css';
import formStyles from '../../../styles/FormSections.module.css';
import componentStyles from './InverterStringingSection.module.css';

import {
  calculateInverterInputDistribution,
  calculateStringVoltage,
  validateStringVoltage,
  calculateStringCurrent,
  validateStringCurrent,
} from '../../../utils/stringingCalculations';

/**
 * String Inverter Stringing Section
 * Handles Auto vs Custom stringing configuration for string inverters
 *
 * String inverters have multiple DC inputs, each with 1-2 strings of panels
 * Uses max_strings_branches from inverter specs to determine max inputs
 */
const InverterStringingSection = ({ formData, onChange }) => {
  // ============================================
  // FORM DATA & DERIVED STATE
  // ============================================

  const stringingType = formData.stringing_type || 'auto';
  const totalPanels = parseInt(formData.solar_panel_quantity) || 0;

  // Get max inputs from inverter specs (max_strings_branches)
  // This comes from the inverters table when user selects a model
  const maxInputs = parseInt(formData.inverter_max_strings_branches) || 6;

  // Get panel electrical specs for validation
  const panelVoc = parseFloat(formData.solar_panel_voc) || 0;
  const panelIsc = parseFloat(formData.solar_panel_isc) || 0;
  const panelTempCoeffVoc = parseFloat(formData.solar_panel_temp_coeff_voc) || -0.3;

  // Get inverter electrical specs for validation
  const inverterMaxVdc = parseFloat(formData.inverter_max_vdc) || 600;
  const inverterMaxIsc = parseFloat(formData.inverter_max_input_isc) || 15;

  // Calculate max panels per string based on voltage limits
  const maxPanelsPerString = useMemo(() => {
    if (panelVoc > 0 && inverterMaxVdc > 0) {
      // Calculate at coldest temp (-10°C by default)
      const vocCold = panelVoc * (1 + (panelTempCoeffVoc / 100) * (-10 - 25));
      return Math.floor(inverterMaxVdc / vocCold);
    }
    return 15; // Default fallback
  }, [panelVoc, inverterMaxVdc, panelTempCoeffVoc]);

  // ============================================
  // STRINGS OPTIONS (1 or 2 per input)
  // ============================================

  const stringsOptions = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
  ];

  // ============================================
  // PANEL QTY OPTIONS
  // ============================================

  const panelQtyOptions = useMemo(() => {
    // Max panels depends on strings selected (calculated per-row)
    // For now, generate options up to max possible (2 strings × maxPanelsPerString)
    const maxPossible = 2 * maxPanelsPerString;
    return Array.from({ length: maxPossible }, (_, i) => ({
      value: String(i + 1),
      label: String(i + 1)
    }));
  }, [maxPanelsPerString]);

  // ============================================
  // CALCULATE TOTALS
  // ============================================

  // Calculate total panels assigned (from branch_string_X fields)
  const totalPanelsAssigned = useMemo(() => {
    let total = 0;
    for (let i = 1; i <= maxInputs; i++) {
      total += parseInt(formData[`branch_string_${i}`]) || 0;
    }
    return total;
  }, [formData, maxInputs]);

  const panelsRemaining = totalPanels - totalPanelsAssigned;

  // ============================================
  // HANDLERS
  // ============================================

  const handleStringingTypeChange = (type) => {
    onChange('stringing_type', type);

    // Clear branch string fields when switching to auto
    if (type === 'auto') {
      for (let i = 1; i <= 10; i++) {
        onChange(`branch_string_${i}`, '');
      }
    }
  };

  const handleStringsChange = (inputIndex, value) => {
    // Store strings value locally for validation only (not saved to database)
    onChange(`input_${inputIndex}_strings_local`, value);
  };

  const handlePanelQtyChange = (inputIndex, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    // Save to branch_string_X (matches mobile app database)
    onChange(`branch_string_${inputIndex}`, numericValue);
  };

  // ============================================
  // AUTO-CALCULATE DISTRIBUTION
  // ============================================

  const handleAutoCalculate = () => {
    // Default to 1 string per input for simplicity
    // User can adjust strings manually after
    const stringsPerInput = 1;

    const distribution = calculateInverterInputDistribution(
      totalPanels,
      maxInputs,
      stringsPerInput,
      maxPanelsPerString
    );

    if (!distribution) return;

    // Clear all branch strings first
    for (let i = 1; i <= 10; i++) {
      onChange(`branch_string_${i}`, '');
    }

    // Populate with calculated values (save panel qty to branch_string_X)
    distribution.inputs.forEach((input) => {
      const i = input.inputIndex;
      onChange(`branch_string_${i}`, String(input.panelQty));
    });
  };

  // ============================================
  // RENDER INPUT ROW
  // ============================================

  const renderInputRow = (inputIndex) => {
    // Panel qty is stored in branch_string_X (matches mobile app database)
    const panelQtyField = `branch_string_${inputIndex}`;
    const panelQtyValue = formData[panelQtyField] || '';

    // Strings value is local state only (not saved to database, used for validation)
    // Default to 1 string if not explicitly set
    const localStringsField = `input_${inputIndex}_strings_local`;
    const stringsValue = formData[localStringsField] || '1';
    const stringsNum = parseInt(stringsValue) || 1;
    const rowMaxPanels = stringsNum * maxPanelsPerString;

    // Voltage and current validation
    const panelQtyNum = parseInt(panelQtyValue) || 0;
    const panelsPerString = panelQtyNum > 0 ? Math.ceil(panelQtyNum / stringsNum) : 0;

    let voltageValidation = null;
    let currentValidation = null;

    if (panelsPerString > 0 && panelVoc > 0) {
      const stringVoltage = calculateStringVoltage(panelsPerString, panelVoc, panelTempCoeffVoc);
      voltageValidation = validateStringVoltage(stringVoltage, inverterMaxVdc);
    }

    if (stringsNum > 0 && panelIsc > 0) {
      const stringCurrent = calculateStringCurrent(panelIsc, stringsNum);
      currentValidation = validateStringCurrent(stringCurrent, inverterMaxIsc);
    }

    const hasValidationErrors = (voltageValidation && !voltageValidation.isValid) ||
                                 (currentValidation && !currentValidation.isValid);

    return (
      <div key={inputIndex}>
        <div className={componentStyles.inputRow}>
        {/* Input Label */}
        <div className={componentStyles.inputLabel}>
          Input {inputIndex}
        </div>

        {/* Flexible spacer */}
        <div className={componentStyles.spacer} />

        {/* Strings Dropdown */}
        <select
          value={stringsValue}
          onChange={(e) => handleStringsChange(inputIndex, e.target.value)}
          className={`${componentStyles.stringsSelect} ${!stringsValue ? componentStyles.stringsSelectEmpty : ''}`}
        >
          <option value="">0</option>
          {stringsOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Panel Qty Input */}
        <input
          type="text"
          value={panelQtyValue}
          onChange={(e) => handlePanelQtyChange(inputIndex, e.target.value)}
          placeholder="0"
          className={hasValidationErrors ? componentStyles.panelQtyInputError : componentStyles.panelQtyInput}
        />
      </div>

      {/* Validation Messages */}
      {panelQtyNum > 0 && (voltageValidation || currentValidation) && (
        <div className={componentStyles.validationContainer}>
          {voltageValidation && (
            <div className={voltageValidation.isValid ? componentStyles.validationMessage : componentStyles.validationMessageError}>
              {!voltageValidation.isValid && '⚠️'}
              {panelsPerString} panels/string × {voltageValidation.stringVoltage}V = {(panelsPerString * voltageValidation.stringVoltage).toFixed(1)}V
              {' '}({voltageValidation.message})
            </div>
          )}
          {currentValidation && (
            <div className={currentValidation.isValid ? componentStyles.validationMessage : componentStyles.validationMessageError}>
              {!currentValidation.isValid && '⚠️'}
              {stringsNum} string{stringsNum > 1 ? 's' : ''} × {panelIsc}A × 1.25 = {currentValidation.stringCurrent}A
              {' '}({currentValidation.message})
            </div>
          )}
        </div>
      )}
    </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={componentStyles.sectionWrapper}>
      <EquipmentRow
        title="Stringing"
        subtitle={stringingType === 'auto' ? 'Auto' : 'Custom'}
      >
        {/* Auto/Custom Toggle */}
        <FormFieldRow label="Mode">
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
        </FormFieldRow>

        {/* Auto Stringing Note */}
        {stringingType === 'auto' && (
          <div className={componentStyles.autoNotePadding}>
            <Alert variant="info">
              Stringing will auto-size to distribute panels across available inverter inputs
              while staying within voltage and current limits.
            </Alert>
          </div>
        )}

        {/* Custom Stringing Interface */}
        {stringingType === 'custom' && (
          <div className={componentStyles.customSection}>
            {/* Specs Info */}
            <Alert variant="info" className={componentStyles.infoAlert}>
              {maxInputs} DC Inputs available • Max {maxPanelsPerString} panels/string • 1-2 strings/input
            </Alert>

            {/* Auto-Calculate Button */}
            {totalPanels > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing)' }}>
                <TableRowButton
                  variant="outline"
                  onClick={handleAutoCalculate}
                  label="Auto-Calculate Distribution"
                />
              </div>
            )}

            {/* Header Row */}
            <div className={componentStyles.headerRow}>
              {/* Left side: Remaining Panels */}
              <div className={componentStyles.headerFlex}>
                <span className={componentStyles.headerText}>
                  Remaining Panels:{' '}
                  <span className={`${componentStyles.panelsRemaining} ${
                    panelsRemaining === 0 ? componentStyles.panelsRemainingComplete :
                    panelsRemaining < 0 ? componentStyles.panelsRemainingError :
                    componentStyles.panelsRemainingWarning
                  }`}>
                    {panelsRemaining}
                  </span>
                </span>
              </div>

              {/* Column headers */}
              <div className={componentStyles.columnHeader}>
                Strings
              </div>
              <div className={componentStyles.columnHeaderWide}>
                Panel Qty
              </div>
            </div>

            {/* Input Rows */}
            <div className={componentStyles.inputRowsContainer}>
              {Array.from({ length: maxInputs }, (_, i) => renderInputRow(i + 1))}
            </div>
          </div>
        )}
      </EquipmentRow>
    </div>
  );
};

export default InverterStringingSection;
