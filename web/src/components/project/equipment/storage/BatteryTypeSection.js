import React, { useState, useEffect } from 'react';
import Toggle from '../../../common/Toggle';
import { SearchableDropdown, Button } from '../../../ui';
import styles from '../../../../styles/ProjectAdd.module.css';
import logger from '../../../../services/devLogger';
import {
  getBatteryManufacturers,
  getBatteryModels,
} from '../../../../services/equipmentService';

/**
 * Battery Type Section
 * Handles battery configuration with New/Existing toggle
 * Supports configuration for multiple batteries (Daisy Chain, Battery Combiner Panel, Inverter)
 */
const BatteryTypeSection = ({
  formData,
  onChange,
  batteryNumber = 1,
  showAddBattery2 = false,
  onAddBattery2,
  showConfiguration = false,
  smsData = null,
  inverterData = null,
  batteryCombinerPanelData = null,
}) => {
  const [manufacturers, setManufacturers] = useState([]);
  const [models, setModels] = useState([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedModelData, setSelectedModelData] = useState(null);

  // Field names based on battery number
  const prefix = `battery${batteryNumber}`;
  const isNewField = `${prefix}_isnew`;
  const makeField = `${prefix}_make`;
  const modelField = `${prefix}_model`;
  const quantityField = `${prefix}_quantity`;
  const configurationField = `${prefix}_configuration`;
  const tieInLocationField = `${prefix}_tie_in_location`;

  // Configuration options
  const configOptions = [
    'Daisy Chain',
    'Battery Combiner Panel',
    'Inverter',
  ];

  // Get quantity as number
  const quantity = parseInt(formData[quantityField]) || 0;

  // Detect Franklin aPower: requires Battery Combiner Panel for qty > 1
  const isFranklinAPower =
    formData[makeField]?.toLowerCase().includes('franklin') &&
    formData[modelField]?.toLowerCase().includes('apower') &&
    quantity > 1;

  // Get filtered configuration options
  const getConfigOptions = () => {
    if (isFranklinAPower) {
      return ['Battery Combiner Panel'];
    }
    return configOptions;
  };

  // Auto-select Battery Combiner Panel for Franklin aPower with qty > 1
  useEffect(() => {
    if (isFranklinAPower && formData[configurationField] !== 'Battery Combiner Panel') {
      onChange(configurationField, 'Battery Combiner Panel');
    }
  }, [isFranklinAPower, formData[configurationField], configurationField, onChange]);

  // Load manufacturers on mount
  useEffect(() => {
    loadManufacturers();
  }, []);

  // Load models when manufacturer changes
  useEffect(() => {
    if (formData[makeField]) {
      loadModels(formData[makeField]);
    } else {
      setModels([]);
      setSelectedModelData(null);
    }
  }, [formData[makeField]]);

  const loadManufacturers = async () => {
    setLoadingMakes(true);
    try {
      const response = await getBatteryManufacturers();
      setManufacturers(response.data || []);
    } catch (error) {
      logger.error('Equipment', 'Failed to load battery manufacturers:', error);
    } finally {
      setLoadingMakes(false);
    }
  };

  const loadModels = async (manufacturer) => {
    setLoadingModels(true);
    try {
      // Add cache-busting timestamp to force fresh data
      const response = await getBatteryModels(manufacturer);
      const modelsData = response.data || [];

      logger.debug('Equipment', `Loaded ${modelsData.length} battery models for ${manufacturer}`);
      if (modelsData.length > 0) {
        logger.debug('Equipment', 'Available models:', modelsData.map(m => `${m.model_number} (id: ${m.id})`).join(', '));
      }

      setModels(modelsData);

      // If current model is selected, find its data
      if (formData[modelField]) {
        const modelData = modelsData.find(m => m.model_number === formData[modelField]);
        if (modelData) {
          setSelectedModelData(modelData);
          // Store model ID for future reference
          if (modelData.id) {
            onChange(`${prefix}_model_id`, modelData.id);
          }
        } else {
          logger.warn('Equipment', `Selected model "${formData[modelField]}" not found in API response`);
        }
      }
    } catch (error) {
      logger.error('Equipment', 'Failed to load battery models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleToggle = (isNew) => {
    onChange(isNewField, isNew);
  };

  const handleManufacturerChange = (value) => {
    onChange(makeField, value);
    onChange(modelField, ''); // Clear model when manufacturer changes
    setSelectedModelData(null);
  };

  const handleModelChange = (value) => {
    onChange(modelField, value);

    // Find model data
    const modelData = models.find(m => m.model_number === value);
    if (modelData) {
      setSelectedModelData(modelData);
      // Store model ID for future reference
      if (modelData.id) {
        onChange(`${prefix}_model_id`, modelData.id);
      }
    }
  };

  // Build tie-in location options
  const buildTieInLocationOptions = () => {
    const options = [];

    // Storage Management System (SMS)
    if (smsData?.make && smsData?.model) {
      options.push(`SMS - ${smsData.make} ${smsData.model}`);
    } else {
      options.push('SMS');
    }

    // Inverter
    if (inverterData?.make && inverterData?.model) {
      options.push(`Inverter - ${inverterData.make} ${inverterData.model}`);
    }

    // Main Panel
    options.push('Main Panel');

    // Sub Panel
    options.push('Sub Panel');

    // Battery Combiner Panel
    if (batteryCombinerPanelData?.make && batteryCombinerPanelData?.model) {
      options.push(`Battery Combiner Panel - ${batteryCombinerPanelData.make} ${batteryCombinerPanelData.model}`);
    } else {
      options.push('Battery Combiner Panel');
    }

    // Backup Load Sub Panel
    options.push('Backup Load Sub Panel');

    return options;
  };

  const tieInLocationOptions = buildTieInLocationOptions();

  // Check if form is complete for Battery Type 2 button enablement
  const isComplete = formData[makeField] && formData[modelField] && (quantity <= 1 || formData[configurationField]);

  return (
    <>
      <Toggle
        isNew={formData[isNewField] !== false}
        onToggle={handleToggle}
      />

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Quantity</label>
          <input
            type="text"
            value={formData[quantityField] || ''}
            onChange={(e) => {
              // Only allow numbers
              const numericValue = e.target.value.replace(/[^0-9]/g, '');
              onChange(quantityField, numericValue);
            }}
            className={styles.input}
            placeholder="1"
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <SearchableDropdown
            label="Make"
            value={formData[makeField] || ''}
            onChange={handleManufacturerChange}
            options={manufacturers.map(m => ({ value: m, label: m }))}
            placeholder={loadingMakes ? 'Loading...' : 'Select make...'}
            disabled={loadingMakes}
          />
        </div>

        <div className={styles.formGroup}>
          <SearchableDropdown
            label="Model"
            value={formData[modelField] || ''}
            onChange={handleModelChange}
            options={models.map(m => ({ value: m.model_number, label: m.model_number }))}
            placeholder={loadingModels ? 'Loading...' : formData[makeField] ? 'Select model' : 'Select make'}
            disabled={!formData[makeField] || loadingModels}
          />
        </div>
      </div>

      {/* Tie-in Location */}
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <SearchableDropdown
            label="Tie-in Location"
            value={formData[tieInLocationField] || ''}
            onChange={(value) => onChange(tieInLocationField, value)}
            options={tieInLocationOptions.map(opt => ({ value: opt, label: opt }))}
            placeholder="Select location..."
          />
        </div>
      </div>

      {/* Configuration - Show when quantity > 1 */}
      {showConfiguration && quantity > 1 && (
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <SearchableDropdown
              label="Configuration"
              value={formData[configurationField] || ''}
              onChange={(value) => onChange(configurationField, value)}
              options={getConfigOptions().map(opt => ({ value: opt, label: opt }))}
              placeholder="Select configuration..."
              disabled={isFranklinAPower}
            />
          </div>
        </div>
      )}

      {/* Battery Type 2 Button */}
      {showAddBattery2 && (
        <Button
          variant="secondary"
          size="md"
          onClick={onAddBattery2}
          disabled={!isComplete}
          style={{
            width: '50%',
          }}
        >
          + Battery Type 2
        </Button>
      )}
    </>
  );
};

export default BatteryTypeSection;
