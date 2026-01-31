import React, { useState, useRef, useEffect, useMemo } from 'react';
import styles from './SearchableDropdown.module.css';

const SearchableDropdown = ({
  options = [],           // [{ value, label, group? }]
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  label,
  error,
  disabled = false,
  required = false,
  clearable = true,
  noResultsText = 'No results found',
  className = '',
  id,
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

  // Group options if they have group property
  const groupedOptions = useMemo(() => {
    const hasGroups = filteredOptions.some(opt => opt.group);
    if (!hasGroups) return { '': filteredOptions };

    return filteredOptions.reduce((acc, opt) => {
      const group = opt.group || '';
      if (!acc[group]) acc[group] = [];
      acc[group].push(opt);
      return acc;
    }, {});
  }, [filteredOptions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optValue) => {
    if (onChange) onChange(optValue);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) onChange(null);
  };

  const dropdownId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`${styles.wrapper} ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={dropdownId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div
        className={`${styles.control} ${isOpen ? styles.open : ''} ${error ? styles.error : ''} ${disabled ? styles.disabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`${styles.value} ${!selectedOption ? styles.placeholder : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className={styles.indicators}>
          {clearable && value && !disabled && (
            <button className={styles.clearBtn} onClick={handleClear} aria-label="Clear">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <svg
            className={`${styles.chevron} ${isOpen ? styles.rotated : ''}`}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M7 12A5 5 0 107 2a5 5 0 000 10zM14 14l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.options}>
            {filteredOptions.length === 0 ? (
              <div className={styles.noResults}>{noResultsText}</div>
            ) : (
              Object.entries(groupedOptions).map(([group, opts]) => (
                <div key={group || 'default'}>
                  {group && <div className={styles.groupLabel}>{group}</div>}
                  {opts.map((opt) => (
                    <button
                      key={opt.value}
                      className={`${styles.option} ${opt.value === value ? styles.selected : ''}`}
                      onClick={() => handleSelect(opt.value)}
                    >
                      {opt.label}
                      {opt.value === value && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
};

export default SearchableDropdown;
