import React, { memo } from 'react';
import { EquipmentRow, FormFieldRow, TableRowButton, TableDropdown, AddSectionButton, SectionClearModal, SectionRemoveModal, Alert } from '../../ui';
import { useSectionDelete, DELETE_BEHAVIOR } from '../../../hooks/useSectionDelete';

/**
 * Energy Storage System Section
 * Allows user to select backup option: Whole Home, Partial Home, or No Backup
 * Shows backup system size dropdown for Whole Home and Partial Home
 * Shows AddSectionButton when no backup option is selected
 */
const EnergyStorageSection = ({ formData, onChange, onBatchChange }) => {
  // Backup System Size options - Whole Home (matches mobile app spec)
  const wholeHomeOptions = [
    { label: '100 Amps', value: '100' },
    { label: '125 Amps', value: '125' },
    { label: '150 Amps', value: '150' },
    { label: '175 Amps', value: '175' },
    { label: '200 Amps', value: '200' },
    { label: '225 Amps', value: '225' },
  ];

  // Backup System Size options - Partial Home (includes 30A and 60A)
  const partialHomeOptions = [
    { label: '30 Amps', value: '30' },
    { label: '60 Amps', value: '60' },
    { label: '100 Amps', value: '100' },
    { label: '125 Amps', value: '125' },
    { label: '150 Amps', value: '150' },
    { label: '175 Amps', value: '175' },
    { label: '200 Amps', value: '200' },
    { label: '225 Amps', value: '225' },
  ];

  const backupOption = formData.backup_option || '';
  const backupSystemSize = formData.backup_system_size || '';

  // Prepare cascade clear fields for use with the delete hook (all downstream ESS fields)
  const essCascadeFields = [
    // SMS fields
      ['sms_isnew', true],
      ['sms_make', ''],
      ['sms_model', ''],
      ['sms_main_breaker', ''],
      ['sms_pv_breaker', ''],
      ['sms_ess_breaker', ''],
      ['sms_tie_in_breaker', ''],
      ['sms_has_rsd', false],
      ['sms_pv_breaker_rating_override', ''],
      ['sms_ess_breaker_rating_override', ''],
      ['sms_tie_in_breaker_rating_override', ''],
      ['sms_backup_load_sub_panel_breaker_rating', ''],

      // Clear Battery Type 1 fields
      ['battery1_isnew', true],
      ['battery1_make', ''],
      ['battery1_model', ''],
      ['battery1_quantity', ''],
      ['battery1_configuration', ''],
      ['battery1_tie_in_location', ''],

      // Clear Battery Type 2 fields and hide section
      ['battery2_isnew', true],
      ['battery2_make', ''],
      ['battery2_model', ''],
      ['battery2_quantity', ''],
      ['battery2_tie_in_location', ''],
      ['show_battery_type_2', false],

      // Clear Backup Load Sub Panel fields
      ['backup_panel_isnew', true],
      ['backup_panel_make', ''],
      ['backup_panel_model', ''],
      ['backup_panel_bus_amps', ''],
      ['backup_panel_main_breaker', 'MLO'],
      ['backup_panel_tie_in_breaker', ''],
      ['backup_sp_tie_in_breaker_location', ''],

      // Clear Battery Combiner Panel fields
      ['battery_combiner_panel_isnew', true],
      ['battery_combiner_panel_make', ''],
      ['battery_combiner_panel_model', ''],
      ['battery_combiner_panel_bus_amps', ''],
      ['battery_combiner_panel_main_breaker', 'MLO'],
      ['battery_combiner_panel_tie_in_breaker', ''],

      // Clear Gateway Config fields (Tesla)
      ['gatewayConfigIsNew', true],
      ['gatewayConfigMainBreaker', ''],
      ['gatewayConfigBackupPanel', ''],
      ['gatewayConfigActivatePCS', false],
      ['gatewayConfigPVBreaker', ''],
      ['gatewayConfigESSBreaker', ''],
      ['gatewayConfigTieInBreaker', ''],
      ['pcs_settings', false],
  ];

  // Cascade section names (for display in modal)
  const cascadeSections = [
    'Storage Management System',
    'Battery (Type 1)',
    'Battery (Type 2)',
    'Backup Load Sub Panel',
    'Battery Combiner Panel',
    'Gateway Configuration',
  ];

  // Use the section delete hook with CLEAR_AND_REMOVE behavior
  const {
    showClearModal,
    showRemoveModal,
    handleTrashClick,
    handleClearConfirm,
    handleRemoveConfirm,
    closeClearModal,
    closeRemoveModal,
  } = useSectionDelete({
    sectionName: 'energyStorage',
    formData,
    onChange,
    onBatchChange,
    behavior: DELETE_BEHAVIOR.CLEAR_AND_REMOVE,
    visibilityFlag: null, // ESS doesn't use visibility flag - uses presence of backup_option
    additionalClearFields: essCascadeFields,
    cascadeSections,
  });

  const handleBackupOptionChange = (option) => {
    // Update backup option
    onChange('backup_option', option);

    // Clear backup system size when changing options
    // (No Backup doesn't use size, Whole/Partial have different options)
    onChange('backup_system_size', '');

    // Clear IQ Combiner 6C meter collar location when switching to No Backup
    if (option === 'No Backup') {
      onChange('meter_collar_location', '');
    }
  };

  /**
   * Handle backup system size change
   * Auto-populates Backup Load Sub Panel bus amps if not already set
   */
  const handleBackupSystemSizeChange = (value) => {
    onChange('backup_system_size', value);

    // Auto-populate backup panel bus amps if not already set by user
    if (value && !formData.backup_panel_bus_amps) {
      onChange('backup_panel_bus_amps', value);
    }
  };

  const showBackupSystemSize = backupOption === 'Whole Home' || backupOption === 'Partial Home';
  const sizeOptions = backupOption === 'Whole Home' ? wholeHomeOptions : partialHomeOptions;

  // Show AddSectionButton when no backup option is selected (empty state)
  if (!backupOption) {
    return (
      <AddSectionButton
        label="Energy Storage System"
        onClick={() => handleBackupOptionChange('Whole Home')}
      />
    );
  }

  return (
    <div style={{ marginBottom: 'var(--spacing)' }}>
      <EquipmentRow
        title="Energy Storage System"
        subtitle={backupOption ? `${backupOption}${backupSystemSize ? ` - ${backupSystemSize} Amps` : ''}` : ''}
        onDelete={handleTrashClick}
      >
        {/* Row 1: Grid Forming Options */}
        <FormFieldRow label="Grid Forming">
          <TableRowButton
            label="Whole Home"
            variant="secondary"
            active={backupOption === 'Whole Home'}
            onClick={() => handleBackupOptionChange('Whole Home')}
          />
          <TableRowButton
            label="Partial Home"
            variant="secondary"
            active={backupOption === 'Partial Home'}
            onClick={() => handleBackupOptionChange('Partial Home')}
          />
        </FormFieldRow>

        {/* Row 2: Grid Tied Options */}
        <FormFieldRow label="Grid Tied" style={{ marginTop: 'var(--spacing-tight)' }}>
          <TableRowButton
            label="No Backup"
            variant="secondary"
            active={backupOption === 'No Backup'}
            onClick={() => handleBackupOptionChange('No Backup')}
          />
        </FormFieldRow>

        {/* Backup System Size - Only show for Whole Home or Partial Home */}
        {showBackupSystemSize && (
          <TableDropdown
            label="Backup Size"
            value={backupSystemSize}
            onChange={handleBackupSystemSizeChange}
            options={sizeOptions}
            placeholder="Select size"
          />
        )}
      </EquipmentRow>

      {/* Partial Home Backup Warning - Only show for IQ Combiner 6C */}
      {backupOption === 'Partial Home' && (
        <Alert variant="warning" style={{ marginTop: 'var(--spacing)' }}>
          <strong>Planned Feature - Not Yet Supported:</strong> Partial Home Backup is a planned configuration that is currently not supported by Enphase. This configuration requires a Stand Alone Meter and will be enabled via a future Enphase software update during commissioning.
        </Alert>
      )}

      {/* Section Clear Modal with cascade info */}
      <SectionClearModal
        isOpen={showClearModal}
        onClose={closeClearModal}
        onConfirm={handleClearConfirm}
        sectionName="Energy Storage System"
      />

      {/* Section Remove Modal - Not typically used since ESS is added/removed via AddSectionButton */}
      <SectionRemoveModal
        isOpen={showRemoveModal}
        onClose={closeRemoveModal}
        onConfirm={handleRemoveConfirm}
        sectionName="Energy Storage System"
      />
    </div>
  );
};

export default memo(EnergyStorageSection);
