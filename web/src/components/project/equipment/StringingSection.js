import React, { useState } from 'react';
import Toggle from '../../common/Toggle';
import TableRowButton from '../../ui/TableRowButton';
import { Alert } from '../../ui';
import styles from '../../../styles/ProjectAdd.module.css';
import equipStyles from '../EquipmentForm.module.css';
import formStyles from '../../../styles/FormSections.module.css';
import componentStyles from './StringingSection.module.css';

/**
 * Stringing Section
 * Handles Auto vs Custom stringing configuration for inverters
 */
const StringingSection = ({ formData, onChange }) => {
  const [activeStringInput, setActiveStringInput] = useState(null);

  // Get stringing type (default to 'auto')
  const stringingType = formData.stringing_type || 'auto';

  // Get max strings from inverter data
  const maxStrings = formData.inverter_max_strings_branches || 3;

  // Get solar panel quantity
  const solarPanelQty = parseInt(formData.solar_panel_quantity) || 0;

  // Branch string fields (up to 6 MPPTs/strings)
  const branchStrings = [
    formData.branch_string_1 || '',
    formData.branch_string_2 || '',
    formData.branch_string_3 || '',
    formData.branch_string_4 || '',
    formData.branch_string_5 || '',
    formData.branch_string_6 || '',
  ];

  // Calculate total panels assigned
  const totalPanelsAssigned = branchStrings.reduce((sum, val) => {
    return sum + (parseInt(val) || 0);
  }, 0);

  const panelsRemaining = solarPanelQty - totalPanelsAssigned;

  const handleStringingTypeChange = (type) => {
    onChange('stringing_type', type);

    // Clear branch strings when switching to auto
    if (type === 'auto') {
      for (let i = 1; i <= 6; i++) {
        onChange(`branch_string_${i}`, '');
      }
    }
  };

  const handleBranchStringChange = (index, value) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    onChange(`branch_string_${index}`, numericValue);
  };

  const handleAutoDistribute = () => {
    // Distribute remaining panels evenly across all branches
    if (panelsRemaining <= 0) return;

    const panelsPerBranch = Math.floor(panelsRemaining / maxStrings);
    const remainder = panelsRemaining % maxStrings;

    for (let i = 1; i <= maxStrings; i++) {
      const currentValue = parseInt(branchStrings[i - 1]) || 0;
      const additionalPanels = i <= remainder ? panelsPerBranch + 1 : panelsPerBranch;
      onChange(`branch_string_${i}`, (currentValue + additionalPanels).toString());
    }
  };

  const handleMPPTToggle = (mpptIndex, isNew) => {
    onChange(`mppt_${mpptIndex}_isnew`, isNew);
  };

  const renderMPPTRow = (mpptIndex) => {
    const fieldName = `branch_string_${mpptIndex}`;
    const value = formData[fieldName] || '';
    const displayValue = value === '' || value === '0' ? '' : value;
    const isActive = activeStringInput === mpptIndex;
    const mpptIsNew = formData[`mppt_${mpptIndex}_isnew`] !== false;

    return (
      <div key={mpptIndex} className={`${formStyles.fieldRow} ${componentStyles.mpptRow}`}>
        {/* Input Label - left aligned */}
        <div className={`${formStyles.label} ${componentStyles.inputLabel}`}>
          Input {mpptIndex}
        </div>

        {/* New/Existing Toggle */}
        <div className={formStyles.fieldMedium}>
          <Toggle
            isNew={mpptIsNew}
            onToggle={(isNew) => handleMPPTToggle(mpptIndex, isNew)}
          />
        </div>

        {/* Flexible spacer pushes Strings and Panel Qty to the right */}
        <div className={formStyles.fieldFlex1}></div>

        {/* Strings Box */}
        <input
          type="text"
          value="1"
          readOnly
          className={`${styles.input} ${formStyles.fieldSmall} ${componentStyles.stringsReadonly}`}
        />

        {/* Spacer between Strings and Panel Qty */}
        <div className={componentStyles.fieldSpacer}></div>

        {/* Panel Qty Input */}
        <input
          type="text"
          value={displayValue}
          onChange={(e) => handleBranchStringChange(mpptIndex, e.target.value)}
          onFocus={() => setActiveStringInput(mpptIndex)}
          onBlur={() => setActiveStringInput(null)}
          className={`${styles.input} ${formStyles.fieldSmall} ${componentStyles.panelQtyInput} ${isActive ? componentStyles.panelQtyInputActive : componentStyles.panelQtyInputInactive}`}
          placeholder="Panel Quantity"
        />
      </div>
    );
  };

  return (
    <>
      {/* Stringing Type Selector */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Stringing</label>
        <div className={componentStyles.stringingToggleWrapper}>
          <div className={formStyles.toggleGroup}>
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
          </div>
          {/* Tooltip icon */}
          <div className={componentStyles.tooltipIconWrapper}>
            <img
              src={require('../../../assets/images/Skyfire Flame Icon.png')}
              alt=""
              className={componentStyles.tooltipIcon}
              title="Stringing will auto size to distribute total Quantity in Solar Panel 1 and to stay within Manufacturer stringing requirements and limits."
            />
          </div>
        </div>
      </div>

      {/* Custom Stringing Interface */}
      {stringingType === 'custom' && (
        <div className={formStyles.sectionColumn}>
          {/* Check if inverter is selected */}
          {!formData.inverter_make || !formData.inverter_model ? (
            <div className={formStyles.warningBox}>
              <div className={formStyles.infoBoxContent}>
                Please select an inverter make and model first to configure custom stringing.
              </div>
            </div>
          ) : (
            <>
              {/* Header Row with Remaining Panels and Auto Distribute */}
              <div className={`${formStyles.fieldRow} ${componentStyles.headerRow}`}>
                {/* Auto Distribute Button + Remaining Panels Label */}
                <div className={`${formStyles.fieldFlex1} ${componentStyles.headerLabelWrapper}`}>
                  <div className={componentStyles.remainingPanelsRow}>
                    <button
                      type="button"
                      onClick={handleAutoDistribute}
                      className={componentStyles.autoDistributeButton}
                      disabled={panelsRemaining <= 0}
                    >
                      Auto Distribute
                    </button>
                    <div className={formStyles.label}>
                      Remaining Panels: <span className={formStyles.valueHighlight}>{panelsRemaining >= 0 ? panelsRemaining : 0}</span>
                    </div>
                  </div>
                </div>
                <div className={`${formStyles.label} ${componentStyles.headerLabel}`}>
                  Strings
                </div>
                {/* Spacer between Strings and Panel Qty */}
                <div className={componentStyles.fieldSpacer}></div>
                <div className={`${formStyles.label} ${componentStyles.headerLabel}`}>
                  Panel Qty
                </div>
              </div>

              {/* MPPT Rows */}
              <div className={componentStyles.mpptRowsContainer}>
                {Array.from({ length: maxStrings }, (_, i) => renderMPPTRow(i + 1))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default StringingSection;
