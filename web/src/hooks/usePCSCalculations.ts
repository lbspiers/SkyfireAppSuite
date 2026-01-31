/**
 * usePCSCalculations Hook
 * Custom hook that handles all PCS (Power Control System) calculation logic for a single system
 */

import { useMemo } from 'react';
import {
  calculateAllowableBackfeed,
  formatBackfeedFormula,
  calculateMaxContinuousOutput,
  detectBattery,
  getFilteredPcsOptions,
  getRecommendedPcsAmps,
} from '../utils/pcsUtils';

export interface UsePCSCalculationsProps {
  systemNumber: 1 | 2 | 3 | 4;

  // Battery data (from system details)
  // NOTE: These match the keys returned from ElectricalForm's batteryData object
  batteryMake1?: string | null;  // Maps to sys1_battery_1_make
  batteryModel1?: string | null; // Maps to sys1_battery_1_model
  batteryQty1?: number | null;   // Maps to sys1_battery_1_qty
  batteryMake2?: string | null;  // Maps to sys1_battery_2_make
  batteryModel2?: string | null; // Maps to sys1_battery_2_model
  batteryQty2?: number | null;   // Maps to sys1_battery_2_qty

  // Inverter data
  inverterMake?: string | null;
  inverterModel?: string | null;
  inverterType?: 'microinverter' | 'inverter' | null;
  microinverterQty?: number | null;
  maxContOutputAmps?: number | null; // From inverter specs

  // Electrical panel data
  busBarRating?: number | null;
  mainBreakerRating?: string | null; // Can be "MLO" or number

  // Current PCS state
  currentPcsAmps?: string | null;

  // Combined system info (optional)
  isCombinedSystem?: boolean;
  combinedSystemMaxOutput?: number | null;
}

export interface UsePCSCalculationsReturn {
  // Calculated values
  hasBattery: boolean;
  maxContinuousOutputAmps: number | null;
  maxContinuousOutput125: number | null; // × 1.25
  allowableBackfeed: number | null;

  // Trigger states
  shouldAutoTriggerPCS: boolean;
  canManualTriggerPCS: boolean;
  violates120Rule: boolean; // For non-battery systems

  // Filtered options
  filteredPcsAmpsOptions: Array<{ label: string; value: string }>;
  recommendedPcsAmps: string | null;

  // Display helpers
  backfeedFormula: string; // e.g., "(200 × 1.2) - 100 = 140"
}

/**
 * Custom hook for PCS calculations
 * Handles all Power Control System calculation logic for a single system
 */
export const usePCSCalculations = (props: UsePCSCalculationsProps): UsePCSCalculationsReturn => {
  const {
    systemNumber,
    batteryMake1,
    batteryModel1,
    batteryQty1,
    batteryMake2,
    batteryModel2,
    batteryQty2,
    inverterMake,
    inverterModel,
    inverterType,
    microinverterQty,
    maxContOutputAmps,
    busBarRating,
    mainBreakerRating,
    currentPcsAmps,
    isCombinedSystem = false,
    combinedSystemMaxOutput,
  } = props;

  console.debug(`[PCS] usePCSCalculations - System ${systemNumber}:`, {
    batteryMake1,
    batteryModel1,
    batteryQty1,
    batteryMake2,
    batteryModel2,
    batteryQty2,
    inverterModel,
    inverterType,
    microinverterQty,
    maxContOutputAmps,
    busBarRating,
    mainBreakerRating,
    isCombinedSystem,
    combinedSystemMaxOutput,
  });

  // ============================================
  // BATTERY DETECTION
  // ============================================

  const hasBattery = useMemo(() => {
    return detectBattery({
      batteryMake1,
      batteryModel1,
      batteryQty1,
      batteryMake2,
      batteryModel2,
      batteryQty2,
      inverterModel,
    });
  }, [batteryMake1, batteryModel1, batteryQty1, batteryMake2, batteryModel2, batteryQty2, inverterModel]);

  // ============================================
  // ALLOWABLE BACKFEED CALCULATION
  // ============================================

  const allowableBackfeed = useMemo(() => {
    return calculateAllowableBackfeed(busBarRating, mainBreakerRating);
  }, [busBarRating, mainBreakerRating]);

  // ============================================
  // BACKFEED FORMULA FOR DISPLAY
  // ============================================

  const backfeedFormula = useMemo(() => {
    if (!busBarRating || !mainBreakerRating) {
      return 'N/A';
    }
    return formatBackfeedFormula(busBarRating, mainBreakerRating);
  }, [busBarRating, mainBreakerRating]);

  // ============================================
  // MAX CONTINUOUS OUTPUT CALCULATION
  // ============================================

  const maxContinuousOutputAmps = useMemo(() => {
    // For combined systems, use the combined max output
    if (isCombinedSystem && combinedSystemMaxOutput !== null && combinedSystemMaxOutput !== undefined) {
      console.debug(`[PCS] Using combined system max output: ${combinedSystemMaxOutput}`);
      return combinedSystemMaxOutput;
    }

    // Calculate for this system
    return calculateMaxContinuousOutput(maxContOutputAmps, inverterType, microinverterQty);
  }, [isCombinedSystem, combinedSystemMaxOutput, maxContOutputAmps, inverterType, microinverterQty]);

  // ============================================
  // MAX CONTINUOUS OUTPUT × 1.25 (NEC 125% RULE)
  // ============================================

  const maxContinuousOutput125 = useMemo(() => {
    if (maxContinuousOutputAmps === null) return null;
    return maxContinuousOutputAmps * 1.25;
  }, [maxContinuousOutputAmps]);

  // ============================================
  // AUTO-TRIGGER PCS CONDITION
  // ============================================

  const shouldAutoTriggerPCS = useMemo(() => {
    // PCS auto-triggers when:
    // 1. System has a battery
    // 2. Max continuous output exceeds allowable backfeed
    const shouldTrigger =
      hasBattery &&
      maxContinuousOutputAmps !== null &&
      allowableBackfeed !== null &&
      maxContinuousOutputAmps > allowableBackfeed;

    console.debug(`[PCS] Auto-trigger check:`, {
      hasBattery,
      maxContinuousOutputAmps,
      allowableBackfeed,
      shouldTrigger,
    });

    return shouldTrigger;
  }, [hasBattery, maxContinuousOutputAmps, allowableBackfeed]);

  // ============================================
  // MANUAL TRIGGER AVAILABILITY
  // ============================================

  const canManualTriggerPCS = useMemo(() => {
    // Manual PCS is available when:
    // 1. System has a battery
    // 2. PCS doesn't auto-trigger
    // 3. Allowable backfeed is valid and > 0
    const canManual =
      hasBattery &&
      !shouldAutoTriggerPCS &&
      allowableBackfeed !== null &&
      allowableBackfeed > 0;

    console.debug(`[PCS] Manual trigger availability:`, {
      hasBattery,
      shouldAutoTriggerPCS,
      allowableBackfeed,
      canManual,
    });

    return canManual;
  }, [hasBattery, shouldAutoTriggerPCS, allowableBackfeed]);

  // ============================================
  // 120% RULE VIOLATION (NON-BATTERY SYSTEMS)
  // ============================================

  const violates120Rule = useMemo(() => {
    // 120% Rule violation occurs when:
    // 1. System does NOT have a battery
    // 2. Max continuous output × 1.25 exceeds allowable backfeed
    const violates =
      !hasBattery &&
      maxContinuousOutputAmps !== null &&
      allowableBackfeed !== null &&
      maxContinuousOutput125 !== null &&
      maxContinuousOutput125 > allowableBackfeed;

    console.debug(`[PCS] 120% Rule violation check:`, {
      hasBattery,
      maxContinuousOutputAmps,
      maxContinuousOutput125,
      allowableBackfeed,
      violates,
    });

    return violates;
  }, [hasBattery, maxContinuousOutputAmps, maxContinuousOutput125, allowableBackfeed]);

  // ============================================
  // FILTERED PCS OPTIONS
  // ============================================

  const filteredPcsAmpsOptions = useMemo(() => {
    return getFilteredPcsOptions(allowableBackfeed);
  }, [allowableBackfeed]);

  // ============================================
  // RECOMMENDED PCS AMPS
  // ============================================

  const recommendedPcsAmps = useMemo(() => {
    return getRecommendedPcsAmps(allowableBackfeed);
  }, [allowableBackfeed]);

  // ============================================
  // RETURN VALUES
  // ============================================

  return {
    // Calculated values
    hasBattery,
    maxContinuousOutputAmps,
    maxContinuousOutput125,
    allowableBackfeed,

    // Trigger states
    shouldAutoTriggerPCS,
    canManualTriggerPCS,
    violates120Rule,

    // Filtered options
    filteredPcsAmpsOptions,
    recommendedPcsAmps,

    // Display helpers
    backfeedFormula,
  };
};

export default usePCSCalculations;
