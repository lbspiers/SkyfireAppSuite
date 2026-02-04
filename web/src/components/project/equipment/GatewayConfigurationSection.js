import React from 'react';
import { MAIN_CIRCUIT_BREAKER_RATINGS, PCS_AMPS_OPTIONS } from '../../../utils/constants';
import { TableDropdown, TableRowButton, Alert } from '../../ui';
import formStyles from '../../../styles/FormSections.module.css';
import componentStyles from './GatewayConfigurationSection.module.css';

/**
 * Gateway Configuration Section
 * Tesla Gateway (Backup Gateway 2 or Gateway 3) specific configuration
 *
 * Each breaker field supports Auto/Custom mode:
 * - Auto: System calculates optimal breaker rating (shows tooltip)
 * - Custom: User manually selects breaker rating from dropdown
 */
const GatewayConfigurationSection = ({ formData, onChange }) => {
  // Main Breaker
  const mainBreakerMode = formData.gatewayConfigMainBreakerMode || 'auto';
  const mainBreaker = formData.gatewayConfigMainBreaker || '';

  // Backup Sub Panel
  const backupSubPanelMode = formData.gatewayConfigBackupSubPanelMode || 'auto';
  const backupSubPanel = formData.gatewayConfigBackupSubPanel || '';

  // PV Breaker Rating
  const pvBreakerMode = formData.gatewayConfigPVBreakerMode || 'auto';
  const pvBreaker = formData.gatewayConfigPVBreaker || '';

  // ESS Breaker Rating
  const essBreakerMode = formData.gatewayConfigESSBreakerMode || 'auto';
  const essBreaker = formData.gatewayConfigESSBreaker || '';

  // Tie-in Breaker
  const tieInBreakerMode = formData.gatewayConfigTieInBreakerMode || 'auto';
  const tieInBreaker = formData.gatewayConfigTieInBreaker || '';

  // Activate PCS
  const activatePCS = formData.gatewayConfigActivatePCS || false;
  const pcsAmps = formData.gatewayConfigPCSAmps || '';

  // Tie-in breaker options (15-250 amps in increments of 5)
  const tieInBreakerOptions = Array.from({ length: 48 }, (_, i) => {
    const value = 15 + i * 5;
    return { label: `${value} Amps`, value: value.toString() };
  });

  /**
   * Renders a breaker field with Auto/Custom toggle and tooltip
   */
  const renderBreakerField = (config) => {
    const {
      label,
      modeField,
      valueField,
      mode,
      value,
      options,
      placeholder,
      tooltipText
    } = config;

    const handleModeChange = (newMode) => {
      onChange(modeField, newMode);
      // Clear value when switching to auto
      if (newMode === 'auto') {
        onChange(valueField, '');
      }
    };

    return (
      <div className={componentStyles.breakerFieldContainer}>
        {/* Label with Auto/Custom Toggle and Tooltip */}
        <div className={componentStyles.breakerHeader}>
          <span className={formStyles.label}>{label}</span>
          <div className={componentStyles.toggleWrapper}>
            <div className={formStyles.toggleGroup}>
              <TableRowButton
                label="Auto"
                variant="secondary"
                active={mode === 'auto'}
                onClick={() => handleModeChange('auto')}
              />
              <TableRowButton
                label="Custom"
                variant="secondary"
                active={mode === 'custom'}
                onClick={() => handleModeChange('custom')}
              />
            </div>
            {/* Tooltip icon */}
            <div className={componentStyles.tooltipIconWrapper}>
              <img
                src={require('../../../assets/images/Skyfire Flame Icon.png')}
                alt=""
                className={componentStyles.tooltipIcon}
                title={tooltipText}
              />
            </div>
          </div>
        </div>

        {/* Dropdown (only shown in Custom mode) */}
        {mode === 'custom' && (
          <div className={componentStyles.breakerContent}>
            <TableDropdown
              label=""
              value={value}
              onChange={(val) => onChange(valueField, val)}
              options={options}
              placeholder={placeholder}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={formStyles.sectionColumn}>
      {/* Main Breaker */}
      {renderBreakerField({
        label: 'Main Breaker*',
        modeField: 'gatewayConfigMainBreakerMode',
        valueField: 'gatewayConfigMainBreaker',
        mode: mainBreakerMode,
        value: mainBreaker,
        options: MAIN_CIRCUIT_BREAKER_RATINGS,
        placeholder: 'Select breaker...',
        tooltipText: 'Main Breaker will be automatically calculated based on the total Gateway max continuous output current.'
      })}

      {/* Backup Sub Panel */}
      {renderBreakerField({
        label: 'Backup Sub Panel*',
        modeField: 'gatewayConfigBackupSubPanelMode',
        valueField: 'gatewayConfigBackupSubPanel',
        mode: backupSubPanelMode,
        value: backupSubPanel,
        options: MAIN_CIRCUIT_BREAKER_RATINGS,
        placeholder: 'Select breaker...',
        tooltipText: 'Backup Sub Panel breaker will be automatically calculated based on the backup loads requirements.'
      })}

      {/* PV Breaker Rating */}
      {renderBreakerField({
        label: 'PV Breaker Rating',
        modeField: 'gatewayConfigPVBreakerMode',
        valueField: 'gatewayConfigPVBreaker',
        mode: pvBreakerMode,
        value: pvBreaker,
        options: MAIN_CIRCUIT_BREAKER_RATINGS.filter(opt => opt.value !== 'MLO'),
        placeholder: 'Select breaker...',
        tooltipText: 'A PV Breaker will be added in the Gateway PV input and will be rated to protect the total PV max continuous output current.'
      })}

      {/* ESS Breaker Rating */}
      {renderBreakerField({
        label: 'ESS Breaker Rating',
        modeField: 'gatewayConfigESSBreakerMode',
        valueField: 'gatewayConfigESSBreaker',
        mode: essBreakerMode,
        value: essBreaker,
        options: MAIN_CIRCUIT_BREAKER_RATINGS.filter(opt => opt.value !== 'MLO'),
        placeholder: 'Select breaker...',
        tooltipText: 'An ESS Breaker will be added in the Gateway battery input and will be rated to protect the total Battery max continuous output current.'
      })}

      {/* Tie-in Breaker Rating */}
      {renderBreakerField({
        label: 'Tie-in Breaker',
        modeField: 'gatewayConfigTieInBreakerMode',
        valueField: 'gatewayConfigTieInBreaker',
        mode: tieInBreakerMode,
        value: tieInBreaker,
        options: tieInBreakerOptions,
        placeholder: 'Select breaker...',
        tooltipText: 'A Tie-in Breaker will be added in the Main Panel (A) and will be rated to protect the total Gateway max continuous output current landed in this Gateway. You can change the Tie-in Location in the Electrical Section.'
      })}

      {/* Activate PCS Button - at bottom of section */}
      {!activatePCS && (
        <div className={componentStyles.activatePCSButtonContainer}>
          <TableRowButton
            label="Activate PCS"
            variant="outline"
            onClick={() => onChange('gatewayConfigActivatePCS', true)}
            style={{ width: '100%' }}
          />
        </div>
      )}

      {/* PCS Active State - shown when activated */}
      {activatePCS && (
        <div className={componentStyles.pcsActiveContainer}>
          {/* PCS Activation Alert */}
          <Alert variant="info" collapsible={false}>
            <strong>Power Control System Active:</strong> Manual activation enabled.
          </Alert>

          {/* PCS Setting (Amps) Dropdown */}
          <TableDropdown
            label="PCS Setting (Amps)"
            value={pcsAmps}
            onChange={(value) => onChange('gatewayConfigPCSAmps', value)}
            options={PCS_AMPS_OPTIONS}
            placeholder="Select amps..."
          />

          {/* PCS Note */}
          <div className={componentStyles.pcsNote}>
            PCS Settings only throttle the current (amps), if you want to change the SMS breaker rating, see SMS Section.
          </div>

          {/* Deactivate PCS Button */}
          <TableRowButton
            label="Deactivate PCS"
            variant="outline"
            onClick={() => {
              onChange('gatewayConfigActivatePCS', false);
              onChange('gatewayConfigPCSAmps', '');
            }}
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(GatewayConfigurationSection);
