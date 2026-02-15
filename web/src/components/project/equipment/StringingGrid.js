import React, { useMemo, useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import Toggle from '../../common/Toggle';
import FormInput from '../../ui/FormInput';
import FormSelect from '../../ui/FormSelect';
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
  onFocus,
  onBlur,
  activeInput
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
      {/* Header Row */}
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

      {/* Data Rows */}
      <div className={gridStyles.rowsContainer}>
        {rows.map((row, index) => (
          <div key={row.id || index} className={mode === 'dual-qty' ? gridStyles.dataRowDual : gridStyles.dataRow}>
            {/* Column 1: Label (Input/Branch) */}
            <div className={gridStyles.labelCell}>
              {columnLabels.col1} {row.index}
            </div>

            {/* Column 2: New/Existing Toggle */}
            <div className={gridStyles.toggleCell}>
              <Toggle
                isNew={row.isNew}
                onToggle={(isNew) => onToggle(row.index, isNew)}
              />
            </div>

            {/* Column 3: Panel Qty (dual-qty mode only) */}
            {mode === 'dual-qty' && (
              <div className={gridStyles.qtyCell}>
                <FormInput
                  type="text"
                  value={row.panelQtyValue || ''}
                  onChange={(e) => onPanelQtyChange && onPanelQtyChange(row.index, e.target.value)}
                  onFocus={() => onFocus && onFocus(`panel_${row.index}`)}
                  onBlur={() => onBlur && onBlur()}
                  placeholder="Panel Qty"
                  size="sm"
                  fullWidth={false}
                  className={gridStyles.formInputWrapper}
                />
              </div>
            )}

            {/* Column 3/4: Panel Qty Dropdown (standard mode) or Micro Qty Input (dual-qty mode) */}
            <div className={gridStyles.qtyCell}>
              {mode === 'standard' ? (
                <div className={gridStyles.dropdownWrapper} ref={el => dropdownRefs.current[row.index] = el}>
                  <button
                    type="button"
                    className={gridStyles.dropdown}
                    onClick={() => handleDropdownToggle(row.index)}
                    onFocus={() => onFocus && onFocus(row.index)}
                    onBlur={() => onBlur && onBlur()}
                  >
                    <span className={!row.displayValue ? gridStyles.placeholderText : ''}>
                      {row.displayValue || 'Panel Qty'}
                    </span>
                  </button>
                  <ChevronDownIcon isOpen={openDropdown === row.index} />

                  {openDropdown === row.index && (
                    <div className={gridStyles.dropdownMenu}>
                      <div className={gridStyles.optionsList}>
                        {panelQtyOptions.map((option, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`${gridStyles.option} ${option.value === row.displayValue ? gridStyles.selected : ''}`}
                            onClick={() => handleOptionSelect(row.index, option.value)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <FormInput
                  type="text"
                  value={row.displayValue}
                  onChange={(e) => onChange(row.index, e.target.value)}
                  onFocus={() => onFocus && onFocus(row.index)}
                  onBlur={() => onBlur && onBlur()}
                  placeholder="Panel Qty"
                  size="sm"
                  fullWidth={false}
                  className={gridStyles.formInputWrapper}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StringingGrid;
