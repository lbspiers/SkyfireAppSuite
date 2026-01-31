import React, { useState, useMemo } from 'react';
import { Alert, Button, EquipmentRow, FormFieldRow, TableRowButton } from '../../ui';
import StringingGrid from './StringingGrid';
import projectStyles from '../../../styles/ProjectAdd.module.css';
import equipStyles from '../EquipmentForm.module.css';
import formStyles from '../../../styles/FormSections.module.css';
import styles from './MicroinverterStringingSection.module.css';
import {
  getStringingSpecs,
  getMaxBranches as getMaxBranchesUtil,
  isDualQtyManufacturer,
} from '../../../utils/stringingConstants';
import {
  calculateMaxPanelsPerBranch,
  distributeStandardMicros,
  calculateDualQtyDistribution,
  getStringingMode,
} from '../../../utils/stringingCalculations';

/**
 * Microinverter Stringing Section
 * Handles Auto vs Custom stringing configuration for microinverters with combiner panels
 */
const MicroinverterStringingSection = ({ formData, onChange }) => {
  const [activeStringInput, setActiveStringInput] = useState(null);

  // ============================================
  // DERIVED STATE FROM FORM DATA
  // ============================================

  // Get stringing type (default to 'auto')
  const stringingType = formData.stringing_type || 'auto';

  // Get combiner panel data
  const combinerPanelMake = formData.combiner_panel_make || '';
  const combinerPanelModel = formData.combiner_panel_model || '';
  const hasCombinerPanel = combinerPanelMake && combinerPanelModel;

  // Get inverter data
  const inverterMake = formData.inverter_make || '';
  const inverterModel = formData.inverter_model || '';
  const inverterMaxContOutput = parseFloat(formData.inverter_max_cont_output_amps) || 0;

  // Get solar panel quantity
  const solarPanelQty = parseInt(formData.solar_panel_quantity) || 0;

  // ============================================
  // STRINGING MODE DETECTION
  // ============================================

  // Determine stringing mode: 'standard' (Enphase), 'dual-qty' (Hoymiles/APSystems)
  const stringingMode = getStringingMode('microinverter', inverterMake);
  const isDualQtyMode = stringingMode === 'dual-qty';

  // Get specs for dual-qty manufacturers
  const specs = useMemo(() => {
    return isDualQtyMode ? getStringingSpecs(inverterMake, inverterModel) : null;
  }, [isDualQtyMode, inverterMake, inverterModel]);

  // ============================================
  // BRANCH & PANEL LIMITS
  // ============================================

  // Use utility function for max branches
  const maxBranches = getMaxBranchesUtil(combinerPanelMake, combinerPanelModel);

  // Calculate max panels per branch based on mode
  const maxPanelsPerBranch = useMemo(() => {
    if (isDualQtyMode && specs) {
      return specs.maxPanelsBranch;
    }
    // Standard mode: calculate from max continuous output amps
    return calculateMaxPanelsPerBranch(inverterMaxContOutput);
  }, [isDualQtyMode, specs, inverterMaxContOutput]);

  // For dual-qty mode, also get max micros per branch
  const maxMicrosPerBranch = isDualQtyMode && specs ? specs.maxUnitsBranch : null;

  // Panel ratio for dual-qty mode
  const panelRatio = specs ? parseInt(specs.panelRatio.split(':')[0], 10) : 1;

  // ============================================
  // COLUMN LABELS
  // ============================================

  // Column labels based on mode
  const columnLabels = isDualQtyMode
    ? { col1: 'Branch', col3: 'Panel Qty', col4: 'Micro Qty' }
    : { col1: 'Branch', col4: 'Panel Qty' };

  // ============================================
  // CALCULATE TOTALS
  // ============================================

  // Calculate total panels assigned across all branches
  const totalPanelsAssigned = useMemo(() => {
    let total = 0;
    for (let i = 1; i <= 10; i++) {
      const panelQty = parseInt(formData[`branch_string_${i}`]) || 0;
      total += panelQty;
    }
    return total;
  }, [formData]);

  const panelsRemaining = solarPanelQty - totalPanelsAssigned;

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleStringingTypeChange = (type) => {
    onChange('stringing_type', type);

    // Clear all branch data when switching to auto
    if (type === 'auto') {
      for (let i = 1; i <= 10; i++) {
        onChange(`branch_string_${i}`, '');
      }
    }
  };

  const handleBranchStringChange = (index, value) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    onChange(`branch_string_${index}`, numericValue);
  };

  // ============================================
  // AUTO-CALCULATE FUNCTION
  // ============================================

  const handleAutoCalculate = () => {
    if (solarPanelQty <= 0) return;

    let distribution;

    if (isDualQtyMode && specs) {
      // Hoymiles/APSystems auto-distribution
      distribution = calculateDualQtyDistribution(solarPanelQty, specs, maxBranches);
    } else {
      // Standard (Enphase) auto-distribution
      distribution = distributeStandardMicros(solarPanelQty, maxPanelsPerBranch, maxBranches);
    }

    if (!distribution || !distribution.branches) return;

    // Clear all branches first
    for (let i = 1; i <= 10; i++) {
      onChange(`branch_string_${i}`, '');
    }

    // Populate with calculated values
    distribution.branches.forEach((branch) => {
      const i = branch.branchIndex;
      const panelQtyStr = String(branch.panelQty || 0);
      onChange(`branch_string_${i}`, panelQtyStr);
    });
  };

  // Prepare rows data for StringingGrid component
  const prepareGridRows = () => {
    return Array.from({ length: maxBranches }, (_, i) => {
      const index = i + 1;
      const fieldName = `branch_string_${index}`;
      const value = formData[fieldName] || '';
      const displayValue = value === '' || value === '0' ? '' : value;

      return {
        id: index,
        index,
        displayValue,
        panelQtyValue: isDualQtyMode ? displayValue : undefined,
        isNew: true, // No longer tracking per-branch new/existing
      };
    });
  };

  return (
    <div className={styles.sectionWrapper}>
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
          <div className={styles.autoAlertContainer}>
            <Alert variant="info">
              Stringing will auto size to distribute total Quantity in Solar Panel 1
              and to stay within Manufacturer stringing requirements and limits.
              <br /><br />
              Must choose Combiner Panel to custom string branches.
            </Alert>
          </div>
        )}

        {/* Custom Stringing Interface */}
        {stringingType === 'custom' && (
          <div className={styles.customContainer}>
            {/* Check if combiner panel is selected */}
            {!hasCombinerPanel ? (
              <Alert variant="warning">
                Please select a combiner panel make and model first to configure custom stringing.
              </Alert>
            ) : (
              <>
                {/* Specs Info Display */}
                {isDualQtyMode && specs && (
                  <Alert variant="info" className={styles.specsInfoAlert}>
                    <strong>{inverterModel}</strong>: {specs.panelRatio} ratio •
                    Max {specs.maxUnitsBranch} micros/branch •
                    Max {specs.maxPanelsBranch} panels/branch
                  </Alert>
                )}

                {/* Auto-Calculate Button */}
                {solarPanelQty > 0 && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleAutoCalculate}
                    className={styles.autoCalculateButton}
                  >
                    Auto-Calculate Distribution
                  </Button>
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
              </>
            )}
          </div>
        )}
      </EquipmentRow>
    </div>
  );
};

export default MicroinverterStringingSection;
