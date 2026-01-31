// InverterTypeDetection.ts
// Service for detecting inverter types from equipment specifications

import { getEquipmentSpecs } from '../api/project.service';

export type InverterType = 'grid-following' | 'grid-forming-following' | 'hybrid' | null;

/**
 * Known hybrid inverter manufacturers and model patterns
 * These are used for quick detection before API lookup
 */
const KNOWN_HYBRID_PATTERNS = [
  // SolarEdge Hybrid Models
  /storedge/i,
  /energy hub/i,
  /SE\d+H/i, // e.g., SE7600H-US

  // Tesla/SolarEdge Hybrid
  /powerwall/i,

  // Enphase Hybrid
  /IQ8/i, // IQ8 series microinverters have hybrid capabilities

  // Generac Hybrid
  /PWRcell/i,

  // SMA Hybrid
  /sunny boy storage/i,
  /SBS/i,

  // Fronius Hybrid
  /symo hybrid/i,
  /primo hybrid/i,
  /GEN24/i,

  // Growatt Hybrid
  /SPH/i, // Growatt SPH series

  // Solis Hybrid
  /RHI/i, // Solis RHI series

  // Schneider Electric Hybrid
  /conext/i,

  // Delta Hybrid
  /M\d+HV/i, // Delta M series hybrid

  // Generic patterns
  /hybrid/i,
  /storage/i,
  /battery.*inverter/i,
  /inverter.*battery/i,
];

/**
 * Known grid-forming/following inverter patterns
 * These support both grid-tied and islanding modes
 */
const KNOWN_GRID_FORMING_PATTERNS = [
  // SMA
  /sunny island/i,

  // Outback Power
  /radian/i,
  /skybox/i,

  // Schneider Electric
  /XW\+/i,

  // Victron
  /quattro/i,
  /multiplus/i,

  // Generac
  /pwrcell inverter/i,

  // Sol-Ark
  /sol-ark/i,

  // Generic patterns
  /grid.*forming/i,
  /multimode/i,
  /off.*grid/i,
  /islanding/i,
];

/**
 * Detect inverter type from make and model
 * Uses pattern matching and optionally API lookup for specifications
 */
export class InverterTypeDetector {
  /**
   * Quick pattern-based detection
   * Fast check before API call
   */
  static detectFromPattern(make: string, model: string): InverterType {
    if (!make || !model) return null;

    const combinedString = `${make} ${model}`;

    // Check hybrid patterns first (most specific)
    for (const pattern of KNOWN_HYBRID_PATTERNS) {
      if (pattern.test(combinedString)) {
        console.log(`[InverterDetection] Pattern match: ${combinedString} → hybrid (${pattern})`);
        return 'hybrid';
      }
    }

    // Check grid-forming patterns
    for (const pattern of KNOWN_GRID_FORMING_PATTERNS) {
      if (pattern.test(combinedString)) {
        console.log(`[InverterDetection] Pattern match: ${combinedString} → grid-forming-following (${pattern})`);
        return 'grid-forming-following';
      }
    }

    // Default to grid-following for standard inverters
    console.log(`[InverterDetection] No pattern match: ${combinedString} → grid-following (default)`);
    return 'grid-following';
  }

  /**
   * Detect inverter type with API specification lookup
   * More accurate but requires API call
   */
  static async detectFromSpecs(make: string, model: string): Promise<InverterType> {
    if (!make || !model) return null;

    // First try pattern matching for quick result
    const patternResult = this.detectFromPattern(make, model);

    try {
      // Query equipment specifications from API
      const response = await getEquipmentSpecs('Inverter', make, model);

      if (response?.status === 200 && response?.data?.success) {
        const specs = response.data.data;

        // Check for hybrid indicators in specifications
        const isHybrid = this.isHybridFromSpecs(specs);
        if (isHybrid) {
          console.log(`[InverterDetection] API specs: ${make} ${model} → hybrid`);
          return 'hybrid';
        }

        // Check for grid-forming indicators
        const isGridForming = this.isGridFormingFromSpecs(specs);
        if (isGridForming) {
          console.log(`[InverterDetection] API specs: ${make} ${model} → grid-forming-following`);
          return 'grid-forming-following';
        }

        // Default to grid-following
        console.log(`[InverterDetection] API specs: ${make} ${model} → grid-following`);
        return 'grid-following';
      }

      // API call failed or no data - fall back to pattern result
      console.log(`[InverterDetection] API lookup failed, using pattern result: ${patternResult}`);
      return patternResult;

    } catch (error) {
      console.error('[InverterDetection] Error fetching equipment specs:', error);
      // Fall back to pattern-based detection
      return patternResult;
    }
  }

  /**
   * Check if specifications indicate hybrid inverter
   */
  private static isHybridFromSpecs(specs: any): boolean {
    if (!specs) return false;

    // Check common spec fields that indicate hybrid functionality
    const indicators = [
      specs.type?.toLowerCase().includes('hybrid'),
      specs.description?.toLowerCase().includes('hybrid'),
      specs.features?.toLowerCase().includes('battery'),
      specs.features?.toLowerCase().includes('storage'),
      specs.capabilities?.includes('DC Coupling'),
      specs.capabilities?.includes('Battery Integration'),
      specs.hasBuiltInBattery === true,
      specs.hasDCCoupling === true,
    ];

    return indicators.some(indicator => indicator === true);
  }

  /**
   * Check if specifications indicate grid-forming capability
   */
  private static isGridFormingFromSpecs(specs: any): boolean {
    if (!specs) return false;

    // Check for grid-forming/islanding indicators
    const indicators = [
      specs.capabilities?.includes('Grid Forming'),
      specs.capabilities?.includes('Islanding'),
      specs.capabilities?.includes('Backup Power'),
      specs.capabilities?.includes('Off-Grid'),
      specs.canIsland === true,
      specs.hasBackupMode === true,
      specs.supportsOffGrid === true,
    ];

    return indicators.some(indicator => indicator === true);
  }

  /**
   * Detect inverter type synchronously (pattern-based only)
   * Use this for immediate UI updates
   */
  static detectSync(make: string, model: string): InverterType {
    return this.detectFromPattern(make, model);
  }

  /**
   * Detect inverter type asynchronously (with API lookup)
   * Use this for accurate configuration evaluation
   */
  static async detectAsync(make: string, model: string): Promise<InverterType> {
    return await this.detectFromSpecs(make, model);
  }

  /**
   * Batch detect multiple inverters
   * Useful for system combination scenarios
   */
  static async detectBatch(
    inverters: Array<{ make: string; model: string }>
  ): Promise<InverterType[]> {
    const promises = inverters.map(inv => this.detectAsync(inv.make, inv.model));
    return await Promise.all(promises);
  }

  /**
   * Determine coupling type from inverter type
   */
  static getCouplingType(inverterType: InverterType): 'AC' | 'DC' {
    return inverterType === 'hybrid' ? 'DC' : 'AC';
  }

  /**
   * Check if inverter supports backup power
   */
  static supportsBackup(inverterType: InverterType): boolean {
    return inverterType === 'grid-forming-following' || inverterType === 'hybrid';
  }

  /**
   * Get user-friendly description of inverter type
   */
  static getDescription(inverterType: InverterType): string {
    const descriptions: Record<NonNullable<InverterType>, string> = {
      'hybrid': 'Hybrid inverter with DC coupling and battery integration',
      'grid-forming-following': 'Grid-forming/following inverter with backup capability',
      'grid-following': 'Standard grid-following inverter',
    };

    return inverterType ? descriptions[inverterType] : 'Unknown inverter type';
  }

  /**
   * Validate inverter compatibility with configuration
   */
  static isCompatibleWithConfig(
    inverterType: InverterType,
    configId: string
  ): boolean {
    // C-series requires hybrid inverter
    if (configId.startsWith('C-')) {
      return inverterType === 'hybrid';
    }

    // A-1 and B-3, B-1 require grid-forming capability for backup
    if (['A-1', 'B-1', 'B-3'].includes(configId)) {
      return inverterType === 'grid-forming-following' || inverterType === 'hybrid';
    }

    // A-2, B-2, B-4, B-5 work with grid-following
    return true; // Any inverter type works
  }
}

// Export convenience functions
export const detectInverterType = InverterTypeDetector.detectSync;
export const detectInverterTypeAsync = InverterTypeDetector.detectAsync;
export const getInverterCouplingType = InverterTypeDetector.getCouplingType;
export const checkInverterBackupSupport = InverterTypeDetector.supportsBackup;
