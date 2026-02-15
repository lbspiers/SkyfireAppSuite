import React, { useState, useEffect, useMemo, memo } from 'react';
import { EquipmentRow, TableDropdown, Button } from '../../ui';
import { BOS_FIELD_PATTERNS } from '../../../constants/bosFieldPatterns';
import {
  getUtilityEquipmentTypeOptions,
  translateToStandardName,
  getAvailableMakes as getUtilityMakes,
  getAvailableModels as getUtilityModels,
} from '../../../utils/bosEquipmentUtils';
import { BOS_EQUIPMENT_CATALOG } from '../../../constants/bosEquipmentCatalog';
import { AMP_RATING_OPTIONS } from '../../../constants/bosConstants';

/**
 * BOS Equipment Section
 * Renders inline BOS equipment slots with dropdowns (just like Solar Panel/Battery/Inverter)
 *
 * Usage: Place after trigger equipment (String Combiner, Battery, SMS, Backup Panel)
 *
 * @param {number|null} maxContinuousOutputAmps - Raw max output amps (1.25× applied here)
 * @param {boolean} loadingMaxOutput - Loading state for max output calculation
 */
const BOSEquipmentSection = ({
  formData,
  onChange,
  section,
  systemNumber = 1,
  maxContinuousOutputAmps = null,
  loadingMaxOutput = false,
}) => {
  const pattern = BOS_FIELD_PATTERNS[section];

  // Track which slots are visible (start with slot 1 always visible)
  const [visibleSlots, setVisibleSlots] = useState([1]);

  // Hydrate visible slots from existing data on mount AND when formData changes
  useEffect(() => {
    const slotsWithData = [1]; // Always show slot 1

    // Check slots 2 through maxSlots for existing data
    for (let i = 2; i <= pattern.maxSlots; i++) {
      const prefix = pattern.slotPattern(systemNumber, i);
      const hasData = !!(
        formData[`${prefix}_equipment_type`] ||
        formData[`${prefix}_make`] ||
        formData[`${prefix}_model`] ||
        formData[`${prefix}_amp_rating`] ||
        formData[`${prefix}_active`]  // Check _active flag set by auto-population
      );

      if (hasData) {
        slotsWithData.push(i);
      }
    }

    // Only update if different from current state (but don't compare against visibleSlots to avoid interference with manual additions)
    setVisibleSlots(prev => {
      const currentSlots = JSON.stringify(prev.sort());
      const newSlots = JSON.stringify(slotsWithData.sort());
      return currentSlots !== newSlots ? slotsWithData : prev;
    });
  }, [formData, pattern.maxSlots, systemNumber]); // React to formData changes only

  // Get utility from multiple sources (fallback chain)
  const utility = useMemo(() => {
    // Try formData.site.utility first
    if (formData.site?.utility) {
      return formData.site.utility;
    }

    // Try formData.utility (passed directly)
    if (formData.utility) {
      return formData.utility;
    }

    // Try projectUtility prop (fallback)
    if (formData.projectUtility) {
      return formData.projectUtility;
    }

    return 'Gen';
  }, [formData.site?.utility, formData.utility, formData.projectUtility]);

  // Check if inverter is Hoymiles or APSystems (requires breaker rating)
  const inverterMake = formData.inverter_make || formData[`sys${systemNumber}_inverter_make`] || '';
  const isHoymilesOrApsystems = inverterMake === 'Hoymiles' || inverterMake === 'APSystems';

  // Check if this is a microinverter system (for title labeling)
  const inverterType = formData.inverter_type || formData[`sys${systemNumber}_inverter_type`] || '';
  const isMicroinverter = inverterType === 'microinverter';

  // Get section-specific title
  const getSectionTitle = (slotNumber) => {
    switch (section) {
      case 'utility':
        return isMicroinverter ? `String Combiner BOS (Type ${slotNumber})` : `Inverter BOS (Type ${slotNumber})`;
      case 'battery1':
        return `Battery 1 BOS (Type ${slotNumber})`;
      case 'battery2':
        return `Battery 2 BOS (Type ${slotNumber})`;
      case 'backup':
        return `Backup BOS (Type ${slotNumber})`;
      case 'postSMS':
        return `Post-SMS BOS (Type ${slotNumber})`;
      default:
        return `BOS Equipment (Type ${slotNumber})`;
    }
  };

  // Breaker size options for Hoymiles/APSystems
  const breakerSizeOptions = [
    { label: '20', value: '20' },
    { label: '30', value: '30' },
  ];

  // Calculate minimum required amps (apply 1.25× NEC safety factor)
  const minRequiredAmps = useMemo(() => {
    if (!maxContinuousOutputAmps || maxContinuousOutputAmps <= 0) return null;
    return maxContinuousOutputAmps * 1.25;
  }, [maxContinuousOutputAmps]);

  // Get utility-specific equipment types
  const equipmentTypes = useMemo(() => {
    return getUtilityEquipmentTypeOptions(utility);
  }, [utility]);

  // Get available makes for a given equipment type and amp rating (translate to standard name for lookup)
  const getAvailableMakes = (equipmentType, ampRating) => {
    if (!equipmentType) return [];
    const standardType = translateToStandardName(equipmentType);

    // If amp rating is selected, filter makes that have models at this amp rating
    if (ampRating) {
      const makes = [...new Set(
        BOS_EQUIPMENT_CATALOG
          .filter(e => e.type === standardType && e.amp === ampRating)
          .map(e => e.make)
      )].sort();
      return makes.map(make => ({ label: make, value: make }));
    }

    // No amp rating selected, show all makes
    const makes = getUtilityMakes(standardType);
    return makes.map(make => ({ label: make, value: make }));
  };

  // Get available models for a given type, make, and amp rating (translate to standard name for lookup)
  const getAvailableModels = (equipmentType, make, ampRating) => {
    if (!equipmentType || !make) return [];
    const standardType = translateToStandardName(equipmentType);

    // Get all models for this type and make
    let models = getUtilityModels(standardType, make);

    // Filter by amp rating if selected
    if (ampRating) {
      models = models.filter(m => m.amp === ampRating);
    }

    return models.map(m => ({
      label: `${m.model} (${m.amp})`,
      value: m.model,
      amp: m.amp,
    }));
  };

  // Get available amp ratings for a given equipment type (filtered by minRequiredAmps)
  const getAvailableAmpRatings = (equipmentType) => {
    if (!equipmentType) return [];

    const standardType = translateToStandardName(equipmentType);

    // Get unique amp ratings for this equipment type from catalog
    const amps = [...new Set(
      BOS_EQUIPMENT_CATALOG
        .filter(e => e.type === standardType)
        .map(e => parseFloat(e.amp))
        .filter(a => !isNaN(a))
    )].sort((a, b) => a - b);

    // Filter by minimum required amps if available
    if (minRequiredAmps) {
      const filtered = amps.filter(a => a >= minRequiredAmps);
      console.log(`[BOS Sizing ${section}] Min required:`, Math.ceil(minRequiredAmps));
      console.log(`[BOS Sizing ${section}] Available amps:`, filtered);
      return filtered.map(amp => ({ label: `${amp}A`, value: amp.toString() }));
    }

    return amps.map(amp => ({ label: `${amp}A`, value: amp.toString() }));
  };

  // Handle delete for a slot
  const handleDeleteSlot = (slotNumber) => {
    const prefix = pattern.slotPattern(systemNumber, slotNumber);

    // Clear all data for this slot
    onChange(`${prefix}_equipment_type`, '');
    onChange(`${prefix}_make`, '');
    onChange(`${prefix}_model`, '');
    onChange(`${prefix}_amp_rating`, '');
    onChange(`${prefix}_is_new`, true);
    if (pattern.hasTrigger) {
      onChange(`${prefix}_trigger`, null);
    }
    if (pattern.hasActive) {
      onChange(`${prefix}_active`, null);
    }

    // If this is the last visible slot (slot 1) being deleted, hide the entire BOS section
    if (visibleSlots.length === 1 && slotNumber === 1) {
      // Hide the appropriate BOS section based on section type
      const bosFlags = {
        utility: 'show_inverter_bos',
        battery1: 'show_battery1_bos',
        battery2: 'show_battery2_bos',
        backup: 'show_backup_bos',
        postSMS: 'show_postsms_bos',
      };
      const flagToHide = bosFlags[section];
      if (flagToHide) {
        onChange(flagToHide, false);
      }
    }
    // Otherwise, remove it from visibleSlots array
    else if (visibleSlots.length > 1) {
      setVisibleSlots(visibleSlots.filter(slot => slot !== slotNumber));
    }
  };

  // Handle equipment type change - also set trigger/active if needed, clear downstream fields
  const handleEquipmentTypeChange = (slot, value) => {
    const prefix = pattern.slotPattern(systemNumber, slot);
    onChange(`${prefix}_equipment_type`, value);

    // Clear amp rating, make, and model when equipment type changes
    onChange(`${prefix}_amp_rating`, '');
    onChange(`${prefix}_make`, '');
    onChange(`${prefix}_model`, '');

    // Auto-set trigger and active when equipment type is selected
    if (value && pattern.hasTrigger) {
      onChange(`${prefix}_trigger`, true);
    }
    if (value && pattern.hasActive) {
      onChange(`${prefix}_active`, true);
    }
  };

  // Handle amp rating change - clear make/model
  const handleAmpRatingChange = (slot, value) => {
    const prefix = pattern.slotPattern(systemNumber, slot);
    onChange(`${prefix}_amp_rating`, value);

    // Clear make and model when amp rating changes
    onChange(`${prefix}_make`, '');
    onChange(`${prefix}_model`, '');
  };

  // Handle model change - auto-fill amp rating
  const handleModelChange = (slot, equipmentType, make, modelValue) => {
    const prefix = pattern.slotPattern(systemNumber, slot);
    onChange(`${prefix}_model`, modelValue);

    // Auto-fill amp rating from selected model (translate to standard type for lookup)
    const standardType = translateToStandardName(equipmentType);
    const selectedModel = BOS_EQUIPMENT_CATALOG.find(
      item => item.type === standardType && item.make === make && item.model === modelValue
    );
    if (selectedModel && selectedModel.amp) {
      onChange(`${prefix}_amp_rating`, selectedModel.amp);
    }
  };

  // Build list of slots to render based on visibleSlots
  const slotsToRender = visibleSlots.map(slotNumber => {
    const prefix = pattern.slotPattern(systemNumber, slotNumber);
    const equipmentType = formData[`${prefix}_equipment_type`];
    const make = formData[`${prefix}_make`];
    const model = formData[`${prefix}_model`];
    const ampRating = formData[`${prefix}_amp_rating`];
    const isNew = formData[`${prefix}_is_new`] !== false;

    return {
      slotNumber,
      prefix,
      equipmentType: equipmentType || '',
      make: make || '',
      model: model || '',
      ampRating: ampRating || '',
      isNew,
    };
  });

  // Auto-select amp rating when equipment type selected and maxOutput available
  useEffect(() => {
    slotsToRender.forEach(slot => {
      // Only auto-select if: equipment type selected, no amp rating, and we have min required amps
      if (slot.equipmentType && !slot.ampRating && minRequiredAmps) {
        const availableAmps = getAvailableAmpRatings(slot.equipmentType);

        if (availableAmps.length > 0) {
          const smallestCompliant = availableAmps[0].value; // Already filtered and sorted
          onChange(`${slot.prefix}_amp_rating`, smallestCompliant);
          console.log(`[BOS Auto-Select ${section} Slot ${slot.slotNumber}] Amp rating: ${smallestCompliant}A (min required: ${minRequiredAmps}A)`);
        }
      }
    });
  }, [slotsToRender.map(s => s.equipmentType).join(','), minRequiredAmps]);

  // Auto-select make if only 1 option available
  useEffect(() => {
    slotsToRender.forEach(slot => {
      if (slot.ampRating && !slot.make) {
        const availableMakes = getAvailableMakes(slot.equipmentType, slot.ampRating);

        if (availableMakes.length === 1) {
          onChange(`${slot.prefix}_make`, availableMakes[0].value);
          console.log(`[BOS Auto-Select ${section} Slot ${slot.slotNumber}] Make: ${availableMakes[0].value} (only option)`);
        }
      }
    });
  }, [slotsToRender.map(s => `${s.ampRating}-${s.make}`).join(',')]);

  // Auto-select model if only 1 option available
  useEffect(() => {
    slotsToRender.forEach(slot => {
      if (slot.make && !slot.model) {
        const availableModels = getAvailableModels(slot.equipmentType, slot.make, slot.ampRating);

        if (availableModels.length === 1) {
          onChange(`${slot.prefix}_model`, availableModels[0].value);
          console.log(`[BOS Auto-Select ${section} Slot ${slot.slotNumber}] Model: ${availableModels[0].value} (only option)`);
        }
      }
    });
  }, [slotsToRender.map(s => `${s.make}-${s.model}`).join(',')]);

  // Determine next slot number and if we can add more
  const nextSlot = visibleSlots.length === 0 ? 1 : Math.max(...visibleSlots) + 1;
  const canAddMore = nextSlot <= pattern.maxSlots;

  // Handle adding a new slot
  const handleAddSlot = () => {
    if (canAddMore) {
      setVisibleSlots([...visibleSlots, nextSlot]);
    }
  };

  return (
    <div>
      {slotsToRender.map((slot, index) => {
        const availableMakes = getAvailableMakes(slot.equipmentType, slot.ampRating);
        const availableModels = getAvailableModels(slot.equipmentType, slot.make, slot.ampRating);
        const isLastSlot = index === slotsToRender.length - 1;

        // Subtitle shows make/model if available
        const getSubtitle = () => {
          const parts = [];

          // New/Existing indicator
          const statusLetter = slot.isNew ? 'N' : 'E';
          parts.push(`(${statusLetter})`);

          if (slot.make && slot.model) {
            parts.push(`${slot.make} ${slot.model}`);
          }
          if (slot.ampRating) {
            parts.push(`${slot.ampRating}`);
          }
          return parts.join(' ');
        };

        const availableAmpRatings = getAvailableAmpRatings(slot.equipmentType);

        return (
          <div key={slot.slotNumber} style={{
            marginBottom: 'var(--spacing-xs)',
            marginTop: index === 0 ? 'var(--spacing-xs)' : '0'
          }}>
            <EquipmentRow
              title={slot.equipmentType || getSectionTitle(slot.slotNumber)}
              subtitle={getSubtitle()}
              showNewExistingToggle={true}
              isNew={slot.isNew}
              onNewExistingChange={(isNew) => onChange(`${slot.prefix}_is_new`, isNew)}
              toggleRowRightContent={
                maxContinuousOutputAmps > 0 ? (
                  <span style={{
                    fontSize: 'var(--font-size-xs)',
                    color: '#ff6b35',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}>
                    Min: {Math.ceil(maxContinuousOutputAmps * 1.25)}A
                  </span>
                ) : null
              }
              onDelete={() => handleDeleteSlot(slot.slotNumber)}
            >
            <TableDropdown
              label="Equipment Type"
              value={slot.equipmentType || ''}
              onChange={(value) => handleEquipmentTypeChange(slot.slotNumber, value)}
              options={equipmentTypes}
              placeholder="Select equipment type..."
            />

            <>
              <TableDropdown
                label="Amp Rating"
                value={slot.ampRating || ''}
                onChange={(value) => handleAmpRatingChange(slot.slotNumber, value)}
                options={availableAmpRatings}
                placeholder={!slot.equipmentType ? 'Select type first' : minRequiredAmps ? `Min ${Math.ceil(minRequiredAmps)}A` : 'Select amp rating...'}
                disabled={!slot.equipmentType || availableAmpRatings.length === 0}
              />
              {slot.equipmentType && availableAmpRatings.length === 0 && minRequiredAmps && (
                <div style={{
                  color: 'var(--color-error)',
                  fontSize: 'var(--font-size-xs)',
                  marginTop: 'var(--spacing-xs)',
                  paddingLeft: '1rem',
                }}>
                  No equipment meets {Math.ceil(minRequiredAmps)}A requirement
                </div>
              )}
            </>

            <TableDropdown
              label="Make"
              value={slot.make || ''}
              onChange={(value) => onChange(`${slot.prefix}_make`, value)}
              options={availableMakes}
              placeholder={!slot.ampRating ? 'Select amp rating first' : 'Select make...'}
              disabled={!slot.ampRating}
            />

            <TableDropdown
              label="Model"
              value={slot.model || ''}
              onChange={(value) => handleModelChange(slot.slotNumber, slot.equipmentType, slot.make, value)}
              options={availableModels}
              placeholder={!slot.make ? 'Select make first' : 'Select model...'}
              disabled={!slot.make}
            />

            {/* Breaker Size - Only for Hoymiles/APSystems */}
            {isHoymilesOrApsystems && (
              <TableDropdown
                label="Breaker Size"
                value={formData[`sys${systemNumber}_ap_hoy_breaker_size`] || ''}
                onChange={(value) => onChange(`sys${systemNumber}_ap_hoy_breaker_size`, value)}
                options={breakerSizeOptions}
                placeholder="Select breaker size..."
              />
            )}

            {/* Add Next BOS Button - Only in the LAST visible slot */}
            {isLastSlot && canAddMore && (
              <div style={{
                marginTop: 'var(--spacing-tight)',
                paddingTop: 0,
                paddingLeft: '1rem',
                borderTop: '1px solid var(--border-color)'
              }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddSlot}
                  style={{ borderRadius: '9999px' }}
                >
                  + {getSectionTitle(nextSlot)}
                </Button>
              </div>
            )}
          </EquipmentRow>
          </div>
        );
      })}
    </div>
  );
};

export default memo(BOSEquipmentSection);
