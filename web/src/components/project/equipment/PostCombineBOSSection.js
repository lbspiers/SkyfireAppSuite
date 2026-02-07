/**
 * PostCombineBOSSection - Post-Combine BOS Equipment (max 3 slots)
 *
 * Follows same pattern as SolarPanelSection using EquipmentRow + TableDropdown.
 * Field prefix: post_sms_bos_sys1_type{N}, uses _existing (inverted from _is_new)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { EquipmentRow, TableDropdown, ConfirmDialog, Button } from '../../ui';
import { patchSystemDetails } from '../../../services/systemDetailsAPI';
import { BOS_EQUIPMENT_CATALOG } from '../../../constants/bosEquipmentCatalog';
import { getUtilityEquipmentTypeOptions, translateToStandardName } from '../../../utils/bosEquipmentUtils';
import styles from './PostCombineBOSSection.module.css';

const PostCombineBOSSection = ({ projectUuid, systemDetails, activeSystems, utility }) => {
  // Calculate combined max output from all active systems
  const combinedMaxOutput = useMemo(() => {
    let total = 0;
    activeSystems?.forEach(n => {
      const p = `sys${n}_`;

      // Get inverter output
      const isMicroinverter = systemDetails?.[`${p}inverter_type`] === 'microinverter';
      const invMaxOutput = parseFloat(systemDetails?.[`${p}inv_max_continuous_output`]) || 0;
      const inverterMake = systemDetails?.[`${p}micro_inverter_make`] || systemDetails?.[`${p}inverter_make`] || '';

      let inverterOutput = 0;
      if (isMicroinverter) {
        // For microinverters, multiply by quantity
        // Hoymiles and APSystems have their own quantity field (inverter_qty)
        // Others use solar panel quantity
        const isHoymiles = inverterMake.toLowerCase().includes('hoymiles');
        const isAPSystems = inverterMake.toLowerCase().includes('apsystems') || inverterMake.toLowerCase().includes('aps systems');

        let microQty = 1;
        if (isHoymiles || isAPSystems) {
          microQty = parseInt(systemDetails?.[`${p}micro_inverter_quantity`]) || parseInt(systemDetails?.[`${p}inverter_qty`]) || 1;
        } else {
          microQty = parseInt(systemDetails?.[`${p}solar_panel_quantity`]) || 1;
        }

        inverterOutput = invMaxOutput * microQty;
      } else {
        // For string inverters, just use the output (quantity already considered if needed)
        const invQty = parseInt(systemDetails?.[`${p}inverter_qty`]) || 1;
        inverterOutput = invMaxOutput * invQty;
      }

      // Get battery outputs
      const battery1Output = parseFloat(systemDetails?.[`${p}battery_1_max_continuous_output`]) || 0;
      const battery2Output = parseFloat(systemDetails?.[`${p}battery_2_max_continuous_output`]) || 0;

      total += inverterOutput + battery1Output + battery2Output;
    });
    return Math.round(total);
  }, [systemDetails, activeSystems]);

  // Minimum amp rating (1.25× NEC factor)
  const minAmpRating = useMemo(() => {
    return combinedMaxOutput ? Math.ceil(combinedMaxOutput * 1.25) : null;
  }, [combinedMaxOutput]);

  const getPrefix = (n) => `post_sms_bos_sys1_type${n}`;
  const isPopulated = (n) => !!systemDetails?.[`${getPrefix(n)}_equipment_type`];

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* Slot 1 - Always visible */}
      <PostCombineBOSSlot
        slotNumber={1}
        projectUuid={projectUuid}
        systemDetails={systemDetails}
        utility={utility}
        minAmpRating={minAmpRating}
        showAddButton={!isPopulated(2)}
      />

      {/* Slot 2 - Shows when Slot 1 populated */}
      {isPopulated(1) && (
        <PostCombineBOSSlot
          slotNumber={2}
          projectUuid={projectUuid}
          systemDetails={systemDetails}
          utility={utility}
          minAmpRating={minAmpRating}
          showAddButton={!isPopulated(3)}
        />
      )}

      {/* Slot 3 - Shows when Slots 1 and 2 populated */}
      {isPopulated(1) && isPopulated(2) && (
        <PostCombineBOSSlot
          slotNumber={3}
          projectUuid={projectUuid}
          systemDetails={systemDetails}
          utility={utility}
          minAmpRating={minAmpRating}
          showAddButton={false}
        />
      )}
    </div>
  );
};

/**
 * PostCombineBOSSlot - Individual BOS equipment slot
 * Uses EquipmentRow + TableDropdown pattern like SolarPanelSection
 */
const PostCombineBOSSlot = ({
  slotNumber,
  projectUuid,
  systemDetails,
  utility,
  minAmpRating,
  showAddButton = false,
}) => {
  const prefix = `post_sms_bos_sys1_type${slotNumber}`;

  // Local state for dropdowns
  const [equipmentType, setEquipmentType] = useState('');
  const [ampRating, setAmpRating] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [isExisting, setIsExisting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load from systemDetails on mount/change
  useEffect(() => {
    setEquipmentType(systemDetails?.[`${prefix}_equipment_type`] || '');
    setAmpRating(systemDetails?.[`${prefix}_amp_rating`] || '');
    setMake(systemDetails?.[`${prefix}_make`] || '');
    setModel(systemDetails?.[`${prefix}_model`] || '');
    // _is_new: true = new, false = existing (default true for new equipment)
    const isNewValue = systemDetails?.[`${prefix}_is_new`];
    setIsExisting(isNewValue === false); // isExisting = !isNew
  }, [systemDetails, prefix]);

  // Get equipment type options
  const equipmentTypeOptions = useMemo(() => {
    return getUtilityEquipmentTypeOptions(utility).map(opt => ({
      value: opt.value,
      label: opt.label,
    }));
  }, [utility]);

  // Get available amp ratings for selected equipment type
  const ampRatingOptions = useMemo(() => {
    if (!equipmentType) return [];

    // Translate utility-specific name to standard name for catalog lookup
    const standardType = translateToStandardName(equipmentType);

    const ratings = [...new Set(
      BOS_EQUIPMENT_CATALOG
        .filter(e => e.type === standardType)
        .map(e => parseFloat(e.amp))
        .filter(a => !isNaN(a) && (!minAmpRating || a >= minAmpRating))
    )].sort((a, b) => a - b);

    return ratings.map(r => ({ value: r.toString(), label: `${r}A` }));
  }, [equipmentType, minAmpRating]);

  // Get available makes for selected equipment type + amp rating
  const makeOptions = useMemo(() => {
    if (!equipmentType) return [];

    // Translate utility-specific name to standard name for catalog lookup
    const standardType = translateToStandardName(equipmentType);

    let filtered = BOS_EQUIPMENT_CATALOG.filter(e => e.type === standardType);
    if (ampRating) {
      filtered = filtered.filter(e => e.amp === ampRating);
    }

    const makes = [...new Set(filtered.map(e => e.make))].sort();
    return makes.map(m => ({ value: m, label: m }));
  }, [equipmentType, ampRating]);

  // Get available models for selected equipment type + amp rating + make
  const modelOptions = useMemo(() => {
    if (!equipmentType || !make) return [];

    // Translate utility-specific name to standard name for catalog lookup
    const standardType = translateToStandardName(equipmentType);

    let filtered = BOS_EQUIPMENT_CATALOG.filter(e =>
      e.type === standardType && e.make === make
    );
    if (ampRating) {
      filtered = filtered.filter(e => e.amp === ampRating);
    }

    return filtered.map(e => ({ value: e.model, label: `${e.model} (${e.amp}A)` }));
  }, [equipmentType, ampRating, make]);

  // Save field to database
  const saveField = async (fieldName, value) => {
    try {
      await patchSystemDetails(projectUuid, {
        [`${prefix}_${fieldName}`]: value,
      });
    } catch (error) {
      console.error('[PostCombineBOS] Save failed:', error);
      toast.error('Failed to save');
    }
  };

  // Handle equipment type change - cascade clear
  const handleEquipmentTypeChange = (value) => {
    setEquipmentType(value);
    setAmpRating('');
    setMake('');
    setModel('');
    saveField('equipment_type', value);
    saveField('amp_rating', '');
    saveField('make', '');
    saveField('model', '');
    // Save is_new as true when equipment type is selected (new equipment by default)
    saveField('is_new', true);
  };

  // Handle amp rating change - cascade clear make/model
  const handleAmpRatingChange = (value) => {
    setAmpRating(value);
    setMake('');
    setModel('');
    saveField('amp_rating', value);
    saveField('make', '');
    saveField('model', '');
  };

  // Handle make change - cascade clear model
  const handleMakeChange = (value) => {
    setMake(value);
    setModel('');
    saveField('make', value);
    saveField('model', '');
    // Save is_new when make is selected (user is actively configuring equipment)
    saveField('is_new', !isExisting);
  };

  // Handle model change
  const handleModelChange = (value) => {
    setModel(value);
    saveField('model', value);
    // Save is_new when model is selected (user is actively configuring equipment)
    saveField('is_new', !isExisting);
  };

  // Handle New/Existing toggle
  const handleNewExistingChange = (isNew) => {
    setIsExisting(!isNew);
    // _is_new: true = new, false = existing
    saveField('is_new', isNew);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await patchSystemDetails(projectUuid, {
        [`${prefix}_equipment_type`]: '',
        [`${prefix}_amp_rating`]: '',
        [`${prefix}_make`]: '',
        [`${prefix}_model`]: '',
        [`${prefix}_is_new`]: true,
      });
      toast.success('Deleted');
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('[PostCombineBOS] Delete failed:', error);
      toast.error('Failed to delete');
    }
  };

  // Build subtitle for collapsed state
  const subtitle = make && model ? `${make} ${model}` : '';

  return (
    <>
      <EquipmentRow
        title={`Post Combine BOS (Type ${slotNumber})`}
        subtitle={subtitle}
        showNewExistingToggle={true}
        isNew={!isExisting}
        onNewExistingChange={handleNewExistingChange}
        onDelete={() => setShowDeleteConfirm(true)}
        onCamera={() => {}}
        onEdit={() => {}}
        toggleRowRightContent={
          minAmpRating && (
            <span style={{
              fontSize: 'var(--font-size-xs)',
              color: 'rgb(255, 107, 53)',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}>
              Min: {minAmpRating}A
            </span>
          )
        }
      >
        {/* Equipment Type */}
        <TableDropdown
          label="Equipment Type"
          value={equipmentType}
          onChange={handleEquipmentTypeChange}
          options={equipmentTypeOptions}
          placeholder="Select equipment type..."
        />

        {/* Amp Rating */}
        <TableDropdown
          label="Amp Rating"
          value={ampRating}
          onChange={handleAmpRatingChange}
          options={ampRatingOptions}
          placeholder={equipmentType ? 'Select amp rating...' : 'Select type first'}
          disabled={!equipmentType}
        />

        {/* Make */}
        <TableDropdown
          label="Make"
          value={make}
          onChange={handleMakeChange}
          options={makeOptions}
          placeholder={ampRating ? 'Select make...' : 'Select amp rating first'}
          disabled={!ampRating}
        />

        {/* Model */}
        <TableDropdown
          label="Model"
          value={model}
          onChange={handleModelChange}
          options={modelOptions}
          placeholder={make ? 'Select model...' : 'Select make first'}
          disabled={!make}
        />

        {/* Add Button */}
        {showAddButton && (
          <div style={{
            marginTop: 'var(--spacing-tight)',
            paddingTop: 0,
            paddingLeft: '1rem',
            borderTop: '1px solid var(--border-color)'
          }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              style={{ borderRadius: '9999px' }}
            >
              +Post Combine BOS (Type {slotNumber + 1})
            </Button>
          </div>
        )}
      </EquipmentRow>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={`Clear Post Combine BOS Type ${slotNumber}`}
        message={`Are you sure you want to clear Post Combine BOS Type ${slotNumber}?`}
        confirmText="Clear"
        cancelText="Cancel"
        variant="warning"
      />
    </>
  );
};

export default PostCombineBOSSection;
