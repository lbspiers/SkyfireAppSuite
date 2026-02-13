import React, { memo, useEffect, useRef } from 'react';
import { EquipmentRow, FormFieldRow, TableRowButton, TableDropdown, AddSectionButton, SectionClearModal, SectionRemoveModal, Alert } from '../../ui';
import { useSectionDelete, DELETE_BEHAVIOR } from '../../../hooks/useSectionDelete';

/**
 * Energy Storage System Section
 * Allows user to select backup option: Whole Home, Partial Home, or No Backup
 * Shows backup system size dropdown for Whole Home and Partial Home
 * Shows AddSectionButton when no backup option is selected
 */
const EnergyStorageSection = ({ formData, onChange, onBatchChange }) => {
  const hasInitialized = useRef(false);

  // Initialize visibility flags based on existing data on mount
  useEffect(() => {
    if (hasInitialized.current) return;

    const backupOption = formData.backup_option;
    const hasSMSData = formData.sms_make && formData.sms_make !== 'No SMS';
    const hasBattery1Data = formData.battery1_make;

    console.log('[ESS Init] Initializing visibility flags:', {
      backupOption,
      sms_make: formData.sms_make,
      hasSMSData,
      show_sms_before: formData.show_sms,
      battery1_make: formData.battery1_make,
      hasBattery1Data,
      show_battery1_before: formData.show_battery1,
    });

    // If there's ANY backup option selected (including No Backup), ensure SMS and Battery sections are visible
    if (backupOption === 'Whole Home' || backupOption === 'Partial Home' || backupOption === 'No Backup') {
      // SMS Section - always show for any backup option
      if (formData.show_sms !== true) {
        console.log('[ESS Init] Setting show_sms to true');
        onChange('show_sms', true);
      } else {
        console.log('[ESS Init] NOT changing show_sms:', { hasSMSData, currentShowSMS: formData.show_sms, sms_make: formData.sms_make });
      }

      // Battery Type 1 Section - always show for any backup option
      if (formData.show_battery1 !== true) {
        console.log('[ESS Init] Setting show_battery1 to true');
        onChange('show_battery1', true);
      } else {
        console.log('[ESS Init] NOT setting show_battery1:', { hasBattery1Data, currentShowBattery1: formData.show_battery1 });
      }

      // Backup Panel - only show for Whole/Partial Home (not for No Backup)
      if ((backupOption === 'Whole Home' || backupOption === 'Partial Home') && formData.show_backup_panel !== true) {
        console.log('[ESS Init] Setting show_backup_panel to true');
        onChange('show_backup_panel', true);
      }
    }

    hasInitialized.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

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
    // Clear main ESS fields first (this controls section visibility)
      ['backup_option', ''],
      ['backup_system_size', ''],
      ['meter_collar_location', ''],

    // Hide all ESS-related sections
      ['show_sms', false],
      ['show_battery1', false],
      ['show_battery2', false],
      ['show_battery_type_2', false],
      ['show_battery1_bos', false],
      ['show_battery2_bos', false],
      ['show_backup_panel', false],

    // SMS fields
      ['sms_existing', false],
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
      ['battery1_existing', false],
      ['battery1_make', ''],
      ['battery1_model', ''],
      ['battery1_quantity', ''],
      ['battery1_configuration', ''],
      ['battery1_tie_in_location', ''],
      ['battery1_mount_type', ''],

      // Clear Battery Type 2 fields
      ['battery2_existing', false],
      ['battery2_make', ''],
      ['battery2_model', ''],
      ['battery2_quantity', ''],
      ['battery2_tie_in_location', ''],
      ['battery2_mount_type', ''],
      ['battery2_configuration', ''],

      // Clear Battery 1 BOS equipment slots (3 slots)
      ['battery1_bos_type1_equipment_type', ''],
      ['battery1_bos_type1_make', ''],
      ['battery1_bos_type1_model', ''],
      ['battery1_bos_type1_amp_rating', ''],
      ['battery1_bos_type1_is_new', true],
      ['battery1_bos_type2_equipment_type', ''],
      ['battery1_bos_type2_make', ''],
      ['battery1_bos_type2_model', ''],
      ['battery1_bos_type2_amp_rating', ''],
      ['battery1_bos_type2_is_new', true],
      ['battery1_bos_type3_equipment_type', ''],
      ['battery1_bos_type3_make', ''],
      ['battery1_bos_type3_model', ''],
      ['battery1_bos_type3_amp_rating', ''],
      ['battery1_bos_type3_is_new', true],

      // Clear Battery 2 BOS equipment slots (3 slots)
      ['battery2_bos_type1_equipment_type', ''],
      ['battery2_bos_type1_make', ''],
      ['battery2_bos_type1_model', ''],
      ['battery2_bos_type1_amp_rating', ''],
      ['battery2_bos_type1_is_new', true],
      ['battery2_bos_type2_equipment_type', ''],
      ['battery2_bos_type2_make', ''],
      ['battery2_bos_type2_model', ''],
      ['battery2_bos_type2_amp_rating', ''],
      ['battery2_bos_type2_is_new', true],
      ['battery2_bos_type3_equipment_type', ''],
      ['battery2_bos_type3_make', ''],
      ['battery2_bos_type3_model', ''],
      ['battery2_bos_type3_amp_rating', ''],
      ['battery2_bos_type3_is_new', true],

      // Clear Backup Load Sub Panel fields
      ['backup_panel_existing', false],
      ['backup_panel_make', ''],
      ['backup_panel_model', ''],
      ['backup_panel_bus_amps', ''],
      ['backup_panel_main_breaker', 'MLO'],
      ['backup_panel_tie_in_breaker', ''],
      ['backup_sp_tie_in_breaker_location', ''],

      // Clear Battery Combiner Panel fields
      ['battery_combiner_panel_existing', false],
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
    'Battery Type 1 BOS',
    'Battery (Type 2)',
    'Battery Type 2 BOS',
    'Backup Load Sub Panel',
    'Battery Combiner Panel',
    'Gateway Configuration',
  ];

  // Use the section delete hook with CLEAR_ONLY behavior
  // For ESS, clearing backup_option effectively removes the section (collapses to AddSectionButton)
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
    behavior: DELETE_BEHAVIOR.CLEAR_ONLY,
    visibilityFlag: null, // ESS doesn't use visibility flag - clearing backup_option collapses section
    additionalClearFields: essCascadeFields,
    cascadeSections,
  });

  const handleBackupOptionChange = (option) => {
    console.log('[ESS] Backup option changed to:', option);

    // Skip all other logic if just expanding the section
    if (option === 'expand') {
      onChange('backup_option', option);
      return;
    }

    // Prepare batch updates
    const updates = [
      ['backup_option', option],
      ['backup_system_size', ''], // Clear size when changing options
    ];

    // Toggle visibility flags based on backup option
    if (option === 'Whole Home' || option === 'Partial Home' || option === 'No Backup') {
      console.log('[ESS] Setting visibility flags for any backup option:', option);
      // Show SMS and Battery Type 1 for ALL backup options (including No Backup)
      updates.push(
        ['show_sms', true],
        ['show_battery1', true]
      );

      // Only show backup panel for Whole Home and Partial Home
      if (option === 'Whole Home' || option === 'Partial Home') {
        updates.push(['show_backup_panel', true]);
      } else if (option === 'No Backup') {
        // Hide backup panel for No Backup (grid-tied only)
        updates.push(
          ['show_backup_panel', false],
          ['meter_collar_location', '']
        );
      }
      // Note: Battery Type 2 and BOS sections remain manually controlled
    } else {
      console.log('[ESS] Hiding all sections (no option selected)');
      // No option selected or empty - hide all
      updates.push(
        ['show_sms', false],
        ['show_battery1', false],
        ['show_battery2', false],
        ['show_battery1_bos', false],
        ['show_battery2_bos', false],
        ['show_backup_panel', false]
      );
    }

    console.log('[ESS] Applying batch updates:', updates);

    // Use batch update if available, fallback to sequential onChange
    if (onBatchChange) {
      onBatchChange(updates);
    } else {
      updates.forEach(([field, value]) => onChange(field, value));
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
  // Allow 'expand' as a temporary state to show options without defaulting
  const isExpanded = backupOption && backupOption !== '';

  if (!isExpanded) {
    return (
      <AddSectionButton
        label="Energy Storage System"
        onClick={() => onChange('backup_option', 'expand')}
      />
    );
  }

  // Build subtitle - show nothing if 'expand' state, otherwise show the selected option
  const hasValidSelection = backupOption && backupOption !== 'expand';
  const subtitle = hasValidSelection
    ? `${backupOption}${backupSystemSize ? ` - ${backupSystemSize} Amps` : ''}`
    : '';

  return (
    <div style={{ marginBottom: 'var(--spacing-xs)' }}>
      <EquipmentRow
        title="Energy Storage System"
        subtitle={subtitle}
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

      {/* Section Clear Modal */}
      <SectionClearModal
        isOpen={showClearModal}
        onClose={closeClearModal}
        onConfirm={handleClearConfirm}
        sectionName="Energy Storage System"
        willRemove={true}
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
