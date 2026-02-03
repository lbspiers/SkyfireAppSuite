import React, { useMemo } from 'react';
import { EquipmentRow, TableDropdown, FormFieldRow, TableRowButton } from '../../ui';
import BackupLoadSubPanelSection from '../equipment/BackupLoadSubPanelSection';

/**
 * Backup Configuration Section
 * Two-step process for configuring backup loads
 */
const BackupConfigurationSection = ({
  formData,
  onChange,
  onActivateSubPanelB,
  backupSystemSize,
  maxContinuousOutputAmps,
  loadingMaxOutput
}) => {
  // Step 1: Backup Option dropdown
  const BACKUP_OPTION_DROPDOWN = [
    { value: '', label: 'Select...' },
    { value: 'Backup Existing Panel', label: 'Backup Existing Panel' },
    { value: 'Relocate Loads to New Backup Sub Panel', label: 'Relocate Loads to New Backup Sub Panel' },
  ];

  // Get current selections
  const backupLoadsLanding = formData.backup_loads_landing || '';

  // Determine which step to show
  const showPanelButtons = backupLoadsLanding === 'Backup Existing Panel';
  const showBackupLoadSubPanel = backupLoadsLanding === 'Relocate Loads to New Backup Sub Panel';

  // Handle Step 1 dropdown change
  const handleBackupOptionChange = (value) => {
    onChange('backup_loads_landing', value);

    // Clear any previous panel selection when changing the main option
    if (value === 'Relocate Loads to New Backup Sub Panel') {
      // Clear panel selections
      onChange('backup_panel_selection', '');
      // Mark backup panel as new
      onChange('backup_panel_isnew', true);
    } else if (value === 'Backup Existing Panel') {
      // Clear panel selection, they'll choose in step 2
      onChange('backup_panel_selection', '');
    } else {
      // Clear everything if selecting empty option
      onChange('backup_panel_selection', '');
    }
  };

  // Handle Step 2 panel button selection
  const handlePanelSelection = (panel) => {
    onChange('backup_panel_selection', panel);

    // If they choose Sub Panel B, activate it and set to Existing
    if (panel === 'Sub Panel (B)') {
      onChange('show_sub_panel_b', true);
      onChange('spb_activated', true);
      onChange('spb_subpanel_existing', true);
    }

    // If they choose Sub Panel C, activate it and set to Existing
    if (panel === 'Sub Panel (C)') {
      onChange('show_sub_panel_c', true);
      onChange('spc_subpanel_existing', true);
    }
  };

  // Generate title based on backup option
  const getTitle = () => {
    const backupOption = formData.backup_option || '';
    if (backupOption === 'Whole Home' || backupOption === 'Partial Home') {
      return `Backup Loads - ${backupOption}`;
    }
    return 'Backup Loads';
  };

  // Generate subtitle for the section header
  const getSubtitle = () => {
    if (!backupLoadsLanding) {
      return 'Not configured';
    }

    // Show the panel selection if one has been made
    const panelSelection = formData.backup_panel_selection;
    if (backupLoadsLanding === 'Backup Existing Panel' && panelSelection) {
      return `${backupLoadsLanding} - ${panelSelection}`;
    }

    return backupLoadsLanding;
  };

  return (
    <>
      <div style={{ marginBottom: showBackupLoadSubPanel ? '0' : 'var(--spacing-xs)' }}>
        <EquipmentRow
          title={getTitle()}
          subtitle={getSubtitle()}
        >
          {/* Step 1: Backup Option Dropdown */}
          <TableDropdown
            label="Backup Option"
            value={backupLoadsLanding}
            onChange={handleBackupOptionChange}
            options={BACKUP_OPTION_DROPDOWN}
            placeholder="Select backup option..."
            showSearch={false}
          />

          {/* Step 2: Panel Selection Buttons (only show if "Backup Existing Panel" selected) */}
          {showPanelButtons && (
            <FormFieldRow label="Select Panel">
              <TableRowButton
                label="Main Panel (A)"
                variant="outline"
                active={formData.backup_panel_selection === 'Main Panel (A)'}
                onClick={() => handlePanelSelection('Main Panel (A)')}
              />
              <TableRowButton
                label="Sub Panel (B)"
                variant="outline"
                active={formData.backup_panel_selection === 'Sub Panel (B)'}
                onClick={() => handlePanelSelection('Sub Panel (B)')}
              />
              <TableRowButton
                label="Sub Panel (C)"
                variant="outline"
                active={formData.backup_panel_selection === 'Sub Panel (C)'}
                onClick={() => handlePanelSelection('Sub Panel (C)')}
              />
            </FormFieldRow>
          )}
        </EquipmentRow>
      </div>

      {/* Conditionally render Backup Load Sub Panel Section - External to configuration */}
      {showBackupLoadSubPanel && (
        <div style={{ marginTop: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
          <BackupLoadSubPanelSection
            formData={formData}
            onChange={onChange}
            backupSystemSize={backupSystemSize}
            maxContinuousOutputAmps={maxContinuousOutputAmps}
            loadingMaxOutput={loadingMaxOutput}
          />
        </div>
      )}
    </>
  );
};

export default BackupConfigurationSection;
