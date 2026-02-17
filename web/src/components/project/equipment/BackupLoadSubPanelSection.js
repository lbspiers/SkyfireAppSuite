import React, { useState, useEffect, memo } from 'react';
import { Alert, EquipmentRow, FormFieldRow, TableDropdown, TableRowButton, AddSectionButton, Tooltip } from '../../ui';
import BOSEquipmentSection from './BOSEquipmentSection';
import {
  getCombinerPanelManufacturers,
  getCombinerPanelModels,
} from '../../../services/equipmentService';
import logger from '../../../services/devLogger';
import styles from './BackupLoadSubPanelSection.module.css';
import flameIcon from '../../../assets/images/Skyfire Flame Icon.png';

/**
 * Backup Load Sub Panel Section
 * Shown when backup option is "Whole Home" or "Partial Home"
 */
const BackupLoadSubPanelSection = ({
  formData,
  onChange,
  backupSystemSize,
  systemNumber = 1,
  maxContinuousOutputAmps = null,
  loadingMaxOutput = false,
}) => {
  const [manufacturers, setManufacturers] = useState([]);
  const [models, setModels] = useState([]);
  const [loadingManufacturers, setLoadingManufacturers] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [editTieInBreaker, setEditTieInBreaker] = useState(false);

  const tieInLocationField = 'backup_sp_tie_in_breaker_location';

  // Detect Enphase IQ Combiner 6C
  const isEnphaseCombiner6C = React.useMemo(() => {
    const make = formData.combiner_panel_make?.toLowerCase();
    const model = formData.combiner_panel_model;
    return make === 'enphase' && model?.includes('6C');
  }, [formData.combiner_panel_make, formData.combiner_panel_model]);

  // Load manufacturers on mount
  // Load manufacturers on mount (once only)
  // CRITICAL: Guard prevents multiple API calls during re-renders
  useEffect(() => {
    if (manufacturers.length === 0 && !loadingManufacturers) {
      loadManufacturers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = run once on mount only

  // Load models when manufacturer changes
  useEffect(() => {
    if (formData.backup_panel_make) {
      loadModels(formData.backup_panel_make);
    } else {
      setModels([]);
    }
  }, [formData.backup_panel_make]);

  // Sync Backup Load Sub Panel data to SMS fields when Combiner 6C is selected
  useEffect(() => {
    if (!isEnphaseCombiner6C) {
      return; // Only sync for Combiner 6C
    }

    // Sync the backup panel data to SMS fields
    // This makes the backup panel appear in the BOS chain at the correct position
    const updates = [];

    // Equipment type is always "Backup Load Sub Panel"
    if (formData.backup_panel_make && formData.backup_panel_model) {
      if (formData.sms_equipment_type !== 'Backup Load Sub Panel') {
        updates.push(['sms_equipment_type', 'Backup Load Sub Panel']);
      }
    }

    // Sync make
    if (formData.backup_panel_make !== formData.sms_make) {
      updates.push(['sms_make', formData.backup_panel_make || '']);
    }

    // Sync model
    if (formData.backup_panel_model !== formData.sms_model) {
      updates.push(['sms_model', formData.backup_panel_model || '']);
    }

    // Sync new/existing status
    const backupPanelIsNew = formData.backup_panel_existing !== true;
    const smsIsNew = formData.sms_existing !== true;
    if (backupPanelIsNew !== smsIsNew) {
      updates.push(['sms_existing', !backupPanelIsNew]);
    }

    // Apply updates if needed
    if (updates.length > 0) {
      updates.forEach(([field, value]) => {
        onChange(field, value, systemNumber);
      });
      logger.log('BackupLoadSubPanel', `Synced ${updates.length} fields to SMS for Combiner 6C`);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isEnphaseCombiner6C,
    formData.backup_panel_make,
    formData.backup_panel_model,
    formData.backup_panel_existing,
  ]);

  const loadManufacturers = async () => {
    setLoadingManufacturers(true);
    try {
      const response = await getCombinerPanelManufacturers();
      const manufacturerList = response?.data || [];
      // Normalize data to { label, value } format
      const normalized = manufacturerList.map(item => {
        if (typeof item === 'string') {
          return { label: item, value: item };
        }
        const name = item.manufacturer || item.name || item.label || String(item);
        return { label: name, value: name };
      });
      // Filter out Enphase from backup panel manufacturers
      const filtered = normalized.filter(m =>
        m.label !== 'Enphase' && m.value !== 'Enphase'
      );
      setManufacturers(filtered);
    } catch (error) {
      logger.error('Equipment', 'Error loading backup panel manufacturers:', error);
    } finally {
      setLoadingManufacturers(false);
    }
  };

  const loadModels = async (manufacturer) => {
    setLoadingModels(true);
    try {
      const response = await getCombinerPanelModels(manufacturer);
      const modelList = response?.data || [];
      // Normalize data to { label, value } format
      const normalized = modelList.map(item => {
        if (typeof item === 'string') {
          return { label: item, value: item };
        }
        const modelName = item.model || item.model_number || item.name || item.label || String(item);
        return { label: modelName, value: modelName };
      });
      setModels(normalized);
    } catch (error) {
      logger.error('Equipment', 'Error loading backup panel models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleMakeChange = (value) => {
    // Always save isnew state when make is selected (defaults to true if not set)
    const isNewValue = formData.backup_panel_existing !== true; // true unless explicitly set to false
    onChange('backup_panel_existing', !isNewValue, systemNumber);
    console.log('[BackupLoadSubPanel] Setting backup_panel_existing:', isNewValue);

    onChange('backup_panel_make', value, systemNumber);
    onChange('backup_panel_model', '', systemNumber);

    // Ensure main breaker default is saved to bls1_backuploader_main_breaker_rating
    if (formData.backup_panel_main_breaker === undefined || formData.backup_panel_main_breaker === null) {
      onChange('backup_panel_main_breaker', 'MLO', systemNumber);
      onChange('bls1_backuploader_main_breaker_rating', 'MLO', systemNumber);
      console.log('[BackupLoadSubPanel] Setting default backup_panel_main_breaker: MLO');
      console.log('[BackupLoadSubPanel] Setting bls1_backuploader_main_breaker_rating: MLO');
    } else {
      // Sync current value to bls1 field
      onChange('bls1_backuploader_main_breaker_rating', formData.backup_panel_main_breaker, systemNumber);
      console.log('[BackupLoadSubPanel] Syncing bls1_backuploader_main_breaker_rating:', formData.backup_panel_main_breaker);
    }
  };

  const handleModelChange = (value) => {
    // Always save isnew state when model is selected (defaults to true if not set)
    const isNewValue = formData.backup_panel_existing !== true; // true unless explicitly set to false
    onChange('backup_panel_existing', !isNewValue, systemNumber);

    onChange('backup_panel_model', value, systemNumber);
  };

  const handleClearTieInBreaker = () => {
    onChange('backup_panel_tie_in_breaker', '', systemNumber);
    setEditTieInBreaker(false);
  };

  // Breaker rating options (15-600)
  const breakerOptions = [
    '15', '20', '25', '30', '35', '40', '45', '50', '60', '70', '80', '90', '100',
    '110', '125', '150', '175', '200', '225', '250', '300', '350', '400', '450', '500', '600'
  ];

  // Bus amp options (40 to 250 in increments of 10)
  const busAmpOptions = Array.from({ length: 22 }, (_, i) => {
    const value = 40 + i * 10;
    return { label: value.toString(), value: value.toString() };
  });

  // Main breaker options
  const mainBreakerOptions = [
    { label: 'MLO', value: 'MLO' },
    { label: '100', value: '100' },
    { label: '110', value: '110' },
    { label: '125', value: '125' },
    { label: '150', value: '150' },
    { label: '175', value: '175' },
    { label: '200', value: '200' },
    { label: '225', value: '225' },
    { label: '250', value: '250' },
    { label: '300', value: '300' },
    { label: '350', value: '350' },
    { label: '400', value: '400' },
    { label: '450', value: '450' },
    { label: '500', value: '500' },
    { label: '600', value: '600' },
  ];

  const isComplete = formData.backup_panel_make && formData.backup_panel_model;

  const getSubtitle = () => {
    if (formData.backup_panel_make && formData.backup_panel_model) {
      const statusLetter = formData.backup_panel_existing !== true ? 'N' : 'E';
      return `(${statusLetter}) ${formData.backup_panel_make} ${formData.backup_panel_model}`;
    }
    return '';
  };

  const handleDelete = () => {
    // Clear all backup panel fields
    onChange('backup_panel_make', '', systemNumber);
    onChange('backup_panel_model', '', systemNumber);
    onChange('backup_panel_bus_amps', '', systemNumber);
    onChange('backup_panel_main_breaker', 'MLO', systemNumber);
    onChange('backup_panel_tie_in_breaker', '', systemNumber);
    onChange('backup_panel_existing', false, systemNumber);
    onChange(tieInLocationField, '', systemNumber);
    setEditTieInBreaker(false);

    // If IQ Combiner 6C is active, also clear the SMS fields that were synced
    // This ensures the equipment_type and other SMS data doesn't get left behind
    if (isEnphaseCombiner6C) {
      onChange('sms_equipment_type', '', systemNumber);
      onChange('sms_make', '', systemNumber);
      onChange('sms_model', '', systemNumber);
      onChange('sms_existing', false, systemNumber);
      logger.log('BackupLoadSubPanel', 'Cleared SMS fields for Combiner 6C on delete');
    }
  };

  // Build Tie-In Location options based on available equipment
  const tieInLocationOptions = React.useMemo(() => {
    const options = [];

    // Always include Main Panel A
    options.push({
      value: 'Main Panel A',
      label: 'Main Panel A',
    });

    // Check for Inverter (System 1)
    const inverterMake = formData.inverter_make || '';
    const inverterModel = formData.inverter_model || '';
    if (inverterMake && inverterModel) {
      options.push({
        value: `${inverterMake} ${inverterModel}`,
        label: `Inverter: ${inverterMake} ${inverterModel}`,
      });
    }

    // Check for String Combiner Panel
    if (formData.combiner_panel_make && formData.combiner_panel_model) {
      options.push({
        value: `${formData.combiner_panel_make} ${formData.combiner_panel_model}`,
        label: `String Combiner: ${formData.combiner_panel_make} ${formData.combiner_panel_model}`,
      });
    }

    // Check for SMS
    if (formData.sms_make && formData.sms_model && formData.sms_make !== 'No SMS') {
      options.push({
        value: `${formData.sms_make} ${formData.sms_model}`,
        label: `SMS: ${formData.sms_make} ${formData.sms_model}`,
      });
    }

    return options;
  }, [
    formData.inverter_make,
    formData.inverter_model,
    formData.combiner_panel_make,
    formData.combiner_panel_model,
    formData.sms_make,
    formData.sms_model,
  ]);

  // Auto-select if only one option
  useEffect(() => {
    if (tieInLocationOptions.length === 1 && !formData[tieInLocationField]) {
      onChange(tieInLocationField, tieInLocationOptions[0].value, systemNumber);
    }
  }, [tieInLocationOptions, formData[tieInLocationField]]);

  return (
    <div className={styles.sectionWrapper}>
      <EquipmentRow
        title="Backup Load Sub Panel"
        subtitle={getSubtitle()}
        showNewExistingToggle={true}
        isExisting={formData.backup_panel_existing}
        onExistingChange={(val) => onChange('backup_panel_existing', val, systemNumber)}
        onDelete={handleDelete}
      >
        <TableDropdown
          label="Make"
          value={formData.backup_panel_make || ''}
          onChange={handleMakeChange}
          options={manufacturers}
          placeholder={loadingManufacturers ? 'Loading...' : 'Select make...'}
          disabled={loadingManufacturers}
        />

        <TableDropdown
          label="Model"
          value={formData.backup_panel_model || ''}
          onChange={handleModelChange}
          options={models}
          placeholder={!formData.backup_panel_make ? 'Select make' : loadingModels ? 'Loading...' : 'Select model'}
          disabled={!formData.backup_panel_make || loadingModels}
        />

        <TableDropdown
          label="Bus (Amps)"
          value={formData.backup_panel_bus_amps || ''}
          onChange={(value) => onChange('backup_panel_bus_amps', value, systemNumber)}
          options={busAmpOptions}
          placeholder="Select amps..."
        />

        <TableDropdown
          label="Main Circuit Breaker"
          value={formData.backup_panel_main_breaker || 'MLO'}
          onChange={(value) => {
            onChange('backup_panel_main_breaker', value, systemNumber);
            onChange('bls1_backuploader_main_breaker_rating', value, systemNumber);
            console.log('[BackupLoadSubPanel] Main breaker changed to:', value);
            console.log('[BackupLoadSubPanel] Setting bls1_backuploader_main_breaker_rating:', value);
          }}
          options={mainBreakerOptions}
          placeholder="Select breaker..."
        />

        {/* Tie-In Location - Hidden for Combiner 6C */}
        {!isEnphaseCombiner6C && tieInLocationOptions.length > 0 && (
          <TableDropdown
            label="Tie-In Location"
            value={formData[tieInLocationField] || ''}
            onChange={(value) => onChange(tieInLocationField, value, systemNumber)}
            options={tieInLocationOptions}
            placeholder="Select tie-in location..."
            disabled={tieInLocationOptions.length === 1}
          />
        )}

        {/* Tie-in Breaker */}
        <FormFieldRow label="Tie-in Breaker">
          <TableRowButton
            label="Auto"
            variant="outline"
            active={!editTieInBreaker}
            onClick={() => {
              handleClearTieInBreaker();
            }}
          />
          <TableRowButton
            label="Custom"
            variant="outline"
            active={editTieInBreaker}
            onClick={() => setEditTieInBreaker(true)}
          />
          {!editTieInBreaker && (
            <div style={{ display: 'inline-flex', marginLeft: 'var(--spacing-tight)' }}>
              <Tooltip
                content={
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
                    A minimum SMS Tie-in Breaker will be added in Main Panel (A). If you are landing in another location and/or using alternate Tie-in method you can edit it in the Electrical Section.
                  </div>
                }
                position="bottom"
                className="alertTooltip"
              >
                <img src={flameIcon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', cursor: 'help' }} />
              </Tooltip>
            </div>
          )}
        </FormFieldRow>
        {editTieInBreaker && (
          <TableDropdown
            label="Breaker Rating"
            value={formData.backup_panel_tie_in_breaker || ''}
            onChange={(value) => onChange('backup_panel_tie_in_breaker', value, systemNumber)}
            options={breakerOptions.map(rating => ({ label: rating, value: rating }))}
            placeholder="Select rating..."
          />
        )}
      </EquipmentRow>

      {/* BOS Equipment */}
      {isComplete && (
        <BOSEquipmentSection
          formData={formData}
          onChange={onChange}
          section="backup"
          systemNumber={systemNumber}
          maxContinuousOutputAmps={maxContinuousOutputAmps}
          loadingMaxOutput={loadingMaxOutput}
        />
      )}
    </div>
  );
};

const areBackupPanelPropsEqual = (prevProps, nextProps) => {
  if (prevProps.systemNumber !== nextProps.systemNumber) return false;

  const relevantFields = [
    'backup_panel_make', 'backup_panel_model', 'backup_panel_existing',
    'backup_panel_bus_bar_rating', 'backup_panel_main_breaker',
    'backup_panel_upstream_breaker',
    'combiner_panel_make', 'combiner_panel_model',
    'sms_make', 'sms_model', 'sms_existing', 'sms_equipment_type',
    'show_backup_panel',
    // Backup load types (1-20)
    ...Array.from({ length: 20 }, (_, i) => `backup_load_type_${i + 1}`),
    ...Array.from({ length: 20 }, (_, i) => `backup_load_rating_${i + 1}`),
  ];

  for (const field of relevantFields) {
    if (prevProps.formData?.[field] !== nextProps.formData?.[field]) {
      return false;
    }
  }

  return true;
};

export default memo(BackupLoadSubPanelSection, areBackupPanelPropsEqual);
