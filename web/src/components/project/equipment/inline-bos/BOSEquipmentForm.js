/**
 * BOSEquipmentForm Component
 *
 * Equipment selection form for BOS with utility-specific translations.
 *
 * Features (per mobile app specification):
 * 1. Utility-specific equipment type dropdown (uses getUtilityEquipmentTypeOptions)
 * 2. Amp Rating dropdown shown FIRST (before Make) - matches mobile app
 * 3. Auto-select amp rating when equipment type selected (smallest compliant rating)
 * 4. Auto-select make if only 1 option available
 * 5. Auto-select model if only 1 option available
 * 6. Cascade clearing with hydration guards to prevent clearing on initial load
 * 7. NEC 1.25× filtering applied in this component (receives raw maxContinuousOutputAmps)
 * 8. Is New checkbox
 * 9. NO _active field for battery sections
 * 10. All equipment types available everywhere (no filtering by location)
 *
 * Props:
 * @param {object|null} equipmentData - Existing equipment data (null for new)
 * @param {function} onSave - Save callback
 * @param {function} onCancel - Cancel callback
 * @param {string} utility - Utility abbreviation
 * @param {number|null} maxContinuousOutputAmps - Raw max output amps (1.25× applied here)
 * @param {boolean} loadingMaxOutput - Loading state for max output calculation
 * @param {string} section - Section type for field name generation
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  getUtilityEquipmentTypeOptions,
  getAvailableMakes,
  getAvailableModels,
} from '../../../../utils/bosEquipmentUtils';
import { BOS_EQUIPMENT_CATALOG } from '../../../../constants/bosEquipmentCatalog';
import { FormSelect, TableRowButton, Button } from '../../../ui';
import styles from './BOSEquipmentForm.module.css';

const BOSEquipmentForm = ({
  equipmentData,
  onSave,
  onCancel,
  utility,
  maxContinuousOutputAmps = null,
  loadingMaxOutput = false,
  section,
}) => {
  // Form state
  const [equipmentType, setEquipmentType] = useState(equipmentData?.equipmentType || '');
  const [ampRating, setAmpRating] = useState(equipmentData?.ampRating || '');
  const [make, setMake] = useState(equipmentData?.make || '');
  const [model, setModel] = useState(equipmentData?.model || '');
  const [isNew, setIsNew] = useState(equipmentData?.isNew ?? true);

  // Refs for hydration guards (prevent clearing on initial load)
  const prevEquipmentType = useRef(equipmentData?.equipmentType || '');
  const prevAmpRating = useRef(equipmentData?.ampRating || '');
  const prevMake = useRef(equipmentData?.make || '');
  const isInitialMount = useRef(true);

  // Calculate minimum required amps (apply 1.25× NEC safety factor)
  const minRequiredAmps = useMemo(() => {
    if (!maxContinuousOutputAmps || maxContinuousOutputAmps <= 0) return null;
    return maxContinuousOutputAmps * 1.25;
  }, [maxContinuousOutputAmps]);

  // Get utility-specific equipment type options
  const equipmentTypeOptions = useMemo(() => {
    return getUtilityEquipmentTypeOptions(utility).map(opt => ({
      value: opt.value,
      label: opt.label,
    }));
  }, [utility]);

  // Get available amp ratings for selected equipment type (filtered by minRequired)
  const availableAmpRatings = useMemo(() => {
    if (!equipmentType) return [];

    // Get unique amp ratings for this equipment type
    const amps = [...new Set(
      BOS_EQUIPMENT_CATALOG
        .filter(e => e.type === equipmentType ||
                     getUtilityEquipmentTypeOptions(utility).some(opt =>
                       opt.value === equipmentType && e.type === opt.value
                     ))
        .map(e => parseFloat(e.amp))
        .filter(a => !isNaN(a))
    )].sort((a, b) => a - b);

    // Filter by minimum required amps if available
    if (minRequiredAmps) {
      const filtered = amps.filter(a => a >= minRequiredAmps);
      return filtered;
    }

    return amps;
  }, [equipmentType, minRequiredAmps, utility]);

  // Get available makes for selected equipment type and amp rating
  const availableMakes = useMemo(() => {
    if (!equipmentType) return [];
    if (!ampRating) return getAvailableMakes(equipmentType);

    // Filter makes that have models at this amp rating
    return [...new Set(
      BOS_EQUIPMENT_CATALOG
        .filter(e => e.type === equipmentType && e.amp === ampRating)
        .map(e => e.make)
    )].sort();
  }, [equipmentType, ampRating]);

  // Get available models for selected equipment type, amp rating, and make
  const availableModels = useMemo(() => {
    if (!equipmentType || !make) return [];

    let models = getAvailableModels(equipmentType, make);

    // Filter by amp rating if selected
    if (ampRating) {
      models = models.filter(m => m.amp === ampRating);
    }

    return models;
  }, [equipmentType, make, ampRating]);

  // ============================================
  // AUTO-SELECT LOGIC
  // ============================================

  // Auto-select amp rating when equipment type selected and maxOutput available
  useEffect(() => {
    // Skip on initial mount (hydration)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only auto-select if: equipment type selected, no amp rating, and we have available options
    if (equipmentType && !ampRating && availableAmpRatings.length > 0 && minRequiredAmps) {
      const smallestCompliant = availableAmpRatings[0]; // Already filtered and sorted
      setAmpRating(smallestCompliant.toString());
      console.log(`[BOS Auto-Select] Amp rating: ${smallestCompliant}A (min required: ${minRequiredAmps}A)`);
    }
  }, [equipmentType, availableAmpRatings, minRequiredAmps, ampRating]);

  // Auto-select make if only 1 option available
  useEffect(() => {
    if (ampRating && !make && availableMakes.length === 1) {
      setMake(availableMakes[0]);
      console.log(`[BOS Auto-Select] Make: ${availableMakes[0]} (only option)`);
    }
  }, [ampRating, availableMakes, make]);

  // Auto-select model if only 1 option available
  useEffect(() => {
    if (make && !model && availableModels.length === 1) {
      setModel(availableModels[0].model);
      console.log(`[BOS Auto-Select] Model: ${availableModels[0].model} (only option)`);
    }
  }, [make, availableModels, model]);

  // ============================================
  // CASCADE CLEARING (with hydration guards)
  // ============================================

  // Equipment type change → clear amp/make/model
  useEffect(() => {
    if (prevEquipmentType.current && prevEquipmentType.current !== equipmentType) {
      setAmpRating('');
      setMake('');
      setModel('');
    }
    prevEquipmentType.current = equipmentType;
  }, [equipmentType]);

  // Amp rating change → clear make/model
  useEffect(() => {
    if (prevAmpRating.current && prevAmpRating.current !== ampRating) {
      setMake('');
      setModel('');
    }
    prevAmpRating.current = ampRating;
  }, [ampRating]);

  // Make change → clear model
  useEffect(() => {
    if (prevMake.current && prevMake.current !== make) {
      setModel('');
    }
    prevMake.current = make;
  }, [make]);

  // Handle save
  const handleSave = () => {
    if (!equipmentType) {
      toast.warning('Please select an equipment type', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }
    if (!ampRating) {
      toast.warning('Please select an amp rating', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }
    if (!make) {
      toast.warning('Please select a make', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }
    if (!model) {
      toast.warning('Please select a model', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }

    onSave({
      equipmentType,
      ampRating,
      make,
      model,
      isNew,
    });
  };

  // Convert amp ratings array to FormSelect options format
  const ampRatingOptions = availableAmpRatings.map(amp => ({
    value: amp.toString(),
    label: `${amp}A`,
  }));

  // Convert makes array to FormSelect options format
  const makeOptions = availableMakes.map(makeOption => ({
    value: makeOption,
    label: makeOption,
  }));

  // Convert models array to FormSelect options format
  const modelOptions = availableModels.map(modelOption => ({
    value: modelOption.model,
    label: `${modelOption.model} (${modelOption.amp}A)`,
  }));

  return (
    <div className={styles.bosEquipmentForm}>
      {/* New/Existing Toggle Row with Max Output Display */}
      <div className={styles.toggleRow}>
        <div className={styles.toggleButtons}>
          <TableRowButton
            label="New"
            variant="outline"
            active={isNew}
            onClick={() => setIsNew(true)}
          />
          <TableRowButton
            label="Existing"
            variant="outline"
            active={!isNew}
            onClick={() => setIsNew(false)}
          />
        </div>

        {/* Max Output Display - Right justified */}
        {maxContinuousOutputAmps > 0 && (
          <div className={styles.maxOutputDisplay}>
            Max Cont Output (×1.25): {Math.ceil(minRequiredAmps)}A
          </div>
        )}
      </div>

      {/* Equipment Type Dropdown */}
      <FormSelect
        label="Equipment Type"
        required
        options={equipmentTypeOptions}
        value={equipmentType}
        onChange={(e) => setEquipmentType(e.target.value)}
        placeholder="-- Select Equipment Type --"
      />

      {/* Amp Rating Dropdown (before Make) */}
      <FormSelect
        label={`Amp Rating${minRequiredAmps ? ` (min ${Math.ceil(minRequiredAmps)}A)` : ''}`}
        required
        options={ampRatingOptions}
        value={ampRating}
        onChange={(e) => setAmpRating(e.target.value)}
        disabled={!equipmentType || availableAmpRatings.length === 0}
        placeholder="-- Select Amp Rating --"
        error={equipmentType && availableAmpRatings.length === 0 && minRequiredAmps
          ? `No equipment meets ${Math.ceil(minRequiredAmps)}A requirement`
          : undefined}
      />

      {/* Make Dropdown */}
      <FormSelect
        label="Make"
        required
        options={makeOptions}
        value={make}
        onChange={(e) => setMake(e.target.value)}
        disabled={!ampRating || availableMakes.length === 0}
        placeholder="-- Select Make --"
      />

      {/* Model Dropdown */}
      <FormSelect
        label="Model"
        required
        options={modelOptions}
        value={model}
        onChange={(e) => setModel(e.target.value)}
        disabled={!make || availableModels.length === 0}
        placeholder="-- Select Model --"
      />

      {/* Loading indicator */}
      {loadingMaxOutput && (
        <div className={styles.loadingText}>Calculating sizing requirements...</div>
      )}

      {/* Action Buttons */}
      <div className={styles.formActions}>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          {equipmentData ? 'Update' : 'Add'}
        </Button>
      </div>
    </div>
  );
};

export default BOSEquipmentForm;
