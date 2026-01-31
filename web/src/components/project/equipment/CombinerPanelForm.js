import React, { useState } from 'react';
import Toggle from '../../common/Toggle';
import { SearchableDropdown } from '../../ui';
import styles from '../../../styles/ProjectAdd.module.css';
import equipStyles from '../EquipmentForm.module.css';

/**
 * CombinerPanelForm - Form for System Combiner Panel details
 * Shows when user selects "Combiner Panel" as landing destination
 */
const CombinerPanelForm = ({ onSave, onClear, initialData = null }) => {
  const [formData, setFormData] = useState({
    isNew: initialData?.isNew ?? true,
    make: initialData?.make || '',
    model: initialData?.model || '',
    busAmps: initialData?.busAmps || '',
    mcb: initialData?.mcb || '',
  });

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    // Auto-save on change
    if (onSave) {
      onSave(updated);
    }
  };

  const handleToggle = (isNew) => {
    handleChange('isNew', isNew);
  };

  const handleClear = () => {
    const clearedData = {
      isNew: true,
      make: '',
      model: '',
      busAmps: '',
      mcb: '',
    };
    setFormData(clearedData);
    if (onSave) {
      onSave(clearedData);
    }
    if (onClear) {
      onClear();
    }
  };

  const hasData = formData.make || formData.model || formData.busAmps || formData.mcb;

  // Placeholder options - these would come from API in production
  const makeOptions = [
    { value: 'Siemens', label: 'Siemens' },
    { value: 'Square D', label: 'Square D' },
    { value: 'Eaton', label: 'Eaton' },
    { value: 'Schneider Electric', label: 'Schneider Electric' },
    { value: 'ABB', label: 'ABB' },
  ];

  const modelOptions = [
    { value: 'Model A', label: 'Model A' },
    { value: 'Model B', label: 'Model B' },
    { value: 'Model C', label: 'Model C' },
  ];

  const busAmpsOptions = [
    { value: '100', label: '100A' },
    { value: '125', label: '125A' },
    { value: '150', label: '150A' },
    { value: '200', label: '200A' },
    { value: '225', label: '225A' },
    { value: '400', label: '400A' },
  ];

  const mcbOptions = [
    { value: '15', label: '15A' },
    { value: '20', label: '20A' },
    { value: '30', label: '30A' },
    { value: '40', label: '40A' },
    { value: '50', label: '50A' },
    { value: '60', label: '60A' },
  ];

  return (
    <>
      <div className={equipStyles.sectionHeader} style={{ paddingTop: 'var(--spacing-loose)' }}>
        <h3 className={equipStyles.sectionTitle}>System Combiner Panel</h3>
        {hasData && (
          <button
            type="button"
            onClick={handleClear}
            className={equipStyles.clearButton}
          >
            Clear
          </button>
        )}
      </div>

      <div className={styles.formGroup}>
        <Toggle
          isNew={formData.isNew}
          onToggle={handleToggle}
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <SearchableDropdown
            label="Make"
            value={formData.make}
            onChange={(value) => handleChange('make', value)}
            options={makeOptions}
            placeholder="Select make"
          />
        </div>

        <div className={styles.formGroup}>
          <SearchableDropdown
            label="Model"
            value={formData.model}
            onChange={(value) => handleChange('model', value)}
            options={modelOptions}
            placeholder="Select model"
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <SearchableDropdown
            label="Bus Amps"
            value={formData.busAmps}
            onChange={(value) => handleChange('busAmps', value)}
            options={busAmpsOptions}
            placeholder="Select bus amps"
          />
        </div>

        <div className={styles.formGroup}>
          <SearchableDropdown
            label="MCB"
            value={formData.mcb}
            onChange={(value) => handleChange('mcb', value)}
            options={mcbOptions}
            placeholder="Select MCB"
          />
        </div>
      </div>
    </>
  );
};

export default CombinerPanelForm;
