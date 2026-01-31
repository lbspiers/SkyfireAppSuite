// src/hooks/useEquipmentForm.ts
// Combined hook for equipment selection with auto-save

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSystemDetails } from './useSystemDetails';
import { useEquipmentData } from './useEquipmentData';

// ============================================
// Types
// ============================================

export type SystemNumber = 1 | 2 | 3 | 4;

export type EquipmentCategory =
  | 'solar_panel'
  | 'micro_inverter'
  | 'optimizer'
  | 'string_combiner'
  | 'battery_1'
  | 'battery_2'
  | 'ess'
  | 'sms'
  | 'backup_subpanel';

interface EquipmentFieldMapping {
  equipmentType: string;           // API equipment type (e.g., "Solar Panel")
  makeField: string;               // DB field for make (without prefix)
  modelField: string;              // DB field for model (without prefix)
  qtyField?: string;               // DB field for quantity (optional)
  existingField?: string;          // DB field for existing flag (optional)
  idField?: string;                // DB field for equipment UUID (optional)
  additionalFields?: string[];     // Other related fields to clear on reset
}

// Field mappings for each equipment category
// Note: Field names do NOT include system prefix - that's added dynamically
const EQUIPMENT_FIELD_MAP: Record<EquipmentCategory, EquipmentFieldMapping> = {
  solar_panel: {
    equipmentType: 'Solar Panel',
    makeField: 'solar_panel_make',
    modelField: 'solar_panel_model',
    qtyField: 'solar_panel_qty',
    existingField: 'solar_panel_existing',
    idField: 'solarpanel_id',
  },
  micro_inverter: {
    equipmentType: 'Microinverter',
    makeField: 'micro_inverter_make',
    modelField: 'micro_inverter_model',
    qtyField: 'micro_inverter_qty',
    existingField: 'micro_inverter_existing',
    idField: 'micro_inverter_id',
  },
  optimizer: {
    equipmentType: 'Optimizer',
    makeField: 'optimizer_make',
    modelField: 'optimizer_model',
    qtyField: 'optimizer_qty',
    existingField: 'optimizer_existing',
    idField: 'optimizer_id',
  },
  string_combiner: {
    equipmentType: 'String Combiner Panel',
    makeField: 'combiner_panel_make',
    modelField: 'combiner_panel_model',
    existingField: 'combiner_existing',
    idField: 'combinerpanel_id',
    additionalFields: ['combinerpanel_bus_rating', 'combinerpanel_main_breaker_rating'],
  },
  battery_1: {
    equipmentType: 'Battery Storage',
    makeField: 'battery_1_make',
    modelField: 'battery_1_model',
    qtyField: 'battery_1_qty',
    existingField: 'battery1_existing',
    idField: 'battery1_id',
    additionalFields: ['battery1_tie_in_location'],
  },
  battery_2: {
    equipmentType: 'Battery Storage',
    makeField: 'battery_2_make',
    modelField: 'battery_2_model',
    qtyField: 'battery_2_qty',
    existingField: 'battery2_existing',
    idField: 'battery2_id',
    additionalFields: ['battery2_tie_in_location'],
  },
  ess: {
    equipmentType: 'ESS Combiner',
    makeField: 'ess_make',
    modelField: 'ess_model',
    existingField: 'ess_existing',
    idField: 'ess_id',
    additionalFields: ['ess_main_breaker_rating', 'ess_upstream_breaker_rating', 'ess_upstream_breaker_location'],
  },
  sms: {
    equipmentType: 'Storage Management System',
    makeField: 'sms_make',
    modelField: 'sms_model',
    existingField: 'sms_existing',
    idField: 'sms_id',
    additionalFields: [
      'sms_breaker_rating',
      'sms_rsd_enabled',
      'sms_backup_load_sub_panel_breaker_rating',
      'sms_pv_breaker_rating_override',
      'sms_ess_breaker_rating_override',
      'sms_tie_in_breaker_rating_override',
    ],
  },
  backup_subpanel: {
    equipmentType: 'Load Center',
    makeField: 'backup_load_sub_panel_make',      // Note: bls1_ prefix handled separately
    modelField: 'backup_load_sub_panel_model',
    existingField: 'backuploader_existing',
    idField: 'backupload_sub_panel_id',
    additionalFields: [
      'backuploader_bus_bar_rating',
      'backuploader_main_breaker_rating',
      'backuploader_upstream_breaker_rating',
    ],
  },
};

// Special prefix handling for non-system equipment
const SPECIAL_PREFIXES: Partial<Record<EquipmentCategory, string>> = {
  backup_subpanel: 'bls1_',
};

interface UseEquipmentFormOptions {
  projectUuid: string;
  category: EquipmentCategory;
  systemNumber?: SystemNumber;      // Default: 1, ignored for backup_subpanel
  autoLoadManufacturers?: boolean;  // Default: true
  autoSave?: boolean;               // Default: true
}

interface UseEquipmentFormReturn {
  // Current values
  make: string;
  model: string;
  quantity: number | null;
  isExisting: boolean;
  equipmentId: string | null;

  // Dropdown data
  manufacturers: string[];
  models: string[];

  // Loading states
  loading: boolean;
  loadingManufacturers: boolean;
  loadingModels: boolean;
  saving: boolean;

  // Error state
  error: string | null;

  // Actions
  setMake: (make: string) => Promise<void>;
  setModel: (model: string) => Promise<void>;
  setQuantity: (qty: number | null) => Promise<void>;
  setIsExisting: (existing: boolean) => Promise<void>;
  clearEquipment: () => Promise<void>;
  refresh: () => Promise<void>;

  // Utilities
  getModelData: (modelName: string) => string | undefined;
  fieldMapping: EquipmentFieldMapping;
}

/**
 * Combined hook for equipment form management
 * Handles manufacturer/model dropdowns, field persistence, and auto-save
 */
export function useEquipmentForm(options: UseEquipmentFormOptions): UseEquipmentFormReturn {
  const {
    projectUuid,
    category,
    systemNumber = 1,
    autoLoadManufacturers = true,
    autoSave = true,
  } = options;

  const fieldMapping = EQUIPMENT_FIELD_MAP[category];

  // Determine field prefix
  const prefix = SPECIAL_PREFIXES[category] || `sys${systemNumber}_`;

  // Build full field names
  const makeFieldName = `${prefix}${fieldMapping.makeField}`;
  const modelFieldName = `${prefix}${fieldMapping.modelField}`;
  const qtyFieldName = fieldMapping.qtyField ? `${prefix}${fieldMapping.qtyField}` : null;
  const existingFieldName = fieldMapping.existingField ? `${prefix}${fieldMapping.existingField}` : null;
  const idFieldName = fieldMapping.idField ? `${prefix}${fieldMapping.idField}` : null;

  // System details hook for persistence
  const {
    data: systemData,
    loading: systemLoading,
    saving,
    error: systemError,
    updateField,
    updateFields,
    clearFields,
    refresh: refreshSystem,
  } = useSystemDetails({ projectUuid });

  // Equipment data hook for dropdowns
  const {
    manufacturers,
    manufacturersLoading,
    models,
    modelsLoading,
    loadManufacturers,
    loadModels,
  } = useEquipmentData({
    equipmentType: fieldMapping.equipmentType,
    autoLoadManufacturers,
  });

  // Local state for current values (derived from systemData)
  const make = useMemo(() => systemData?.[makeFieldName] || '', [systemData, makeFieldName]);
  const model = useMemo(() => systemData?.[modelFieldName] || '', [systemData, modelFieldName]);
  const quantity = useMemo(() => {
    if (!qtyFieldName) return null;
    const val = systemData?.[qtyFieldName];
    return val !== null && val !== undefined ? Number(val) : null;
  }, [systemData, qtyFieldName]);
  const isExisting = useMemo(() => {
    if (!existingFieldName) return false;
    return !!systemData?.[existingFieldName];
  }, [systemData, existingFieldName]);
  const equipmentId = useMemo(() => {
    if (!idFieldName) return null;
    return systemData?.[idFieldName] || null;
  }, [systemData, idFieldName]);

  // Load models when make changes (and is non-empty)
  useEffect(() => {
    if (make) {
      loadModels(make);
    }
  }, [make, loadModels]);

  // Set make (clears model and dependent fields)
  const setMake = useCallback(async (newMake: string) => {
    if (!autoSave) return;

    const fieldsToUpdate: Record<string, any> = {
      [makeFieldName]: newMake || null,
      [modelFieldName]: null, // Clear model when make changes
    };

    // Clear ID field
    if (idFieldName) {
      fieldsToUpdate[idFieldName] = null;
    }

    // Clear additional fields
    if (fieldMapping.additionalFields) {
      fieldMapping.additionalFields.forEach(field => {
        fieldsToUpdate[`${prefix}${field}`] = null;
      });
    }

    await updateFields(fieldsToUpdate);
  }, [autoSave, makeFieldName, modelFieldName, idFieldName, prefix, fieldMapping.additionalFields, updateFields]);

  // Set model
  const setModel = useCallback(async (newModel: string) => {
    if (!autoSave) return;

    const fieldsToUpdate: Record<string, any> = {
      [modelFieldName]: newModel || null,
    };

    // Note: ID field would need to be set separately if available from model data
    // Currently models are just strings, not objects with IDs

    await updateFields(fieldsToUpdate);
  }, [autoSave, modelFieldName, updateFields]);

  // Set quantity
  const setQuantity = useCallback(async (qty: number | null) => {
    if (!autoSave || !qtyFieldName) return;
    await updateField(qtyFieldName, qty);
  }, [autoSave, qtyFieldName, updateField]);

  // Set existing flag
  const setIsExisting = useCallback(async (existing: boolean) => {
    if (!autoSave || !existingFieldName) return;
    await updateField(existingFieldName, existing);
  }, [autoSave, existingFieldName, updateField]);

  // Clear all equipment fields
  const clearEquipment = useCallback(async () => {
    const fieldsToClear: string[] = [makeFieldName, modelFieldName];

    if (qtyFieldName) fieldsToClear.push(qtyFieldName);
    if (existingFieldName) fieldsToClear.push(existingFieldName);
    if (idFieldName) fieldsToClear.push(idFieldName);

    if (fieldMapping.additionalFields) {
      fieldMapping.additionalFields.forEach(field => {
        fieldsToClear.push(`${prefix}${field}`);
      });
    }

    await clearFields(fieldsToClear);
  }, [makeFieldName, modelFieldName, qtyFieldName, existingFieldName, idFieldName, prefix, fieldMapping.additionalFields, clearFields]);

  // Refresh data
  const refresh = useCallback(async () => {
    await refreshSystem();
    await loadManufacturers();
    if (make) {
      await loadModels(make);
    }
  }, [refreshSystem, loadManufacturers, loadModels, make]);

  // Get model data by name (currently just returns the model string if found)
  const getModelData = useCallback((modelName: string): string | undefined => {
    return models.find(m => m === modelName);
  }, [models]);

  return {
    // Current values
    make,
    model,
    quantity,
    isExisting,
    equipmentId,

    // Dropdown data
    manufacturers,
    models,

    // Loading states
    loading: systemLoading,
    loadingManufacturers: manufacturersLoading,
    loadingModels: modelsLoading,
    saving,

    // Error
    error: systemError,

    // Actions
    setMake,
    setModel,
    setQuantity,
    setIsExisting,
    clearEquipment,
    refresh,

    // Utilities
    getModelData,
    fieldMapping,
  };
}

export default useEquipmentForm;
