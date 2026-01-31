import React, { useState, useRef, useEffect, useMemo } from 'react';
import styles from './TableDropdown.module.css';

/**
 * TableDropdown - Minimal searchable dropdown for table rows
 * 25% label, 75% dropdown field with chevron
 *
 * @param {string} label - Field label (left side, 25%)
 * @param {string} value - Selected value
 * @param {function} onChange - Change handler
 * @param {array} options - Array of {value, label} objects
 * @param {string} placeholder - Placeholder text
 * @param {boolean} disabled - Disable the dropdown
 * @param {boolean} showSearch - Show search input (default: true, set false for short lists)
 */
const TableDropdown = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  disabled = false,
  showSearch = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter(opt =>
      opt.label.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
    setSearch('');
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
            {showSearch && (
              <div className={styles.searchWrapper}>
                <input
                  ref={inputRef}
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <div className={styles.optionsList}>
              {filteredOptions.length === 0 ? (
                <div className={styles.noResults}>No results found</div>
              ) : (
                filteredOptions.map((option, idx) => (
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

export default TableDropdown;
