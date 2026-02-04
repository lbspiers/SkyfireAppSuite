/**
 * POIPromptModal - Prompts user to select POI Type and Location
 * Used by Utility Required BOS when POI fields are not yet filled
 */

import React, { useState, useMemo } from 'react';
import { Modal, Button } from '../ui';
import styles from './POIPromptModal.module.css';

// POI Type options (from constants)
const POI_TYPE_OPTIONS = [
  { label: "PV Breaker (OCPD)", value: "PV Breaker (OCPD)" },
  { label: "Line (Supply) Side Tap", value: "Line (Supply) Side Tap" },
  { label: "Line Side Connection", value: "Line Side Connection" },
  { label: "Load Side Tap", value: "Load Side Tap" },
  { label: "Lug Kit", value: "Lug Kit" },
  { label: "Meter Collar Adapter", value: "Meter Collar Adapter" },
  { label: "Solar Ready", value: "Solar Ready" },
];

/**
 * Get POI location options based on selected POI type
 */
const getLocationOptions = (poiType) => {
  const baseOptions = [
    { label: 'Main Panel (A) Bus', value: 'Main Panel (A) Bus' },
    { label: 'Sub Panel (B) Bus', value: 'Sub Panel (B) Bus' },
  ];

  if (poiType === 'Line (Supply) Side Tap') {
    return [{ label: 'Between Main Panel (A) MCB & Utility Meter', value: 'Between Main Panel (A) MCB & Utility Meter' }];
  }

  if (poiType === 'Line Side Connection') {
    return [{ label: 'Utility Meter', value: 'Utility Meter' }];
  }

  if (poiType === 'Load Side Tap') {
    return [
      { label: 'Between Main Panel (A) Bus & MCB', value: 'Between Main Panel (A) Bus & MCB' },
      { label: 'Between Main Panel (A) & Sub Panel (B)', value: 'Between Main Panel (A) & Sub Panel (B)' },
    ];
  }

  if (poiType === 'Meter Collar Adapter') {
    return [
      { label: 'Utility Meter', value: 'Utility Meter' },
      { label: 'Detached Meter Enclosure', value: 'Detached Meter Enclosure' },
    ];
  }

  if (poiType === 'Solar Ready') {
    return [
      { label: '60A Dedicated PV Input', value: '60A Dedicated PV Input' },
      { label: '100A Dedicated PV Input', value: '100A Dedicated PV Input' },
      { label: '200A Dedicated PV Input', value: '200A Dedicated PV Input' },
    ];
  }

  return baseOptions;
};

const POIPromptModal = ({ isOpen, onClose, onConfirm, systemNumber = 1 }) => {
  const [poiType, setPoiType] = useState('');
  const [poiLocation, setPoiLocation] = useState('');

  // Get location options based on selected POI type
  const locationOptions = useMemo(() => {
    return getLocationOptions(poiType);
  }, [poiType]);

  // Reset location when POI type changes
  const handlePoiTypeChange = (value) => {
    setPoiType(value);
    setPoiLocation(''); // Clear location when type changes
  };

  const handleConfirm = () => {
    if (poiType && poiLocation) {
      onConfirm({ poiType, poiLocation });
      // Reset state after confirmation
      setPoiType('');
      setPoiLocation('');
    }
  };

  const handleClose = () => {
    // Reset state on close
    setPoiType('');
    setPoiLocation('');
    onClose();
  };

  const isValid = poiType && poiLocation;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`POI Configuration Required - System ${systemNumber}`}
      size="md"
    >
      <div className={styles.content}>
        <p className={styles.description}>
          To detect utility required equipment, please specify the Point of Interconnection (POI) details:
        </p>

        {/* POI Type Dropdown */}
        <div className={styles.field}>
          <label className={styles.label}>POI Type</label>
          <select
            className={styles.select}
            value={poiType}
            onChange={(e) => handlePoiTypeChange(e.target.value)}
          >
            <option value="">Select POI type...</option>
            {POI_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* POI Location Dropdown */}
        <div className={styles.field}>
          <label className={styles.label}>POI Location</label>
          <select
            className={styles.select}
            value={poiLocation}
            onChange={(e) => setPoiLocation(e.target.value)}
            disabled={!poiType}
          >
            <option value="">
              {poiType ? 'Select POI location...' : 'Select POI type first'}
            </option>
            {locationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <p className={styles.note}>
          Note: You can complete additional POI details in the Electrical tab later.
        </p>
      </div>

      <div className={styles.actions}>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={!isValid}
        >
          Continue
        </Button>
      </div>
    </Modal>
  );
};

export default POIPromptModal;
