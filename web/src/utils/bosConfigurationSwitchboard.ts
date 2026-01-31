/**
 * BOS Configuration Switchboard
 * Orchestrates BOS detection across all systems and utilities
 */

import {
  EquipmentState,
  ConfigurationMatch,
  ProjectConfigurationResult,
  BOSEquipmentItem,
} from '../types/bosConfigurationTypes';
import {
  extractEquipmentState,
  hasSystemData,
  extractCombinePointData,
} from './bosEquipmentStateExtractor';

// APS Configuration Detectors
import {
  detectAPSPVOnlyStringInverter,
  detectAPSPVOnlyMicroinverter,
  detectAPSDCCoupledWithSMSAndBackup,
  detectAPSDCCoupledSMSNoBackup,
  detectAPSDCCoupledNoSMSBackup,
  detectAPSDCCoupledNoSMSNoBackup,
  detectAPSACCoupledStringSMSBackup,
  detectAPSACCoupledStringSMSNoBackup,
  detectAPSACCoupledStringNoSMSBackup,
  detectAPSACCoupledStringNoSMSNoBackup,
  detectAPSACCoupledMicroSMSBackup,
  detectAPSACCoupledMicroSMSNoBackup,
  detectAPSACCoupledMicroNoSMSBackup,
  detectAPSACCoupledMicroNoSMSNoBackup,
  detectAPSPVOnlyStringSMS,
  detectAPSPVOnlyStringNoSMS,
  detectAPSPVOnlyMicroSMS,
  detectAPSPVOnlyMicroNoSMS,
  detectTeslaPW3MultiSystemWholeHome,
  detectTeslaPW3SingleSystem,
  detectFranklinAPSWholeHome,
  detectFranklinAPSPartialHome,
  detectEnphaseAPSWholeHome,
  detectEnphaseAPSPartialHome,
} from './configurations/apsConfigurations';

// Generic Configuration Detectors
import {
  detectGenericPVOnly,
  detectGenericACCoupled,
  detectGenericBatteryOnly,
  detectSRPPVOnlyString,
  detectSRPPVOnlyMicro,
  detectTEPPVOnlyString,
  detectTEPPVOnlyMicro,
  detectTRICOPVOnlyString,
  detectTRICOPVOnlyMicro,
  detectXcelPVOnlyString,
  detectXcelPVOnlyMicro,
} from './configurations/genericConfigurations';

/**
 * Detect configuration for a single system
 * Priority: Utility-specific detectors first, then generic fallback
 * IMPORTANT: Now async to support Tesla PW3 multi-system detection
 */
export async function detectSystemConfiguration(
  equipment: EquipmentState,
  fetchSystemDetails?: (projectUuid?: string) => Promise<Record<string, any> | null>
): Promise<ConfigurationMatch | null> {
  // Try APS-specific detectors first
  const utilityLower = (equipment.utilityName || '').toLowerCase();
  const isAPS = utilityLower.includes('aps') ||
                utilityLower.includes('arizona public service');

  if (isAPS) {
    // ============================================
    // FRANKLIN APOWER DETECTORS (Equipment-Specific)
    // Priority 1-2 (HIGHEST) - Hyper-specific Franklin + Agate combination
    // Must run BEFORE all other detectors for best quality match
    // ============================================

    // Priority 1: Franklin aPower + Whole Home (most specific)
    const franklinWholeHome = detectFranklinAPSWholeHome(equipment);
    if (franklinWholeHome) return franklinWholeHome;

    // Priority 2: Franklin aPower + Partial Home
    const franklinPartialHome = detectFranklinAPSPartialHome(equipment);
    if (franklinPartialHome) return franklinPartialHome;

    // ============================================
    // ENPHASE DETECTORS (Equipment-Specific)
    // Priority 3-4 - Enphase IQ ecosystem (microinverter + IQ Battery)
    // Must run AFTER Franklin, BEFORE DC-coupled for best match quality
    // ============================================

    // Priority 3: Enphase + APS + Whole Home
    const enphaseWholeHome = detectEnphaseAPSWholeHome(equipment);
    if (enphaseWholeHome) return enphaseWholeHome;

    // Priority 4: Enphase + APS + Partial Home
    const enphasePartialHome = detectEnphaseAPSPartialHome(equipment);
    if (enphasePartialHome) return enphasePartialHome;

    // ============================================
    // DC-COUPLED DETECTORS
    // Must run before AC-Coupled to avoid false matches
    // ============================================

    // Priority 5: DC-Coupled + SMS + Backup (most specific)
    const apsDCCoupledSMSBackup = detectAPSDCCoupledWithSMSAndBackup(equipment);
    if (apsDCCoupledSMSBackup) return apsDCCoupledSMSBackup;

    // Priority 6: DC-Coupled + SMS + No Backup
    const apsDCCoupledSMSNoBackup = detectAPSDCCoupledSMSNoBackup(equipment);
    if (apsDCCoupledSMSNoBackup) return apsDCCoupledSMSNoBackup;

    // Priority 7: DC-Coupled + No SMS + Backup
    const apsDCCoupledNoSMSBackup = detectAPSDCCoupledNoSMSBackup(equipment);
    if (apsDCCoupledNoSMSBackup) return apsDCCoupledNoSMSBackup;

    // Priority 8: DC-Coupled + No SMS + No Backup
    const apsDCCoupledNoSMSNoBackup = detectAPSDCCoupledNoSMSNoBackup(equipment);
    if (apsDCCoupledNoSMSNoBackup) return apsDCCoupledNoSMSNoBackup;

    // ============================================
    // TESLA POWERWALL 3 DETECTORS (Equipment-Specific)
    // Must run BEFORE generic AC/DC-coupled detectors
    // Higher confidence matches than generic detectors
    // ============================================

    // Priority 9: Tesla PW3 Multi-System (runs on System 2)
    if (equipment.systemNumber === 2 && fetchSystemDetails) {
      const teslaPW3Multi = await detectTeslaPW3MultiSystemWholeHome(equipment, fetchSystemDetails);
      if (teslaPW3Multi) return teslaPW3Multi;
    }

    // Priority 10: Tesla PW3 Single-System (runs on System 1)
    if (equipment.systemNumber === 1) {
      const teslaPW3Single = detectTeslaPW3SingleSystem(equipment);
      if (teslaPW3Single) return teslaPW3Single;
    }

    // ============================================
    // AC-COUPLED DETECTORS - STRING INVERTER
    // Priority: SMS+Backup > SMS+NoBackup > NoSMS+Backup > NoSMS+NoBackup
    // ============================================

    // Priority 11: AC-Coupled String + SMS + Backup
    const apsACCoupledStringSMSBackup = detectAPSACCoupledStringSMSBackup(equipment);
    if (apsACCoupledStringSMSBackup) return apsACCoupledStringSMSBackup;

    // Priority 12: AC-Coupled String + SMS + No Backup
    const apsACCoupledStringSMSNoBackup = detectAPSACCoupledStringSMSNoBackup(equipment);
    if (apsACCoupledStringSMSNoBackup) return apsACCoupledStringSMSNoBackup;

    // Priority 13: AC-Coupled String + No SMS + Backup
    const apsACCoupledStringNoSMSBackup = detectAPSACCoupledStringNoSMSBackup(equipment);
    if (apsACCoupledStringNoSMSBackup) return apsACCoupledStringNoSMSBackup;

    // Priority 14: AC-Coupled String + No SMS + No Backup
    const apsACCoupledStringNoSMSNoBackup = detectAPSACCoupledStringNoSMSNoBackup(equipment);
    if (apsACCoupledStringNoSMSNoBackup) return apsACCoupledStringNoSMSNoBackup;

    // ============================================
    // AC-COUPLED DETECTORS - MICROINVERTER
    // Priority: SMS+Backup > SMS+NoBackup > NoSMS+Backup > NoSMS+NoBackup
    // ============================================

    // Priority 15: AC-Coupled Micro + SMS + Backup
    const apsACCoupledMicroSMSBackup = detectAPSACCoupledMicroSMSBackup(equipment);
    if (apsACCoupledMicroSMSBackup) return apsACCoupledMicroSMSBackup;

    // Priority 16: AC-Coupled Micro + SMS + No Backup
    const apsACCoupledMicroSMSNoBackup = detectAPSACCoupledMicroSMSNoBackup(equipment);
    if (apsACCoupledMicroSMSNoBackup) return apsACCoupledMicroSMSNoBackup;

    // Priority 17: AC-Coupled Micro + No SMS + Backup
    const apsACCoupledMicroNoSMSBackup = detectAPSACCoupledMicroNoSMSBackup(equipment);
    if (apsACCoupledMicroNoSMSBackup) return apsACCoupledMicroNoSMSBackup;

    // Priority 18: AC-Coupled Micro + No SMS + No Backup
    const apsACCoupledMicroNoSMSNoBackup = detectAPSACCoupledMicroNoSMSNoBackup(equipment);
    if (apsACCoupledMicroNoSMSNoBackup) return apsACCoupledMicroNoSMSNoBackup;

    // ============================================
    // PV-ONLY DETECTORS (Lowest Priority)
    // SMS-specific detectors run before generic ones
    // ============================================

    // Priority 19: PV-Only String + SMS
    const apsPVStringSMS = detectAPSPVOnlyStringSMS(equipment);
    if (apsPVStringSMS) return apsPVStringSMS;

    // Priority 20: PV-Only String + No SMS
    const apsPVStringNoSMS = detectAPSPVOnlyStringNoSMS(equipment);
    if (apsPVStringNoSMS) return apsPVStringNoSMS;

    // Priority 21: PV-Only Micro + SMS
    const apsPVMicroSMS = detectAPSPVOnlyMicroSMS(equipment);
    if (apsPVMicroSMS) return apsPVMicroSMS;

    // Priority 22: PV-Only Micro + No SMS
    const apsPVMicroNoSMS = detectAPSPVOnlyMicroNoSMS(equipment);
    if (apsPVMicroNoSMS) return apsPVMicroNoSMS;

    // Priority 23: Generic PV-Only String Inverter (fallback)
    const apsPVString = detectAPSPVOnlyStringInverter(equipment);
    if (apsPVString) return apsPVString;

    // Priority 24: Generic PV-Only Microinverter (fallback)
    const apsPVMicro = detectAPSPVOnlyMicroinverter(equipment);
    if (apsPVMicro) return apsPVMicro;
  }

  // ============================================
  // SRP DETECTORS (Salt River Project)
  // Priority 25-26 - After APS, before generic
  // ============================================

  // Check if utility is SRP (reuse utilityLower from above)
  const isSRP = utilityLower.includes('srp') ||
                utilityLower.includes('salt river') ||
                utilityLower.includes('salt river project');

  if (isSRP) {
    // Priority 25: SRP PV-Only String Inverter
    const srpPVString = detectSRPPVOnlyString(equipment);
    if (srpPVString) return srpPVString;

    // Priority 26: SRP PV-Only Microinverter
    const srpPVMicro = detectSRPPVOnlyMicro(equipment);
    if (srpPVMicro) return srpPVMicro;
  }

  // ============================================
  // TEP DETECTORS (Tucson Electric Power)
  // Priority 27-28 - After SRP, before generic
  // ============================================

  // Check if utility is TEP (reuse utilityLower from above)
  const isTEP = utilityLower.includes('tep') ||
                utilityLower.includes('tucson electric') ||
                utilityLower.includes('tucson electric power');

  if (isTEP) {
    // Priority 27: TEP PV-Only String Inverter
    const tepPVString = detectTEPPVOnlyString(equipment);
    if (tepPVString) return tepPVString;

    // Priority 28: TEP PV-Only Microinverter
    const tepPVMicro = detectTEPPVOnlyMicro(equipment);
    if (tepPVMicro) return tepPVMicro;
  }

  // ============================================
  // TRICO DETECTORS (TRICO Electric Cooperative)
  // Priority 29-30 - After TEP, before generic
  // ============================================

  // Check if utility is TRICO (reuse utilityLower from above)
  const isTRICO = utilityLower.includes('trico') ||
                  utilityLower.includes('trico electric');

  if (isTRICO) {
    // Priority 29: TRICO PV-Only String Inverter
    const tricoPVString = detectTRICOPVOnlyString(equipment);
    if (tricoPVString) return tricoPVString;

    // Priority 30: TRICO PV-Only Microinverter
    const tricoPVMicro = detectTRICOPVOnlyMicro(equipment);
    if (tricoPVMicro) return tricoPVMicro;
  }

  // ============================================
  // XCEL DETECTORS (Xcel Energy - Colorado)
  // Priority 31-32 - After TRICO, before generic
  // Uses POI-based equipment selection
  // ============================================

  // Check if utility is Xcel (reuse utilityLower from above)
  const isXcel = utilityLower.includes('xcel') ||
                 utilityLower.includes('xcel energy') ||
                 utilityLower.includes('public service company of colorado');

  if (isXcel) {
    // Priority 31: Xcel PV-Only String Inverter (POI-dependent disconnect)
    const xcelPVString = detectXcelPVOnlyString(equipment);
    if (xcelPVString) return xcelPVString;

    // Priority 32: Xcel PV-Only Microinverter (POI-dependent disconnect)
    const xcelPVMicro = detectXcelPVOnlyMicro(equipment);
    if (xcelPVMicro) return xcelPVMicro;
  }

  // Add more utility-specific detectors here as needed
  // Example:
  // if (equipment.utilityName && equipment.utilityName.toLowerCase().includes('sce')) {
  //   const scePVOnly = detectSCEPVOnly(equipment);
  //   if (scePVOnly) return scePVOnly;
  // }

  // Generic fallback detectors (lower confidence)
  // Generic AC-Coupled (highest priority fallback)
  const genericACCoupled = detectGenericACCoupled(equipment);
  if (genericACCoupled) return genericACCoupled;

  // Generic Battery-Only
  const genericBatteryOnly = detectGenericBatteryOnly(equipment);
  if (genericBatteryOnly) return genericBatteryOnly;

  // Generic PV-Only
  const genericPVOnly = detectGenericPVOnly(equipment);
  if (genericPVOnly) return genericPVOnly;

  return null; // No configuration matched
}

/**
 * Detect configurations for all systems in a project
 * Returns detected BOS for each system + combine point BOS
 * IMPORTANT: This function is now async to support battery API lookup
 * @param formData - systemDetails from database
 * @param utilityName - Utility name from project site (e.g., "APS", "SRP")
 */
export async function detectProjectConfiguration(
  formData: Record<string, any>,
  utilityName?: string
): Promise<ProjectConfigurationResult> {
  const result: ProjectConfigurationResult = {
    allBOSItems: [],
  };

  // Use passed utility name or try to get from formData
  const effectiveUtility = utilityName || formData.utility || '';

  console.log('[BOS Switchboard] Effective utility:', effectiveUtility);

  // Detect configurations for each system
  for (let systemNumber = 1; systemNumber <= 4; systemNumber++) {
    const sysNum = systemNumber as 1 | 2 | 3 | 4;

    // Skip systems without data
    if (!hasSystemData(formData, sysNum)) {
      continue;
    }

    // Extract equipment state - PASS UTILITY NAME (now async for battery API lookup)
    const equipmentState = await extractEquipmentState(formData, sysNum, effectiveUtility);

    console.log('[BOS Switchboard] System', sysNum, 'equipment state:', {
      utilityName: equipmentState.utilityName,
      hasSolarPanels: equipmentState.hasSolarPanels,
      hasInverter: equipmentState.hasInverter,
      hasBattery: equipmentState.hasBattery,
    });

    // Create fetchSystemDetails closure for this specific formData
    const fetchSystemDetailsForProject = async () => formData;

    // Detect configuration (now async for Tesla PW3 multi-system support)
    const match = await detectSystemConfiguration(equipmentState, fetchSystemDetailsForProject);

    console.log('[BOS Switchboard] System', sysNum, 'match:', match?.configName || 'none');

    if (match) {
      // Store system-specific match
      if (systemNumber === 1) result.system1 = match;
      if (systemNumber === 2) result.system2 = match;
      if (systemNumber === 3) result.system3 = match;
      if (systemNumber === 4) result.system4 = match;

      // Add BOS items to master list
      result.allBOSItems.push(...match.bosEquipment);
    }
  }

  // Detect combine point BOS for multi-system projects
  const combinePointBOS = detectCombinePointBOS(formData);
  if (combinePointBOS) {
    result.combinedConfig = combinePointBOS;
    result.allBOSItems.push(...combinePointBOS.bosEquipment);
  }

  return result;
}

/**
 * Detect BOS for combine point (multi-system projects)
 * Triggers when 2+ systems combine via Combiner Panel or Junction Box
 */
function detectCombinePointBOS(formData: Record<string, any>): ConfigurationMatch | null {
  const { hasCombinePoint, combineMethod, combineAmpRating } = extractCombinePointData(formData);

  if (!hasCombinePoint || combineAmpRating === 0) {
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  // Check existing combine point BOS
  const existingCombineBOS: number[] = [];
  for (let i = 1; i <= 3; i++) {
    if (formData[`post_combine_bos_type${i}_equipment_type`]) {
      existingCombineBOS.push(i);
    }
  }

  // Find next available slot
  let combineSlot: number | null = null;
  for (let i = 1; i <= 3; i++) {
    if (!existingCombineBOS.includes(i)) {
      combineSlot = i;
      break;
    }
  }

  if (!combineSlot) {
    return null; // All combine slots filled
  }

  // Add AC Disconnect at combine point
  bosEquipment.push({
    equipmentType: 'AC Disconnect',
    position: combineSlot,
    section: 'combine',
    systemNumber: 0, // Combine point is not system-specific
    minAmpRating: combineAmpRating,
    sizingCalculation: `Combined systems × 1.25 = ${combineAmpRating}A`,
    blockName: 'POST COMBINE',
    isNew: true,
  });

  return {
    configId: 'combine-point',
    configName: 'Multi-System Combine Point',
    description: `BOS for ${combineMethod} combining multiple systems`,
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * Get human-readable summary of detected configuration
 */
export function getConfigurationSummary(result: ProjectConfigurationResult): string {
  const lines: string[] = [];

  if (result.system1) {
    lines.push(`System 1: ${result.system1.configName} (${result.system1.bosEquipment.length} items)`);
  }
  if (result.system2) {
    lines.push(`System 2: ${result.system2.configName} (${result.system2.bosEquipment.length} items)`);
  }
  if (result.system3) {
    lines.push(`System 3: ${result.system3.configName} (${result.system3.bosEquipment.length} items)`);
  }
  if (result.system4) {
    lines.push(`System 4: ${result.system4.configName} (${result.system4.bosEquipment.length} items)`);
  }
  if (result.combinedConfig) {
    lines.push(`Combine Point: ${result.combinedConfig.configName} (${result.combinedConfig.bosEquipment.length} items)`);
  }

  if (lines.length === 0) {
    return 'No BOS configurations detected';
  }

  return lines.join('\n');
}
