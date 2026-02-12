import React, { useMemo, useState, useEffect } from 'react';
import { BUS_BAR_RATING, MAIN_CIRCUIT_BREAKER_RATINGS } from '../../../utils/constants';
import { AddSectionButton, EquipmentRow, FormFieldRow, TableDropdown, TableRowButton, SectionClearModal } from '../../ui';

/**
 * Main Panel A Section
 * Main electrical panel configuration with allowable backfeed calculation
 */
const MainPanelASection = ({ formData, onChange, onShowSubPanelB, subPanelBVisible = false }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Set default to Existing on mount if panel data exists but toggle not set
  useEffect(() => {
    const hasPanelData = formData.ele_bus_bar_rating || formData.ele_main_circuit_breaker_rating;

    // Use == null to catch both undefined AND null
    if (hasPanelData && formData.mpa_bus_bar_existing == null) {
      onChange('mpa_bus_bar_existing', true); // Default to Existing
    }
    if (hasPanelData && formData.mpa_main_circuit_breaker_existing == null) {
      onChange('mpa_main_circuit_breaker_existing', true); // Default to Existing
    }
    if (hasPanelData && formData.el_mpa_derated == null) {
      onChange('el_mpa_derated', false); // Default Derate to false
    }
  }, [formData.ele_bus_bar_rating, formData.ele_main_circuit_breaker_rating, formData.mpa_bus_bar_existing, formData.mpa_main_circuit_breaker_existing, formData.el_mpa_derated, onChange]); // Re-run if these values change
  // Calculate allowable backfeed: (Bus × 1.2) - Main Breaker
  const allowableBackfeed = useMemo(() => {
    const bus = parseInt(formData.ele_bus_bar_rating) || 0;
    const mainBreaker = formData.ele_main_circuit_breaker_rating === 'MLO'
      ? 0
      : parseInt(formData.ele_main_circuit_breaker_rating) || 0;

    if (bus === 0) return null;
    return (bus * 1.2 - mainBreaker).toFixed(0);
  }, [formData.ele_bus_bar_rating, formData.ele_main_circuit_breaker_rating]);

  // Determine current toggle states
  const isMPU = formData.mpa_bus_bar_existing === false;
  const isExisting = formData.mpa_bus_bar_existing === true;
  const isDerate = formData.el_mpa_derated === true;

  const handleMPUClick = () => {
    if (isMPU) {
      // Turn off MPU → default to Existing
      onChange('mpa_bus_bar_existing', true);
      onChange('mpa_main_circuit_breaker_existing', true);
    } else {
      // Turn on MPU → turn off Derate (they can't coexist)
      onChange('mpa_bus_bar_existing', false);
      onChange('mpa_main_circuit_breaker_existing', false);
      onChange('el_mpa_derated', false); // MPU and Derate are mutually exclusive
    }
  };

  const handleExistingClick = () => {
    if (isExisting && !isMPU && !isDerate) {
      // Already in Existing state, do nothing
      return;
    }
    // Turn on Existing
    onChange('mpa_bus_bar_existing', true);
    onChange('mpa_main_circuit_breaker_existing', true);
    onChange('el_mpa_derated', false); // Clear derate - mutually exclusive
  };

  const handleDerateClick = () => {
    if (isDerate) {
      // Turn off Derate
      onChange('el_mpa_derated', false);
      onChange('mpa_main_circuit_breaker_existing', true); // Revert MCB to existing
    } else {
      // Turn on Derate
      if (isMPU) {
        // Can't have MPU + Derate, so switch to Existing first
        onChange('mpa_bus_bar_existing', true);
      }
      onChange('el_mpa_derated', true);
      onChange('mpa_main_circuit_breaker_existing', false); // Derate means MCB is new
    }
  };

  // Wrapper to handle field changes and save toggle defaults
  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value);

    // Also save toggle defaults if not already set
    // Use == null to catch both undefined AND null
    if ((fieldName === 'ele_bus_bar_rating' || fieldName === 'ele_main_circuit_breaker_rating') && value) {
      if (formData.mpa_bus_bar_existing == null) {
        onChange('mpa_bus_bar_existing', true); // Default to Existing
      }
      if (formData.mpa_main_circuit_breaker_existing == null) {
        onChange('mpa_main_circuit_breaker_existing', true); // Default to Existing
      }
      if (formData.el_mpa_derated == null) {
        onChange('el_mpa_derated', false);
      }
    }
  };

  const getSubtitle = () => {
    const parts = [];

    // Breaker Rating
    if (formData.ele_main_circuit_breaker_rating) {
      parts.push(`Breaker: ${formData.ele_main_circuit_breaker_rating}`);
    }

    // Bus Bar Rating
    if (formData.ele_bus_bar_rating) {
      parts.push(`Bus: ${formData.ele_bus_bar_rating}A`);
    }

    // Panel Type (MPU/Existing/Derate)
    if (isMPU) {
      parts.push('MPU');
    } else if (isDerate) {
      parts.push('Derate');
    } else if (isExisting) {
      parts.push('Existing');
    }

    // Max Allowable Backfeed
    if (allowableBackfeed !== null) {
      parts.push(`Max Backfeed: ${allowableBackfeed}A`);
    }

    return parts.join(' | ');
  };

  const handleDelete = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClear = () => {
    onChange('ele_main_circuit_breaker_rating', null);
    onChange('ele_bus_bar_rating', null);
    onChange('ele_feeder_location_on_bus_bar', null);
    onChange('mpa_bus_bar_existing', null);
    onChange('mpa_main_circuit_breaker_existing', null);
    onChange('el_mpa_derated', null);
    setShowClearConfirm(false);
  };

  return (
    <div style={{ marginBottom: 'var(--spacing-xs)' }}>
      <EquipmentRow
        title="Main Panel (A)"
        subtitle={getSubtitle()}
        onDelete={handleDelete}
      >
        {/* Panel Type Toggle - MPU / Existing / Derate - No label, left-justified */}
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-xs)',
          padding: 'var(--spacing-tight) var(--spacing)',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <TableRowButton
            label="MPU"
            variant="outline"
            active={isMPU}
            onClick={handleMPUClick}
          />
          <TableRowButton
            label="Existing"
            variant="outline"
            active={isExisting && !isMPU && !isDerate}
            onClick={handleExistingClick}
          />
          <TableRowButton
            label="Derate"
            variant="outline"
            active={isDerate}
            onClick={handleDerateClick}
          />
        </div>

        {/* Bus (Amps) - MOVED TO TOP */}
        <TableDropdown
          label="Bus (Amps)"
          value={formData.ele_bus_bar_rating || ''}
          onChange={(value) => handleFieldChange('ele_bus_bar_rating', value)}
          options={BUS_BAR_RATING}
          placeholder="Select amps..."
        />

        {/* Main Circuit Breaker */}
        <TableDropdown
          label="Main Circuit Breaker"
          value={formData.ele_main_circuit_breaker_rating || ''}
          onChange={(value) => handleFieldChange('ele_main_circuit_breaker_rating', value)}
          options={MAIN_CIRCUIT_BREAKER_RATINGS}
          placeholder="Select breaker..."
        />

        {/* Feeder Location on Bus Bar - Hidden when service type is Pedestal */}
        {formData.ele_ses_type !== 'Pedestal' && (
          <FormFieldRow label="Feeder Location">
            <TableRowButton
              label="Top"
              variant="outline"
              active={formData.ele_feeder_location_on_bus_bar === 'Top'}
              onClick={() => handleFieldChange('ele_feeder_location_on_bus_bar', 'Top')}
            />
            <TableRowButton
              label="Center"
              variant="outline"
              active={formData.ele_feeder_location_on_bus_bar === 'Center'}
              onClick={() => handleFieldChange('ele_feeder_location_on_bus_bar', 'Center')}
            />
            <TableRowButton
              label="Bottom"
              variant="outline"
              active={formData.ele_feeder_location_on_bus_bar === 'Bottom'}
              onClick={() => handleFieldChange('ele_feeder_location_on_bus_bar', 'Bottom')}
            />
          </FormFieldRow>
        )}

        {/* Allowable Backfeed Display */}
        {allowableBackfeed !== null && (
          <div style={{
            padding: 'var(--spacing-tight) var(--spacing)',
            textAlign: 'center',
            color: 'var(--color-primary)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-semibold)',
          }}>
            Allowable Backfeed: {allowableBackfeed} Amps
          </div>
        )}
      </EquipmentRow>

      {/* Sub Panel (B) Button - Only show if not already visible */}
      {!subPanelBVisible && (
        <AddSectionButton
          label="Sub Panel (B)"
          onClick={onShowSubPanelB}
        />
      )}

      <SectionClearModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleConfirmClear}
        sectionName="Main Panel (A)"
        fieldCount={6}
      />
    </div>
  );
};

export default MainPanelASection;
