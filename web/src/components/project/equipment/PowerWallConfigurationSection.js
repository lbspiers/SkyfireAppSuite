import React from 'react';
import {
  TESLA_POWERWALL_GATEWAYS,
  EXPANSION_PACK_OPTIONS,
  BACKUP_SWITCH_LOCATIONS
} from '../../../utils/constants';
import { FormFieldRow, TableRowButton, TableDropdown } from '../../ui';
import styles from './PowerWallConfigurationSection.module.css';
import formStyles from '../../../styles/FormSections.module.css';

/**
 * PowerWall Configuration Section
 * Handles Tesla PowerWall-specific configuration (expansion packs, gateway, backup options)
 */
const PowerWallConfigurationSection = ({ formData, onChange }) => {
  // Extract values with defaults
  const backupOption = formData.backup_option || '';
  const expansionPacks = formData.expansionPacks ?? 0;
  const gateway = formData.gateway || '';
  const backupSwitchLocation = formData.backupSwitchLocation || '';
  const batteryExisting = formData.batteryExisting || false;

  console.log('[PowerWallConfig] Render:', {
    gateway,
    backupOption,
    formData_gateway: formData.gateway,
    showGatewaySelection: backupOption === 'Whole Home' || backupOption === 'Partial Home'
  });

  // Conditional visibility
  const showGatewaySelection = backupOption === 'Whole Home' || backupOption === 'Partial Home';
  const showBackupSwitchLocation = gateway === 'Backup Switch';
  const showNoBackupNote = backupOption === 'No Backup';

  return (
    <div className={formStyles.sectionColumn}>
      {/* 1. Backup Option */}
      <FormFieldRow label="Backup Option">
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
          <TableRowButton
            label="Whole"
            variant="outline"
            active={backupOption === 'Whole Home'}
            onClick={() => onChange('backup_option', 'Whole Home')}
          />
          <TableRowButton
            label="Partial"
            variant="outline"
            active={backupOption === 'Partial Home'}
            onClick={() => onChange('backup_option', 'Partial Home')}
          />
          <TableRowButton
            label="None"
            variant="outline"
            active={backupOption === 'No Backup'}
            onClick={() => onChange('backup_option', 'No Backup')}
          />
        </div>
      </FormFieldRow>

      {/* 2. "No Backup" Info Note (conditional) */}
      {showNoBackupNote && (
        <div className={styles.infoNote}>
          <span className={styles.infoIcon}>ℹ️</span>
          <span className={styles.infoText}>
            Note: Adding Tesla Remote Energy Meter
          </span>
        </div>
      )}

      {/* 3. Battery Expansion Packs with New/Existing toggle */}
      <FormFieldRow
        label="Tesla Expansion Packs"
        showNewExistingToggle={true}
        isNew={!batteryExisting}
        onNewExistingChange={(isNew) => onChange('batteryExisting', !isNew)}
      >
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
          {EXPANSION_PACK_OPTIONS.map((option) => (
            <TableRowButton
              key={option.value}
              label={option.label}
              variant="outline"
              active={expansionPacks === option.value}
              onClick={() => onChange('expansionPacks', option.value)}
              style={{ minWidth: '48px' }}
            />
          ))}
        </div>
      </FormFieldRow>

      {/* 4. Gateway Selection (conditional) */}
      {showGatewaySelection && (
        <>
          <TableDropdown
            label="Management"
            value={gateway}
            onChange={(value) => {
              console.log('[PowerWallConfig] Gateway onChange:', { value, currentGateway: gateway });
              onChange('gateway', value);
            }}
            options={TESLA_POWERWALL_GATEWAYS}
            placeholder="Select gateway..."
          />
          <div style={{
            borderBottom: '1px solid var(--border-color)',
            margin: 'var(--spacing-base) 0'
          }} />
        </>
      )}

      {/* 5. Backup Switch Location (conditional) */}
      {showBackupSwitchLocation && (
        <FormFieldRow label="Backup Switch Location*">
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
            {BACKUP_SWITCH_LOCATIONS.map((option) => (
              <TableRowButton
                key={option.value}
                label={option.label}
                variant="outline"
                active={backupSwitchLocation === option.value}
                onClick={() => onChange('backupSwitchLocation', option.value)}
              />
            ))}
          </div>
        </FormFieldRow>
      )}
    </div>
  );
};

export default React.memo(PowerWallConfigurationSection);
