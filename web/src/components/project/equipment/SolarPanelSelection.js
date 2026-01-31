import React, { useState } from 'react';
import styles from './SolarPanelSelection.module.css';

// Reusable UI Components
import { FormInput, FormSelect, Button } from '../../ui';

/**
 * SolarPanelSelection - Solar panel and system selection component
 * First tab in the equipment configuration
 */
const SolarPanelSelection = ({ projectUuid, projectData, systemNumber }) => {
  const [formData, setFormData] = useState({
    panelManufacturer: '',
    panelModel: '',
    panelWattage: '',
    panelCount: '',
    inverterType: '',
    inverterManufacturer: '',
    inverterModel: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Solar Panel and System Selection</h3>
        <p className={styles.subtitle}>System {systemNumber}</p>
      </div>

      <div className={styles.formGrid}>
        {/* Solar Panel Section */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Solar Panel Information</h4>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <FormInput
                label="Panel Manufacturer"
                type="text"
                value={formData.panelManufacturer}
                onChange={(e) => handleInputChange('panelManufacturer', e.target.value)}
                placeholder="e.g., SunPower, LG, REC"
                size="md"
                fullWidth
              />
            </div>

            <div className={styles.formField}>
              <FormInput
                label="Panel Model"
                type="text"
                value={formData.panelModel}
                onChange={(e) => handleInputChange('panelModel', e.target.value)}
                placeholder="e.g., SPR-X22-370"
                size="md"
                fullWidth
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <FormInput
                label="Panel Wattage (W)"
                type="number"
                value={formData.panelWattage}
                onChange={(e) => handleInputChange('panelWattage', e.target.value)}
                placeholder="e.g., 370"
                size="md"
                fullWidth
              />
            </div>

            <div className={styles.formField}>
              <FormInput
                label="Number of Panels"
                type="number"
                value={formData.panelCount}
                onChange={(e) => handleInputChange('panelCount', e.target.value)}
                placeholder="e.g., 24"
                size="md"
                fullWidth
              />
            </div>
          </div>

          {formData.panelWattage && formData.panelCount && (
            <div className={styles.calculatedValue}>
              <span className={styles.calculatedLabel}>Total System Size:</span>
              <span className={styles.calculatedResult}>
                {(parseFloat(formData.panelWattage) * parseInt(formData.panelCount) / 1000).toFixed(2)} kW
              </span>
            </div>
          )}
        </div>

        {/* Inverter Section */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Inverter Information</h4>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <FormSelect
                label="Inverter Type"
                value={formData.inverterType}
                onChange={(e) => handleInputChange('inverterType', e.target.value)}
                options={[
                  { value: 'string', label: 'String Inverter' },
                  { value: 'micro', label: 'Microinverter' },
                  { value: 'hybrid', label: 'Hybrid Inverter' },
                  { value: 'optimizer', label: 'Power Optimizer' },
                ]}
                placeholder="Select inverter type"
                size="md"
                fullWidth
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <FormInput
                label="Inverter Manufacturer"
                type="text"
                value={formData.inverterManufacturer}
                onChange={(e) => handleInputChange('inverterManufacturer', e.target.value)}
                placeholder="e.g., Enphase, SolarEdge, SMA"
                size="md"
                fullWidth
              />
            </div>

            <div className={styles.formField}>
              <FormInput
                label="Inverter Model"
                type="text"
                value={formData.inverterModel}
                onChange={(e) => handleInputChange('inverterModel', e.target.value)}
                placeholder="e.g., IQ7PLUS-72-2-US"
                size="md"
                fullWidth
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className={styles.footer}>
        <Button variant="primary" size="lg">
          Save Configuration
        </Button>
      </div>
    </div>
  );
};

export default SolarPanelSelection;
