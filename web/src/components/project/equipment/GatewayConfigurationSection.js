import React from 'react';
import { MAIN_CIRCUIT_BREAKER_RATINGS, PCS_AMPS_OPTIONS } from '../../../utils/constants';
import { TableDropdown, TableRowButton, Alert, FormFieldRow, Tooltip } from '../../ui';
import formStyles from '../../../styles/FormSections.module.css';
import flameIcon from '../../../assets/images/Skyfire Flame Icon.png';
import logger from '../../../services/devLogger';

/**
 * Gateway Configuration Section
 * Tesla Gateway (Backup Gateway 2 or Gateway 3) specific configuration
 *
 * Each breaker field supports Auto/Custom mode:
 * - Auto: System calculates optimal breaker rating (shows tooltip)
 * - Custom: User manually selects breaker rating from dropdown
 */
const GatewayConfigurationSection = ({
  gatewayConfigMainBreakerMode = 'auto',
  gatewayConfigMainBreaker = '',
  gatewayConfigBackupSubPanelMode = 'auto',
  gatewayConfigBackupSubPanel = '',
  gatewayConfigPVBreakerMode = 'auto',
  gatewayConfigPVBreaker = '',
  gatewayConfigESSBreakerMode = 'auto',
  gatewayConfigESSBreaker = '',
  gatewayConfigTieInBreakerMode = 'auto',
  gatewayConfigTieInBreaker = '',
  gatewayConfigActivatePCS = false,
  gatewayConfigPCSAmps = '',
  onChange,
}) => {
  // Main Breaker
  const mainBreakerMode = gatewayConfigMainBreakerMode;
  const mainBreaker = gatewayConfigMainBreaker;

  // Backup Sub Panel
  const backupSubPanelMode = gatewayConfigBackupSubPanelMode;
  const backupSubPanel = gatewayConfigBackupSubPanel;

  // PV Breaker Rating
  const pvBreakerMode = gatewayConfigPVBreakerMode;
  const pvBreaker = gatewayConfigPVBreaker;

  // ESS Breaker Rating
  const essBreakerMode = gatewayConfigESSBreakerMode;
  const essBreaker = gatewayConfigESSBreaker;

  // Tie-in Breaker
  const tieInBreakerMode = gatewayConfigTieInBreakerMode;
  const tieInBreaker = gatewayConfigTieInBreaker;

  // Activate PCS
  const activatePCS = gatewayConfigActivatePCS;
  const pcsAmps = gatewayConfigPCSAmps;

  logger.log('[GatewayConfig] Render:', {
    mainBreakerMode,
    backupSubPanelMode,
    pvBreakerMode,
    essBreakerMode,
    tieInBreakerMode,
    activatePCS
  });

  // Main Breaker options (100, 125, 150, 175, 200)
  const mainBreakerOptions = [100, 125, 150, 175, 200].map((n) => ({
    label: `${n} Amps`,
    value: n.toString()
  }));

  // Tie-in breaker options (15-250 amps in increments of 5)
  const tieInBreakerOptions = Array.from({ length: 48 }, (_, i) => {
    const value = 15 + i * 5;
    return { label: `${value} Amps`, value: value.toString() };
  });

  /**
   * Renders a breaker field with Auto/Custom toggle and tooltip
   * Matches the styling of Inverter section Stringing row
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
      tooltipText,
      defaultValue = '' // For resetting when switching back to Auto
    } = config;

    const handleModeChange = (newMode) => {
      onChange(modeField, newMode);
      // Reset to default value when switching to auto
      // For Main Breaker and Backup Sub Panel, default is MLO (empty in custom mode)
      // For other breakers, default is empty (auto-calculated)
      if (newMode === 'auto') {
        onChange(valueField, defaultValue);
      }
    };

    return (
      <>
        {/* Toggle Row */}
        <FormFieldRow label={label}>
          <TableRowButton
            label="Auto"
            variant="outline"
            active={mode === 'auto'}
            onClick={() => handleModeChange('auto')}
          />
          <TableRowButton
            label="Custom"
            variant="outline"
            active={mode === 'custom'}
            onClick={() => handleModeChange('custom')}
          />
          <div style={{ display: 'inline-flex', marginLeft: 'var(--spacing-tight)' }}>
            <Tooltip
              content={
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
                  {tooltipText}
                </div>
              }
              position="bottom"
              className="alertTooltip"
            >
              <img src={flameIcon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', cursor: 'help' }} />
            </Tooltip>
          </div>
        </FormFieldRow>

        {/* Dropdown Row (only shown in Custom mode) */}
        {mode === 'custom' && (
          <TableDropdown
            label=""
            value={value}
            onChange={(val) => onChange(valueField, val)}
            options={options}
            placeholder={placeholder}
          />
        )}
      </>
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
        options: mainBreakerOptions,
        placeholder: 'Select breaker...',
        tooltipText: 'Main Breaker is defaulted to MLO. Click Custom to edit if alternate breaker is needed.',
        defaultValue: '' // MLO is default (empty = MLO in Auto mode)
      })}

      {/* Backup Sub Panel */}
      {renderBreakerField({
        label: 'Backup Sub Panel*',
        modeField: 'gatewayConfigBackupSubPanelMode',
        valueField: 'gatewayConfigBackupSubPanel',
        mode: backupSubPanelMode,
        value: backupSubPanel,
        options: mainBreakerOptions,
        placeholder: 'Select breaker...',
        tooltipText: 'Backup Subpanel is defaulted to MLO. Click Custom to edit if alternate breaker is needed.',
        defaultValue: '' // MLO is default (empty = MLO in Auto mode)
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
        tooltipText: 'A minimum PV Breaker will be added in the SMS PV input and will be rated to protect the total PV max continuous output current.',
        defaultValue: '' // Empty = auto-calculated
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
        tooltipText: 'A minimum Battery Breaker will be added in the SMS Battery input and will be rated to protect the total Battery max continuous output current.',
        defaultValue: '' // Empty = auto-calculated
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
        tooltipText: 'A minimum SMS Tie-in Breaker will be added in Main Panel (A). If you are landing in another location and/or using an alternate Tie in method, you can edit it in the Electrical section. If Whole Home Backup, the Tie-in breaker will auto size to the bus rating of the Panel it is landing in. If Partial Home Backup, the Tie-in Breaker will auto size to protect the total PV and Battery max continuous output current landed in the SMS. If the total PV and Battery max continuous output current landed in the SMS is larger than the max allowable panel backfeed, then the Power Control System (PCS) will activate and be sized to the max allowable panel backfeed or manually activate below.',
        defaultValue: '' // Empty = auto-calculated
      })}

      {/* Activate PCS Button - at bottom of section */}
      {!activatePCS && (
        <div style={{ paddingLeft: 'var(--spacing)', paddingRight: 'var(--spacing)', paddingTop: 'var(--spacing-tight)', paddingBottom: 'var(--spacing-tight)' }}>
          <TableRowButton
            label="Activate PCS"
            variant="outline"
            onClick={() => onChange('gatewayConfigActivatePCS', true)}
          />
        </div>
      )}

      {/* PCS Active State - shown when activated */}
      {activatePCS && (
        <>
          {/* PCS Activation Alert */}
          <div style={{ padding: '0 var(--spacing) var(--spacing-tight)' }}>
            <Alert variant="info" collapsible={false}>
              <strong>Power Control System Active:</strong> Manual activation enabled.
            </Alert>
          </div>

          {/* PCS Setting (Amps) Dropdown */}
          <TableDropdown
            label="PCS Setting (Amps)"
            value={pcsAmps}
            onChange={(value) => onChange('gatewayConfigPCSAmps', value)}
            options={PCS_AMPS_OPTIONS}
            placeholder="Select amps..."
          />

          {/* PCS Note */}
          <div style={{
            padding: 'var(--spacing-tight) var(--spacing)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            fontStyle: 'italic'
          }}>
            PCS Settings only throttle the current (amps), if you want to change the SMS breaker rating, see SMS Section.
          </div>

          {/* Deactivate PCS Button */}
          <div style={{ paddingLeft: 'var(--spacing)', paddingRight: 'var(--spacing)', paddingTop: 'var(--spacing-tight)', paddingBottom: 'var(--spacing-tight)' }}>
            <TableRowButton
              label="Deactivate PCS"
              variant="outline"
              onClick={() => {
                onChange('gatewayConfigActivatePCS', false);
                onChange('gatewayConfigPCSAmps', '');
              }}
            />
          </div>
        </>
      )}

    </div>
  );
};

export default React.memo(GatewayConfigurationSection);
