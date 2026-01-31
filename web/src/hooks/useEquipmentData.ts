// src/hooks/useEquipmentData.ts

import { useState, useEffect, useCallback } from 'react';
import { getCachedManufacturers, getCachedModels, getCachedSpecs } from '../services/equipmentService';

// ============================================
// Type Definitions
// ============================================

interface UseEquipmentDataOptions {
  equipmentType: string;
  autoLoadManufacturers?: boolean;
}

interface UseEquipmentDataReturn {
  // Manufacturers
  manufacturers: string[];
  manufacturersLoading: boolean;
  manufacturersError: string | null;
  loadManufacturers: () => Promise<void>;

  // Models
  models: string[];
  modelsLoading: boolean;
  modelsError: string | null;
  loadModels: (manufacturer: string) => Promise<void>;

  // Specs
  specs: Record<string, any> | null;
  specsLoading: boolean;
  specsError: string | null;
  loadSpecs: (manufacturer: string, model: string) => Promise<void>;

  // State reset
  resetModels: () => void;
  resetSpecs: () => void;
  resetAll: () => void;
}

// ============================================
// Hook Implementation
// ============================================

/**
 * Hook for managing equipment dropdown data with smart caching
 *
 * Usage:
 * ```tsx
 * const {
 *   manufacturers,
 *   manufacturersLoading,
 *   loadManufacturers,
 *   models,
 *   loadModels,
 *   specs,
 *   loadSpecs,
 * } = useEquipmentData({ equipmentType: 'Solar Panel' });
 * ```
 */
export const useEquipmentData = (options: UseEquipmentDataOptions): UseEquipmentDataReturn => {
  const { equipmentType, autoLoadManufacturers = true } = options;

  // ============================================
  // Manufacturers State
  // ============================================
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [manufacturersLoading, setManufacturersLoading] = useState(false);
  const [manufacturersError, setManufacturersError] = useState<string | null>(null);

  // ============================================
  // Models State
  // ============================================
  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [currentManufacturer, setCurrentManufacturer] = useState<string | null>(null);

  // ============================================
  // Specs State
  // ============================================
  const [specs, setSpecs] = useState<Record<string, any> | null>(null);
  const [specsLoading, setSpecsLoading] = useState(false);
  const [specsError, setSpecsError] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<string | null>(null);

  // ============================================
  // Load Manufacturers
  // ============================================
  const loadManufacturers = useCallback(async () => {
    if (!equipmentType) {
      console.warn('[useEquipmentData] Cannot load manufacturers without equipmentType');
      return;
    }

    setManufacturersLoading(true);
    setManufacturersError(null);

    try {
      const data = await getCachedManufacturers(equipmentType);
      setManufacturers(data);
    } catch (err: any) {
      console.error('[useEquipmentData] Load manufacturers error:', err);
      setManufacturersError(err.message || 'Failed to load manufacturers');
      setManufacturers([]);
    } finally {
      setManufacturersLoading(false);
    }
  }, [equipmentType]);

  // ============================================
  // Load Models
  // ============================================
  const loadModels = useCallback(
    async (manufacturer: string) => {
      if (!equipmentType || !manufacturer) {
        console.warn('[useEquipmentData] Cannot load models without equipmentType and manufacturer');
        return;
      }

      // Skip if already loaded for this manufacturer
      if (currentManufacturer === manufacturer && models.length > 0) {
        console.debug(`[useEquipmentData] Models already loaded for ${manufacturer}`);
        return;
      }

      setModelsLoading(true);
      setModelsError(null);
      setCurrentManufacturer(manufacturer);

      try {
        const data = await getCachedModels(equipmentType, manufacturer);
        setModels(data);
      } catch (err: any) {
        console.error('[useEquipmentData] Load models error:', err);
        setModelsError(err.message || 'Failed to load models');
        setModels([]);
      } finally {
        setModelsLoading(false);
      }
    },
    [equipmentType, currentManufacturer, models.length]
  );

  // ============================================
  // Load Specs
  // ============================================
  const loadSpecs = useCallback(
    async (manufacturer: string, model: string) => {
      if (!equipmentType || !manufacturer || !model) {
        console.warn('[useEquipmentData] Cannot load specs without equipmentType, manufacturer, and model');
        return;
      }

      // Skip if already loaded for this model
      if (currentManufacturer === manufacturer && currentModel === model && specs) {
        console.debug(`[useEquipmentData] Specs already loaded for ${manufacturer} ${model}`);
        return;
      }

      setSpecsLoading(true);
      setSpecsError(null);
      setCurrentModel(model);

      try {
        const data = await getCachedSpecs(equipmentType, manufacturer, model);
        setSpecs(data);
      } catch (err: any) {
        console.error('[useEquipmentData] Load specs error:', err);
        setSpecsError(err.message || 'Failed to load specs');
        setSpecs(null);
      } finally {
        setSpecsLoading(false);
      }
    },
    [equipmentType, currentManufacturer, currentModel, specs]
  );

  // ============================================
  // Reset Functions
  // ============================================

  const resetModels = useCallback(() => {
    setModels([]);
    setModelsError(null);
    setCurrentManufacturer(null);
    console.debug('[useEquipmentData] Reset models');
  }, []);

  const resetSpecs = useCallback(() => {
    setSpecs(null);
    setSpecsError(null);
    setCurrentModel(null);
    console.debug('[useEquipmentData] Reset specs');
  }, []);

  const resetAll = useCallback(() => {
    setManufacturers([]);
    setManufacturersError(null);
    resetModels();
    resetSpecs();
    console.debug('[useEquipmentData] Reset all equipment data');
  }, [resetModels, resetSpecs]);

  // ============================================
  // Auto-load Manufacturers
  // ============================================
  useEffect(() => {
    if (autoLoadManufacturers && equipmentType) {
      loadManufacturers();
    }
  }, [autoLoadManufacturers, equipmentType, loadManufacturers]);

  // ============================================
  // Reset on Equipment Type Change
  // ============================================
  useEffect(() => {
    // Reset models and specs when equipment type changes
    resetModels();
    resetSpecs();
  }, [equipmentType, resetModels, resetSpecs]);

  // ============================================
  // Return Hook API
  // ============================================
  return {
    // Manufacturers
    manufacturers,
    manufacturersLoading,
    manufacturersError,
    loadManufacturers,

    // Models
    models,
    modelsLoading,
    modelsError,
    loadModels,

    // Specs
    specs,
    specsLoading,
    specsError,
    loadSpecs,

    // Reset
    resetModels,
    resetSpecs,
    resetAll,
  };
};

export default useEquipmentData;
