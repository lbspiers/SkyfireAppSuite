// src/utils/equipmentCacheManager.ts

/**
 * Centralized equipment cache manager
 * Manages cache flags for equipment data fetching across all sections
 */

interface CacheFlags {
  // Inverter section
  inverterMakes: boolean;
  inverterModels: boolean;

  // Optimizer section
  optimizerMakes: boolean;
  optimizerModels: boolean;

  // Solar Panel section
  solarPanelMakes: boolean;
  solarPanelModels: boolean;

  // Microinverter section
  microinverterMakes: boolean;
  microinverterModels: boolean;

  // String Combiner Panel section
  combinerMakes: boolean;
  combinerModels: boolean;

  // Energy Storage section
  energyStorageMakes: boolean;
  energyStorageModels: boolean;

  // Battery sections
  batteryType1Makes: boolean;
  batteryType1Models: boolean;
  batteryType2Makes: boolean;
  batteryType2Models: boolean;
}

class EquipmentCacheManager {
  private cacheFlags: CacheFlags = {
    inverterMakes: false,
    inverterModels: false,
    optimizerMakes: false,
    optimizerModels: false,
    solarPanelMakes: false,
    solarPanelModels: false,
    microinverterMakes: false,
    microinverterModels: false,
    combinerMakes: false,
    combinerModels: false,
    energyStorageMakes: false,
    energyStorageModels: false,
    batteryType1Makes: false,
    batteryType1Models: false,
    batteryType2Makes: false,
    batteryType2Models: false,
  };

  // Get cache flag status
  getCacheFlag(key: keyof CacheFlags): boolean {
    return this.cacheFlags[key];
  }

  // Set cache flag
  setCacheFlag(key: keyof CacheFlags, value: boolean): void {
    this.cacheFlags[key] = value;
  }

  // Clear all cache flags (call on login/logout)
  clearAllCache(): void {
    console.log('🔧 [EQUIPMENT CACHE] Clearing all equipment cache flags');
    this.cacheFlags = {
      inverterMakes: false,
      inverterModels: false,
      optimizerMakes: false,
      optimizerModels: false,
      solarPanelMakes: false,
      solarPanelModels: false,
      microinverterMakes: false,
      microinverterModels: false,
      combinerMakes: false,
      combinerModels: false,
      energyStorageMakes: false,
      energyStorageModels: false,
      batteryType1Makes: false,
      batteryType1Models: false,
      batteryType2Makes: false,
      batteryType2Models: false,
    };
  }

  // Clear cache for specific equipment type
  clearCacheForType(type: string): void {
    const typeKey = type.toLowerCase();
    console.log(`🔧 [EQUIPMENT CACHE] Clearing cache for ${type}`);

    if (typeKey.includes('inverter')) {
      this.cacheFlags.inverterMakes = false;
      this.cacheFlags.inverterModels = false;
    }
    if (typeKey.includes('optimizer')) {
      this.cacheFlags.optimizerMakes = false;
      this.cacheFlags.optimizerModels = false;
    }
    if (typeKey.includes('solar') || typeKey.includes('panel')) {
      this.cacheFlags.solarPanelMakes = false;
      this.cacheFlags.solarPanelModels = false;
    }
    if (typeKey.includes('microinverter')) {
      this.cacheFlags.microinverterMakes = false;
      this.cacheFlags.microinverterModels = false;
    }
    if (typeKey.includes('combiner')) {
      this.cacheFlags.combinerMakes = false;
      this.cacheFlags.combinerModels = false;
    }
    if (typeKey.includes('energy') || typeKey.includes('storage')) {
      this.cacheFlags.energyStorageMakes = false;
      this.cacheFlags.energyStorageModels = false;
    }
    if (typeKey.includes('battery')) {
      this.cacheFlags.batteryType1Makes = false;
      this.cacheFlags.batteryType1Models = false;
      this.cacheFlags.batteryType2Makes = false;
      this.cacheFlags.batteryType2Models = false;
    }
  }
}

// Export singleton instance
export const equipmentCacheManager = new EquipmentCacheManager();