import React, { useMemo, useEffect } from 'react';
import { BUS_BAR_RATING, MAIN_CIRCUIT_BREAKER_RATINGS, FEEDER_LOCATIONS, CONDUCTOR_SIZING_OPTIONS, SPB_TIE_IN_LOCATIONS } from '../../../utils/constants';
import { AddSectionButton, EquipmentRow, FormFieldRow, TableDropdown, TableRowButton } from '../../ui';
import styles from './SubPanelBSection.module.css';

/**
 * Sub Panel B Section
 * Optional sub-panel configuration
 */
const SubPanelBSection = ({ formData, onChange, onShowSubPanelC, subPanelCVisible = false }) => {
  // Sub Panel B Main Circuit Breaker options - max 225A
  const SUB_PANEL_B_BREAKER_OPTIONS = useMemo(() => {
    return MAIN_CIRCUIT_BREAKER_RATINGS.filter(option => {
      if (option.value === 'MLO') return true;
      const ampValue = parseInt(option.value);
      return ampValue <= 225;
    });
  }, []);

  // Tie-In Breaker options with "Lug Kit" instead of "MLO"
  const TIE_IN_BREAKER_OPTIONS = useMemo(() => {
    return SUB_PANEL_B_BREAKER_OPTIONS.map(option =>
      option.value === 'MLO' ? { value: 'MLO', label: 'Lug Kit' } : option
    );
  }, [SUB_PANEL_B_BREAKER_OPTIONS]);

  // Calculate allowable backfeed: (Bus × 1.2) - Main Breaker
  const allowableBackfeed = useMemo(() => {
    const bus = parseInt(formData.spb_bus_bar_rating) || 0;
    const mainBreaker = formData.spb_main_breaker_rating === 'MLO'
      ? 0
      : parseInt(formData.spb_main_breaker_rating) || 0;

    if (bus === 0) return null;
    return (bus * 1.2 - mainBreaker).toFixed(0);
  }, [formData.spb_bus_bar_rating, formData.spb_main_breaker_rating]);

  const isMLO = formData.spb_main_breaker_rating === 'MLO';

  // Set default to New on mount if Sub Panel B data exists but toggle not set
  useEffect(() => {
    const hasSPBData = formData.spb_bus_bar_rating || formData.spb_main_breaker_rating;

    // Use == null to catch both undefined AND null
    if (hasSPBData && formData.spb_subpanel_existing == null) {
      onChange('spb_subpanel_existing', false); // false = New (default for Sub Panel B)
    }
    if (hasSPBData && formData.spb_subpanelb_mcbexisting == null) {
      onChange('spb_subpanelb_mcbexisting', false); // Default MCB to New when panel is New
    }
    if (hasSPBData && formData.el_spb_derated == null) {
      onChange('el_spb_derated', false); // Default Derate to false
    }
    // Save MLO default for main circuit breaker
    if (hasSPBData && formData.spb_main_breaker_rating == null) {
      onChange('spb_main_breaker_rating', 'MLO'); // Default to MLO
    }
  }, [formData.spb_bus_bar_rating, formData.spb_main_breaker_rating, formData.spb_subpanel_existing, formData.spb_subpanelb_mcbexisting, formData.el_spb_derated, onChange]);

  // Determine current toggle states
  const isNew = formData.spb_subpanel_existing === false;
  const isExisting = formData.spb_subpanel_existing === true;
  const isDerate = formData.el_spb_derated === true;

  const handleNewClick = () => {
    if (isNew) {
      // Turn off New → default to Existing
      onChange('spb_subpanel_existing', true);
      onChange('spb_subpanelb_mcbexisting', true);
    } else {
      // Turn on New → turn off Derate
      onChange('spb_subpanel_existing', false);
      onChange('spb_subpanelb_mcbexisting', false);
      onChange('el_spb_derated', false);
    }
  };

  const handleExistingClick = () => {
    if (isExisting && !isNew) {
      // Already existing and not New, do nothing
      return;
    }
    onChange('spb_subpanel_existing', true);
    onChange('spb_subpanelb_mcbexisting', true);
    // Don't touch el_spb_derated - Existing and Derate CAN coexist
  };

  const handleDerateClick = () => {
    if (isDerate) {
      // Turn off Derate
      onChange('el_spb_derated', false);
      onChange('spb_subpanelb_mcbexisting', true);
    } else {
      // Turn on Derate
      if (isNew) {
        // Can't have New + Derate, so switch to Existing first
        onChange('spb_subpanel_existing', true);
      }
      onChange('el_spb_derated', true);
      onChange('spb_subpanelb_mcbexisting', false);
    }
  };

  // Wrapper to save toggle defaults when any field changes
  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value);

    // Also save toggle defaults if not already set
    // Use == null to catch both undefined AND null
    if ((fieldName === 'spb_bus_bar_rating' || fieldName === 'spb_main_breaker_rating') && value) {
      if (formData.spb_subpanel_existing == null) {
        onChange('spb_subpanel_existing', false); // Default to New
      }
      if (formData.el_spb_derated == null) {
        onChange('el_spb_derated', false);
      }
    }

    // Save MLO default when bus bar is set but breaker not set
    if (fieldName === 'spb_bus_bar_rating' && value && formData.spb_main_breaker_rating == null) {
      onChange('spb_main_breaker_rating', 'MLO');
    }
  };

  // Check if there's any data in Sub Panel B (excluding MLO which is the default)
  const hasData = useMemo(() => {
    return !!(
      formData.spb_bus_bar_rating ||
      formData.spb_subpanel_b_feeder_location ||
      formData.spb_upstream_breaker_rating ||
      formData.spb_conductor_sizing ||
      formData.spb_tie_in_location
    );
  }, [
    formData.spb_bus_bar_rating,
    formData.spb_subpanel_b_feeder_location,
    formData.spb_upstream_breaker_rating,
    formData.spb_conductor_sizing,
    formData.spb_tie_in_location,
  ]);

  const getSubtitle = () => {
    const parts = [];
    if (formData.spb_main_breaker_rating) {
      parts.push(`Breaker: ${formData.spb_main_breaker_rating}`);
    }
    if (formData.spb_bus_bar_rating) {
      parts.push(`Bus: ${formData.spb_bus_bar_rating}A`);
    }
    return parts.join(' | ');
  };

  const handleDelete = () => {
    // If there's data, clear it (first click)
    if (hasData) {
      // Clear all Sub Panel B fields
      onChange('spb_bus_bar_rating', null);
      onChange('spb_main_breaker_rating', null);
      onChange('spb_subpanel_b_feeder_location', null);
      onChange('spb_upstream_breaker_rating', null);
      onChange('spb_conductor_sizing', null);
      onChange('spb_tie_in_location', null);
      onChange('spb_subpanel_existing', null);
      onChange('el_spb_derated', null);
      onChange('spb_subpanelb_mcbexisting', null);
    } else {
      // If no data, hide the section (second click)
      onChange('show_sub_panel_b', false);
      onChange('spb_activated', false);
    }
  };

  return (
    <div className={styles.sectionWrapper}>
      <EquipmentRow
        title="Sub Panel (B)"
        subtitle={getSubtitle()}
        onDelete={handleDelete}
        initiallyExpanded={hasData}
      >
        {/* Panel Type Toggle - New / Existing / Derate - No label, left-justified */}
        <div className={styles.panelTypeToggle}>
          <TableRowButton
            label="New"
            variant="outline"
            active={isNew}
            onClick={handleNewClick}
          />
          <TableRowButton
            label="Existing"
            variant="outline"
            active={isExisting && !isNew}
            onClick={handleExistingClick}
          />
          <TableRowButton
            label="Derate"
            variant="outline"
            active={isDerate}
            onClick={handleDerateClick}
          />
        </div>
        {/* Bus (Amps) */}
        <TableDropdown
          label="Bus (Amps)"
          value={formData.spb_bus_bar_rating || ''}
          onChange={(value) => handleFieldChange('spb_bus_bar_rating', value)}
          options={BUS_BAR_RATING}
          placeholder="Select amps..."
        />

        {/* Main Circuit Breaker */}
        <TableDropdown
          label="Main Circuit Breaker"
          value={formData.spb_main_breaker_rating || 'MLO'}
          onChange={(value) => handleFieldChange('spb_main_breaker_rating', value)}
          options={SUB_PANEL_B_BREAKER_OPTIONS}
          placeholder="Select breaker..."
        />

        {/* Feeder Location on Bus Bar */}
        <FormFieldRow label="Feeder Location">
          {FEEDER_LOCATIONS.map((location) => (
            <TableRowButton
              key={location.value}
              label={location.label}
              variant="outline"
              active={formData.spb_subpanel_b_feeder_location === location.value}
              onClick={() => handleFieldChange('spb_subpanel_b_feeder_location', location.value)}
            />
          ))}
        </FormFieldRow>

        {/* Tie-In Breaker Rating */}
        <TableDropdown
          label="Tie-In Breaker"
          value={formData.spb_upstream_breaker_rating || ''}
          onChange={(value) => handleFieldChange('spb_upstream_breaker_rating', value)}
          options={TIE_IN_BREAKER_OPTIONS}
          placeholder="Select rating..."
        />

        {/* Conductor Sizing - Only for existing panels */}
        {isExisting && (
          <TableDropdown
            label="Conductor Sizing"
            value={formData.spb_conductor_sizing || ''}
            onChange={(value) => handleFieldChange('spb_conductor_sizing', value)}
            options={CONDUCTOR_SIZING_OPTIONS}
            placeholder="Select size..."
          />
        )}

        {/* Tie-In Location */}
        <TableDropdown
          label="Tie-In Location"
          value={formData.spb_tie_in_location || ''}
          onChange={(value) => handleFieldChange('spb_tie_in_location', value)}
          options={SPB_TIE_IN_LOCATIONS}
          placeholder="Select location..."
        />

        {/* Allowable Backfeed Display */}
        {allowableBackfeed !== null && (
          <div className={styles.allowableBackfeed}>
            Allowable Backfeed: {allowableBackfeed} Amps
          </div>
        )}

      </EquipmentRow>

      {/* Sub Panel (C) Button - Only show if not already visible */}
      {!subPanelCVisible && (
        <AddSectionButton
          label="Sub Panel (C)"
          onClick={onShowSubPanelC}
        />
      )}
    </div>
  );
};

export default SubPanelBSection;
