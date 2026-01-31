// src/services/equipmentService.ts

import { getEquipmentManufacturers, getEquipmentModels, getEquipmentSpecs } from './projectAPI';

// ============================================
// Type Definitions
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface ManufacturerCache {
  [equipmentType: string]: CacheEntry<string[]>;
}

interface ModelCache {
  [key: string]: CacheEntry<string[]>; // key = `${equipmentType}::${manufacturer}`
}

interface SpecsCache {
  [key: string]: CacheEntry<Record<string, any> | null>; // key = `${type}::${make}::${model}`
}

// ============================================
// In-Memory Cache
// ============================================

class EquipmentCache {
  private manufacturers: ManufacturerCache = {};
  private models: ModelCache = {};
  private specs: SpecsCache = {};
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if a cache entry is still valid
   */
  private isValid<T>(entry: CacheEntry<T> | undefined): boolean {
    if (!entry) return false;
    return Date.now() - entry.timestamp < this.CACHE_TTL;
  }

  /**
   * Get manufacturers from cache or fetch
   */
  async getManufacturers(equipmentType: string): Promise<string[]> {
    const cached = this.manufacturers[equipmentType];

    if (this.isValid(cached)) {
      console.debug(`[equipmentService] Using cached manufacturers for ${equipmentType}`);
      return cached.data;
    }

    console.debug(`[equipmentService] Fetching manufacturers for ${equipmentType}`);
    const data = await getEquipmentManufacturers(equipmentType);

    this.manufacturers[equipmentType] = {
      data,
      timestamp: Date.now(),
    };

    return data;
  }

  /**
   * Get models from cache or fetch
   */
  async getModels(equipmentType: string, manufacturer: string): Promise<string[]> {
    const key = `${equipmentType}::${manufacturer}`;
    const cached = this.models[key];

    if (this.isValid(cached)) {
      console.debug(`[equipmentService] Using cached models for ${equipmentType} / ${manufacturer}`);
      return cached.data;
    }

    console.debug(`[equipmentService] Fetching models for ${equipmentType} / ${manufacturer}`);
    const data = await getEquipmentModels(equipmentType, manufacturer);

    this.models[key] = {
      data,
      timestamp: Date.now(),
    };

    return data;
  }

  /**
   * Get specs from cache or fetch
   */
  async getSpecs(type: string, make: string, model: string): Promise<Record<string, any> | null> {
    const key = `${type}::${make}::${model}`;
    const cached = this.specs[key];

    if (this.isValid(cached)) {
      console.debug(`[equipmentService] Using cached specs for ${type} / ${make} / ${model}`);
      return cached.data;
    }

    console.debug(`[equipmentService] Fetching specs for ${type} / ${make} / ${model}`);
    const data = await getEquipmentSpecs(type, make, model);

    this.specs[key] = {
      data,
      timestamp: Date.now(),
    };

    return data;
  }

  /**
   * Invalidate manufacturers cache for a specific type
   */
  invalidateManufacturers(equipmentType: string): void {
    delete this.manufacturers[equipmentType];
    console.debug(`[equipmentService] Invalidated manufacturers cache for ${equipmentType}`);
  }

  /**
   * Invalidate models cache for a specific type and manufacturer
   */
  invalidateModels(equipmentType: string, manufacturer: string): void {
    const key = `${equipmentType}::${manufacturer}`;
    delete this.models[key];
    console.debug(`[equipmentService] Invalidated models cache for ${equipmentType} / ${manufacturer}`);
  }

  /**
   * Invalidate specs cache for specific equipment
   */
  invalidateSpecs(type: string, make: string, model: string): void {
    const key = `${type}::${make}::${model}`;
    delete this.specs[key];
    console.debug(`[equipmentService] Invalidated specs cache for ${type} / ${make} / ${model}`);
  }

  /**
   * Clear all manufacturers cache
   */
  clearManufacturers(): void {
    this.manufacturers = {};
    console.debug('[equipmentService] Cleared all manufacturers cache');
  }

  /**
   * Clear all models cache
   */
  clearModels(): void {
    this.models = {};
    console.debug('[equipmentService] Cleared all models cache');
  }

  /**
   * Clear all specs cache
   */
  clearSpecs(): void {
    this.specs = {};
    console.debug('[equipmentService] Cleared all specs cache');
  }

  /**
   * Clear entire cache
   */
  clearAll(): void {
    this.manufacturers = {};
    this.models = {};
    this.specs = {};
    console.debug('[equipmentService] Cleared entire equipment cache');
  }
}

// ============================================
// Singleton Instance
// ============================================

const equipmentCache = new EquipmentCache();

// ============================================
// Deduplication Layer
// ============================================

/**
 * Track in-flight requests to prevent duplicate API calls
 */
class RequestDeduplicator {
  private inFlight: Map<string, Promise<any>> = new Map();

  /**
   * Execute a request with deduplication
   * If the same request is already in-flight, return the existing promise
   */
  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if request is already in-flight
    if (this.inFlight.has(key)) {
      console.debug(`[equipmentService] Deduplicating request: ${key}`);
      return this.inFlight.get(key) as Promise<T>;
    }

    // Execute the request
    const promise = requestFn();
    this.inFlight.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      // Clean up after request completes
      this.inFlight.delete(key);
    }
  }

  /**
   * Clear all in-flight requests
   */
  clear(): void {
    this.inFlight.clear();
  }
}

const requestDeduplicator = new RequestDeduplicator();

// ============================================
// Public API with Caching and Deduplication
// ============================================

/**
 * Get manufacturers for an equipment type (cached + deduplicated)
 */
export const getCachedManufacturers = async (equipmentType: string): Promise<string[]> => {
  const key = `manufacturers::${equipmentType}`;
  return requestDeduplicator.deduplicate(key, () => equipmentCache.getManufacturers(equipmentType));
};

/**
 * Get models for an equipment type and manufacturer (cached + deduplicated)
 */
export const getCachedModels = async (equipmentType: string, manufacturer: string): Promise<string[]> => {
  const key = `models::${equipmentType}::${manufacturer}`;
  return requestDeduplicator.deduplicate(key, () => equipmentCache.getModels(equipmentType, manufacturer));
};

/**
 * Get specs for specific equipment (cached + deduplicated)
 */
export const getCachedSpecs = async (
  type: string,
  make: string,
  model: string
): Promise<Record<string, any> | null> => {
  const key = `specs::${type}::${make}::${model}`;
  return requestDeduplicator.deduplicate(key, () => equipmentCache.getSpecs(type, make, model));
};

// ============================================
// Cache Management Functions
// ============================================

/**
 * Invalidate manufacturers cache for a specific type
 */
export const invalidateManufacturersCache = (equipmentType: string): void => {
  equipmentCache.invalidateManufacturers(equipmentType);
};

/**
 * Invalidate models cache for a specific type and manufacturer
 */
export const invalidateModelsCache = (equipmentType: string, manufacturer: string): void => {
  equipmentCache.invalidateModels(equipmentType, manufacturer);
};

/**
 * Invalidate specs cache for specific equipment
 */
export const invalidateSpecsCache = (type: string, make: string, model: string): void => {
  equipmentCache.invalidateSpecs(type, make, model);
};

/**
 * Clear all manufacturers cache
 */
export const clearManufacturersCache = (): void => {
  equipmentCache.clearManufacturers();
};

/**
 * Clear all models cache
 */
export const clearModelsCache = (): void => {
  equipmentCache.clearModels();
};

/**
 * Clear all specs cache
 */
export const clearSpecsCache = (): void => {
  equipmentCache.clearSpecs();
};

/**
 * Clear entire equipment cache
 */
export const clearEquipmentCache = (): void => {
  equipmentCache.clearAll();
  requestDeduplicator.clear();
};

// ============================================
// Preloading Functions
// ============================================

/**
 * Preload manufacturers for common equipment types
 */
export const preloadCommonManufacturers = async (): Promise<void> => {
  const commonTypes = [
    'Solar Panel',
    'Inverter',
    'Battery',
    'Racking',
    'String Combiner Panel',
    'Meter',
    'Wire',
  ];

  console.debug('[equipmentService] Preloading manufacturers for common equipment types');

  await Promise.allSettled(commonTypes.map((type) => getCachedManufacturers(type)));

  console.debug('[equipmentService] Preload complete');
};

/**
 * Preload models for a specific equipment type and manufacturer
 */
export const preloadModels = async (equipmentType: string, manufacturer: string): Promise<void> => {
  console.debug(`[equipmentService] Preloading models for ${equipmentType} / ${manufacturer}`);
  await getCachedModels(equipmentType, manufacturer);
};

// ============================================
// Batch Loading Functions
// ============================================

/**
 * Batch load manufacturers for multiple equipment types
 */
export const batchLoadManufacturers = async (equipmentTypes: string[]): Promise<Map<string, string[]>> => {
  console.debug(`[equipmentService] Batch loading manufacturers for ${equipmentTypes.length} types`);

  const results = await Promise.allSettled(
    equipmentTypes.map(async (type) => ({
      type,
      manufacturers: await getCachedManufacturers(type),
    }))
  );

  const map = new Map<string, string[]>();

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      map.set(result.value.type, result.value.manufacturers);
    }
  });

  return map;
};

/**
 * Batch load models for multiple type/manufacturer combinations
 */
export const batchLoadModels = async (
  combinations: Array<{ equipmentType: string; manufacturer: string }>
): Promise<Map<string, string[]>> => {
  console.debug(`[equipmentService] Batch loading models for ${combinations.length} combinations`);

  const results = await Promise.allSettled(
    combinations.map(async ({ equipmentType, manufacturer }) => ({
      key: `${equipmentType}::${manufacturer}`,
      models: await getCachedModels(equipmentType, manufacturer),
    }))
  );

  const map = new Map<string, string[]>();

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      map.set(result.value.key, result.value.models);
    }
  });

  return map;
};

// ============================================
// Export Cache Instance (for testing/debugging)
// ============================================

export const _cache = equipmentCache;
export const _deduplicator = requestDeduplicator;
