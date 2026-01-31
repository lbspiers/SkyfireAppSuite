/**
 * DEPRECATED: Use ui/SearchableDropdown instead. This file kept for reference.
 *
 * This component has been replaced by the more feature-rich SearchableDropdown
 * in src/components/ui/SearchableDropdown.js
 */

import React, { useState, useRef, useEffect } from 'react';
import styles from '../../styles/ProjectAdd.module.css';

/**
 * SearchableSelect - Dropdown with search/filter functionality
 *
 * @param {string} value - Currently selected value
 * @param {function} onChange - Callback when selection changes
 * @param {array} options - Array of {value, label} objects
 * @param {string} placeholder - Placeholder text
 * @param {boolean} disabled - Whether select is disabled
 * @param {string} className - Additional CSS classes
 * @param {object} style - Inline styles
 */
const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  disabled = false,
  className = '',
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const optionsListRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get display label for current value
  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsListRef.current) {
      const highlightedElement = optionsListRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;

      default:
        // Open dropdown when typing
        if (!isOpen && e.key.length === 1) {
          setIsOpen(true);
        }
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.searchableSelect} ${className}`}
      style={{ position: 'relative', ...style }}
    >
      {/* Selected Value Display */}
      <div
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        className={`${styles.select} ${value ? styles.selectFilled : ''}`}
        style={{
          color: value ? 'var(--text-primary)' : 'var(--text-disabled)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>{displayLabel}</span>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--gray-800)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0.375rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            maxHeight: '300px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Search Input */}
          <div style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type to search..."
              className={styles.input}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '0.875rem',
                background: 'var(--gray-700)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.25rem',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Options List */}
          <div
            ref={optionsListRef}
            style={{
              overflowY: 'auto',
              maxHeight: '240px'
            }}
          >
            {filteredOptions.length === 0 ? (
              <div style={{
                padding: '1rem',
                textAlign: 'center',
                color: 'var(--gray-500)',
                fontSize: '0.875rem'
              }}>
                No matches found
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  style={{
                    padding: '0.625rem 0.75rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: option.value === value ? 'var(--color-primary)' : 'var(--text-primary)',
                    background: highlightedIndex === index
                      ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)'
                      : option.value === value
                      ? 'color-mix(in srgb, var(--color-primary) 5%, transparent)'
                      : 'transparent',
                    transition: 'background 0.15s',
                    fontWeight: option.value === value ? 600 : 400
                  }}
                >
                  {option.label}
                  {option.value === value && (
                    <span style={{ marginLeft: '0.5rem', color: 'var(--color-primary)' }}>✓</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
