import React, { useMemo, useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import Toggle from '../../common/Toggle';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';
import TableRowButton from '../../ui/TableRowButton';
import Tooltip from '../../ui/Tooltip';
import styles from '../../../styles/ProjectAdd.module.css';
import gridStyles from './StringingGrid.module.css';

/**
 * ChevronDownIcon - Reusable chevron icon component
 */
const ChevronDownIcon = ({ isOpen }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 16 16"
    fill="currentColor"
    className={`${gridStyles.chevronIcon} ${isOpen ? gridStyles.chevronOpen : ''}`}
  >
    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
  </svg>
);

/**
 * StringingGrid Component
 * Reusable grid for both inverter and microinverter stringing configuration
 * Uses CSS Grid with content-aware column sizing
 *
 * Modes:
 * - 'standard': Shows Strings column + Panel Qty dropdown (for standard microinverters like Enphase)
 * - 'dual-qty': Shows Panel Qty + Micro Qty columns (for APSystems, Hoymiles Power)
 */
const StringingGrid = ({
  rows,
  panelsRemaining,
  columnLabels = { col1: 'Input', col3: 'Panel Qty', col4: 'Micro Qty' },
  mode = 'standard', // 'standard' or 'dual-qty'
  maxPanelsPerBranch = 20, // Max panels per branch for standard mode dropdown
  onToggle,
  onChange,
  onPanelQtyChange, // For dual-qty mode
  onPanelTypeChange, // Handler for panel type selection
  onSplitToggle, // Handler for split row toggle (when Both is selected)
  showPanelType = false, // Whether to show panel type column
  panelType1Label = 'Type 1', // Label for Type 1 panel (make + model)
  panelType2Label = 'Type 2', // Label for Type 2 panel (make + model)
  onMicroTypeChange, // Handler for micro type selection in Both mode
  onFocus,
  onBlur,
  activeInput,
  hideRemainingPanels = false // New prop to hide the "Remaining Panels" display
}) => {
  // Generate panel quantity options for standard mode (1 to maxPanelsPerBranch)
  const panelQtyOptions = useMemo(() => {
    const options = [];
    for (let i = 1; i <= maxPanelsPerBranch; i++) {
      options.push({ value: i.toString(), label: i.toString() });
    }
    return options;
  }, [maxPanelsPerBranch]);

  // State for dropdown management
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRefs = useRef({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openDropdown !== null) {
        const ref = dropdownRefs.current[openDropdown];
        if (ref && !ref.contains(e.target)) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const handleDropdownToggle = (rowIndex) => {
    setOpenDropdown(openDropdown === rowIndex ? null : rowIndex);
  };

  const handleOptionSelect = (rowIndex, value) => {
    onChange(rowIndex, value);
    setOpenDropdown(null);
  };
  return (
    <div className={gridStyles.gridContainer}>
      {/* Header Row - only show if not hiding remaining panels */}
      {!hideRemainingPanels && (
        <>
          <div className={mode === 'dual-qty' ? gridStyles.headerRowDual : gridStyles.headerRow}>
            <div className={gridStyles.panelsRemaining}>
              Remaining Panels: <span className={gridStyles.highlight}>{panelsRemaining >= 0 ? panelsRemaining : 0}</span>
              <Tooltip content="Track unassigned panels in this system" position="top">
                <HelpCircle size={14} className={gridStyles.helpIcon} />
              </Tooltip>
            </div>
            {mode === 'dual-qty' && (
              <div className={gridStyles.headerLabel}>
                {columnLabels.col3}
                <Tooltip content="Number of solar panels per branch" position="top">
                  <HelpCircle size={14} className={gridStyles.helpIcon} />
                </Tooltip>
              </div>
            )}
            <div className={gridStyles.headerLabel}>
              {columnLabels.col4}
              <Tooltip content={mode === 'standard' ? 'Number of panels connected to this microinverter' : 'Number of microinverters per branch'} position="top">
                <HelpCircle size={14} className={gridStyles.helpIcon} />
              </Tooltip>
            </div>
          </div>

          {/* Divider */}
          <div className={gridStyles.divider}></div>
        </>
      )}

      {/* Data Rows */}
      <div className={gridStyles.rowsContainer}>
        {rows.map((row, index) => {
          // Handle "Both" parent rows with sub-rows
          if (row.isParent && row.subRows) {
            return (
              <div key={row.id || index} className={gridStyles.branchGroup}>
                {/* Divider before branch */}
                <div className={gridStyles.branchDivider}></div>

                {/* Branch header row */}
                <div className={gridStyles.branchHeaderRow}>
                  {/* Branch Label - centered */}
                  <div className={gridStyles.branchLabelCell}>
                    {columnLabels.col1} {row.index}
                  </div>

                  {/* Column Headers */}
                  <div className={gridStyles.branchColumnHeader}>Solar Panel Type</div>
                  <div className={gridStyles.branchColumnHeader}>Micro Type</div>
                  <div className={gridStyles.branchColumnHeader}>Qty</div>
                </div>

                {/* Dotted divider line */}
                <div className={gridStyles.branchDottedDivider}></div>

                {/* Sub-rows for Type 1 and Type 2 */}
                {row.subRows.map((subRow, subIndex) => (
                  <div key={subRow.id} className={gridStyles.subRow}>
                    {/* Empty cell for alignment */}
                    <div></div>

                    {/* Solar Panel Type */}
                    <div className={gridStyles.subRowCell}>
                      Type {subRow.actualPanelType}
                    </div>

                    {/* Micro Type Dropdown */}
                    <div className={gridStyles.subRowCell}>
                      <div className={gridStyles.dropdownWrapper} ref={el => dropdownRefs.current[`microType_${row.index}_${subRow.subType}`] = el}>
                        <button
                          type="button"
                          className={gridStyles.dropdown}
                          onClick={() => handleDropdownToggle(`microType_${row.index}_${subRow.subType}`)}
                        >
                          <span className={!subRow.microType ? gridStyles.placeholderText : ''}>
                            {subRow.microType === '1' ? 'Type 1' : subRow.microType === '2' ? 'Type 2' : 'Select Type'}
                          </span>
                        </button>
                        <ChevronDownIcon isOpen={openDropdown === `microType_${row.index}_${subRow.subType}`} />

                        {openDropdown === `microType_${row.index}_${subRow.subType}` && (
                          <div className={gridStyles.dropdownMenu}>
                            <div className={gridStyles.optionsList}>
                              <button
                                type="button"
                                className={`${gridStyles.option} ${subRow.microType === '1' ? gridStyles.selected : ''}`}
                                onClick={() => {
                                  onMicroTypeChange && onMicroTypeChange(row.index, '1', subRow.subType);
                                  setOpenDropdown(null);
                                }}
                              >
                                Type 1
                              </button>
                              <button
                                type="button"
                                className={`${gridStyles.option} ${subRow.microType === '2' ? gridStyles.selected : ''}`}
                                onClick={() => {
                                  onMicroTypeChange && onMicroTypeChange(row.index, '2', subRow.subType);
                                  setOpenDropdown(null);
                                }}
                              >
                                Type 2
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Panel Qty Input */}
                    <div className={gridStyles.qtyCell}>
                      <FormInput
                        type="text"
                        value={subRow.displayValue || ''}
                        onChange={(e) => onChange(row.index, e.target.value, subRow.subType)}
                        onFocus={() => onFocus && onFocus(row.index)}
                        onBlur={() => onBlur && onBlur()}
                        placeholder="Qty"
                        size="sm"
                        fullWidth={false}
                        className={gridStyles.formInputWrapper}
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          }

          // Regular rows (non-split)
          return (
            <div key={row.id || index} className={mode === 'dual-qty' ? gridStyles.dataRowDual : gridStyles.dataRow}>
              {/* Column 1 (25%): Label (Input/Branch) */}
              <div className={gridStyles.labelCell}>
                {columnLabels.col1} {row.index}
              </div>

              {/* Column 2 (75%): Panel Type Dropdown + Qty Input */}
              <div className={gridStyles.qtyCell}>
                {/* Panel Type Dropdown (shown when showPanelType is true) */}
                {showPanelType && (
                  <div className={gridStyles.dropdownWrapper} ref={el => dropdownRefs.current[`panelType_${row.index}`] = el}>
                    <button
                      type="button"
                      className={gridStyles.dropdown}
                      onClick={() => handleDropdownToggle(`panelType_${row.index}`)}
                    >
                      <span className={!row.panelType ? gridStyles.placeholderText : ''}>
                        {row.panelType === '1' ? panelType1Label : row.panelType === '2' ? panelType2Label : row.panelType === 'both' ? 'Both' : 'Select Type'}
                      </span>
                    </button>
                    <ChevronDownIcon isOpen={openDropdown === `panelType_${row.index}`} />

                    {openDropdown === `panelType_${row.index}` && (
                      <div className={gridStyles.dropdownMenu}>
                        <div className={gridStyles.optionsList}>
                          <button
                            type="button"
                            className={`${gridStyles.option} ${row.panelType === '1' ? gridStyles.selected : ''}`}
                            onClick={() => {
                              onPanelTypeChange && onPanelTypeChange(row.index, '1');
                              setOpenDropdown(null);
                            }}
                          >
                            {panelType1Label}
                          </button>
                          <button
                            type="button"
                            className={`${gridStyles.option} ${row.panelType === '2' ? gridStyles.selected : ''}`}
                            onClick={() => {
                              onPanelTypeChange && onPanelTypeChange(row.index, '2');
                              setOpenDropdown(null);
                            }}
                          >
                            {panelType2Label}
                          </button>
                          <button
                            type="button"
                            className={`${gridStyles.option} ${row.panelType === 'both' ? gridStyles.selected : ''}`}
                            onClick={() => {
                              onPanelTypeChange && onPanelTypeChange(row.index, 'both');
                              setOpenDropdown(null);
                            }}
                          >
                            Both
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Panel Qty Text Input */}
                <FormInput
                  type="text"
                  value={row.displayValue || ''}
                  onChange={(e) => onChange(row.index, e.target.value)}
                  onFocus={() => onFocus && onFocus(row.index)}
                  onBlur={() => onBlur && onBlur()}
                  placeholder="Qty"
                  size="sm"
                  fullWidth={false}
                  className={gridStyles.formInputWrapper}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StringingGrid;
