/**
 * Inverter Type Detection Utility
 * Detects hybrid (DC-coupled) vs grid-following (AC-coupled) inverters
 * Based on mobile app InverterTypeDetection.ts
 */

/**
 * Hybrid inverter patterns by brand
 * Hybrid inverters = DC-coupled battery systems
 */
const HYBRID_INVERTER_PATTERNS = [
  // SolarEdge
  /storedge/i,
  /energy hub/i,
  /SE\d+H/i,  // SE7600H-US, SE10000H, etc.

  // Tesla
  /powerwall/i,

  // Enphase
  /IQ8/i,  // IQ8 series microinverters

  // Generac
  /PWRcell/i,

  // SMA
  /sunny boy storage/i,
  /SBS/i,

  // Fronius
  /symo hybrid/i,
  /primo hybrid/i,
  /GEN24/i,

  // Growatt
  /SPH/i,  // SPH series

  // Solis
  /RHI/i,  // RHI series

  // Schneider Electric
  /conext/i,

  // Delta
  /M\d+HV/i,  // M series hybrid

  // Sol-Ark
  /sol-ark/i,

  // Generic catch-all
  /hybrid/i,
  /storage/i,
  /battery.*inverter/i,
  /inverter.*battery/i,
];

/**
 * Check if inverter model indicates a hybrid (DC-coupled) inverter
 * @param inverterModel - Inverter model string
 * @returns true if hybrid inverter detected
 */
export function isHybridInverter(inverterModel: string): boolean {
  if (!inverterModel) return false;

  const modelLower = inverterModel.toLowerCase().trim();

  return HYBRID_INVERTER_PATTERNS.some(pattern => pattern.test(modelLower));
}

/**
 * Determine coupling type based on inverter model
 * Hybrid inverters = DC-coupled, all others = AC-coupled
 * @param inverterModel - Inverter model string
 * @returns 'DC' for hybrid inverters, 'AC' for grid-following inverters
 */
export function getCouplingTypeFromInverter(inverterModel: string): 'AC' | 'DC' {
  return isHybridInverter(inverterModel) ? 'DC' : 'AC';
}

/**
 * Determine final coupling type using priority logic:
 * 1. Use battery API couple_type if available (most accurate)
 * 2. Fall back to inverter type detection if battery data missing
 *
 * @param inverterModel - Inverter model string
 * @param batteryCoupleType - Battery couple_type from API (optional)
 * @param batteryQuantity - Number of batteries (0 = no battery)
 * @returns Final coupling type determination
 */
export function determineCouplingType(
  inverterModel: string,
  batteryCoupleType?: 'AC' | 'DC' | '',
  batteryQuantity: number = 0
): 'AC' | 'DC' {
  // No battery = use inverter inference
  if (batteryQuantity === 0) {
    return getCouplingTypeFromInverter(inverterModel);
  }

  // Has battery - check API data first
  if (batteryCoupleType && (batteryCoupleType === 'AC' || batteryCoupleType === 'DC')) {
    return batteryCoupleType; // ✅ Trust battery API data
  }

  // Battery API missing/invalid - fall back to inverter detection
  return getCouplingTypeFromInverter(inverterModel); // ⚠️ Fallback to inverter
}
