/**
 * AddEquipmentForm - Inline form for adding preferred equipment
 * Replaces the category list in the left panel when active
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { isModelOptional, getEquipmentTypeForCategory } from '../../constants/equipmentCategories';
import {
  getEquipmentManufacturers,
  getEquipmentModels,
} from '../../services/preferredEquipmentService';
import styles from './AddEquipmentForm.module.css';

const AddEquipmentForm = ({
  onClose,
  onAdd,
  categoryId,
  categoryLabel,
  isSolarPanel = false,
}) => {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [quantity, setQuantity] = useState('');
  const [wattageFilter, setWattageFilter] = useState('');
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load manufacturers when form mounts
  useEffect(() => {
    if (categoryId) {
      loadManufacturers();
    }
  }, [categoryId]);

  const loadManufacturers = async () => {
    setLoadingMakes(true);
    try {
      const equipmentType = getEquipmentTypeForCategory(categoryId);
      const data = await getEquipmentManufacturers(equipmentType, wattageFilter || undefined);
      const makeOptions = (data || []).map(m => ({
        label: m.manufacturer || m.manufacturerName || m.name || m,
        value: m.manufacturer || m.manufacturerName || m.name || m,
      }));
      setMakes(makeOptions);
    } catch (error) {
      console.error('[AddEquipmentForm] Error loading manufacturers:', error);
    } finally {
      setLoadingMakes(false);
    }
  };

  const loadModels = async (selectedMake) => {
    if (!selectedMake) {
      setModels([]);
      return;
    }
    setLoadingModels(true);
    try {
      const equipmentType = getEquipmentTypeForCategory(categoryId);
      const data = await getEquipmentModels(equipmentType, selectedMake, wattageFilter || undefined);
      const modelOptions = (data || []).map(m => ({
        label: m.model_number || m.model || m.name || m,
        value: m.model_number || m.model || m.name || m,
        wattage: m.nameplate_pmax || m.wattage || null,
      }));
      setModels(modelOptions);
    } catch (error) {
      console.error('[AddEquipmentForm] Error loading models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleMakeChange = (value) => {
    setMake(value);
    setModel('');
    loadModels(value);
  };

  const handleWattageFilterChange = (value) => {
    setWattageFilter(value);
    setMake('');
    setModel('');
    setModels([]);
    // Reload manufacturers with new filter after brief delay
    setTimeout(() => loadManufacturers(), 100);
  };

  const handleSubmit = async () => {
    if (!make) return;

    setSaving(true);
    try {
      await onAdd({
        categoryId,
        make,
        model,
        quantity: quantity ? parseInt(quantity, 10) : 0,
      });
      onClose(); // Return to category list after successful add
    } catch (error) {
      console.error('[AddEquipmentForm] Error adding equipment:', error);
    } finally {
      setSaving(false);
    }
  };

  // Check if model is optional for this category
  const modelOptional = isModelOptional(categoryId);

  return (
    <div className={styles.container}>
      {/* Header with back button */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onClose}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
      </div>

      {/* Title */}
      <h3 className={styles.title}>Add {categoryLabel}</h3>

      {/* Form Fields */}
      <div className={styles.formContent}>
        {/* Wattage Filter - Solar Panels Only */}
        {isSolarPanel && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Filter by Wattage</label>
            <input
              type="number"
              className={styles.input}
              value={wattageFilter}
              onChange={(e) => handleWattageFilterChange(e.target.value)}
              placeholder="e.g., 400"
            />
          </div>
        )}

        {/* Manufacturer */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Manufacturer *</label>
          <select
            className={styles.select}
            value={make}
            onChange={(e) => handleMakeChange(e.target.value)}
            disabled={loadingMakes}
          >
            <option value="">
              {loadingMakes ? 'Loading...' : 'Select Manufacturer'}
            </option>
            {makes.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Model {modelOptional ? '(optional)' : '*'}
          </label>
          <select
            className={styles.select}
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!make || loadingModels}
          >
            <option value="">
              {loadingModels ? 'Loading...' : make ? 'Select Model' : 'Select Manufacturer First'}
            </option>
            {models.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Qty on Hand</label>
          <input
            type="number"
            className={styles.input}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            min="0"
          />
          <span className={styles.hint}>Quantity tracking coming soon</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button
          className={styles.addButton}
          onClick={handleSubmit}
          disabled={saving || !make || (!modelOptional && !model)}
        >
          {saving ? 'Adding...' : `+ Add ${categoryLabel.replace(/s$/, '')}`}
        </button>
        <button className={styles.cancelButton} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddEquipmentForm;
