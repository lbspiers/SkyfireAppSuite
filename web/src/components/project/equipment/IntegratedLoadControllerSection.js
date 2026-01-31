import React from 'react';
import { EquipmentRow, FormFieldRow, TableRowButton, TableDropdown, AddButton, Alert } from '../../ui';
import styles from '../../../styles/ProjectAdd.module.css';

/**
 * Integrated Load Controller Section
 * Handles load management/controller configuration within String Combiner setup
 * Shown as an optional add-on for advanced load management
 */
const IntegratedLoadControllerSection = ({ formData, onChange, onRemove }) => {
  // Check if load controller is added
  const hasLoadController = formData.load_controller_added === true;

  // Controller type options
  const controllerTypes = [
    { value: 'Enphase IQ Load Controller', label: 'Enphase IQ Load Controller' },
    { value: 'Smart Circuit Breaker', label: 'Smart Circuit Breaker' },
    { value: 'Load Management Relay', label: 'Load Management Relay' },
  ];

  // Number of controlled loads
  const controlledLoadsOptions = [
    { value: '1', label: '1 Load' },
    { value: '2', label: '2 Loads' },
    { value: '3', label: '3 Loads' },
    { value: '4', label: '4 Loads' },
  ];

  const handleAddLoadController = () => {
    onChange('load_controller_added', true);
    // Set default values
    if (!formData.load_controller_isnew) {
      onChange('load_controller_isnew', true);
    }
  };

  const handleRemoveLoadController = () => {
    // Clear all load controller fields
    onChange('load_controller_added', false);
    onChange('load_controller_type', '');
    onChange('load_controller_controlled_loads', '');
    onChange('load_controller_isnew', undefined);

    if (onRemove) onRemove();
  };

  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value);
    // Ensure isnew is set when any field is changed
    if (formData.load_controller_isnew === undefined) {
      onChange('load_controller_isnew', true);
    }
  };

  // If not added, show Add button
  if (!hasLoadController) {
    return (
      <div style={{ padding: 'var(--spacing)' }}>
        <AddButton
          label="Add Integrated Load Controller"
          onClick={handleAddLoadController}
        />
      </div>
    );
  }

  // If added, show full configuration
  return (
    <EquipmentRow
      title="Integrated Load Controller"
      subtitle={formData.load_controller_type || ''}
      isNew={formData.load_controller_isnew !== false}
      onToggle={(isNew) => onChange('load_controller_isnew', isNew)}
      onDelete={handleRemoveLoadController}
      showNewExistingToggle={true}
    >
      {/* Controller Type */}
      <TableDropdown
        label="Controller Type"
        value={formData.load_controller_type || ''}
        onChange={(value) => handleFieldChange('load_controller_type', value)}
        options={controllerTypes}
        placeholder="Select controller type"
      />

      {/* Number of Controlled Loads */}
      <TableDropdown
        label="Controlled Loads"
        value={formData.load_controller_controlled_loads || ''}
        onChange={(value) => handleFieldChange('load_controller_controlled_loads', value)}
        options={controlledLoadsOptions}
        placeholder="Select number of loads"
      />

      {/* Info about load management */}
      {formData.load_controller_type && (
        <Alert variant="info" collapsible={false}>
          Load controller will manage power distribution to connected loads based on available solar production and battery state.
        </Alert>
      )}
    </EquipmentRow>
  );
};

export default IntegratedLoadControllerSection;
