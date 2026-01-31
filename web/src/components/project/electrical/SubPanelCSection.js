import React, { useMemo } from 'react';
import { BUS_BAR_RATING, MAIN_CIRCUIT_BREAKER_RATINGS, FEEDER_LOCATIONS, CONDUCTOR_SIZING_OPTIONS } from '../../../utils/constants';
import { AddSectionButton, EquipmentRow, FormFieldRow, TableDropdown, TableRowButton } from '../../ui';
import styles from './SubPanelCSection.module.css';

/**
 * Sub Panel C Section
 * Optional sub-panel configuration
 */
const SubPanelCSection = ({ formData, onChange, onShowSubPanelD, subPanelDVisible = false }) => {
  // Tie-In Breaker options with "Lug Kit" instead of "MLO"
  const TIE_IN_BREAKER_OPTIONS = useMemo(() => {
    return MAIN_CIRCUIT_BREAKER_RATINGS.map(option =>
      option.value === 'MLO' ? { value: 'MLO', label: 'Lug Kit' } : option
    );
  }, []);

  // Calculate allowable backfeed: (Bus × 1.2) - Main Breaker
  const allowableBackfeed = useMemo(() => {
    const bus = parseInt(formData.spc_bus_bar_rating) || 0;
    const mainBreaker = formData.spc_main_breaker_rating === 'MLO'
      ? 0
      : parseInt(formData.spc_main_breaker_rating) || 0;

    if (bus === 0) return null;
    return (bus * 1.2 - mainBreaker).toFixed(0);
  }, [formData.spc_bus_bar_rating, formData.spc_main_breaker_rating]);

  const isMLO = formData.spc_main_breaker_rating === 'MLO';
  const isExisting = formData.spc_subpanel_existing;

  // Determine current panel type value
  const getPanelTypeValue = () => {
    if (formData.el_spc_derated) return 'derate';
    if (formData.spc_subpanel_existing === false) return 'new';
    return 'existing'; // Default to existing
  };

  const handlePanelTypeChange = (value) => {
    if (value === 'new') {
      // New: Bus = New, MCB = New
      onChange('spc_subpanel_existing', false);
      onChange('spc_subpanelc_mcbexisting', false);
      onChange('el_spc_derated', false);
    } else if (value === 'existing') {
      // Existing: Bus = Existing, MCB = Existing
      onChange('spc_subpanel_existing', true);
      onChange('spc_subpanelc_mcbexisting', true);
      onChange('el_spc_derated', false);
    } else if (value === 'derate') {
      // Derate: Bus = Existing, MCB = New
      onChange('spc_subpanel_existing', true);
      onChange('spc_subpanelc_mcbexisting', false);
      onChange('el_spc_derated', true);
    }
  };

  // Wrapper to save toggle defaults when any field changes
  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value);
    // Note: Sub panels do NOT auto-default to a panel type selection
    // User must explicitly choose New, Existing, or Derate
  };

  // Check if there's any data in Sub Panel C (excluding MLO which is the default)
  const hasData = useMemo(() => {
    return !!(
      formData.spc_bus_bar_rating ||
      formData.spc_feeder_location ||
      formData.spc_upstream_breaker_rating ||
      formData.spc_conductor_sizing ||
      formData.spc_tie_in_location
    );
  }, [
    formData.spc_bus_bar_rating,
    formData.spc_feeder_location,
    formData.spc_upstream_breaker_rating,
    formData.spc_conductor_sizing,
    formData.spc_tie_in_location,
  ]);

  const getSubtitle = () => {
    const parts = [];
    if (formData.spc_main_breaker_rating) {
      parts.push(`Breaker: ${formData.spc_main_breaker_rating}`);
    }
    if (formData.spc_bus_bar_rating) {
      parts.push(`Bus: ${formData.spc_bus_bar_rating}A`);
    }
    return parts.join(' | ');
  };

  const handleDelete = () => {
    // Clear all Sub Panel C fields
    onChange('spc_bus_bar_rating', null);
    onChange('spc_main_breaker_rating', null);
    onChange('spc_feeder_location', null);
    onChange('spc_upstream_breaker_rating', null);
    onChange('spc_conductor_sizing', null);
    onChange('spc_tie_in_location', null);
    onChange('spc_subpanel_existing', null);
    onChange('spc_subpanelc_mcbexisting', null);
    onChange('el_spc_derated', null);

    // Clear the show flag to hide Sub Panel C
    onChange('show_sub_panel_c', null);
  };

  // Tie-In Location options for Sub Panel C
  const tieInLocationOptions = [
    { label: 'Main Panel (A) Bus', value: 'Main Panel (A) Bus' },
    { label: 'Sub Panel (B) Bus', value: 'Sub Panel (B) Bus' },
  ];

  return (
    <div className={styles.sectionWrapper}>
      <EquipmentRow
        title="Sub Panel (C)"
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
          value={formData.spc_bus_bar_rating || ''}
          onChange={(value) => handleFieldChange('spc_bus_bar_rating', value)}
          options={BUS_BAR_RATING}
          placeholder="Select amps..."
        />

        {/* Main Circuit Breaker */}
        <TableDropdown
          label="Main Circuit Breaker"
          value={formData.spc_main_breaker_rating || 'MLO'}
          onChange={(value) => handleFieldChange('spc_main_breaker_rating', value)}
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
              active={formData.spc_feeder_location === location.value}
              onClick={() => handleFieldChange('spc_feeder_location', location.value)}
            />
          ))}
        </FormFieldRow>

        {/* Tie-In Breaker Rating */}
        <TableDropdown
          label="Tie-In Breaker"
          value={formData.spc_upstream_breaker_rating || ''}
          onChange={(value) => handleFieldChange('spc_upstream_breaker_rating', value)}
          options={TIE_IN_BREAKER_OPTIONS}
          placeholder="Select rating..."
        />

        {/* Conductor Sizing - Only for existing panels */}
        {isExisting && (
          <TableDropdown
            label="Conductor Sizing"
            value={formData.spc_conductor_sizing || ''}
            onChange={(value) => handleFieldChange('spc_conductor_sizing', value)}
            options={CONDUCTOR_SIZING_OPTIONS}
            placeholder="Select size..."
          />
        )}

        {/* Tie-In Location */}
        <TableDropdown
          label="Tie-In Location"
          value={formData.spc_tie_in_location || ''}
          onChange={(value) => handleFieldChange('spc_tie_in_location', value)}
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

      {/* Sub Panel (D) Button - Only show if not already visible */}
      {!subPanelDVisible && (
        <AddSectionButton
          label="Sub Panel (D)"
          onClick={onShowSubPanelD}
        />
      )}
    </div>
  );
};

export default SubPanelCSection;
