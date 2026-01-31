import React from 'react';
import styles from '../../../../styles/ProjectAdd.module.css';
import equipStyles from '../../EquipmentForm.module.css';

/**
 * Energy Storage Section
 * Handles backup option selection (Whole Home, Partial Home, No Backup)
 * and backup system size dropdown
 */
const EnergyStorageSection = ({ formData, onChange }) => {
  // Get backup option and utility service amps
  const backupOption = formData.backup_option || '';
  const utilityServiceAmps = formData.utility_service_amps || '';

  // Backup system size options
  const WHOLE_HOME_OPTIONS = ['100', '125', '150', '175', '200', '225', '250', '300', '350', '400'];
  const PARTIAL_HOME_OPTIONS = ['30', '40', '50', '60', '70', '80', '90', '100'];

  const handleBackupOptionChange = (option) => {
    onChange('backup_option', option);
    // Clear utility service amps when changing backup option
    if (option === 'No Backup') {
      onChange('utility_service_amps', '');
    }
  };

  const handleClear = () => {
    onChange('backup_option', '');
    onChange('utility_service_amps', '');
  };

  return (
    <>
      {/* Backup Option Selection */}
      <div className={styles.formGroup}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <label className={styles.label}>Select Backup Option</label>
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0 0.5rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-primary-dark)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-primary)';
            }}
          >
            Clear
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className={`${equipStyles.stringingButton} ${backupOption === 'Whole Home' ? equipStyles.stringingButtonSelected : ''}`}
            onClick={() => handleBackupOptionChange('Whole Home')}
          >
            Whole Home
          </button>
          <button
            type="button"
            className={`${equipStyles.stringingButton} ${backupOption === 'Partial Home' ? equipStyles.stringingButtonSelected : ''}`}
            onClick={() => handleBackupOptionChange('Partial Home')}
          >
            Partial Home
          </button>
          <button
            type="button"
            className={`${equipStyles.stringingButton} ${backupOption === 'No Backup' ? equipStyles.stringingButtonSelected : ''}`}
            onClick={() => handleBackupOptionChange('No Backup')}
          >
            No Backup
          </button>
        </div>
      </div>

      {/* Backup System Size - Show for Whole Home or Partial Home */}
      {(backupOption === 'Whole Home' || backupOption === 'Partial Home') && (
        <>
          <div style={{
            color: 'var(--gray-50)',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            marginTop: '1rem',
            marginBottom: '0.75rem',
          }}>
            {backupOption === 'Whole Home'
              ? 'Choose the size of the backup load system'
              : 'Choose the size you are backing up'}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Backup System Size (Amps)</label>
            <select
              value={utilityServiceAmps}
              onChange={(e) => onChange('utility_service_amps', e.target.value)}
              className={`${styles.select} ${utilityServiceAmps ? styles.selectFilled : ''}`}
              style={{ color: utilityServiceAmps ? 'var(--gray-50)' : 'var(--gray-500)' }}
            >
              <option value="">Select size...</option>
              {(backupOption === 'Whole Home' ? WHOLE_HOME_OPTIONS : PARTIAL_HOME_OPTIONS).map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </>
  );
};

export default EnergyStorageSection;
