import React, { useMemo } from 'react';
import { BUS_BAR_RATING, MAIN_CIRCUIT_BREAKER_RATINGS, FEEDER_LOCATIONS, CONDUCTOR_SIZING_OPTIONS } from '../../../utils/constants';
import { EquipmentRow, FormFieldRow, TableDropdown, TableRowButton } from '../../ui';
import styles from './SubPanelDSection.module.css';

/**
 * Sub Panel D Section
 * Optional sub-panel configuration
 */
const SubPanelDSection = ({ formData, onChange }) => {
  // Tie-In Breaker options with "Lug Kit" instead of "MLO"
  const TIE_IN_BREAKER_OPTIONS = useMemo(() => {
    return MAIN_CIRCUIT_BREAKER_RATINGS.map(option =>
      option.value === 'MLO' ? { value: 'MLO', label: 'Lug Kit' } : option
    );
  }, []);

  // Calculate allowable backfeed: (Bus × 1.2) - Main Breaker
  const allowableBackfeed = useMemo(() => {
    const bus = parseInt(formData.spd_bus_bar_rating) || 0;
    const mainBreaker = formData.spd_main_breaker_rating === 'MLO'
      ? 0
      : parseInt(formData.spd_main_breaker_rating) || 0;

    if (bus === 0) return null;
    return (bus * 1.2 - mainBreaker).toFixed(0);
  }, [formData.spd_bus_bar_rating, formData.spd_main_breaker_rating]);

  const isMLO = formData.spd_main_breaker_rating === 'MLO';
  const isExisting = formData.spd_subpanel_existing;

  // Determine current panel type value
  const getPanelTypeValue = () => {
    if (formData.el_spd_derated) return 'derate';
    if (formData.spd_subpanel_existing === false) return 'new';
    return 'existing'; // Default to existing
  };

  const handlePanelTypeChange = (value) => {
    if (value === 'new') {
      // New: Bus = New, MCB = New
      onChange('spd_subpanel_existing', false);
      onChange('spd_subpaneld_mcbexisting', false);
      onChange('el_spd_derated', false);
    } else if (value === 'existing') {
      // Existing: Bus = Existing, MCB = Existing
      onChange('spd_subpanel_existing', true);
      onChange('spd_subpaneld_mcbexisting', true);
      onChange('el_spd_derated', false);
    } else if (value === 'derate') {
      // Derate: Bus = Existing, MCB = New
      onChange('spd_subpanel_existing', true);
      onChange('spd_subpaneld_mcbexisting', false);
      onChange('el_spd_derated', true);
    }
  };

  // Wrapper to save toggle defaults when any field changes
  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value);
    // Note: Sub panels do NOT auto-default to a panel type selection
    // User must explicitly choose New, Existing, or Derate
  };

  // Check if there's any data in Sub Panel D (excluding MLO which is the default)
  const hasData = useMemo(() => {
    return !!(
      formData.spd_bus_bar_rating ||
      formData.spd_feeder_location ||
      formData.spd_upstream_breaker_rating ||
      formData.spd_conductor_sizing ||
      formData.spd_tie_in_location
    );
  }, [
    formData.spd_bus_bar_rating,
    formData.spd_feeder_location,
    formData.spd_upstream_breaker_rating,
    formData.spd_conductor_sizing,
    formData.spd_tie_in_location,
  ]);

  const getSubtitle = () => {
    const parts = [];
    if (formData.spd_main_breaker_rating) {
      parts.push(`Breaker: ${formData.spd_main_breaker_rating}`);
    }
    if (formData.spd_bus_bar_rating) {
      parts.push(`Bus: ${formData.spd_bus_bar_rating}A`);
    }
    return parts.join(' | ');
  };

  const handleDelete = () => {
    // Clear all Sub Panel D fields
    onChange('spd_bus_bar_rating', null);
    onChange('spd_main_breaker_rating', null);
    onChange('spd_feeder_location', null);
    onChange('spd_upstream_breaker_rating', null);
    onChange('spd_conductor_sizing', null);
    onChange('spd_tie_in_location', null);
    onChange('spd_subpanel_existing', null);
    onChange('spd_subpaneld_mcbexisting', null);
    onChange('el_spd_derated', null);

    // Clear the show flag to hide Sub Panel D
    onChange('show_sub_panel_d', null);
  };

  // Tie-In Location options for Sub Panel D
  const tieInLocationOptions = [
    { label: 'Main Panel (A) Bus', value: 'Main Panel (A) Bus' },
    { label: 'Sub Panel (B) Bus', value: 'Sub Panel (B) Bus' },
    { label: 'Sub Panel (C) Bus', value: 'Sub Panel (C) Bus' },
  ];

  return (
    <div className={styles.sectionWrapper}>
      <EquipmentRow
        title="Sub Panel (D)"
        subtitle={getSubtitle()}
        onDelete={handleDelete}
        initiallyExpanded={hasData}
      >
        {/* Panel Type Toggle - New / Existing / Derate - No label, left-justified */}
        <div className={styles.panelTypeToggle}>
          <TableRowButton
            label="New"
            variant="outline"
            active={getPanelTypeValue() === 'new'}
            onClick={() => handlePanelTypeChange('new')}
          />
          <TableRowButton
            label="Existing"
            variant="outline"
            active={getPanelTypeValue() === 'existing'}
            onClick={() => handlePanelTypeChange('existing')}
          />
          <TableRowButton
            label="Derate"
            variant="outline"
            active={getPanelTypeValue() === 'derate'}
            onClick={() => handlePanelTypeChange('derate')}
          />
        </div>
        {/* Bus (Amps) */}
        <TableDropdown
          label="Bus (Amps)"
          value={formData.spd_bus_bar_rating || ''}
          onChange={(value) => handleFieldChange('spd_bus_bar_rating', value)}
          options={BUS_BAR_RATING}
          placeholder="Select amps..."
        />

        {/* Main Circuit Breaker */}
        <TableDropdown
          label="Main Circuit Breaker"
          value={formData.spd_main_breaker_rating || 'MLO'}
          onChange={(value) => handleFieldChange('spd_main_breaker_rating', value)}
          options={MAIN_CIRCUIT_BREAKER_RATINGS}
          placeholder="Select breaker..."
        />

        {/* Feeder Location on Bus Bar */}
        <FormFieldRow label="Feeder Location">
          {FEEDER_LOCATIONS.map((location) => (
            <TableRowButton
              key={location.value}
              label={location.label}
              variant="outline"
              active={formData.spd_feeder_location === location.value}
              onClick={() => handleFieldChange('spd_feeder_location', location.value)}
            />
          ))}
        </FormFieldRow>

        {/* Tie-In Breaker Rating */}
        <TableDropdown
          label="Tie-In Breaker"
          value={formData.spd_upstream_breaker_rating || ''}
          onChange={(value) => handleFieldChange('spd_upstream_breaker_rating', value)}
          options={TIE_IN_BREAKER_OPTIONS}
          placeholder="Select rating..."
        />

        {/* Conductor Sizing - Only for existing panels */}
        {isExisting && (
          <TableDropdown
            label="Conductor Sizing"
            value={formData.spd_conductor_sizing || ''}
            onChange={(value) => handleFieldChange('spd_conductor_sizing', value)}
            options={CONDUCTOR_SIZING_OPTIONS}
            placeholder="Select size..."
          />
        )}

        {/* Tie-In Location */}
        <TableDropdown
          label="Tie-In Location"
          value={formData.spd_tie_in_location || ''}
          onChange={(value) => handleFieldChange('spd_tie_in_location', value)}
          options={tieInLocationOptions}
          placeholder="Select location..."
        />

        {/* Allowable Backfeed Display */}
        {allowableBackfeed !== null && (
          <div className={styles.allowableBackfeedContainer}>
            <div className={styles.allowableBackfeedValue}>
              Allowable Backfeed: {allowableBackfeed} Amps
            </div>
            <div className={styles.allowableBackfeedFormula}>
              (Bus × 1.2) - Main Breaker
            </div>
          </div>
        )}

      </EquipmentRow>
    </div>
  );
};

export default SubPanelDSection;
