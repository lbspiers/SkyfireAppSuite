import React, { useState, useRef, useEffect } from 'react';
import Autocomplete from 'react-google-autocomplete';
import logger from '../../services/devLogger';
import { GOOGLE_API_KEY } from '../../config/google';
import styles from '../../styles/ProjectAdd.module.css';

// Style the Google autocomplete dropdown
const styleGoogleDropdown = () => {
  const style = document.createElement('style');
  style.innerHTML = `
    .pac-container {
      background-color: var(--gray-800) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 0.5rem !important;
      margin-top: 0.25rem !important;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3) !important;
    }

    .pac-item {
      background-color: var(--gray-800) !important;
      color: var(--text-primary) !important;
      border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
      padding: 0.75rem !important;
      cursor: pointer !important;
    }

    .pac-item:hover {
      background-color: var(--gray-700) !important;
    }

    .pac-item-selected {
      background-color: var(--gray-700) !important;
    }

    .pac-item-query {
      color: var(--text-primary) !important;
      font-weight: 600 !important;
    }

    .pac-matched {
      color: var(--color-primary) !important;
      font-weight: 700 !important;
    }

    .pac-icon {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
};

const AddressAutocomplete = ({ value, onChange, onAddressSelect, error, className }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const autocompleteRef = useRef(null);

  // Apply custom styles to Google autocomplete dropdown on mount
  useEffect(() => {
    styleGoogleDropdown();
  }, []);

  const handlePlaceSelected = (place) => {
    if (!place.address_components) {
      logger.error('General', 'No address components found');
      return;
    }

    let streetNumber = '';
    let streetName = '';
    let city = '';
    let state = '';
    let zip = '';
    let lat = null;
    let lng = null;

    // Extract address components
    place.address_components.forEach((component) => {
      const types = component.types;
      if (types.includes('street_number')) {
        streetNumber = component.long_name;
      }
      if (types.includes('route')) {
        streetName = component.long_name;
      }
      if (types.includes('locality')) {
        city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
      if (types.includes('postal_code')) {
        zip = component.long_name;
      }
    });

    // Get coordinates if available
    if (place.geometry && place.geometry.location) {
      lat = place.geometry.location.lat();
      lng = place.geometry.location.lng();
    }

    const fullAddress = streetNumber ? `${streetNumber} ${streetName}` : streetName;

    setInputValue(fullAddress);

    // Call the parent handlers
    if (onChange) {
      onChange(fullAddress);
    }

    if (onAddressSelect) {
      onAddressSelect({
        address: fullAddress,
        city,
        state,
        zip,
        lat,
        lng,
      });
    }
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (onChange) {
      onChange(newValue);
    }

    // If user clears the field, reset everything
    if (!newValue && onAddressSelect) {
      onAddressSelect({
        address: '',
        city: '',
        state: '',
        zip: '',
      });
    }
  };

  return (
    <Autocomplete
      ref={autocompleteRef}
      apiKey={GOOGLE_API_KEY}
      value={inputValue}
      onChange={handleChange}
      onPlaceSelected={handlePlaceSelected}
      options={{
        types: ['address'],
        componentRestrictions: { country: 'us' },
      }}
      placeholder="123 Main St..."
      className={className || `${styles.input} ${error ? styles.inputError : ''}`}
    />
  );
};

export default AddressAutocomplete;
