import React, { useMemo, useEffect, useRef, memo } from 'react';
import { Alert } from '../../ui';
import {
  IQ_COMBINER_6C_CONFIGURATIONS,
  IQ_6C_VALID_METER_COLLAR_BY_BACKUP,
  LEGACY_MICROINVERTER_PREFIXES,
  THIRD_PARTY_INVERTER_MAKES
} from '../../../utils/constants';
import styles from './PowerWallConfigurationSection.module.css';
import logger from '../../../services/devLogger';

/**
 * IQ Combiner 6C Configuration Section
 * Shows auto-detected configuration summary and validation messages
 * Works with existing EnergyStorageSection and IQMeterCollarSection
 */
const IQCombiner6CConfigSection = ({ formData, onChange }) => {
  // Ref to track if we've initialized to prevent infinite loops
  const hasInitializedConfigId = useRef(false);
  const lastSavedConfigId = useRef(null);

  // Extract current values
  const backupOption = formData.backup_option || '';
  const meterCollarLocation = formData.meter_collar_location || '';

  // Auto-detect: Is this legacy/third-party PV?
  const hasLegacyPV = useMemo(() => {
    const inverterMake = formData.inverter_make || '';
    const inverterModel = formData.inverter_model || '';

    // Check for third-party inverter makes
    if (THIRD_PARTY_INVERTER_MAKES.includes(inverterMake)) {
      logger.log('IQCombiner6C', 'Third-party inverter detected', { inverterMake });
      return true;
    }

    // Check for legacy Enphase (M-Series, S-Series)
    if (inverterMake === 'Enphase') {
      // IQ6, IQ7 are NOT legacy (they're older IQ series but still supported)
      // M-Series (M215, M250) and S-Series are legacy
      const modelUpper = inverterModel.toUpperCase();
      const isLegacy = LEGACY_MICROINVERTER_PREFIXES.some(prefix => modelUpper.startsWith(prefix));
      if (isLegacy) {
        logger.log('IQCombiner6C', 'Legacy Enphase inverter detected', { inverterModel });
      }
      return isLegacy;
    }

    return false;
  }, [formData.inverter_make, formData.inverter_model]);

  // Auto-detect: Are they mixing IQ8 with IQ6/IQ7? (for grid-forming validation)
  const hasMixedIQSeries = useMemo(() => {
    const model = formData.inverter_model || '';
    const modelUpper = model.toUpperCase();

    // Check if IQ8 series
    const hasIQ8 = modelUpper.includes('IQ8');

    // Check for IQ6 or IQ7 (could be in secondary panel or same system)
    // For now, we check the primary inverter - expand if needed
    const hasIQ6or7 = modelUpper.includes('IQ6') || modelUpper.includes('IQ7');

    // In a real implementation, check across all systems
    return hasIQ8 && hasIQ6or7;
  }, [formData.inverter_model]);

  // Auto-calculate Configuration ID
  const configurationId = useMemo(() => {
    // Auto-detect: Is this a Battery Only system?
    const isBatteryOnly = formData.solar_panel_make === 'Battery Only';

    // Auto-detect: Does this system have battery?
    const hasBattery = !!(formData.battery1_make || formData.backup_option);

    // Determine if user wants backup
    const wantsBackup = backupOption === 'Whole Home' || backupOption === 'Partial Home';

    logger.log('IQCombiner6C', 'Config calculation triggered', {
      isBatteryOnly,
      hasBattery,
      wantsBackup,
      hasLegacyPV,
      meterCollarLocation,
      backupOption,
      battery1_make: formData.battery1_make,
      solar_panel_make: formData.solar_panel_make
    });

    // Battery only without solar = Config 2 (no backup possible)
    if (isBatteryOnly && hasBattery) {
      logger.log('IQCombiner6C', 'Auto-selected Config 2 (Battery Only)');
      return 2;
    }

    // Solar only, no battery = Config 1
    if (!hasBattery) {
      logger.log('IQCombiner6C', 'Auto-selected Config 1 (Solar Only)');
      return 1;
    }

    // Has both solar and battery
    if (!wantsBackup) {
      // Grid-tied configurations
      if (hasLegacyPV) {
        logger.log('IQCombiner6C', 'Auto-selected Config 4 (Solar + Battery + Legacy PV)');
        return 4;
      }
      logger.log('IQCombiner6C', 'Auto-selected Config 3 (Solar + Battery)');
      return 3;
    }

    // Grid-forming (backup) configurations - requires meter collar location
    if (wantsBackup) {
      if (meterCollarLocation === 'behind_utility_meter') {
        // Behind utility meter = Config 5 or 6
        if (hasLegacyPV) {
          logger.log('IQCombiner6C', 'Auto-selected Config 6 (Whole Home + Legacy PV - Behind Meter)');
          return 6;
        }
        logger.log('IQCombiner6C', 'Auto-selected Config 5 (Whole Home - Behind Meter)');
        return 5;
      }

      if (meterCollarLocation === 'discrete_meter_pan') {
        // Discrete meter pan - depends on backup type
        if (backupOption === 'Whole Home') {
          logger.log('IQCombiner6C', 'Auto-selected Config 7 (Whole Home - Discrete Meter)');
          return 7;
        }
        if (backupOption === 'Partial Home') {
          if (hasLegacyPV) {
            logger.log('IQCombiner6C', 'Auto-selected Config 9 (Partial Home + Legacy PV)');
            return 9;
          }
          logger.log('IQCombiner6C', 'Auto-selected Config 8 (Partial Home)');
          return 8;
        }
      }

      // Backup selected but no meter collar location yet
      // Default to discrete meter pan assumption (most common)
      logger.log('IQCombiner6C', 'Backup selected, awaiting meter collar location - defaulting to Config 7/8');
      if (backupOption === 'Partial Home') {
        if (hasLegacyPV) return 9;
        return 8;
      }
      // Whole Home default
      return 7;
    }

    // Default to Config 3 if we can't determine
    logger.log('IQCombiner6C', 'Defaulting to Config 3 (fallback)');
    return 3;
  }, [
    formData.solar_panel_make,
    formData.battery1_make,
    formData.backup_option,
    backupOption,
    hasLegacyPV,
    meterCollarLocation
  ]);

  // Get configuration details
  const currentConfig = IQ_COMBINER_6C_CONFIGURATIONS.find(c => c.id === configurationId);

  // Determine if user wants backup (for validation)
  const wantsBackup = backupOption === 'Whole Home' || backupOption === 'Partial Home';
  const isPartialHome = backupOption === 'Partial Home';

  // Validation: Grid-forming cannot mix IQ8 with IQ6/IQ7
  const gridFormingMixingError = wantsBackup && hasMixedIQSeries;

  // Auto-correct meter collar location when Partial Home is selected
  // Partial Home ONLY supports Stand Alone Meter
  useEffect(() => {
    if (isPartialHome && meterCollarLocation !== 'discrete_meter_pan') {
      logger.log('IQCombiner6C', 'Auto-correcting meter collar to discrete_meter_pan for Partial Home');
      onChange('meter_collar_location', 'discrete_meter_pan');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPartialHome, meterCollarLocation]);

  // Save configuration ID when it changes (with guards to prevent infinite loops)
  useEffect(() => {
    // Only update if:
    // 1. Config ID actually changed
    // 2. It's different from what we last saved (prevent echo loops)
    // 3. We've passed the initial mount phase
    if (
      configurationId !== formData.iq_combiner_config_id &&
      configurationId !== lastSavedConfigId.current &&
      hasInitializedConfigId.current
    ) {
      lastSavedConfigId.current = configurationId;
      onChange('iq_combiner_config_id', configurationId);
      logger.log('IQCombiner6C', 'Configuration ID updated', { configurationId });
    }

    // Mark as initialized after first render
    if (!hasInitializedConfigId.current) {
      hasInitializedConfigId.current = true;
      lastSavedConfigId.current = formData.iq_combiner_config_id;
    }
  }, [configurationId, formData.iq_combiner_config_id]);

  return (
    <>
      {/* Grid-Forming Mixing Error */}
      {gridFormingMixingError && (
        <Alert variant="error" style={{ marginBottom: 'var(--spacing)' }}>
          <strong>Configuration Error:</strong> Grid-forming backup systems cannot mix IQ8
          microinverters with IQ6 or IQ7. All microinverters must be the same series for backup.
        </Alert>
      )}

      {/* Legacy PV Detection Notice */}
      {hasLegacyPV && (
        <Alert variant="info" style={{ marginBottom: 'var(--spacing)' }}>
          <strong>Legacy/Third-Party PV Detected:</strong> This system includes existing
          PV equipment. A software upgrade will be required during commissioning.
        </Alert>
      )}

      {/* Configuration Summary - Hidden for production */}
      {false && currentConfig && (
        <div className={styles.fieldGroup} style={{
          marginTop: 'var(--spacing)',
          padding: 'var(--spacing)',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)'
        }}>
          <div style={{ marginBottom: 'var(--spacing-tight)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              Auto-Detected Configuration
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-tight)'
          }}>
            <span style={{
              background: 'var(--color-primary)',
              color: 'white',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600
            }}>
              Config {currentConfig.id}
            </span>
            {currentConfig.isPlanned && (
              <span style={{
                background: 'var(--color-warning)',
                color: 'var(--text-on-warning)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>
                Planned
              </span>
            )}
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              {currentConfig.name}
            </span>
          </div>
          <div style={{
            marginTop: 'var(--spacing-tight)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)'
          }}>
            {currentConfig.systemType === 'grid-forming' ? '🔋 Grid-Forming (Backup)' : '⚡ Grid-Tied'}
            {currentConfig.requiresCTs && ' • Consumption CTs Required'}
            {currentConfig.meterCollarLocation && ' • IQ Meter Collar Required'}
          </div>
        </div>
      )}
    </>
  );
};

export default memo(IQCombiner6CConfigSection);
