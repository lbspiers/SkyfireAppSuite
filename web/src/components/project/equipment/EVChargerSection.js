import React, { useState, useEffect } from 'react';
import { EquipmentRow, FormFieldRow, TableRowButton, TableDropdown, AddButton } from '../../ui';
import styles from '../../../styles/ProjectAdd.module.css';

/**
 * EV Charger Section
 * Handles EV charger configuration within String Combiner setup
 * Expandable section with "Add EV Charger" button
 */
const EVChargerSection = ({ formData, onChange, onRemove }) => {
  // Check if EV charger is added
  const hasEVCharger = formData.ev_charger_added === true;

  // EV Charger power rating options (typical residential chargers)
  const powerRatingOptions = [
    { value: '7.2', label: '7.2 kW (Level 2)' },
    { value: '9.6', label: '9.6 kW (Level 2)' },
    { value: '11.5', label: '11.5 kW (Level 2)' },
    { value: '19.2', label: '19.2 kW (Level 2)' },
  ];

  // Installation type options
  const installationTypes = [
    { value: 'Hardwired', label: 'Hardwired' },
    { value: 'Plug-In', label: 'Plug-In (NEMA 14-50)' },
  ];

  const handleAddEVCharger = () => {
    onChange('ev_charger_added', true);
    // Set default values
    if (!formData.ev_charger_isnew) {
      onChange('ev_charger_isnew', true);
    }
  };

  const handleRemoveEVCharger = () => {
    // Clear all EV charger fields
    onChange('ev_charger_added', false);
    onChange('ev_charger_make', '');
    onChange('ev_charger_model', '');
    onChange('ev_charger_power_rating', '');
    onChange('ev_charger_installation_type', '');
    onChange('ev_charger_isnew', undefined);

    if (onRemove) onRemove();
  };

  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value);
    // Ensure isnew is set when any field is changed
    if (formData.ev_charger_isnew === undefined) {
      onChange('ev_charger_isnew', true);
    }
  };

  // If not added, show Add button
  if (!hasEVCharger) {
    return (
      <div style={{ padding: 'var(--spacing)' }}>
        <AddButton
          label="Add EV Charger"
          onClick={handleAddEVCharger}
        />
      </div>
    );
  }

  // If added, show full configuration
  return (
    <EquipmentRow
      title="EV Charger"
      subtitle={formData.ev_charger_model || ''}
      isNew={formData.ev_charger_isnew !== false}
      onToggle={(isNew) => onChange('ev_charger_isnew', isNew)}
      onDelete={handleRemoveEVCharger}
      showNewExistingToggle={true}
    >
      {/* Make/Manufacturer */}
      <TableDropdown
        label="Manufacturer"
        value={formData.ev_charger_make || ''}
        onChange={(value) => handleFieldChange('ev_charger_make', value)}
        options={[
          { value: 'Tesla', label: 'Tesla' },
          { value: 'ChargePoint', label: 'ChargePoint' },
          { value: 'JuiceBox', label: 'JuiceBox' },
          { value: 'ClipperCreek', label: 'ClipperCreek' },
          { value: 'Grizzl-E', label: 'Grizzl-E' },
          { value: 'Emporia', label: 'Emporia' },
          { value: 'Wallbox', label: 'Wallbox' },
          { value: 'Other', label: 'Other' },
        ]}
        placeholder="Select manufacturer"
      />

      {/* Model */}
      <TableDropdown
        label="Model"
        value={formData.ev_charger_model || ''}
        onChange={(value) => handleFieldChange('ev_charger_model', value)}
        options={[
          { value: 'Wall Connector Gen 3', label: 'Wall Connector Gen 3' },
          { value: 'Home Flex', label: 'Home Flex' },
          { value: 'JuiceBox 40', label: 'JuiceBox 40' },
          { value: 'JuiceBox 48', label: 'JuiceBox 48' },
          { value: 'HCS-40', label: 'HCS-40' },
          { value: 'HCS-50', label: 'HCS-50' },
          { value: 'Aventa', label: 'Aventa' },
          { value: 'Pulsar Plus', label: 'Pulsar Plus' },
          { value: 'Other', label: 'Other' },
        ]}
        placeholder="Select model"
      />

      {/* Power Rating */}
      <TableDropdown
        label="Power Rating"
        value={formData.ev_charger_power_rating || ''}
        onChange={(value) => handleFieldChange('ev_charger_power_rating', value)}
        options={powerRatingOptions}
        placeholder="Select power rating"
      />

      {/* Installation Type */}
      <FormFieldRow label="Installation Type">
        <TableRowButton
          label="Hardwired"
          variant="outline"
          active={formData.ev_charger_installation_type === 'Hardwired'}
          onClick={() => handleFieldChange('ev_charger_installation_type', 'Hardwired')}
        />
        <TableRowButton
          label="Plug-In"
          variant="outline"
          active={formData.ev_charger_installation_type === 'Plug-In'}
          onClick={() => handleFieldChange('ev_charger_installation_type', 'Plug-In')}
        />
      </FormFieldRow>
    </EquipmentRow>
  );
};

export default EVChargerSection;
