import React, { useState, useRef, useEffect } from 'react';
import styles from './TableSelect.module.css';

/**
 * TableSelect - Simple dropdown for table rows (no search)
 * Matches TableDropdown styling but without search functionality
 *
 * @param {string} label - Field label (left side, 30%)
 * @param {string} value - Selected value
 * @param {function} onChange - Change handler
 * @param {array} options - Array of {value, label} objects
 * @param {string} placeholder - Placeholder text
 * @param {boolean} disabled - Disable the select
 */
const TableSelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div className={styles.row} ref={containerRef}>
      <span className={styles.label}>{label}</span>
      <div className={styles.dropdownWrapper}>
        <button
          type="button"
          className={`${styles.dropdown} ${disabled ? styles.disabled : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <span className={!selectedOption ? styles.placeholderText : ''}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </button>
        <ChevronDownIcon isOpen={isOpen} />

        {isOpen && (
          <div className={styles.dropdownMenu}>
            <div className={styles.optionsList}>
              {options.length === 0 ? (
                <div className={styles.noResults}>No options available</div>
              ) : (
                options.map((option, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
                    onClick={() => handleSelect(option.value)}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChevronDownIcon = ({ isOpen }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 16 16"
    fill="currentColor"
    className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ''}`}
  >
    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
  </svg>
);

export default TableSelect;
