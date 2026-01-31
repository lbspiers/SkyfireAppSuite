import React, { useMemo } from 'react';
import { EquipmentRow, TableDropdown } from '../../ui';
import BackupLoadSubPanelSection from '../equipment/BackupLoadSubPanelSection';

/**
 * Backup Configuration Section
 * Allows user to choose where backup loads will be landed
 */
const BackupConfigurationSection = ({
  formData,
  onChange,
  onActivateSubPanelB,
  backupSystemSize,
  maxContinuousOutputAmps,
  loadingMaxOutput
}) => {
  // Backup Loads Landing options
  const BACKUP_LOADS_LANDING_OPTIONS = [
    { value: '', label: 'Select...' },
    { value: 'Main Panel (A)', label: 'In Main Panel (A)' },
    { value: 'Existing Sub Panel (B)', label: 'In Existing Sub Panel (B)' },
    { value: 'New Backup Load Sub Panel', label: 'New Backup Load Sub Panel' },
    { value: 'No Backup Panel', label: 'No Backup Panel' },
  ];

  // Get current selection
  const backupLoadsLanding = formData.backup_loads_landing || '';

  // Determine if we should show the backup load sub panel section
  const showBackupLoadSubPanel = backupLoadsLanding === 'New Backup Load Sub Panel';

  // Handle dropdown change
  const handleBackupLoadsLandingChange = (value) => {
    onChange('backup_loads_landing', value);

    // If they choose "Existing Sub Panel (B)", activate Sub Panel B and set it to Existing
    if (value === 'Existing Sub Panel (B)') {
      onChange('show_sub_panel_b', true);
      onChange('spb_activated', true);
      onChange('spb_subpanel_existing', true);
    }
  };

  // Generate title based on backup option
  const getTitle = () => {
    const backupOption = formData.backup_option || '';
    if (backupOption === 'Whole Home' || backupOption === 'Partial Home') {
      return `${backupOption} Backup Configuration`;
    }
    return 'Backup Configuration';
  };

  // Generate subtitle for the section header
  const getSubtitle = () => {
    if (!backupLoadsLanding) {
      return 'Not configured';
    }
    return backupLoadsLanding;
  };

  return (
    <>
      <div style={{ marginBottom: 'var(--spacing)' }}>
        <EquipmentRow
          title={getTitle()}
          subtitle={getSubtitle()}
        >
          {/* Backup Loads Landing Dropdown */}
          <TableDropdown
            label="Use"
            value={backupLoadsLanding}
            onChange={handleBackupLoadsLandingChange}
            options={BACKUP_LOADS_LANDING_OPTIONS}
            placeholder="Select backup loads landing location"
            showSearch={false}
          />
        </EquipmentRow>
      </div>

      {/* Conditionally render Backup Load Sub Panel Section - External to configuration */}
      {showBackupLoadSubPanel && (
        <BackupLoadSubPanelSection
          formData={formData}
          onChange={onChange}
          backupSystemSize={backupSystemSize}
          maxContinuousOutputAmps={maxContinuousOutputAmps}
          loadingMaxOutput={loadingMaxOutput}
        />
      )}
    </>
  );
};

export default BackupConfigurationSection;
