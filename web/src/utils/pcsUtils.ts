/**
 * PCS (Power Control System) Utility Functions
 * Pure utility functions for PCS calculations (no hooks, no state)
 */

import { PCS_AMPS_OPTIONS } from './constants';
import { isPowerWall3 } from './powerWallDetection';

/**
 * Calculate allowable backfeed
 * Formula: (busRating × 1.2) - mainBreaker
 * @param busBarRating - Bus bar rating in amps
 * @param mainBreakerRating - Main breaker rating (can be "MLO" or number string)
 * @returns Allowable backfeed in amps, or null if calculation not possible
 */
export const calculateAllowableBackfeed = (
  busBarRating: number | null | undefined,
  mainBreakerRating: string | null | undefined
): number | null => {
  if (!busBarRating || busBarRating <= 0) {
    console.debug('[PCS] Cannot calculate allowable backfeed: missing or invalid bus bar rating');
    return null;
  }

  if (!mainBreakerRating) {
    console.debug('[PCS] Cannot calculate allowable backfeed: missing main breaker rating');
    return null;
  }

  // MLO (Main Lug Only) = 0 for calculation purposes
  const breakerValue = mainBreakerRating.toLowerCase() === 'mlo' ? 0 : parseFloat(mainBreakerRating);

  if (isNaN(breakerValue)) {
    console.warn('[PCS] Invalid main breaker rating:', mainBreakerRating);
    return null;
  }

  // Formula: (busBarRating × 1.2) - mainBreakerRating
  const calculated = (busBarRating * 1.2) - breakerValue;

  // Return 0 if negative, otherwise round to integer
  const result = Math.max(0, Math.round(calculated));

  console.debug('[PCS] Allowable backfeed calculated:', {
    busBarRating,
    mainBreakerRating,
    breakerValue,
    calculated,
    result
  });

  return result;
};

/**
 * Format backfeed formula for display
 * Returns string like "(200 × 1.2) - 100 = 140 Amps"
 * @param busBarRating - Bus bar rating in amps
 * @param mainBreakerRating - Main breaker rating (can be "MLO" or number string)
 * @returns Formatted formula string
 */
export const formatBackfeedFormula = (
  busBarRating: number,
  mainBreakerRating: string
): string => {
  const breakerValue = mainBreakerRating.toLowerCase() === 'mlo' ? 0 : parseFloat(mainBreakerRating);
  const calculated = (busBarRating * 1.2) - breakerValue;
  const result = Math.max(0, Math.round(calculated));

  const breakerDisplay = mainBreakerRating.toLowerCase() === 'mlo' ? '0 (MLO)' : breakerValue;

  return `(${busBarRating} × 1.2) - ${breakerDisplay} = ${result} Amps`;
};

/**
 * Calculate max continuous output
 * For microinverters: amps × qty
 * For string inverters: amps as-is
 * @param maxContOutputAmps - Max continuous output amps from inverter specs
 * @param inverterType - Type of inverter ('microinverter' or 'inverter')
 * @param microinverterQty - Quantity of microinverters (required if type is 'microinverter')
 * @returns Max continuous output in amps, or null if calculation not possible
 */
export const calculateMaxContinuousOutput = (
  maxContOutputAmps: number | null | undefined,
  inverterType: 'microinverter' | 'inverter' | null | undefined,
  microinverterQty: number | null | undefined
): number | null => {
  if (!maxContOutputAmps || maxContOutputAmps <= 0) {
    console.debug('[PCS] Cannot calculate max continuous output: missing or invalid amps');
    return null;
  }

  if (!inverterType) {
    console.debug('[PCS] Cannot calculate max continuous output: missing inverter type');
    return null;
  }

  if (inverterType === 'microinverter') {
    if (!microinverterQty || microinverterQty <= 0) {
      console.debug('[PCS] Cannot calculate max continuous output: missing or invalid microinverter quantity');
      return null;
    }
    const result = maxContOutputAmps * microinverterQty;
    console.debug('[PCS] Max continuous output (microinverter):', {
      maxContOutputAmps,
      microinverterQty,
      result
    });
    return result;
  }

  // String inverter - use amps as-is
  console.debug('[PCS] Max continuous output (string inverter):', maxContOutputAmps);
  return maxContOutputAmps;
};

/**
 * Determine if battery is present
 * Battery is detected if:
 * - Battery 1: Has (make OR model) AND quantity > 0
 * - Battery 2: Has (make OR model) AND quantity > 0
 * - PowerWall 3: Inverter model contains "PowerWall 3" pattern
 */
export const detectBattery = (params: {
  batteryMake1?: string | null;
  batteryModel1?: string | null;
  batteryQty1?: number | null;
  batteryMake2?: string | null;
  batteryModel2?: string | null;
  batteryQty2?: number | null;
  inverterModel?: string | null;
}): boolean => {
  const {
    batteryMake1,
    batteryModel1,
    batteryQty1,
    batteryMake2,
    batteryModel2,
    batteryQty2,
    inverterModel
  } = params;

  // Check Battery 1
  const hasBattery1 = !!(
    (batteryMake1 || batteryModel1) &&
    batteryQty1 &&
    batteryQty1 > 0
  );

  // Check Battery 2
  const hasBattery2 = !!(
    (batteryMake2 || batteryModel2) &&
    batteryQty2 &&
    batteryQty2 > 0
  );

  // Check PowerWall 3 (integrated battery)
  const hasPowerWall3 = isPowerWall3(inverterModel || '');

  const result = hasBattery1 || hasBattery2 || hasPowerWall3;

  console.debug('[PCS] Battery detection:', {
    hasBattery1,
    hasBattery2,
    hasPowerWall3,
    result
  });

  return result;
};

/**
 * Get filtered PCS amps options
 * Filters PCS_AMPS_OPTIONS to show only values ≤ allowableBackfeed
 * @param allowableBackfeed - Maximum allowable backfeed in amps
 * @returns Filtered array of PCS options
 */
export const getFilteredPcsOptions = (
  allowableBackfeed: number | null
): Array<{ label: string; value: string }> => {
  if (!allowableBackfeed || allowableBackfeed <= 0) {
    console.debug('[PCS] No valid allowable backfeed, returning empty PCS options');
    return [];
  }

  const filtered = PCS_AMPS_OPTIONS.filter(
    option => parseInt(option.value, 10) <= allowableBackfeed
  );

  console.debug('[PCS] Filtered PCS options:', {
    allowableBackfeed,
    totalOptions: PCS_AMPS_OPTIONS.length,
    filteredOptions: filtered.length
  });

  return filtered;
};

/**
 * Get recommended PCS amps value
 * Returns the allowable backfeed rounded down to nearest integer
 * @param allowableBackfeed - Maximum allowable backfeed in amps
 * @returns Recommended PCS amps as string, or null if not calculable
 */
export const getRecommendedPcsAmps = (
  allowableBackfeed: number | null
): string | null => {
  if (!allowableBackfeed || allowableBackfeed <= 0) {
    console.debug('[PCS] No valid allowable backfeed, cannot recommend PCS amps');
    return null;
  }

  const recommended = Math.floor(allowableBackfeed);

  console.debug('[PCS] Recommended PCS amps:', {
    allowableBackfeed,
    recommended
  });

  return String(recommended);
};
