import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../ui/Modal';
import FormSelect from '../../ui/FormSelect';
import Button from '../../ui/Button';
import Toggle from '../../common/Toggle';
import { AMP_RATING_OPTIONS } from '../../../constants/bosConstants';
import { BOS_FIELD_PATTERNS } from '../../../constants/bosFieldPatterns';
import styles from './BOSEquipmentModal.module.css';

// Helper to get default block name for a section
const getDefaultBlockName = (section) => {
  const pattern = BOS_FIELD_PATTERNS[section];
  return pattern?.defaultBlockName || 'PRE COMBINE';
};

/**
 * BOSEquipmentModal - Add or edit BOS equipment
 *
 * Features:
 * - Equipment type selection from catalog
 * - Cascading make/model dropdowns
 * - Auto-fill amp rating from selected model
 * - Recommended amp calculation based on trigger equipment
 * - New/Existing toggle
 * - Block name classification
 */
const BOSEquipmentModal = ({
  isOpen,
  onClose,
  onSave,
  section,
  systemNumber,
  existingSlot,
  equipmentCatalog,
  findEquipment,
  calculateMinAmp,
  triggerEquipment,
  maxContinuousOutputAmps = null,
  loadingMaxOutput = false,
}) => {
  // Form state
  const [equipmentType, setEquipmentType] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [ampRating, setAmpRating] = useState('');
  const [isNew, setIsNew] = useState(true);
  const [blockName, setBlockName] = useState('PRE COMBINE');

  // Reset form when modal opens/closes or when editing different slot
  useEffect(() => {
    if (isOpen) {
      if (existingSlot) {
        // Editing existing
        setEquipmentType(existingSlot.equipment_type || existingSlot.equipmentType || '');
        setMake(existingSlot.make || '');
        setModel(existingSlot.model || '');
        setAmpRating(existingSlot.amp_rating || existingSlot.ampRating || '');
        setIsNew(existingSlot.isNew ?? true);
        setBlockName(existingSlot.block_name || existingSlot.blockName || getDefaultBlockName(section));
      } else {
        // Adding new
        setEquipmentType('');
        setMake('');
        setModel('');
        setAmpRating('');
        setIsNew(true);
        setBlockName(getDefaultBlockName(section));
      }
    }
  }, [isOpen, existingSlot, section]);

  // Get unique equipment types from catalog
  const equipmentTypes = useMemo(() => {
    const types = [...new Set(equipmentCatalog.map((item) => item.type))];
    return types.sort().map((type) => ({ value: type, label: type }));
  }, [equipmentCatalog]);

  // Get unique makes for selected equipment type
  const availableMakes = useMemo(() => {
    if (!equipmentType) return [];
    const makes = [
      ...new Set(
        equipmentCatalog
          .filter((item) => item.type === equipmentType)
          .map((item) => item.make)
      ),
    ];
    return makes.sort().map((m) => ({ value: m, label: m }));
  }, [equipmentType, equipmentCatalog]);

  // Get models for selected type and make
  const availableModels = useMemo(() => {
    if (!equipmentType || !make) return [];
    return equipmentCatalog
      .filter((item) => item.type === equipmentType && item.make === make)
      .sort((a, b) => (a.ampNumeric || 0) - (b.ampNumeric || 0))
      .map((item) => ({
        value: item.model,
        label: `${item.model} (${item.amp})`,
        amp: item.amp,
      }));
  }, [equipmentType, make, equipmentCatalog]);

  // Calculate recommended amp rating based on trigger equipment
  // Uses the new maxContinuousOutputAmps prop with 1.25× NEC safety factor
  const recommendedAmp = useMemo(() => {
    // Prefer the new calculated value if available
    if (maxContinuousOutputAmps && maxContinuousOutputAmps > 0) {
      // Apply 1.25× NEC safety factor
      return Math.ceil(maxContinuousOutputAmps * 1.25);
    }

    // Fallback to legacy calculateMinAmp logic
    if (!triggerEquipment || !calculateMinAmp) return null;

    let context = {};

    // Build context based on section
    if (section === 'utility' && triggerEquipment.inverter?.present) {
      // Use inverter max continuous output if available
      const inverterAmperage = 50; // Default placeholder
      context.inverterAmperage = inverterAmperage;
    }
    if (
      (section === 'battery1' || section === 'postSMS') &&
      triggerEquipment.battery1?.present
    ) {
      // Use battery max output if available
      context.batteryMaxChargeCurrent = 30; // Default placeholder
    }

    if (Object.keys(context).length > 0) {
      const result = calculateMinAmp(context);
      return result.recommendedAmpRating;
    }

    return null;
  }, [section, triggerEquipment, calculateMinAmp, maxContinuousOutputAmps]);

  // Handlers
  const handleTypeChange = (value) => {
    setEquipmentType(value);
    setMake('');
    setModel('');
    setAmpRating('');
  };

  const handleMakeChange = (value) => {
    setMake(value);
    setModel('');
    setAmpRating('');
  };

  const handleModelChange = (value) => {
    setModel(value);
    // Auto-fill amp rating from selected model
    const selectedModel = availableModels.find((m) => m.value === value);
    if (selectedModel) {
      setAmpRating(selectedModel.amp);
    }
  };

  const handleSave = () => {
    if (!equipmentType || !make || !model) return;

    onSave({
      equipmentType,
      make,
      model,
      ampRating,
      isNew,
      blockName,
    });
  };

  // Validation
  const isValid = equipmentType && make && model;

  // Block name options (filtered based on section)
  const blockNameOptions = useMemo(() => {
    // Simple block name options for each section type
    const blockNames = {
      utility: [
        { value: 'PRE COMBINE', label: 'Pre-Combine' },
        { value: 'POST COMBINE', label: 'Post-Combine' },
      ],
      battery1: [
        { value: 'ESS', label: 'Energy Storage System' },
      ],
      battery2: [
        { value: 'ESS', label: 'Energy Storage System' },
      ],
      backup: [
        { value: 'BACKUP LOAD SUB PANEL', label: 'Backup Load Sub Panel' },
      ],
      postSMS: [
        { value: 'POST SMS', label: 'Post-SMS' },
      ],
      combine: [],
    };
    return blockNames[section] || [];
  }, [section]);

  // Amp rating options
  const ampRatingOptions = useMemo(() => {
    return AMP_RATING_OPTIONS.map((amp) => ({
      value: amp,
      label: amp,
    }));
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingSlot ? 'Edit BOS Equipment' : 'Add BOS Equipment'}
      contained={true}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!isValid}>
            {existingSlot ? 'Update' : 'Add'} Equipment
          </Button>
        </>
      }
    >
      <div className={styles.modalContent}>
        {/* Equipment Type */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Equipment Type *</label>
          <FormSelect
            value={equipmentType}
            onChange={handleTypeChange}
            options={equipmentTypes}
            placeholder="Select equipment type..."
          />
        </div>

        {/* Make */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Make *</label>
          <FormSelect
            value={make}
            onChange={handleMakeChange}
            options={availableMakes}
            placeholder="Select make..."
            disabled={!equipmentType}
          />
        </div>

        {/* Model */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Model *</label>
          <FormSelect
            value={model}
            onChange={handleModelChange}
            options={availableModels}
            placeholder="Select model..."
            disabled={!make}
          />
        </div>

        {/* Amp Rating */}
        <div className={styles.formGroup}>
          <div className={styles.labelRow}>
            <label className={styles.label}>Amp Rating</label>
            {recommendedAmp && (
              <span className={styles.recommended}>
                Recommended: {recommendedAmp}A min
              </span>
            )}
          </div>
          <FormSelect
            value={ampRating}
            onChange={setAmpRating}
            options={ampRatingOptions}
            placeholder="Select amp rating..."
          />
        </div>

        {/* New/Existing Toggle with Max Output Info */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Installation Status</label>
          <div className={styles.toggleRow}>
            <Toggle
              isNew={isNew}
              onToggle={setIsNew}
              newLabel="New"
              existingLabel="Existing"
            />
            <span className={styles.toggleHint}>
              {isNew ? 'Equipment to be installed' : 'Equipment already installed'}
            </span>

            {/* Max Output Info - Right justified */}
            {maxContinuousOutputAmps > 0 && (
              <div className={styles.maxOutputInline}>
                <span className={styles.maxOutputLabel}>Max Output:</span>
                <span className={styles.maxOutputValue}>{maxContinuousOutputAmps}A</span>
                <span className={styles.maxOutputLabel}>→ Min:</span>
                <span className={styles.minRequiredValue}>{recommendedAmp}A</span>
              </div>
            )}
          </div>
        </div>

        {/* Block Name (not for combine section) */}
        {section !== 'combine' && blockNameOptions.length > 0 && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Block Classification</label>
            <FormSelect
              value={blockName}
              onChange={setBlockName}
              options={blockNameOptions}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BOSEquipmentModal;
