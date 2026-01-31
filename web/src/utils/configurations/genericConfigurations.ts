/**
 * Generic BOS Configuration Detectors
 * Fallback detectors for utilities without specific configurations
 */

import {
  EquipmentState,
  ConfigurationMatch,
  BOSEquipmentItem,
} from '../../types/bosConfigurationTypes';
import { getNextAvailableSlot } from '../bosEquipmentStateExtractor';

/**
 * Check if utility is SRP (Salt River Project)
 */
function isSRPUtility(utilityName: string | null): boolean {
  if (!utilityName) return false;
  const name = utilityName.toLowerCase();
  return name.includes('srp') ||
         name.includes('salt river') ||
         name.includes('salt river project');
}

/**
 * Check if utility is TEP (Tucson Electric Power)
 */
function isTEPUtility(utilityName: string | null): boolean {
  if (!utilityName) return false;
  const name = utilityName.toLowerCase();
  return name.includes('tep') ||
         name.includes('tucson electric') ||
         name.includes('tucson electric power');
}

/**
 * Check if utility is TRICO (TRICO Electric Cooperative)
 */
function isTRICOUtility(utilityName: string | null): boolean {
  if (!utilityName) return false;
  const name = utilityName.toLowerCase();
  return name.includes('trico') ||
         name.includes('trico electric');
}

/**
 * Check if utility is Xcel Energy (Colorado)
 */
function isXcelUtility(utilityName: string | null): boolean {
  if (!utilityName) return false;
  const name = utilityName.toLowerCase();
  return name.includes('xcel') ||
         name.includes('xcel energy') ||
         name.includes('public service company of colorado');
}

/**
 * Find standard amp rating from minimum calculated amperage
 * Standard ratings: 15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200, 225, 250, etc.
 */
function findStandardAmpRating(minAmps: number): number {
  const standardRatings = [15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200, 225, 250, 300, 350, 400];
  for (const rating of standardRatings) {
    if (rating >= minAmps) {
      return rating;
    }
  }
  return Math.ceil(minAmps / 50) * 50; // Round up to nearest 50 for very large systems
}

/**
 * Generic PV-Only Configuration
 * Triggers: Solar + Inverter (any type), No Battery
 * Uses generic equipment names for broad compatibility
 */
export function detectGenericPVOnly(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    hasSolarPanels,
    inverterMaxContOutput,
    batteryQuantity,
    existingBOS,
    systemNumber,
  } = equipment;

  // Check for PV-Only pattern (no battery)
  if (!hasSolarPanels || batteryQuantity > 0) {
    return null;
  }

  // Check if inverter data is available for amp calculations
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  // NEC 1.25× calculation
  const minAmpRating = Math.ceil(inverterMaxContOutput * 1.25);
  const sizingCalculation = `${inverterMaxContOutput}A × 1.25 = ${minAmpRating}A`;

  // Utility Section BOS (Pre-Combine)
  // Type 1: PV Meter (generic name - will be translated by catalog lookup)
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'PV Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Type 2: AC Disconnect
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'AC Disconnect',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null; // All slots already filled
  }

  return {
    configId: 'generic-pv-only',
    configName: 'Generic PV-Only System',
    description: 'Solar panels with inverter, no battery storage',
    confidence: 'medium',
    bosEquipment,
  };
}

/**
 * Generic AC-Coupled Configuration
 * Triggers: Solar + Battery + Inverter (any type)
 * Uses generic equipment names for broad compatibility
 */
export function detectGenericACCoupled(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    hasSolarPanels,
    inverterMaxContOutput,
    batteryQuantity,
    hasBackupPanel,
    hasSMS,
    existingBOS,
    systemNumber,
  } = equipment;

  // Check for AC-Coupled pattern (Solar + Battery)
  if (!hasSolarPanels || batteryQuantity === 0) {
    return null;
  }

  // Check if inverter data is available for amp calculations
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  // NEC 1.25× calculation
  const minAmpRating = Math.ceil(inverterMaxContOutput * 1.25);
  const sizingCalculation = `${inverterMaxContOutput}A × 1.25 = ${minAmpRating}A`;

  // Utility Section BOS (Pre-Combine)
  // Type 1: PV Meter (generic name)
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'PV Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Type 2: AC Disconnect
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'AC Disconnect',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Battery Section BOS (ESS - Energy Storage System)
  // Type 1: AC Disconnect for Battery
  const battery1Slot1 = getNextAvailableSlot(existingBOS.battery1, 'battery1');
  if (battery1Slot1) {
    bosEquipment.push({
      equipmentType: 'AC Disconnect',
      position: battery1Slot1,
      section: 'battery1',
      systemNumber,
      minAmpRating,
      sizingCalculation,
      blockName: 'ESS',
      isNew: true,
    });
  }

  // Backup Panel BOS (if backup panel exists)
  if (hasBackupPanel) {
    const backupSlot1 = getNextAvailableSlot(existingBOS.backup, 'backup');
    if (backupSlot1) {
      bosEquipment.push({
        equipmentType: 'AC Disconnect',
        position: backupSlot1,
        section: 'backup',
        systemNumber,
        minAmpRating,
        sizingCalculation,
        blockName: 'BACKUP LOAD SUB PANEL',
      isNew: true,
      });
    }
  }

  // Post-SMS BOS (if SMS exists)
  if (hasSMS) {
    const postSMSSlot1 = getNextAvailableSlot(existingBOS.postSMS, 'postSMS');
    if (postSMSSlot1) {
      bosEquipment.push({
        equipmentType: 'AC Disconnect',
        position: postSMSSlot1,
        section: 'postSMS',
        systemNumber,
        minAmpRating,
        sizingCalculation,
        blockName: 'POST SMS',
      isNew: true,
      });
    }
  }

  if (bosEquipment.length === 0) {
    return null; // All slots already filled
  }

  return {
    configId: 'generic-ac-coupled',
    configName: 'Generic AC-Coupled System',
    description: 'Solar panels with battery storage (AC-Coupled)',
    confidence: 'medium',
    bosEquipment,
  };
}

/**
 * Generic Battery-Only Configuration
 * Triggers: Battery, No Solar
 */
export function detectGenericBatteryOnly(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    hasSolarPanels,
    inverterMaxContOutput,
    batteryQuantity,
    hasBackupPanel,
    hasSMS,
    existingBOS,
    systemNumber,
  } = equipment;

  // Check for Battery-Only pattern (no solar)
  if (hasSolarPanels || batteryQuantity === 0) {
    return null;
  }

  // Check if inverter data is available for amp calculations
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  // NEC 1.25× calculation
  const minAmpRating = Math.ceil(inverterMaxContOutput * 1.25);
  const sizingCalculation = `${inverterMaxContOutput}A × 1.25 = ${minAmpRating}A`;

  // Battery Section BOS (ESS - Energy Storage System)
  // Type 1: AC Disconnect for Battery
  const battery1Slot1 = getNextAvailableSlot(existingBOS.battery1, 'battery1');
  if (battery1Slot1) {
    bosEquipment.push({
      equipmentType: 'AC Disconnect',
      position: battery1Slot1,
      section: 'battery1',
      systemNumber,
      minAmpRating,
      sizingCalculation,
      blockName: 'ESS',
      isNew: true,
    });
  }

  // Backup Panel BOS (if backup panel exists)
  if (hasBackupPanel) {
    const backupSlot1 = getNextAvailableSlot(existingBOS.backup, 'backup');
    if (backupSlot1) {
      bosEquipment.push({
        equipmentType: 'AC Disconnect',
        position: backupSlot1,
        section: 'backup',
        systemNumber,
        minAmpRating,
        sizingCalculation,
        blockName: 'BACKUP LOAD SUB PANEL',
      isNew: true,
      });
    }
  }

  // Post-SMS BOS (if SMS exists)
  if (hasSMS) {
    const postSMSSlot1 = getNextAvailableSlot(existingBOS.postSMS, 'postSMS');
    if (postSMSSlot1) {
      bosEquipment.push({
        equipmentType: 'AC Disconnect',
        position: postSMSSlot1,
        section: 'postSMS',
        systemNumber,
        minAmpRating,
        sizingCalculation,
        blockName: 'POST SMS',
      isNew: true,
      });
    }
  }

  if (bosEquipment.length === 0) {
    return null; // All slots already filled
  }

  return {
    configId: 'generic-battery-only',
    configName: 'Generic Battery-Only System',
    description: 'Battery storage without solar panels',
    confidence: 'medium',
    bosEquipment,
  };
}

/**
 * SRP PV-Only String Inverter Configuration
 * Triggers: SRP utility + Solar + String Inverter, No Battery
 * Uses SRP-specific equipment names
 */
export function detectSRPPVOnlyString(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMake,
    inverterModel,
    inverterType,
    inverterMaxContOutput,
    batteryQuantity,
    existingBOS,
    systemNumber,
  } = equipment;

  console.log('[BOS Detection] Testing SRP PV-Only String detector...');

  // System 1 only for now
  if (systemNumber !== 1) {
    return null;
  }

  // Must be SRP utility
  if (!isSRPUtility(utilityName)) {
    return null;
  }

  // Must have inverter (not microinverter)
  if (!inverterMake || !inverterModel) {
    return null;
  }
  if (inverterType === 'microinverter') {
    return null;
  }

  // Must have solar panels
  if (!hasSolarPanels) {
    return null;
  }

  // Must NOT have battery (PV-Only)
  if (batteryQuantity > 0) {
    return null;
  }

  // Check if inverter data is available for amp calculations
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    return null;
  }

  console.log('[BOS Detection] ✅ MATCH: SRP PV-Only String');

  const bosEquipment: BOSEquipmentItem[] = [];

  // Calculate amp rating
  const minAmpRating = Math.ceil(inverterMaxContOutput * 1.25);
  const standardAmps = findStandardAmpRating(minAmpRating);
  const sizingCalculation = `${inverterMaxContOutput}A × 1.25 = ${minAmpRating}A (Standard: ${standardAmps}A)`;

  // Type 1: Dedicated DER Meter (SRP name for PV Meter)
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Dedicated DER Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: standardAmps,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Type 2: DER Meter Disconnect Switch (SRP name for AC Disconnect)
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'DER Meter Disconnect Switch',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: standardAmps,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null; // All slots already filled
  }

  return {
    configId: 'srp-pv-only-string',
    configName: 'SRP PV-Only String Inverter',
    description: 'Solar panels with string inverter, no battery (SRP)',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * SRP PV-Only Microinverter Configuration
 * Triggers: SRP utility + Solar + Microinverter, No Battery
 * Uses SRP-specific equipment names
 */
export function detectSRPPVOnlyMicro(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterType,
    inverterMaxContOutput,
    batteryQuantity,
    existingBOS,
    systemNumber,
  } = equipment;

  console.log('[BOS Detection] Testing SRP PV-Only Micro detector...');

  // System 1 only for now
  if (systemNumber !== 1) {
    return null;
  }

  // Must be SRP utility
  if (!isSRPUtility(utilityName)) {
    return null;
  }

  // Must be microinverter
  if (inverterType !== 'microinverter') {
    return null;
  }

  // Must have solar panels
  if (!hasSolarPanels) {
    return null;
  }

  // Must NOT have battery (PV-Only)
  if (batteryQuantity > 0) {
    return null;
  }

  // Check if inverter data is available for amp calculations
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    return null;
  }

  console.log('[BOS Detection] ✅ MATCH: SRP PV-Only Micro');

  const bosEquipment: BOSEquipmentItem[] = [];

  // Calculate amp rating
  const minAmpRating = Math.ceil(inverterMaxContOutput * 1.25);
  const standardAmps = findStandardAmpRating(minAmpRating);
  const sizingCalculation = `${inverterMaxContOutput}A × 1.25 = ${minAmpRating}A (Standard: ${standardAmps}A)`;

  // Type 1: Dedicated DER Meter (SRP name for PV Meter)
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Dedicated DER Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: standardAmps,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Type 2: DER Meter Disconnect Switch (SRP name for AC Disconnect)
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'DER Meter Disconnect Switch',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: standardAmps,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null; // All slots already filled
  }

  return {
    configId: 'srp-pv-only-micro',
    configName: 'SRP PV-Only Microinverter',
    description: 'Solar panels with microinverter, no battery (SRP)',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * TEP PV-Only String Inverter Configuration
 * Triggers: TEP utility + Solar + String Inverter, No Battery
 * Uses TEP-specific equipment names
 */
export function detectTEPPVOnlyString(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMake,
    inverterModel,
    inverterType,
    inverterMaxContOutput,
    batteryQuantity,
    existingBOS,
    systemNumber,
  } = equipment;

  console.log('[BOS Detection] Testing TEP PV-Only String detector...');

  // System 1 only for now
  if (systemNumber !== 1) {
    return null;
  }

  // Must be TEP utility
  if (!isTEPUtility(utilityName)) {
    return null;
  }

  // Must have inverter (not microinverter)
  if (!inverterMake || !inverterModel) {
    return null;
  }
  if (inverterType === 'microinverter') {
    return null;
  }

  // Must have solar panels
  if (!hasSolarPanels) {
    return null;
  }

  // Must NOT have battery (PV-Only)
  if (batteryQuantity > 0) {
    return null;
  }

  // Check if inverter data is available for amp calculations
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    return null;
  }

  console.log('[BOS Detection] ✅ MATCH: TEP PV-Only String');

  const bosEquipment: BOSEquipmentItem[] = [];

  // Calculate amp rating
  const minAmpRating = Math.ceil(inverterMaxContOutput * 1.25);
  const standardAmps = findStandardAmpRating(minAmpRating);
  const sizingCalculation = `${inverterMaxContOutput}A × 1.25 = ${minAmpRating}A (Standard: ${standardAmps}A)`;

  // Type 1: Utility DG Meter (TEP name for PV Meter)
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Utility DG Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: standardAmps,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Type 2: DG Disconnect Switch (TEP name for AC Disconnect)
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'DG Disconnect Switch',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: standardAmps,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null; // All slots already filled
  }

  return {
    configId: 'tep-pv-only-string',
    configName: 'TEP PV-Only String Inverter',
    description: 'Solar panels with string inverter, no battery (TEP)',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * TEP PV-Only Microinverter Configuration
 * Triggers: TEP utility + Solar + Microinverter, No Battery
 * Uses TEP-specific equipment names
 */
export function detectTEPPVOnlyMicro(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterType,
    inverterMaxContOutput,
    batteryQuantity,
    existingBOS,
    systemNumber,
  } = equipment;

  console.log('[BOS Detection] Testing TEP PV-Only Micro detector...');

  // System 1 only for now
  if (systemNumber !== 1) {
    return null;
  }

  // Must be TEP utility
  if (!isTEPUtility(utilityName)) {
    return null;
  }

  // Must be microinverter
  if (inverterType !== 'microinverter') {
    return null;
  }

  // Must have solar panels
  if (!hasSolarPanels) {
    return null;
  }

  // Must NOT have battery (PV-Only)
  if (batteryQuantity > 0) {
    return null;
  }

  // Check if inverter data is available for amp calculations
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    return null;
  }

  console.log('[BOS Detection] ✅ MATCH: TEP PV-Only Micro');

  const bosEquipment: BOSEquipmentItem[] = [];

  // Calculate amp rating
  const minAmpRating = Math.ceil(inverterMaxContOutput * 1.25);
  const standardAmps = findStandardAmpRating(minAmpRating);
  const sizingCalculation = `${inverterMaxContOutput}A × 1.25 = ${minAmpRating}A (Standard: ${standardAmps}A)`;

  // Type 1: Utility DG Meter (TEP name for PV Meter)
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Utility DG Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: standardAmps,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Type 2: DG Disconnect Switch (TEP name for AC Disconnect)
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'DG Disconnect Switch',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: standardAmps,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null; // All slots already filled
  }

  return {
    configId: 'tep-pv-only-micro',
    configName: 'TEP PV-Only Microinverter',
    description: 'Solar panels with microinverter, no battery (TEP)',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * TRICO PV-Only String Inverter Configuration
 * Triggers: TRICO utility + Solar + String Inverter, No Battery
 * Uses TRICO-specific equipment names
 */
export function detectTRICOPVOnlyString(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMake,
    inverterModel,
    inverterType,
    inverterMaxContOutput,
    batteryQuantity,
    existingBOS,
    systemNumber,
  } = equipment;

  console.log('[BOS Detection] Testing TRICO PV-Only String detector...');

  // System 1 only for now
  if (systemNumber !== 1) {
    return null;
  }

  // Must be TRICO utility
  if (!isTRICOUtility(utilityName)) {
    return null;
  }

  // Must have inverter (not microinverter)
  if (!inverterMake || !inverterModel) {
    return null;
  }
  if (inverterType === 'microinverter') {
    return null;
  }

  // Must have solar panels
  if (!hasSolarPanels) {
    return null;
  }

  // Must NOT have battery (PV-Only)
  if (batteryQuantity > 0) {
    return null;
  }

  // Check if inverter data is available for amp calculations
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    return null;
  }

  console.log('[BOS Detection] ✅ MATCH: TRICO PV-Only String');

  const bosEquipment: BOSEquipmentItem[] = [];

  // Calculate amp rating
  const minAmpRating = Math.ceil(inverterMaxContOutput * 1.25);
  const standardAmps = findStandardAmpRating(minAmpRating);
  const sizingCalculation = `${inverterMaxContOutput}A × 1.25 = ${minAmpRating}A (Standard: ${standardAmps}A)`;

  // Type 1: Co-Generation Meter (TRICO name for PV Meter)
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Co-Generation Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: standardAmps,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Type 2: Co-Generation System Utility Disconnect (TRICO name for AC Disconnect)
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Co-Generation System Utility Disconnect',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: standardAmps,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null; // All slots already filled
  }

  return {
    configId: 'trico-pv-only-string',
    configName: 'TRICO PV-Only String Inverter',
    description: 'Solar panels with string inverter, no battery (TRICO)',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * TRICO PV-Only Microinverter Configuration
 * Triggers: TRICO utility + Solar + Microinverter, No Battery
 * Uses TRICO-specific equipment names
 */
export function detectTRICOPVOnlyMicro(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterType,
    inverterMaxContOutput,
    batteryQuantity,
    existingBOS,
    systemNumber,
  } = equipment;

  console.log('[BOS Detection] Testing TRICO PV-Only Micro detector...');

  // System 1 only for now
  if (systemNumber !== 1) {
    return null;
  }

  // Must be TRICO utility
  if (!isTRICOUtility(utilityName)) {
    return null;
  }

  // Must be microinverter
  if (inverterType !== 'microinverter') {
    return null;
  }

  // Must have solar panels
  if (!hasSolarPanels) {
    return null;
  }

  // Must NOT have battery (PV-Only)
  if (batteryQuantity > 0) {
    return null;
  }

  // Check if inverter data is available for amp calculations
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    return null;
  }

  console.log('[BOS Detection] ✅ MATCH: TRICO PV-Only Micro');

  const bosEquipment: BOSEquipmentItem[] = [];

  // Calculate amp rating
  const minAmpRating = Math.ceil(inverterMaxContOutput * 1.25);
  const standardAmps = findStandardAmpRating(minAmpRating);
  const sizingCalculation = `${inverterMaxContOutput}A × 1.25 = ${minAmpRating}A (Standard: ${standardAmps}A)`;

  // Type 1: Co-Generation Meter (TRICO name for PV Meter)
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Co-Generation Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: standardAmps,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Type 2: Co-Generation System Utility Disconnect (TRICO name for AC Disconnect)
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Co-Generation System Utility Disconnect',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: standardAmps,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null; // All slots already filled
  }

  return {
    configId: 'trico-pv-only-micro',
    configName: 'TRICO PV-Only Microinverter',
    description: 'Solar panels with microinverter, no battery (TRICO)',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * Xcel Energy PV-Only String Inverter Configuration
 * Triggers: Xcel utility + Solar + String Inverter, No Battery
 * Uses POI-based disconnect selection (Supply Side = Non-Fused, Load Side = Fused)
 */
export function detectXcelPVOnlyString(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMake,
    inverterModel,
    inverterType,
    inverterMaxContOutput,
    batteryQuantity,
    existingBOS,
    systemNumber,
    poiType,
  } = equipment;

  console.log('[BOS Detection] Testing Xcel PV-Only String detector...');

  // System 1 only for now
  if (systemNumber !== 1) {
    return null;
  }

  // Must be Xcel utility
  if (!isXcelUtility(utilityName)) {
    return null;
  }

  // Must have inverter (not microinverter)
  if (!inverterMake || !inverterModel) {
    return null;
  }
  if (inverterType === 'microinverter') {
    return null;
  }

  // Must have solar panels
  if (!hasSolarPanels) {
    return null;
  }

  // Must NOT have battery (PV-Only)
  if (batteryQuantity > 0) {
    return null;
  }

  // Check if inverter data is available for amp calculations
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    return null;
  }

  console.log('[BOS Detection] ✅ MATCH: Xcel PV-Only String');

  const bosEquipment: BOSEquipmentItem[] = [];

  // Calculate amp rating
  const minAmpRating = Math.ceil(inverterMaxContOutput * 1.25);
  const standardAmps = findStandardAmpRating(minAmpRating);
  const sizingCalculation = `${inverterMaxContOutput}A × 1.25 = ${minAmpRating}A (Standard: ${standardAmps}A)`;

  // Determine disconnect type based on POI
  // Default to load_side (fused) if not specified
  const effectivePOI = poiType || 'load_side';
  const disconnectType = effectivePOI === 'supply_side'
    ? 'Non-Fused AC Disconnect'
    : 'Fused AC Disconnect';

  console.log(`[BOS Detection] Xcel POI: ${effectivePOI} → ${disconnectType}`);

  // Type 1: Production Meter
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Production Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: standardAmps,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Type 2: Fused or Non-Fused AC Disconnect (POI-dependent)
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: disconnectType,
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: standardAmps,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null; // All slots already filled
  }

  const poiLabel = effectivePOI === 'supply_side' ? 'Supply Side' : 'Load Side';

  return {
    configId: `xcel-pv-only-string-${effectivePOI}`,
    configName: `Xcel PV-Only String Inverter (${poiLabel})`,
    description: `Solar panels with string inverter, no battery (Xcel ${poiLabel})`,
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * Xcel Energy PV-Only Microinverter Configuration
 * Triggers: Xcel utility + Solar + Microinverter, No Battery
 * Uses POI-based disconnect selection (Supply Side = Non-Fused, Load Side = Fused)
 */
export function detectXcelPVOnlyMicro(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterType,
    inverterMaxContOutput,
    batteryQuantity,
    existingBOS,
    systemNumber,
    poiType,
  } = equipment;

  console.log('[BOS Detection] Testing Xcel PV-Only Micro detector...');

  // System 1 only for now
  if (systemNumber !== 1) {
    return null;
  }

  // Must be Xcel utility
  if (!isXcelUtility(utilityName)) {
    return null;
  }

  // Must be microinverter
  if (inverterType !== 'microinverter') {
    return null;
  }

  // Must have solar panels
  if (!hasSolarPanels) {
    return null;
  }

  // Must NOT have battery (PV-Only)
  if (batteryQuantity > 0) {
    return null;
  }

  // Check if inverter data is available for amp calculations
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    return null;
  }

  console.log('[BOS Detection] ✅ MATCH: Xcel PV-Only Micro');

  const bosEquipment: BOSEquipmentItem[] = [];

  // Calculate amp rating
  const minAmpRating = Math.ceil(inverterMaxContOutput * 1.25);
  const standardAmps = findStandardAmpRating(minAmpRating);
  const sizingCalculation = `${inverterMaxContOutput}A × 1.25 = ${minAmpRating}A (Standard: ${standardAmps}A)`;

  // Determine disconnect type based on POI
  // Default to load_side (fused) if not specified
  const effectivePOI = poiType || 'load_side';
  const disconnectType = effectivePOI === 'supply_side'
    ? 'Non-Fused AC Disconnect'
    : 'Fused AC Disconnect';

  console.log(`[BOS Detection] Xcel POI: ${effectivePOI} → ${disconnectType}`);

  // Type 1: Production Meter
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Production Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: standardAmps,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Type 2: Fused or Non-Fused AC Disconnect (POI-dependent)
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: disconnectType,
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: standardAmps,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null; // All slots already filled
  }

  const poiLabel = effectivePOI === 'supply_side' ? 'Supply Side' : 'Load Side';

  return {
    configId: `xcel-pv-only-micro-${effectivePOI}`,
    configName: `Xcel PV-Only Microinverter (${poiLabel})`,
    description: `Solar panels with microinverter, no battery (Xcel ${poiLabel})`,
    confidence: 'high',
    bosEquipment,
  };
}
