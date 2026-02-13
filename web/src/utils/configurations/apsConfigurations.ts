/**
 * APS (Arizona Public Service) BOS Configuration Detectors
 * Detects utility-specific BOS requirements for APS projects
 */

import {
  EquipmentState,
  ConfigurationMatch,
  BOSEquipmentItem,
} from '../../types/bosConfigurationTypes';
import { getNextAvailableSlot } from '../bosEquipmentStateExtractor';

/**
 * Check if utility is APS
 */
function isAPSUtility(utilityName: string): boolean {
  const lower = (utilityName || '').toLowerCase().trim();
  const isAPS = lower.includes('aps') ||
                lower.includes('arizona public service') ||
                lower === 'arizona public service';

  console.log('[APS Detector] Checking utility:', utilityName, '-> isAPS:', isAPS);
  return isAPS;
}

// ============================================
// FRANKLIN APOWER HELPER FUNCTIONS
// ============================================

/**
 * Check if battery is Franklin aPower
 */
function isFranklinAPower(equipment: EquipmentState): boolean {
  return (
    (equipment.batteryMake?.toLowerCase() || '').includes('franklin') &&
    (equipment.batteryModel?.toLowerCase() || '').includes('apower') &&
    equipment.batteryQuantity > 0
  );
}

/**
 * Check if SMS is Franklin Agate (key identifier for Franklin systems)
 */
function isFranklinAgate(equipment: EquipmentState): boolean {
  return (
    equipment.hasSMS &&
    (equipment.smsMake?.toLowerCase() || '').includes('franklin') &&
    (equipment.smsModel?.toLowerCase() || '').includes('agate')
  );
}

// ============================================
// FRANKLIN APOWER DETECTORS (Equipment-Specific)
// Priority 1-2 (HIGHEST) - runs BEFORE all other detectors
// ============================================

/**
 * Franklin aPower + APS + Whole Home Backup
 * Equipment-specific detector for Franklin aPower with Agate SMS
 *
 * BOS: 2 utility + 3 battery + 2 post-SMS = 7 total items
 */
export function detectFranklinAPSWholeHome(equipment: EquipmentState): ConfigurationMatch | null {
  console.log('[Franklin Whole Home] Testing Franklin aPower + APS + Whole Home detector...');

  // Must be System 1
  if (equipment.systemNumber !== 1) {
    console.log('[Franklin Whole Home] ❌ Not System 1');
    return null;
  }

  // Check APS utility
  if (!isAPSUtility(equipment.utilityName)) {
    console.log('[Franklin Whole Home] ❌ Not APS utility');
    return null;
  }

  // Check solar panels present
  if (!equipment.hasSolarPanels) {
    console.log('[Franklin Whole Home] ❌ No solar panels');
    return null;
  }

  // Check Franklin aPower battery
  if (!isFranklinAPower(equipment)) {
    console.log('[Franklin Whole Home] ❌ Not Franklin aPower battery');
    return null;
  }

  // Check Franklin Agate SMS (KEY IDENTIFIER)
  if (!isFranklinAgate(equipment)) {
    console.log('[Franklin Whole Home] ❌ Not Franklin Agate SMS');
    return null;
  }

  // Check Whole Home backup
  if (equipment.backupOption !== 'Whole Home') {
    console.log('[Franklin Whole Home] ❌ Not Whole Home backup');
    return null;
  }

  console.log('[Franklin Whole Home] ✅ MATCH: Franklin aPower + APS + Whole Home');

  // Calculate BOS sizing (AC-Coupled)
  const inverterOutput = equipment.inverterMaxContOutput || 0;
  const batteryOutput = equipment.batteryMaxContOutput || 0;

  // Battery BOS (between battery and SMS)
  const batteryBOSAmps = Math.ceil(batteryOutput * 1.25);
  const batteryCalculation = `${batteryOutput}A × 1.25 = ${batteryBOSAmps}A`;

  // Post-SMS BOS (AC-coupled: inverter + battery)
  const totalOutput = inverterOutput + batteryOutput;
  const postSMSAmps = Math.ceil(totalOutput * 1.25);
  const postSMSCalculation = `(${inverterOutput}A inverter + ${batteryOutput}A battery) × 1.25 = ${postSMSAmps}A`;

  console.log('[Franklin Whole Home] Calculations:');
  console.log(`  - Battery BOS: ${batteryCalculation}`);
  console.log(`  - Post-SMS (AC-Coupled): ${postSMSCalculation}`);

  const bosEquipment: BOSEquipmentItem[] = [];

  // ========== UTILITY BOS (Pre-Combine) ==========
  // 1. Utility Uni-Directional Meter (FIXED: Milbank U5929XL @ 100A)
  const utilitySlot1 = getNextAvailableSlot(equipment.existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber: equipment.systemNumber,
      minAmpRating: 100, // Fixed for Franklin + APS
      sizingCalculation: '100A (standard APS solar production)',
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // 2. Utility Line Side Disconnect
  const utilitySlot2 = getNextAvailableSlot(
    [...equipment.existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',
      position: utilitySlot2,
      section: 'utility',
      systemNumber: equipment.systemNumber,
      minAmpRating: 100,
      sizingCalculation: '100A (standard APS solar production)',
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // ========== BATTERY BOS (Between Battery and SMS) ==========
  // 3. Battery DER Side Disconnect
  const battery1Slot1 = getNextAvailableSlot(equipment.existingBOS.battery1, 'battery1');
  if (battery1Slot1) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter DER Side Disconnect',
      position: battery1Slot1,
      section: 'battery1',
      systemNumber: equipment.systemNumber,
      minAmpRating: batteryBOSAmps,
      sizingCalculation: batteryCalculation,
      blockName: 'ESS',
      isNew: true,
    });
  }

  // 4. Battery Bi-Directional Meter
  const battery1Slot2 = getNextAvailableSlot(
    [...equipment.existingBOS.battery1, ...(battery1Slot1 ? [battery1Slot1] : [])],
    'battery1'
  );
  if (battery1Slot2) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter',
      position: battery1Slot2,
      section: 'battery1',
      systemNumber: equipment.systemNumber,
      minAmpRating: batteryBOSAmps,
      sizingCalculation: batteryCalculation,
      blockName: 'ESS',
      isNew: true,
    });
  }

  // 5. Battery Line Side Disconnect
  const battery1Slot3 = getNextAvailableSlot(
    [...equipment.existingBOS.battery1, ...(battery1Slot1 ? [battery1Slot1] : []), ...(battery1Slot2 ? [battery1Slot2] : [])],
    'battery1'
  );
  if (battery1Slot3) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter Line Side Disconnect',
      position: battery1Slot3,
      section: 'battery1',
      systemNumber: equipment.systemNumber,
      minAmpRating: batteryBOSAmps,
      sizingCalculation: batteryCalculation,
      blockName: 'ESS',
      isNew: true,
    });
  }

  // ========== POST-SMS BOS (After Franklin Agate) ==========
  // 6. Post-SMS DER Side Disconnect
  const postSMSSlot1 = getNextAvailableSlot(equipment.existingBOS.postSMS, 'postSMS');
  if (postSMSSlot1) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter DER Side Disconnect',
      position: postSMSSlot1,
      section: 'postSMS',
      systemNumber: equipment.systemNumber,
      minAmpRating: postSMSAmps,
      sizingCalculation: postSMSCalculation,
      blockName: 'POST COMBINE',
      isNew: true,
    });
  }

  // 7. Post-SMS Utility Disconnect
  const postSMSSlot2 = getNextAvailableSlot(
    [...equipment.existingBOS.postSMS, ...(postSMSSlot1 ? [postSMSSlot1] : [])],
    'postSMS'
  );
  if (postSMSSlot2) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: postSMSSlot2,
      section: 'postSMS',
      systemNumber: equipment.systemNumber,
      minAmpRating: postSMSAmps,
      sizingCalculation: postSMSCalculation,
      blockName: 'POST COMBINE',
      isNew: true,
    });
  }

  return {
    configId: 'franklin-aps-whole-home',
    configName: 'Franklin aPower + APS (Whole Home Backup)',
    description: 'Franklin aPower battery with Agate SMS, Whole Home backup',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * Franklin aPower + APS + Partial Home Backup
 * Equipment-specific detector for Franklin aPower with Agate SMS
 *
 * BOS: 2 utility + 3 battery + 2 post-SMS = 7 total items (same as Whole Home)
 */
export function detectFranklinAPSPartialHome(equipment: EquipmentState): ConfigurationMatch | null {
  console.log('[Franklin Partial Home] Testing Franklin aPower + APS + Partial Home detector...');

  // Must be System 1
  if (equipment.systemNumber !== 1) {
    console.log('[Franklin Partial Home] ❌ Not System 1');
    return null;
  }

  if (!isAPSUtility(equipment.utilityName)) {
    console.log('[Franklin Partial Home] ❌ Not APS utility');
    return null;
  }

  if (!equipment.hasSolarPanels) {
    console.log('[Franklin Partial Home] ❌ No solar panels');
    return null;
  }

  // Check Franklin aPower battery
  if (!isFranklinAPower(equipment)) {
    console.log('[Franklin Partial Home] ❌ Not Franklin aPower battery');
    return null;
  }

  // Check Franklin Agate SMS
  if (!isFranklinAgate(equipment)) {
    console.log('[Franklin Partial Home] ❌ Not Franklin Agate SMS');
    return null;
  }

  // Check Partial Home backup
  if (equipment.backupOption !== 'Partial Home') {
    console.log('[Franklin Partial Home] ❌ Not Partial Home backup');
    return null;
  }

  console.log('[Franklin Partial Home] ✅ MATCH: Franklin aPower + APS + Partial Home');

  // Calculate BOS sizing (same as Whole Home)
  const inverterOutput = equipment.inverterMaxContOutput || 0;
  const batteryOutput = equipment.batteryMaxContOutput || 0;

  const batteryBOSAmps = Math.ceil(batteryOutput * 1.25);
  const batteryCalculation = `${batteryOutput}A × 1.25 = ${batteryBOSAmps}A`;

  const totalOutput = inverterOutput + batteryOutput;
  const postSMSAmps = Math.ceil(totalOutput * 1.25);
  const postSMSCalculation = `(${inverterOutput}A inverter + ${batteryOutput}A battery) × 1.25 = ${postSMSAmps}A`;

  console.log('[Franklin Partial Home] Calculations:');
  console.log(`  - Battery BOS: ${batteryCalculation}`);
  console.log(`  - Post-SMS (AC-Coupled): ${postSMSCalculation}`);

  const bosEquipment: BOSEquipmentItem[] = [];

  // SAME 7 BOS items as Whole Home
  // (Only difference is backup panel configuration, not BOS equipment)

  // 1. Utility Uni-Directional Meter
  const utilitySlot1 = getNextAvailableSlot(equipment.existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber: equipment.systemNumber,
      minAmpRating: 100,
      sizingCalculation: '100A (standard APS solar production)',
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // 2. Utility Line Side Disconnect
  const utilitySlot2 = getNextAvailableSlot(
    [...equipment.existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',
      position: utilitySlot2,
      section: 'utility',
      systemNumber: equipment.systemNumber,
      minAmpRating: 100,
      sizingCalculation: '100A (standard APS solar production)',
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // 3. Battery DER Side Disconnect
  const battery1Slot1 = getNextAvailableSlot(equipment.existingBOS.battery1, 'battery1');
  if (battery1Slot1) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter DER Side Disconnect',
      position: battery1Slot1,
      section: 'battery1',
      systemNumber: equipment.systemNumber,
      minAmpRating: batteryBOSAmps,
      sizingCalculation: batteryCalculation,
      blockName: 'ESS',
      isNew: true,
    });
  }

  // 4. Battery Bi-Directional Meter
  const battery1Slot2 = getNextAvailableSlot(
    [...equipment.existingBOS.battery1, ...(battery1Slot1 ? [battery1Slot1] : [])],
    'battery1'
  );
  if (battery1Slot2) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter',
      position: battery1Slot2,
      section: 'battery1',
      systemNumber: equipment.systemNumber,
      minAmpRating: batteryBOSAmps,
      sizingCalculation: batteryCalculation,
      blockName: 'ESS',
      isNew: true,
    });
  }

  // 5. Battery Line Side Disconnect
  const battery1Slot3 = getNextAvailableSlot(
    [...equipment.existingBOS.battery1, ...(battery1Slot1 ? [battery1Slot1] : []), ...(battery1Slot2 ? [battery1Slot2] : [])],
    'battery1'
  );
  if (battery1Slot3) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter Line Side Disconnect',
      position: battery1Slot3,
      section: 'battery1',
      systemNumber: equipment.systemNumber,
      minAmpRating: batteryBOSAmps,
      sizingCalculation: batteryCalculation,
      blockName: 'ESS',
      isNew: true,
    });
  }

  // 6. Post-SMS DER Side Disconnect
  const postSMSSlot1 = getNextAvailableSlot(equipment.existingBOS.postSMS, 'postSMS');
  if (postSMSSlot1) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter DER Side Disconnect',
      position: postSMSSlot1,
      section: 'postSMS',
      systemNumber: equipment.systemNumber,
      minAmpRating: postSMSAmps,
      sizingCalculation: postSMSCalculation,
      blockName: 'POST COMBINE',
      isNew: true,
    });
  }

  // 7. Post-SMS Utility Disconnect
  const postSMSSlot2 = getNextAvailableSlot(
    [...equipment.existingBOS.postSMS, ...(postSMSSlot1 ? [postSMSSlot1] : [])],
    'postSMS'
  );
  if (postSMSSlot2) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: postSMSSlot2,
      section: 'postSMS',
      systemNumber: equipment.systemNumber,
      minAmpRating: postSMSAmps,
      sizingCalculation: postSMSCalculation,
      blockName: 'POST COMBINE',
      isNew: true,
    });
  }

  return {
    configId: 'franklin-aps-partial-home',
    configName: 'Franklin aPower + APS (Partial Home Backup)',
    description: 'Franklin aPower battery with Agate SMS, Partial Home backup',
    confidence: 'high',
    bosEquipment,
  };
}

// ============================================
// ENPHASE HELPER FUNCTIONS
// ============================================

/**
 * Check if inverter is Enphase microinverter
 */
function isEnphaseMicroinverter(equipment: EquipmentState): boolean {
  return (
    equipment.inverterType === 'microinverter' &&
    (equipment.inverterMake?.toLowerCase() || '').includes('enphase')
  );
}

/**
 * Check if battery is Enphase (IQ Battery)
 */
function isEnphaseBattery(equipment: EquipmentState): boolean {
  return (
    (equipment.batteryMake?.toLowerCase() || '').includes('enphase') &&
    equipment.batteryQuantity > 0
  );
}

/**
 * Check if SMS is Enphase (IQ System Controller / Encharge)
 */
function isEnphaseSMS(equipment: EquipmentState): boolean {
  return (
    equipment.hasSMS &&
    (equipment.smsMake?.toLowerCase() || '').includes('enphase')
  );
}

// ============================================
// ENPHASE DETECTORS (Equipment-Specific)
// Priority 3-4 - runs AFTER Franklin, BEFORE DC-coupled
// ============================================

/**
 * Enphase Microinverter + IQ Battery + APS + Whole Home Backup
 * Equipment-specific detector for Enphase IQ ecosystem
 *
 * BOS: 2 utility + 1 post-SMS = 3 total items (SIMPLER than Franklin)
 */
export function detectEnphaseAPSWholeHome(equipment: EquipmentState): ConfigurationMatch | null {
  console.log('[Enphase Whole Home] Testing Enphase + APS + Whole Home detector...');

  // Must be System 1
  if (equipment.systemNumber !== 1) {
    console.log('[Enphase Whole Home] ❌ Not System 1');
    return null;
  }

  // Check APS utility
  if (!isAPSUtility(equipment.utilityName)) {
    console.log('[Enphase Whole Home] ❌ Not APS utility');
    return null;
  }

  // Check solar panels present
  if (!equipment.hasSolarPanels) {
    console.log('[Enphase Whole Home] ❌ No solar panels');
    return null;
  }

  // Check Enphase microinverter
  if (!isEnphaseMicroinverter(equipment)) {
    console.log('[Enphase Whole Home] ❌ Not Enphase microinverter');
    return null;
  }

  // Check Enphase battery
  if (!isEnphaseBattery(equipment)) {
    console.log('[Enphase Whole Home] ❌ Not Enphase battery');
    return null;
  }

  // Check Enphase SMS (KEY IDENTIFIER)
  if (!isEnphaseSMS(equipment)) {
    console.log('[Enphase Whole Home] ❌ Not Enphase SMS');
    return null;
  }

  // Check Whole Home backup
  if (equipment.backupOption !== 'Whole Home') {
    console.log('[Enphase Whole Home] ❌ Not Whole Home backup');
    return null;
  }

  console.log('[Enphase Whole Home] ✅ MATCH: Enphase + APS + Whole Home');

  // Calculate BOS sizing (AC-Coupled)
  const microinverterOutput = equipment.inverterMaxContOutput || 0;
  const batteryOutput = equipment.batteryMaxContOutput || 0;

  // Pre-Combine BOS (microinverter only)
  const preCombineAmps = Math.ceil(microinverterOutput * 1.25);
  const preCombineCalculation = `${microinverterOutput}A × 1.25 = ${preCombineAmps}A`;

  // Post-SMS BOS (AC-coupled: microinverter + battery)
  const totalOutput = microinverterOutput + batteryOutput;
  const postSMSAmps = Math.ceil(totalOutput * 1.25);
  const postSMSCalculation = `(${microinverterOutput}A microinverter + ${batteryOutput}A battery) × 1.25 = ${postSMSAmps}A`;

  console.log('[Enphase Whole Home] Calculations:');
  console.log(`  - Pre-Combine (microinverter only): ${preCombineCalculation}`);
  console.log(`  - Post-SMS (AC-Coupled): ${postSMSCalculation}`);
  console.log(`  - Note: Enphase batteries managed by IQ System Controller (no separate battery BOS)`);

  const bosEquipment: BOSEquipmentItem[] = [];

  // ========== PRE-COMBINE BOS (After Enphase Combiner Panel) ==========
  // Fixed equipment for Enphase + APS

  // 1. Pre-Combine Uni-Directional Meter (FIXED: Milbank U5929XL @ 100A)
  const utilitySlot1 = getNextAvailableSlot(equipment.existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber: equipment.systemNumber,
      minAmpRating: 100,
      sizingCalculation: '100A (fixed for APS solar production)',
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // 2. Pre-Combine Line Side Disconnect
  const utilitySlot2 = getNextAvailableSlot(
    [...equipment.existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',
      position: utilitySlot2,
      section: 'utility',
      systemNumber: equipment.systemNumber,
      minAmpRating: 100,
      sizingCalculation: '100A (fixed for APS solar production)',
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // ========== POST-SMS BOS (After Enphase IQ System Controller) ==========
  // AC-coupled: Sized to total system output

  // 3. Post-SMS Utility Disconnect
  const postSMSSlot1 = getNextAvailableSlot(equipment.existingBOS.postSMS, 'postSMS');
  if (postSMSSlot1) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: postSMSSlot1,
      section: 'postSMS',
      systemNumber: equipment.systemNumber,
      minAmpRating: postSMSAmps,
      sizingCalculation: postSMSCalculation,
      blockName: 'POST COMBINE',
      isNew: true,
    });
  }

  return {
    configId: 'enphase-aps-whole-home',
    configName: 'Enphase Microinverter + IQ Battery + APS (Whole Home)',
    description: 'Enphase IQ ecosystem with microinverters, IQ Battery, and IQ System Controller',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * Enphase Microinverter + IQ Battery + APS + Partial Home Backup
 * Equipment-specific detector for Enphase IQ ecosystem
 *
 * BOS: 2 utility + 1 post-SMS = 3 total items (SAME as Whole Home)
 */
export function detectEnphaseAPSPartialHome(equipment: EquipmentState): ConfigurationMatch | null {
  console.log('[Enphase Partial Home] Testing Enphase + APS + Partial Home detector...');

  // Must be System 1
  if (equipment.systemNumber !== 1) {
    console.log('[Enphase Partial Home] ❌ Not System 1');
    return null;
  }

  // Check APS utility
  if (!isAPSUtility(equipment.utilityName)) {
    console.log('[Enphase Partial Home] ❌ Not APS utility');
    return null;
  }

  // Check solar panels present
  if (!equipment.hasSolarPanels) {
    console.log('[Enphase Partial Home] ❌ No solar panels');
    return null;
  }

  // Check Enphase microinverter
  if (!isEnphaseMicroinverter(equipment)) {
    console.log('[Enphase Partial Home] ❌ Not Enphase microinverter');
    return null;
  }

  // Check Enphase battery
  if (!isEnphaseBattery(equipment)) {
    console.log('[Enphase Partial Home] ❌ Not Enphase battery');
    return null;
  }

  // Check Enphase SMS (KEY IDENTIFIER)
  if (!isEnphaseSMS(equipment)) {
    console.log('[Enphase Partial Home] ❌ Not Enphase SMS');
    return null;
  }

  // Check Partial Home backup
  if (equipment.backupOption !== 'Partial Home') {
    console.log('[Enphase Partial Home] ❌ Not Partial Home backup');
    return null;
  }

  console.log('[Enphase Partial Home] ✅ MATCH: Enphase + APS + Partial Home');

  // Calculate BOS sizing (AC-Coupled) - SAME as Whole Home
  const microinverterOutput = equipment.inverterMaxContOutput || 0;
  const batteryOutput = equipment.batteryMaxContOutput || 0;

  // Pre-Combine BOS (microinverter only)
  const preCombineAmps = Math.ceil(microinverterOutput * 1.25);
  const preCombineCalculation = `${microinverterOutput}A × 1.25 = ${preCombineAmps}A`;

  // Post-SMS BOS (AC-coupled: microinverter + battery)
  const totalOutput = microinverterOutput + batteryOutput;
  const postSMSAmps = Math.ceil(totalOutput * 1.25);
  const postSMSCalculation = `(${microinverterOutput}A microinverter + ${batteryOutput}A battery) × 1.25 = ${postSMSAmps}A`;

  console.log('[Enphase Partial Home] Calculations:');
  console.log(`  - Pre-Combine (microinverter only): ${preCombineCalculation}`);
  console.log(`  - Post-SMS (AC-Coupled): ${postSMSCalculation}`);
  console.log(`  - Note: Enphase batteries managed by IQ System Controller (no separate battery BOS)`);

  const bosEquipment: BOSEquipmentItem[] = [];

  // ========== PRE-COMBINE BOS (After Enphase Combiner Panel) ==========
  // Fixed equipment for Enphase + APS

  // 1. Pre-Combine Uni-Directional Meter (FIXED: Milbank U5929XL @ 100A)
  const utilitySlot1 = getNextAvailableSlot(equipment.existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber: equipment.systemNumber,
      minAmpRating: 100,
      sizingCalculation: '100A (fixed for APS solar production)',
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // 2. Pre-Combine Line Side Disconnect
  const utilitySlot2 = getNextAvailableSlot(
    [...equipment.existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',
      position: utilitySlot2,
      section: 'utility',
      systemNumber: equipment.systemNumber,
      minAmpRating: 100,
      sizingCalculation: '100A (fixed for APS solar production)',
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // ========== POST-SMS BOS (After Enphase IQ System Controller) ==========
  // AC-coupled: Sized to total system output

  // 3. Post-SMS Utility Disconnect
  const postSMSSlot1 = getNextAvailableSlot(equipment.existingBOS.postSMS, 'postSMS');
  if (postSMSSlot1) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: postSMSSlot1,
      section: 'postSMS',
      systemNumber: equipment.systemNumber,
      minAmpRating: postSMSAmps,
      sizingCalculation: postSMSCalculation,
      blockName: 'POST COMBINE',
      isNew: true,
    });
  }

  return {
    configId: 'enphase-aps-partial-home',
    configName: 'Enphase Microinverter + IQ Battery + APS (Partial Home)',
    description: 'Enphase IQ ecosystem with microinverters, IQ Battery, and IQ System Controller',
    confidence: 'high',
    bosEquipment,
  };
}

// ============================================
// PV-ONLY DETECTORS (Standard Priority)
// ============================================

/**
 * APS PV-Only String Inverter Configuration
 * Triggers: Solar + String Inverter, No Battery
 */
export function detectAPSPVOnlyStringInverter(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterType,
    inverterMaxContOutput,
    batteryQuantity,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  // Must be APS utility
  if (!isAPSUtility(utilityName)) {
    console.log('[APS PV-Only String] Not APS utility, skipping');
    return null;
  }

  console.log('[APS PV-Only String] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    inverterType,
    batteryQuantity,
  });

  // Check for PV-Only String Inverter pattern
  if (!hasSolarPanels || !hasInverter || inverterType !== 'inverter' || batteryQuantity > 0) {
    console.log('[APS PV-Only String] Conditions not met');
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

  // Utility Section BOS (Pre-Combine) - PV-Only uses 2 slots
  // Slot 1: Uni-Directional Meter (PV Meter - production meter, inverter-based sizing)
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',  // Maps to PV Meter in catalog
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating,  // Same as inverter sizing (NEC 1.25×)
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Slot 2: Uni-Directional Meter Line Side Disconnect (AC Disconnect - DER-side)
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',  // Maps to AC Disconnect in catalog
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
    configId: 'aps-pv-only-string',
    configName: 'APS PV-Only String Inverter',
    description: 'Solar panels with string inverter, no battery storage',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * APS PV-Only Microinverter Configuration
 * Triggers: Solar + Microinverter, No Battery
 */
export function detectAPSPVOnlyMicroinverter(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterType,
    inverterMaxContOutput,
    batteryQuantity,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  // Must be APS utility
  if (!isAPSUtility(utilityName)) {
    console.log('[APS PV-Only Micro] Not APS utility, skipping');
    return null;
  }

  console.log('[APS PV-Only Micro] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    inverterType,
    batteryQuantity,
  });

  // Check for PV-Only Microinverter pattern
  if (!hasSolarPanels || !hasInverter || inverterType !== 'microinverter' || batteryQuantity > 0) {
    console.log('[APS PV-Only Micro] Conditions not met');
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

  // Utility Section BOS (Pre-Combine) - PV-Only uses 2 slots
  // Slot 1: Uni-Directional Meter (PV Meter - production meter, inverter-based sizing)
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',  // Maps to PV Meter in catalog
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating,  // Same as inverter sizing (NEC 1.25×)
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Slot 2: Uni-Directional Meter Line Side Disconnect (AC Disconnect - DER-side)
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',  // Maps to AC Disconnect in catalog
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
    configId: 'aps-pv-only-micro',
    configName: 'APS PV-Only Microinverter',
    description: 'Solar panels with microinverters, no battery storage',
    confidence: 'high',
    bosEquipment,
  };
}

// ============================================================================
// PV-ONLY CONFIGURATIONS - SPECIFIC SMS VARIATIONS
// These detectors handle SMS-specific requirements for PV-Only systems
// ============================================================================

/**
 * PV-Only Detector 1: String Inverter + SMS
 * Triggers: String inverter + No battery + SMS present
 * BOS Equipment: 3 Pre-Combine items
 */
export function detectAPSPVOnlyStringSMS(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMake,
    inverterModel,
    inverterType,
    inverterMaxContOutput,
    batteryQuantity,
    hasSMS,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  // Must be APS utility
  if (!isAPSUtility(utilityName)) {
    console.log('[APS PV-Only String + SMS] Not APS utility, skipping');
    return null;
  }

  console.log('[APS PV-Only String + SMS] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    inverterType,
    batteryQuantity,
    hasSMS,
  });

  // Check for PV-Only String + SMS pattern
  if (
    systemNumber !== 1 ||
    !hasSolarPanels ||
    !hasInverter ||
    !inverterMake ||
    !inverterModel ||
    inverterType === 'microinverter' ||  // Must NOT be microinverter
    batteryQuantity > 0 ||  // Must NOT have battery
    !hasSMS  // Must have SMS
  ) {
    console.log('[APS PV-Only String + SMS] Conditions not met');
    return null;
  }

  // Check if inverter data is available
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    console.log('[APS PV-Only String + SMS] No inverter output data');
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  // NEC 1.25× calculation
  const preCombineAmps = Math.ceil(inverterMaxContOutput * 1.25);
  const preCombineCalculation = `${inverterMaxContOutput}A × 1.25 = ${preCombineAmps}A`;

  // Pre-Combine Slot 1: Uni-Directional Meter Line Side Disconnect
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: preCombineAmps,
      sizingCalculation: preCombineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Pre-Combine Slot 2: Uni-Directional Meter
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: preCombineAmps,
      sizingCalculation: preCombineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Pre-Combine Slot 3: Utility Disconnect
  const utilitySlot3 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : [])],
    'utility'
  );
  if (utilitySlot3) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: utilitySlot3,
      section: 'utility',
      systemNumber,
      minAmpRating: preCombineAmps,
      sizingCalculation: preCombineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null;
  }

  console.log('[APS PV-Only String + SMS] ✅ MATCHED - returning', bosEquipment.length, 'BOS items');
  console.log('[APS PV-Only String + SMS] Calculation:', preCombineCalculation);

  return {
    configId: 'aps-pv-only-string-sms',
    configName: 'APS PV-Only String Inverter + SMS',
    description: 'Solar panels with string inverter and SMS, no battery storage',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * PV-Only Detector 2: String Inverter + No SMS
 * Triggers: String inverter + No battery + No SMS
 * BOS Equipment: 3 Pre-Combine items
 */
export function detectAPSPVOnlyStringNoSMS(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMake,
    inverterModel,
    inverterType,
    inverterMaxContOutput,
    batteryQuantity,
    hasSMS,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  // Must be APS utility
  if (!isAPSUtility(utilityName)) {
    console.log('[APS PV-Only String + No SMS] Not APS utility, skipping');
    return null;
  }

  console.log('[APS PV-Only String + No SMS] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    inverterType,
    batteryQuantity,
    hasSMS,
  });

  // Check for PV-Only String + No SMS pattern
  if (
    systemNumber !== 1 ||
    !hasSolarPanels ||
    !hasInverter ||
    !inverterMake ||
    !inverterModel ||
    inverterType === 'microinverter' ||  // Must NOT be microinverter
    batteryQuantity > 0 ||  // Must NOT have battery
    hasSMS  // Must NOT have SMS
  ) {
    console.log('[APS PV-Only String + No SMS] Conditions not met');
    return null;
  }

  // Check if inverter data is available
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    console.log('[APS PV-Only String + No SMS] No inverter output data');
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  // NEC 1.25× calculation
  const combineAmps = Math.ceil(inverterMaxContOutput * 1.25);
  const combineCalculation = `${inverterMaxContOutput}A × 1.25 = ${combineAmps}A`;

  // Slot 1: Uni-Directional Meter (PV Meter - production meter)
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Slot 2: Utility Disconnect (Utility-side lockable disconnect - required for all APS)
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null;
  }

  console.log('[APS PV-Only String + No SMS] ✅ MATCHED - returning', bosEquipment.length, 'BOS items');
  console.log('[APS PV-Only String + No SMS] Calculation:', combineCalculation);

  return {
    configId: 'aps-pv-only-string-no-sms',
    configName: 'APS PV-Only String Inverter (No SMS)',
    description: 'Solar panels with string inverter, no battery storage, no SMS',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * PV-Only Detector 3: Microinverter + SMS
 * Triggers: Microinverter + No battery + SMS present
 * BOS Equipment: 3 Pre-Combine items
 */
export function detectAPSPVOnlyMicroSMS(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMake,
    inverterModel,
    inverterType,
    inverterMaxContOutput,
    batteryQuantity,
    hasSMS,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  // Must be APS utility
  if (!isAPSUtility(utilityName)) {
    console.log('[APS PV-Only Micro + SMS] Not APS utility, skipping');
    return null;
  }

  console.log('[APS PV-Only Micro + SMS] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    inverterType,
    batteryQuantity,
    hasSMS,
  });

  // Check for PV-Only Micro + SMS pattern
  if (
    systemNumber !== 1 ||
    !hasSolarPanels ||
    !hasInverter ||
    !inverterMake ||
    !inverterModel ||
    inverterType !== 'microinverter' ||  // MUST be microinverter
    batteryQuantity > 0 ||  // Must NOT have battery
    !hasSMS  // Must have SMS
  ) {
    console.log('[APS PV-Only Micro + SMS] Conditions not met');
    return null;
  }

  // Check if inverter data is available
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    console.log('[APS PV-Only Micro + SMS] No inverter output data');
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  // NEC 1.25× calculation
  const preCombineAmps = Math.ceil(inverterMaxContOutput * 1.25);
  const preCombineCalculation = `${inverterMaxContOutput}A × 1.25 = ${preCombineAmps}A`;

  // Pre-Combine Slot 1: Uni-Directional Meter Line Side Disconnect
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: preCombineAmps,
      sizingCalculation: preCombineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Pre-Combine Slot 2: Uni-Directional Meter
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: preCombineAmps,
      sizingCalculation: preCombineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Pre-Combine Slot 3: Utility Disconnect
  const utilitySlot3 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : [])],
    'utility'
  );
  if (utilitySlot3) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: utilitySlot3,
      section: 'utility',
      systemNumber,
      minAmpRating: preCombineAmps,
      sizingCalculation: preCombineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null;
  }

  console.log('[APS PV-Only Micro + SMS] ✅ MATCHED - returning', bosEquipment.length, 'BOS items');
  console.log('[APS PV-Only Micro + SMS] Calculation:', preCombineCalculation);

  return {
    configId: 'aps-pv-only-micro-sms',
    configName: 'APS PV-Only Microinverter + SMS',
    description: 'Solar panels with microinverters and SMS, no battery storage',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * PV-Only Detector 4: Microinverter + No SMS
 * Triggers: Microinverter + No battery + No SMS
 * BOS Equipment: 3 Pre-Combine items
 */
export function detectAPSPVOnlyMicroNoSMS(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMake,
    inverterModel,
    inverterType,
    inverterMaxContOutput,
    batteryQuantity,
    hasSMS,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  // Must be APS utility
  if (!isAPSUtility(utilityName)) {
    console.log('[APS PV-Only Micro + No SMS] Not APS utility, skipping');
    return null;
  }

  console.log('[APS PV-Only Micro + No SMS] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    inverterType,
    batteryQuantity,
    hasSMS,
  });

  // Check for PV-Only Micro + No SMS pattern
  if (
    systemNumber !== 1 ||
    !hasSolarPanels ||
    !hasInverter ||
    !inverterMake ||
    !inverterModel ||
    inverterType !== 'microinverter' ||  // MUST be microinverter
    batteryQuantity > 0 ||  // Must NOT have battery
    hasSMS  // Must NOT have SMS
  ) {
    console.log('[APS PV-Only Micro + No SMS] Conditions not met');
    return null;
  }

  // Check if inverter data is available
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    console.log('[APS PV-Only Micro + No SMS] No inverter output data');
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  // NEC 1.25× calculation
  const combineAmps = Math.ceil(inverterMaxContOutput * 1.25);
  const combineCalculation = `${inverterMaxContOutput}A × 1.25 = ${combineAmps}A`;

  // Combine Slot 1: Uni-Directional Meter Line Side Disconnect
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Combine Slot 2: Uni-Directional Meter
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Combine Slot 3: Utility Disconnect
  const utilitySlot3 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : [])],
    'utility'
  );
  if (utilitySlot3) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: utilitySlot3,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null;
  }

  console.log('[APS PV-Only Micro + No SMS] ✅ MATCHED - returning', bosEquipment.length, 'BOS items');
  console.log('[APS PV-Only Micro + No SMS] Calculation:', combineCalculation);

  return {
    configId: 'aps-pv-only-micro-no-sms',
    configName: 'APS PV-Only Microinverter (No SMS)',
    description: 'Solar panels with microinverters, no battery storage, no SMS',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * APS AC-Coupled Configuration
 * Triggers: Solar + Battery + Inverter (any type)
 */
export function detectAPSACCoupled(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMaxContOutput,
    batteryQuantity,
    hasBackupPanel,
    hasSMS,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  // Must be APS utility
  if (!isAPSUtility(utilityName)) {
    console.log('[APS AC-Coupled] Not APS utility, skipping');
    return null;
  }

  console.log('[APS AC-Coupled] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    batteryQuantity,
    hasSMS,
  });

  // Check for AC-Coupled pattern (Solar + Battery)
  if (!hasSolarPanels || !hasInverter || batteryQuantity === 0) {
    console.log('[APS AC-Coupled] Conditions not met');
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
  // Type 1: Utility Disconnect (Fused AC Disconnect - utility-side)
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',  // Maps to Fused AC Disconnect in catalog
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Type 2: Uni-Directional Meter Line Side Disconnect (AC Disconnect - DER-side)
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',  // Maps to AC Disconnect in catalog
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Type 3: Uni-Directional Meter (PV Meter - production meter, inverter-based sizing)
  const utilitySlot3 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : [])],
    'utility'
  );
  if (utilitySlot3) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',  // Maps to PV Meter in catalog
      position: utilitySlot3,
      section: 'utility',
      systemNumber,
      minAmpRating,  // Same as inverter sizing (NEC 1.25×)
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
    configId: 'aps-ac-coupled',
    configName: 'APS AC-Coupled System',
    description: 'Solar panels with battery storage (AC-Coupled)',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * APS DC-Coupled + SMS + Backup Configuration (Detector 1)
 * Triggers: Solar + DC-Coupled Battery + SMS + Whole/Partial Home Backup
 * Most common DC-coupled configuration
 *
 * Equipment:
 * - BACKUP BOS (2 items): Uni-Directional Meter + Line Side Disconnect
 * - PRE COMBINE (2 items): Bi-Directional Meter DER Side Disconnect + Bi-Directional Meter
 * - POST SMS (1 item): Utility Disconnect
 */
export function detectAPSDCCoupledWithSMSAndBackup(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMaxContOutput,
    batteryQuantity,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
    backupPanelBusRating,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  // Must be APS utility
  if (!isAPSUtility(utilityName)) {
    console.log('[APS DC-Coupled + SMS + Backup] Not APS utility, skipping');
    return null;
  }

  console.log('[APS DC-Coupled + SMS + Backup] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    batteryQuantity,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
  });

  // Check for DC-Coupled + SMS + Backup pattern
  // NOTE: DC-coupled configurations only apply to System 1 (multi-system handled separately)
  if (
    systemNumber !== 1 ||
    !hasSolarPanels ||
    !hasInverter ||
    batteryQuantity === 0 ||
    couplingType !== 'DC' ||
    !hasSMS ||
    !hasBackupPanel ||
    (backupOption !== 'Whole Home' && backupOption !== 'Partial Home')
  ) {
    console.log('[APS DC-Coupled + SMS + Backup] Conditions not met', {
      systemNumber,
      isSystem1: systemNumber === 1,
    });
    return null;
  }

  // Check if inverter data is available for amp calculations
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    console.log('[APS DC-Coupled + SMS + Backup] No inverter output data');
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  // ============================================
  // BACKUP BOS (Backup Load Sub Panel)
  // Sized to backup panel bus bar rating (NO 1.25x multiplier)
  // ============================================
  const backupPanelAmps = backupPanelBusRating || 200; // Default 200A
  const backupSizingCalc = `Backup Panel Bus Rating: ${backupPanelAmps}A`;

  // Backup Slot 1: Uni-Directional Meter (sized to backup panel)
  const backupSlot1 = getNextAvailableSlot(existingBOS.backup, 'backup');
  if (backupSlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: backupSlot1,
      section: 'backup',
      systemNumber,
      minAmpRating: backupPanelAmps,
      sizingCalculation: backupSizingCalc,
      blockName: 'BACKUP LOAD SUB PANEL',
      isNew: true,
    });
  }

  // Backup Slot 2: Uni-Directional Meter Line Side Disconnect (sized to backup panel)
  const backupSlot2 = getNextAvailableSlot(
    [...existingBOS.backup, ...(backupSlot1 ? [backupSlot1] : [])],
    'backup'
  );
  if (backupSlot2) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',
      position: backupSlot2,
      section: 'backup',
      systemNumber,
      minAmpRating: backupPanelAmps,
      sizingCalculation: backupSizingCalc,
      blockName: 'BACKUP LOAD SUB PANEL',
      isNew: true,
    });
  }

  // ============================================
  // PRE COMBINE (Between Inverter and SMS)
  // Sized to inverter output × 1.25 (NEC requirement)
  // ============================================
  const minAmpRating = Math.ceil(inverterMaxContOutput * 1.25);
  const sizingCalculation = `${inverterMaxContOutput}A × 1.25 = ${minAmpRating}A`;

  // Utility Slot 1: Bi-Directional Meter DER Side Disconnect
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter DER Side Disconnect',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Utility Slot 2: Bi-Directional Meter
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // ============================================
  // POST SMS (After Storage Management System)
  // Sized to inverter output × 1.25 (NEC requirement)
  // ============================================
  const postSMSSlot1 = getNextAvailableSlot(existingBOS.postSMS, 'postSMS');
  if (postSMSSlot1) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: postSMSSlot1,
      section: 'postSMS',
      systemNumber,
      minAmpRating,
      sizingCalculation,
      blockName: 'POST SMS',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null; // All slots already filled
  }

  console.log('[APS DC-Coupled + SMS + Backup] ✅ MATCHED - returning', bosEquipment.length, 'BOS items');

  return {
    configId: 'aps-dc-coupled-sms-backup',
    configName: 'APS DC-Coupled + SMS + Whole/Partial Home Backup',
    description: 'DC-coupled battery system with SMS and backup panel (SolarEdge, Generac PWRcell, etc.)',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * Detector 2: APS DC-Coupled + SMS + No Backup
 * Triggers: DC-coupled inverter + battery + SMS + no backup panel
 * BOS Equipment: 2 Pre-Combine + 1 Post-SMS = 3 items
 */
export function detectAPSDCCoupledSMSNoBackup(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMaxContOutput,
    batteryQuantity,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  // Must be APS utility
  if (!isAPSUtility(utilityName)) {
    console.log('[APS DC-Coupled + SMS + No Backup] Not APS utility, skipping');
    return null;
  }

  console.log('[APS DC-Coupled + SMS + No Backup] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    batteryQuantity,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
  });

  // Check for DC-Coupled + SMS + No Backup pattern
  // NOTE: DC-coupled configurations only apply to System 1
  if (
    systemNumber !== 1 ||
    !hasSolarPanels ||
    !hasInverter ||
    batteryQuantity === 0 ||
    couplingType !== 'DC' ||
    !hasSMS ||
    hasBackupPanel ||
    backupOption === 'Whole Home' ||
    backupOption === 'Partial Home'
  ) {
    console.log('[APS DC-Coupled + SMS + No Backup] Conditions not met', {
      systemNumber,
      isSystem1: systemNumber === 1,
    });
    return null;
  }

  // Check if inverter data is available for amp calculations
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    console.log('[APS DC-Coupled + SMS + No Backup] No inverter output data');
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  // ============================================
  // PRE COMBINE (Between Inverter and SMS)
  // Sized to inverter output × 1.25 (NEC requirement)
  // ============================================
  const minAmpRating = Math.ceil(inverterMaxContOutput * 1.25);
  const sizingCalculation = `${inverterMaxContOutput}A × 1.25 = ${minAmpRating}A`;

  // Utility Slot 1: Bi-Directional Meter DER Side Disconnect
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter DER Side Disconnect',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Utility Slot 2: Bi-Directional Meter
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating,
      sizingCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // ============================================
  // POST SMS (After Storage Management System)
  // Sized to inverter output × 1.25 (NEC requirement)
  // ============================================
  const postSMSSlot1 = getNextAvailableSlot(existingBOS.postSMS, 'postSMS');
  if (postSMSSlot1) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: postSMSSlot1,
      section: 'postSMS',
      systemNumber,
      minAmpRating,
      sizingCalculation,
      blockName: 'POST SMS',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null; // All slots already filled
  }

  console.log('[APS DC-Coupled + SMS + No Backup] ✅ MATCHED - returning', bosEquipment.length, 'BOS items');

  return {
    configId: 'aps-dc-coupled-sms-no-backup',
    configName: 'APS DC-Coupled + SMS + No Backup',
    description: 'DC-coupled battery system with SMS but no backup panel',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * Detector 3: APS DC-Coupled + No SMS + Backup
 * Triggers: DC-coupled inverter + battery + no SMS + backup panel
 * BOS Equipment: 2 Backup + 1 Pre-Combine = 3 items
 */
export function detectAPSDCCoupledNoSMSBackup(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMaxContOutput,
    batteryQuantity,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
    backupPanelBusRating,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  // Must be APS utility
  if (!isAPSUtility(utilityName)) {
    console.log('[APS DC-Coupled + No SMS + Backup] Not APS utility, skipping');
    return null;
  }

  console.log('[APS DC-Coupled + No SMS + Backup] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    batteryQuantity,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
  });

  // Check for DC-Coupled + No SMS + Backup pattern
  // NOTE: DC-coupled configurations only apply to System 1
  if (
    systemNumber !== 1 ||
    !hasSolarPanels ||
    !hasInverter ||
    batteryQuantity === 0 ||
    couplingType !== 'DC' ||
    hasSMS ||
    !hasBackupPanel ||
    (backupOption !== 'Whole Home' && backupOption !== 'Partial Home')
  ) {
    console.log('[APS DC-Coupled + No SMS + Backup] Conditions not met', {
      systemNumber,
      isSystem1: systemNumber === 1,
    });
    return null;
  }

  // Check if inverter data is available for amp calculations
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    console.log('[APS DC-Coupled + No SMS + Backup] No inverter output data');
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  // ============================================
  // BACKUP BOS (Backup Load Sub Panel)
  // Sized to backup panel bus bar rating (NO 1.25x multiplier)
  // ============================================
  const backupPanelAmps = backupPanelBusRating || 200; // Default 200A
  const backupSizingCalc = `Backup Panel Bus Rating: ${backupPanelAmps}A`;

  // Backup Slot 1: Uni-Directional Meter (sized to backup panel)
  const backupSlot1 = getNextAvailableSlot(existingBOS.backup, 'backup');
  if (backupSlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: backupSlot1,
      section: 'backup',
      systemNumber,
      minAmpRating: backupPanelAmps,
      sizingCalculation: backupSizingCalc,
      blockName: 'BACKUP LOAD SUB PANEL',
      isNew: true,
    });
  }

  // Backup Slot 2: Uni-Directional Meter Line Side Disconnect (sized to backup panel)
  const backupSlot2 = getNextAvailableSlot(
    [...existingBOS.backup, ...(backupSlot1 ? [backupSlot1] : [])],
    'backup'
  );
  if (backupSlot2) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',
      position: backupSlot2,
      section: 'backup',
      systemNumber,
      minAmpRating: backupPanelAmps,
      sizingCalculation: backupSizingCalc,
      blockName: 'BACKUP LOAD SUB PANEL',
      isNew: true,
    });
  }

  // ============================================
  // PRE COMBINE (Between Inverter and Combine Point)
  // Sized to inverter output × 1.25 (NEC requirement)
  // ============================================
  const minAmpRating = Math.ceil(inverterMaxContOutput * 1.25);
  const sizingCalculation = `${inverterMaxContOutput}A × 1.25 = ${minAmpRating}A`;

  // Utility Slot 1: Utility Disconnect
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: utilitySlot1,
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

  console.log('[APS DC-Coupled + No SMS + Backup] ✅ MATCHED - returning', bosEquipment.length, 'BOS items');

  return {
    configId: 'aps-dc-coupled-no-sms-backup',
    configName: 'APS DC-Coupled + No SMS + Backup',
    description: 'DC-coupled battery system with backup panel but no SMS',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * Detector 4: APS DC-Coupled + No SMS + No Backup
 * Triggers: DC-coupled inverter + battery + no SMS + no backup panel
 * BOS Equipment: 1 Pre-Combine = 1 item
 */
export function detectAPSDCCoupledNoSMSNoBackup(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMaxContOutput,
    batteryQuantity,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  // Must be APS utility
  if (!isAPSUtility(utilityName)) {
    console.log('[APS DC-Coupled + No SMS + No Backup] Not APS utility, skipping');
    return null;
  }

  console.log('[APS DC-Coupled + No SMS + No Backup] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    batteryQuantity,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
  });

  // Check for DC-Coupled + No SMS + No Backup pattern
  // NOTE: DC-coupled configurations only apply to System 1
  if (
    systemNumber !== 1 ||
    !hasSolarPanels ||
    !hasInverter ||
    batteryQuantity === 0 ||
    couplingType !== 'DC' ||
    hasSMS ||
    hasBackupPanel ||
    backupOption === 'Whole Home' ||
    backupOption === 'Partial Home'
  ) {
    console.log('[APS DC-Coupled + No SMS + No Backup] Conditions not met', {
      systemNumber,
      isSystem1: systemNumber === 1,
    });
    return null;
  }

  // Check if inverter data is available for amp calculations
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    console.log('[APS DC-Coupled + No SMS + No Backup] No inverter output data');
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  // ============================================
  // PRE COMBINE (Between Inverter and Combine Point)
  // Sized to inverter output × 1.25 (NEC requirement)
  // ============================================
  const minAmpRating = Math.ceil(inverterMaxContOutput * 1.25);
  const sizingCalculation = `${inverterMaxContOutput}A × 1.25 = ${minAmpRating}A`;

  // Utility Slot 1: Utility Disconnect
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: utilitySlot1,
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

  console.log('[APS DC-Coupled + No SMS + No Backup] ✅ MATCHED - returning', bosEquipment.length, 'BOS items');

  return {
    configId: 'aps-dc-coupled-no-sms-no-backup',
    configName: 'APS DC-Coupled + No SMS + No Backup',
    description: 'DC-coupled battery system with no SMS and no backup panel',
    confidence: 'high',
    bosEquipment,
  };
}

// ============================================================================
// AC-COUPLED CONFIGURATIONS - STRING INVERTER
// ============================================================================

/**
 * AC-Coupled Detector 1: String Inverter + SMS + Backup
 * Triggers: AC-coupled + String inverter + Battery + SMS + Backup panel
 * BOS Equipment: 2 Backup + 3 Pre-Combine + 3 Post-SMS = 8 items
 */
export function detectAPSACCoupledStringSMSBackup(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMake,
    inverterModel,
    inverterType,
    inverterMaxContOutput,
    batteryMake,
    batteryModel,
    batteryQuantity,
    batteryMaxContOutput,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
    backupPanelBusRating,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  // Must be APS utility
  if (!isAPSUtility(utilityName)) {
    console.log('[APS AC-Coupled String + SMS + Backup] Not APS utility, skipping');
    return null;
  }

  console.log('[APS AC-Coupled String + SMS + Backup] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    inverterType,
    batteryQuantity,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
  });

  // Check for AC-Coupled + String + SMS + Backup pattern
  if (
    systemNumber !== 1 ||
    !hasSolarPanels ||
    !hasInverter ||
    !inverterMake ||
    !inverterModel ||
    inverterType === 'microinverter' ||  // Must NOT be microinverter
    batteryQuantity === 0 ||
    !batteryMake ||
    !batteryModel ||
    couplingType !== 'AC' ||
    !hasSMS ||
    !hasBackupPanel ||
    (backupOption !== 'Whole Home' && backupOption !== 'Partial Home')
  ) {
    console.log('[APS AC-Coupled String + SMS + Backup] Conditions not met', {
      systemNumber,
      isSystem1: systemNumber === 1,
      isMicro: inverterType === 'microinverter',
    });
    return null;
  }

  // Check if output data available
  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    console.log('[APS AC-Coupled String + SMS + Backup] No inverter output data');
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  // AC-Coupled sizing: BOTH inverter + battery outputs matter
  const inverterOutput = inverterMaxContOutput;
  const batteryOutput = batteryMaxContOutput || 0;
  const totalOutput = inverterOutput + batteryOutput;

  // ============================================
  // BACKUP BOS (Backup Load Sub Panel)
  // Sized to backup panel bus bar rating (NO 1.25x multiplier)
  // ============================================
  const backupAmps = backupPanelBusRating || 200;
  const backupCalculation = `Backup Panel Bus Rating: ${backupAmps}A`;

  // Backup Slot 1: Bi-Directional Meter
  const backupSlot1 = getNextAvailableSlot(existingBOS.backup, 'backup');
  if (backupSlot1) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter',
      position: backupSlot1,
      section: 'backup',
      systemNumber,
      minAmpRating: backupAmps,
      sizingCalculation: backupCalculation,
      blockName: 'ESS',
      isNew: true,
    });
  }

  // Backup Slot 2: Bi-Directional Meter Line Side Disconnect
  const backupSlot2 = getNextAvailableSlot(
    [...existingBOS.backup, ...(backupSlot1 ? [backupSlot1] : [])],
    'backup'
  );
  if (backupSlot2) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter Line Side Disconnect',
      position: backupSlot2,
      section: 'backup',
      systemNumber,
      minAmpRating: backupAmps,
      sizingCalculation: backupCalculation,
      blockName: 'ESS',
      isNew: true,
    });
  }

  // ============================================
  // PRE COMBINE (Between Inverter and SMS)
  // Sized to inverter only × 1.25 (battery charges from grid)
  // ============================================
  const preCombineAmps = Math.ceil(inverterOutput * 1.25);
  const preCombineCalculation = `${inverterOutput}A × 1.25 = ${preCombineAmps}A`;

  // Utility Slot 1: Uni-Directional Meter
  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: preCombineAmps,
      sizingCalculation: preCombineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Utility Slot 2: Utility Disconnect
  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: preCombineAmps,
      sizingCalculation: preCombineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // Utility Slot 3: Uni-Directional Meter Line Side Disconnect
  const utilitySlot3 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : [])],
    'utility'
  );
  if (utilitySlot3) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',
      position: utilitySlot3,
      section: 'utility',
      systemNumber,
      minAmpRating: preCombineAmps,
      sizingCalculation: preCombineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // ============================================
  // POST SMS (After Storage Management System)
  // Sized to BOTH inverter + battery × 1.25 (both can discharge)
  // ============================================
  const postSMSAmps = Math.ceil(totalOutput * 1.25);
  const postSMSCalculation = `(${inverterOutput}A inverter + ${batteryOutput}A battery) × 1.25 = ${postSMSAmps}A`;

  // Post-SMS Slot 1: Bi-Directional Meter DER Side Disconnect
  const postSMSSlot1 = getNextAvailableSlot(existingBOS.postSMS, 'postSMS');
  if (postSMSSlot1) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter DER Side Disconnect',
      position: postSMSSlot1,
      section: 'postSMS',
      systemNumber,
      minAmpRating: postSMSAmps,
      sizingCalculation: postSMSCalculation,
      blockName: 'POST SMS',
      isNew: true,
    });
  }

  // Post-SMS Slot 2: Bi-Directional Meter
  const postSMSSlot2 = getNextAvailableSlot(
    [...existingBOS.postSMS, ...(postSMSSlot1 ? [postSMSSlot1] : [])],
    'postSMS'
  );
  if (postSMSSlot2) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter',
      position: postSMSSlot2,
      section: 'postSMS',
      systemNumber,
      minAmpRating: postSMSAmps,
      sizingCalculation: postSMSCalculation,
      blockName: 'POST SMS',
      isNew: true,
    });
  }

  // Post-SMS Slot 3: Bi-Directional Meter Line Side Disconnect
  const postSMSSlot3 = getNextAvailableSlot(
    [...existingBOS.postSMS, ...(postSMSSlot1 ? [postSMSSlot1] : []), ...(postSMSSlot2 ? [postSMSSlot2] : [])],
    'postSMS'
  );
  if (postSMSSlot3) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter Line Side Disconnect',
      position: postSMSSlot3,
      section: 'postSMS',
      systemNumber,
      minAmpRating: postSMSAmps,
      sizingCalculation: postSMSCalculation,
      blockName: 'POST SMS',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null;
  }

  console.log('[APS AC-Coupled String + SMS + Backup] ✅ MATCHED - returning', bosEquipment.length, 'BOS items');
  console.log('[APS AC-Coupled String + SMS + Backup] Calculations:');
  console.log(`  - Post-SMS: ${postSMSCalculation}`);
  console.log(`  - Pre-Combine: ${preCombineCalculation}`);
  console.log(`  - Backup: ${backupCalculation}`);

  return {
    configId: 'aps-ac-coupled-string-sms-backup',
    configName: 'APS AC-Coupled String Inverter + SMS + Backup',
    description: 'AC-coupled battery system with string inverter, SMS, and backup panel',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * AC-Coupled Detector 2: String Inverter + SMS + No Backup
 * Triggers: AC-coupled + String inverter + Battery + SMS + No backup panel
 * BOS Equipment: 3 Pre-Combine + 2 Post-SMS = 5 items
 */
export function detectAPSACCoupledStringSMSNoBackup(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMake,
    inverterModel,
    inverterType,
    inverterMaxContOutput,
    batteryMake,
    batteryModel,
    batteryQuantity,
    batteryMaxContOutput,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  if (!isAPSUtility(utilityName)) {
    console.log('[APS AC-Coupled String + SMS + No Backup] Not APS utility, skipping');
    return null;
  }

  console.log('[APS AC-Coupled String + SMS + No Backup] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    inverterType,
    batteryQuantity,
    couplingType,
    hasSMS,
    hasBackupPanel,
  });

  if (
    systemNumber !== 1 ||
    !hasSolarPanels ||
    !hasInverter ||
    !inverterMake ||
    !inverterModel ||
    inverterType === 'microinverter' ||
    batteryQuantity === 0 ||
    !batteryMake ||
    !batteryModel ||
    couplingType !== 'AC' ||
    !hasSMS ||
    hasBackupPanel ||
    backupOption === 'Whole Home' ||
    backupOption === 'Partial Home'
  ) {
    console.log('[APS AC-Coupled String + SMS + No Backup] Conditions not met');
    return null;
  }

  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    console.log('[APS AC-Coupled String + SMS + No Backup] No inverter output data');
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  const inverterOutput = inverterMaxContOutput;
  const batteryOutput = batteryMaxContOutput || 0;
  const totalOutput = inverterOutput + batteryOutput;

  // PRE COMBINE (inverter only)
  const preCombineAmps = Math.ceil(inverterOutput * 1.25);
  const preCombineCalculation = `${inverterOutput}A × 1.25 = ${preCombineAmps}A`;

  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: preCombineAmps,
      sizingCalculation: preCombineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: preCombineAmps,
      sizingCalculation: preCombineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot3 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : [])],
    'utility'
  );
  if (utilitySlot3) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',
      position: utilitySlot3,
      section: 'utility',
      systemNumber,
      minAmpRating: preCombineAmps,
      sizingCalculation: preCombineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // POST SMS (inverter + battery)
  const postSMSAmps = Math.ceil(totalOutput * 1.25);
  const postSMSCalculation = `(${inverterOutput}A inverter + ${batteryOutput}A battery) × 1.25 = ${postSMSAmps}A`;

  const postSMSSlot1 = getNextAvailableSlot(existingBOS.postSMS, 'postSMS');
  if (postSMSSlot1) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter DER Side Disconnect',
      position: postSMSSlot1,
      section: 'postSMS',
      systemNumber,
      minAmpRating: postSMSAmps,
      sizingCalculation: postSMSCalculation,
      blockName: 'POST SMS',
      isNew: true,
    });
  }

  const postSMSSlot2 = getNextAvailableSlot(
    [...existingBOS.postSMS, ...(postSMSSlot1 ? [postSMSSlot1] : [])],
    'postSMS'
  );
  if (postSMSSlot2) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter',
      position: postSMSSlot2,
      section: 'postSMS',
      systemNumber,
      minAmpRating: postSMSAmps,
      sizingCalculation: postSMSCalculation,
      blockName: 'POST SMS',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null;
  }

  console.log('[APS AC-Coupled String + SMS + No Backup] ✅ MATCHED - returning', bosEquipment.length, 'BOS items');
  console.log('[APS AC-Coupled String + SMS + No Backup] Calculations:');
  console.log(`  - Post-SMS: ${postSMSCalculation}`);
  console.log(`  - Pre-Combine: ${preCombineCalculation}`);

  return {
    configId: 'aps-ac-coupled-string-sms-no-backup',
    configName: 'APS AC-Coupled String Inverter + SMS (No Backup)',
    description: 'AC-coupled battery system with string inverter and SMS, no backup panel',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * AC-Coupled Detector 3: String Inverter + No SMS + Backup
 * Triggers: AC-coupled + String inverter + Battery + No SMS + Backup panel
 * BOS Equipment: 2 Backup + 5 Pre-Combine = 7 items
 */
export function detectAPSACCoupledStringNoSMSBackup(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMake,
    inverterModel,
    inverterType,
    inverterMaxContOutput,
    batteryMake,
    batteryModel,
    batteryQuantity,
    batteryMaxContOutput,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
    backupPanelBusRating,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  if (!isAPSUtility(utilityName)) {
    console.log('[APS AC-Coupled String + No SMS + Backup] Not APS utility, skipping');
    return null;
  }

  console.log('[APS AC-Coupled String + No SMS + Backup] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    inverterType,
    batteryQuantity,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
  });

  if (
    systemNumber !== 1 ||
    !hasSolarPanels ||
    !hasInverter ||
    !inverterMake ||
    !inverterModel ||
    inverterType === 'microinverter' ||
    batteryQuantity === 0 ||
    !batteryMake ||
    !batteryModel ||
    couplingType !== 'AC' ||
    hasSMS ||
    !hasBackupPanel ||
    (backupOption !== 'Whole Home' && backupOption !== 'Partial Home')
  ) {
    console.log('[APS AC-Coupled String + No SMS + Backup] Conditions not met');
    return null;
  }

  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    console.log('[APS AC-Coupled String + No SMS + Backup] No inverter output data');
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  const inverterOutput = inverterMaxContOutput;
  const batteryOutput = batteryMaxContOutput || 0;
  const totalOutput = inverterOutput + batteryOutput;

  // BACKUP BOS (exact panel rating)
  const backupAmps = backupPanelBusRating || 200;
  const backupCalculation = `Backup Panel Bus Rating: ${backupAmps}A`;

  const backupSlot1 = getNextAvailableSlot(existingBOS.backup, 'backup');
  if (backupSlot1) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter',
      position: backupSlot1,
      section: 'backup',
      systemNumber,
      minAmpRating: backupAmps,
      sizingCalculation: backupCalculation,
      blockName: 'ESS',
      isNew: true,
    });
  }

  const backupSlot2 = getNextAvailableSlot(
    [...existingBOS.backup, ...(backupSlot1 ? [backupSlot1] : [])],
    'backup'
  );
  if (backupSlot2) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter Line Side Disconnect',
      position: backupSlot2,
      section: 'backup',
      systemNumber,
      minAmpRating: backupAmps,
      sizingCalculation: backupCalculation,
      blockName: 'ESS',
      isNew: true,
    });
  }

  // PRE COMBINE (inverter + battery - no SMS)
  const combineAmps = Math.ceil(totalOutput * 1.25);
  const combineCalculation = `(${inverterOutput}A inverter + ${batteryOutput}A battery) × 1.25 = ${combineAmps}A`;

  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot3 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : [])],
    'utility'
  );
  if (utilitySlot3) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',
      position: utilitySlot3,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot4 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : []), ...(utilitySlot3 ? [utilitySlot3] : [])],
    'utility'
  );
  if (utilitySlot4) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter DER Side Disconnect',
      position: utilitySlot4,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot5 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : []), ...(utilitySlot3 ? [utilitySlot3] : []), ...(utilitySlot4 ? [utilitySlot4] : [])],
    'utility'
  );
  if (utilitySlot5) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter',
      position: utilitySlot5,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null;
  }

  console.log('[APS AC-Coupled String + No SMS + Backup] ✅ MATCHED - returning', bosEquipment.length, 'BOS items');
  console.log('[APS AC-Coupled String + No SMS + Backup] Calculations:');
  console.log(`  - Combine: ${combineCalculation}`);
  console.log(`  - Backup: ${backupCalculation}`);

  return {
    configId: 'aps-ac-coupled-string-no-sms-backup',
    configName: 'APS AC-Coupled String Inverter + Backup (No SMS)',
    description: 'AC-coupled battery system with string inverter and backup, no SMS',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * AC-Coupled Detector 4: String Inverter + No SMS + No Backup
 * Triggers: AC-coupled + String inverter + Battery + No SMS + No backup panel
 * BOS Equipment: 4 Pre-Combine = 4 items
 */
export function detectAPSACCoupledStringNoSMSNoBackup(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMake,
    inverterModel,
    inverterType,
    inverterMaxContOutput,
    batteryMake,
    batteryModel,
    batteryQuantity,
    batteryMaxContOutput,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  if (!isAPSUtility(utilityName)) {
    console.log('[APS AC-Coupled String + No SMS + No Backup] Not APS utility, skipping');
    return null;
  }

  console.log('[APS AC-Coupled String + No SMS + No Backup] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    inverterType,
    batteryQuantity,
    couplingType,
    hasSMS,
    hasBackupPanel,
  });

  if (
    systemNumber !== 1 ||
    !hasSolarPanels ||
    !hasInverter ||
    !inverterMake ||
    !inverterModel ||
    inverterType === 'microinverter' ||
    batteryQuantity === 0 ||
    !batteryMake ||
    !batteryModel ||
    couplingType !== 'AC' ||
    hasSMS ||
    hasBackupPanel ||
    backupOption === 'Whole Home' ||
    backupOption === 'Partial Home'
  ) {
    console.log('[APS AC-Coupled String + No SMS + No Backup] Conditions not met');
    return null;
  }

  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    console.log('[APS AC-Coupled String + No SMS + No Backup] No inverter output data');
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  const inverterOutput = inverterMaxContOutput;
  const batteryOutput = batteryMaxContOutput || 0;
  const totalOutput = inverterOutput + batteryOutput;

  // COMBINE (inverter + battery - no SMS, no backup)
  const combineAmps = Math.ceil(totalOutput * 1.25);
  const combineCalculation = `(${inverterOutput}A inverter + ${batteryOutput}A battery) × 1.25 = ${combineAmps}A`;

  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter DER Side Disconnect',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot3 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : [])],
    'utility'
  );
  if (utilitySlot3) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter',
      position: utilitySlot3,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot4 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : []), ...(utilitySlot3 ? [utilitySlot3] : [])],
    'utility'
  );
  if (utilitySlot4) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter Line Side Disconnect',
      position: utilitySlot4,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null;
  }

  console.log('[APS AC-Coupled String + No SMS + No Backup] ✅ MATCHED - returning', bosEquipment.length, 'BOS items');
  console.log('[APS AC-Coupled String + No SMS + No Backup] Calculation: ${combineCalculation}');

  return {
    configId: 'aps-ac-coupled-string-no-sms-no-backup',
    configName: 'APS AC-Coupled String Inverter (No SMS, No Backup)',
    description: 'AC-coupled battery system with string inverter, no SMS, no backup',
    confidence: 'high',
    bosEquipment,
  };
}

// ============================================================================
// AC-COUPLED CONFIGURATIONS - MICROINVERTER
// ============================================================================

/**
 * AC-Coupled Detector 5: Microinverter + SMS + Backup
 * Triggers: AC-coupled + Microinverter + Battery + SMS + Backup panel
 * BOS Equipment: 2 Backup + 3 Pre-Combine + 3 Post-SMS = 8 items
 */
export function detectAPSACCoupledMicroSMSBackup(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMake,
    inverterModel,
    inverterType,
    inverterMaxContOutput,
    batteryMake,
    batteryModel,
    batteryQuantity,
    batteryMaxContOutput,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
    backupPanelBusRating,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  if (!isAPSUtility(utilityName)) {
    console.log('[APS AC-Coupled Micro + SMS + Backup] Not APS utility, skipping');
    return null;
  }

  console.log('[APS AC-Coupled Micro + SMS + Backup] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    inverterType,
    batteryQuantity,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
  });

  // Check for AC-Coupled + Microinverter + SMS + Backup pattern
  if (
    systemNumber !== 1 ||
    !hasSolarPanels ||
    !hasInverter ||
    !inverterMake ||
    !inverterModel ||
    inverterType !== 'microinverter' ||  // MUST be microinverter
    batteryQuantity === 0 ||
    !batteryMake ||
    !batteryModel ||
    couplingType !== 'AC' ||
    !hasSMS ||
    !hasBackupPanel ||
    (backupOption !== 'Whole Home' && backupOption !== 'Partial Home')
  ) {
    console.log('[APS AC-Coupled Micro + SMS + Backup] Conditions not met', {
      systemNumber,
      isSystem1: systemNumber === 1,
      isMicro: inverterType === 'microinverter',
    });
    return null;
  }

  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    console.log('[APS AC-Coupled Micro + SMS + Backup] No inverter output data');
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  const inverterOutput = inverterMaxContOutput;
  const batteryOutput = batteryMaxContOutput || 0;
  const totalOutput = inverterOutput + batteryOutput;

  // BACKUP BOS
  const backupAmps = backupPanelBusRating || 200;
  const backupCalculation = `Backup Panel Bus Rating: ${backupAmps}A`;

  const backupSlot1 = getNextAvailableSlot(existingBOS.backup, 'backup');
  if (backupSlot1) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter',
      position: backupSlot1,
      section: 'backup',
      systemNumber,
      minAmpRating: backupAmps,
      sizingCalculation: backupCalculation,
      blockName: 'ESS',
      isNew: true,
    });
  }

  const backupSlot2 = getNextAvailableSlot(
    [...existingBOS.backup, ...(backupSlot1 ? [backupSlot1] : [])],
    'backup'
  );
  if (backupSlot2) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter Line Side Disconnect',
      position: backupSlot2,
      section: 'backup',
      systemNumber,
      minAmpRating: backupAmps,
      sizingCalculation: backupCalculation,
      blockName: 'ESS',
      isNew: true,
    });
  }

  // PRE COMBINE (microinverter only)
  const preCombineAmps = Math.ceil(inverterOutput * 1.25);
  const preCombineCalculation = `${inverterOutput}A × 1.25 = ${preCombineAmps}A`;

  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: preCombineAmps,
      sizingCalculation: preCombineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: preCombineAmps,
      sizingCalculation: preCombineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot3 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : [])],
    'utility'
  );
  if (utilitySlot3) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',
      position: utilitySlot3,
      section: 'utility',
      systemNumber,
      minAmpRating: preCombineAmps,
      sizingCalculation: preCombineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // POST SMS (microinverter + battery)
  const postSMSAmps = Math.ceil(totalOutput * 1.25);
  const postSMSCalculation = `(${inverterOutput}A microinverter + ${batteryOutput}A battery) × 1.25 = ${postSMSAmps}A`;

  const postSMSSlot1 = getNextAvailableSlot(existingBOS.postSMS, 'postSMS');
  if (postSMSSlot1) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter DER Side Disconnect',
      position: postSMSSlot1,
      section: 'postSMS',
      systemNumber,
      minAmpRating: postSMSAmps,
      sizingCalculation: postSMSCalculation,
      blockName: 'POST SMS',
      isNew: true,
    });
  }

  const postSMSSlot2 = getNextAvailableSlot(
    [...existingBOS.postSMS, ...(postSMSSlot1 ? [postSMSSlot1] : [])],
    'postSMS'
  );
  if (postSMSSlot2) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter',
      position: postSMSSlot2,
      section: 'postSMS',
      systemNumber,
      minAmpRating: postSMSAmps,
      sizingCalculation: postSMSCalculation,
      blockName: 'POST SMS',
      isNew: true,
    });
  }

  const postSMSSlot3 = getNextAvailableSlot(
    [...existingBOS.postSMS, ...(postSMSSlot1 ? [postSMSSlot1] : []), ...(postSMSSlot2 ? [postSMSSlot2] : [])],
    'postSMS'
  );
  if (postSMSSlot3) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter Line Side Disconnect',
      position: postSMSSlot3,
      section: 'postSMS',
      systemNumber,
      minAmpRating: postSMSAmps,
      sizingCalculation: postSMSCalculation,
      blockName: 'POST SMS',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null;
  }

  console.log('[APS AC-Coupled Micro + SMS + Backup] ✅ MATCHED - returning', bosEquipment.length, 'BOS items');
  console.log('[APS AC-Coupled Micro + SMS + Backup] Calculations:');
  console.log(`  - Post-SMS: ${postSMSCalculation}`);
  console.log(`  - Pre-Combine: ${preCombineCalculation}`);
  console.log(`  - Backup: ${backupCalculation}`);

  return {
    configId: 'aps-ac-coupled-micro-sms-backup',
    configName: 'APS AC-Coupled Microinverter + SMS + Backup',
    description: 'AC-coupled battery system with microinverter, SMS, and backup panel',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * AC-Coupled Detector 6: Microinverter + SMS + No Backup
 * Triggers: AC-coupled + Microinverter + Battery + SMS + No backup panel
 * BOS Equipment: 3 Pre-Combine + 2 Post-SMS = 5 items
 */
export function detectAPSACCoupledMicroSMSNoBackup(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMake,
    inverterModel,
    inverterType,
    inverterMaxContOutput,
    batteryMake,
    batteryModel,
    batteryQuantity,
    batteryMaxContOutput,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  if (!isAPSUtility(utilityName)) {
    console.log('[APS AC-Coupled Micro + SMS + No Backup] Not APS utility, skipping');
    return null;
  }

  console.log('[APS AC-Coupled Micro + SMS + No Backup] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    inverterType,
    batteryQuantity,
    couplingType,
    hasSMS,
    hasBackupPanel,
  });

  if (
    systemNumber !== 1 ||
    !hasSolarPanels ||
    !hasInverter ||
    !inverterMake ||
    !inverterModel ||
    inverterType !== 'microinverter' ||
    batteryQuantity === 0 ||
    !batteryMake ||
    !batteryModel ||
    couplingType !== 'AC' ||
    !hasSMS ||
    hasBackupPanel ||
    backupOption === 'Whole Home' ||
    backupOption === 'Partial Home'
  ) {
    console.log('[APS AC-Coupled Micro + SMS + No Backup] Conditions not met');
    return null;
  }

  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    console.log('[APS AC-Coupled Micro + SMS + No Backup] No inverter output data');
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  const inverterOutput = inverterMaxContOutput;
  const batteryOutput = batteryMaxContOutput || 0;
  const totalOutput = inverterOutput + batteryOutput;

  // PRE COMBINE (microinverter only)
  const preCombineAmps = Math.ceil(inverterOutput * 1.25);
  const preCombineCalculation = `${inverterOutput}A × 1.25 = ${preCombineAmps}A`;

  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: preCombineAmps,
      sizingCalculation: preCombineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: preCombineAmps,
      sizingCalculation: preCombineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot3 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : [])],
    'utility'
  );
  if (utilitySlot3) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',
      position: utilitySlot3,
      section: 'utility',
      systemNumber,
      minAmpRating: preCombineAmps,
      sizingCalculation: preCombineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // POST SMS (microinverter + battery)
  const postSMSAmps = Math.ceil(totalOutput * 1.25);
  const postSMSCalculation = `(${inverterOutput}A microinverter + ${batteryOutput}A battery) × 1.25 = ${postSMSAmps}A`;

  const postSMSSlot1 = getNextAvailableSlot(existingBOS.postSMS, 'postSMS');
  if (postSMSSlot1) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter DER Side Disconnect',
      position: postSMSSlot1,
      section: 'postSMS',
      systemNumber,
      minAmpRating: postSMSAmps,
      sizingCalculation: postSMSCalculation,
      blockName: 'POST SMS',
      isNew: true,
    });
  }

  const postSMSSlot2 = getNextAvailableSlot(
    [...existingBOS.postSMS, ...(postSMSSlot1 ? [postSMSSlot1] : [])],
    'postSMS'
  );
  if (postSMSSlot2) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter',
      position: postSMSSlot2,
      section: 'postSMS',
      systemNumber,
      minAmpRating: postSMSAmps,
      sizingCalculation: postSMSCalculation,
      blockName: 'POST SMS',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null;
  }

  console.log('[APS AC-Coupled Micro + SMS + No Backup] ✅ MATCHED - returning', bosEquipment.length, 'BOS items');
  console.log('[APS AC-Coupled Micro + SMS + No Backup] Calculations:');
  console.log(`  - Post-SMS: ${postSMSCalculation}`);
  console.log(`  - Pre-Combine: ${preCombineCalculation}`);

  return {
    configId: 'aps-ac-coupled-micro-sms-no-backup',
    configName: 'APS AC-Coupled Microinverter + SMS (No Backup)',
    description: 'AC-coupled battery system with microinverter and SMS, no backup panel',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * AC-Coupled Detector 7: Microinverter + No SMS + Backup
 * Triggers: AC-coupled + Microinverter + Battery + No SMS + Backup panel
 * BOS Equipment: 2 Backup + 5 Pre-Combine = 7 items
 */
export function detectAPSACCoupledMicroNoSMSBackup(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMake,
    inverterModel,
    inverterType,
    inverterMaxContOutput,
    batteryMake,
    batteryModel,
    batteryQuantity,
    batteryMaxContOutput,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
    backupPanelBusRating,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  if (!isAPSUtility(utilityName)) {
    console.log('[APS AC-Coupled Micro + No SMS + Backup] Not APS utility, skipping');
    return null;
  }

  console.log('[APS AC-Coupled Micro + No SMS + Backup] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    inverterType,
    batteryQuantity,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
  });

  if (
    systemNumber !== 1 ||
    !hasSolarPanels ||
    !hasInverter ||
    !inverterMake ||
    !inverterModel ||
    inverterType !== 'microinverter' ||
    batteryQuantity === 0 ||
    !batteryMake ||
    !batteryModel ||
    couplingType !== 'AC' ||
    hasSMS ||
    !hasBackupPanel ||
    (backupOption !== 'Whole Home' && backupOption !== 'Partial Home')
  ) {
    console.log('[APS AC-Coupled Micro + No SMS + Backup] Conditions not met');
    return null;
  }

  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    console.log('[APS AC-Coupled Micro + No SMS + Backup] No inverter output data');
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  const inverterOutput = inverterMaxContOutput;
  const batteryOutput = batteryMaxContOutput || 0;
  const totalOutput = inverterOutput + batteryOutput;

  // BACKUP BOS
  const backupAmps = backupPanelBusRating || 200;
  const backupCalculation = `Backup Panel Bus Rating: ${backupAmps}A`;

  const backupSlot1 = getNextAvailableSlot(existingBOS.backup, 'backup');
  if (backupSlot1) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter',
      position: backupSlot1,
      section: 'backup',
      systemNumber,
      minAmpRating: backupAmps,
      sizingCalculation: backupCalculation,
      blockName: 'ESS',
      isNew: true,
    });
  }

  const backupSlot2 = getNextAvailableSlot(
    [...existingBOS.backup, ...(backupSlot1 ? [backupSlot1] : [])],
    'backup'
  );
  if (backupSlot2) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter Line Side Disconnect',
      position: backupSlot2,
      section: 'backup',
      systemNumber,
      minAmpRating: backupAmps,
      sizingCalculation: backupCalculation,
      blockName: 'ESS',
      isNew: true,
    });
  }

  // COMBINE (microinverter + battery - no SMS)
  const combineAmps = Math.ceil(totalOutput * 1.25);
  const combineCalculation = `(${inverterOutput}A microinverter + ${batteryOutput}A battery) × 1.25 = ${combineAmps}A`;

  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot3 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : [])],
    'utility'
  );
  if (utilitySlot3) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',
      position: utilitySlot3,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot4 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : []), ...(utilitySlot3 ? [utilitySlot3] : [])],
    'utility'
  );
  if (utilitySlot4) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter DER Side Disconnect',
      position: utilitySlot4,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot5 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : []), ...(utilitySlot3 ? [utilitySlot3] : []), ...(utilitySlot4 ? [utilitySlot4] : [])],
    'utility'
  );
  if (utilitySlot5) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter',
      position: utilitySlot5,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null;
  }

  console.log('[APS AC-Coupled Micro + No SMS + Backup] ✅ MATCHED - returning', bosEquipment.length, 'BOS items');
  console.log('[APS AC-Coupled Micro + No SMS + Backup] Calculations:');
  console.log(`  - Combine: ${combineCalculation}`);
  console.log(`  - Backup: ${backupCalculation}`);

  return {
    configId: 'aps-ac-coupled-micro-no-sms-backup',
    configName: 'APS AC-Coupled Microinverter + Backup (No SMS)',
    description: 'AC-coupled battery system with microinverter and backup, no SMS',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * AC-Coupled Detector 8: Microinverter + No SMS + No Backup
 * Triggers: AC-coupled + Microinverter + Battery + No SMS + No backup panel
 * BOS Equipment: 4 Pre-Combine = 4 items
 */
export function detectAPSACCoupledMicroNoSMSNoBackup(equipment: EquipmentState): ConfigurationMatch | null {
  const {
    utilityName,
    hasSolarPanels,
    inverterMake,
    inverterModel,
    inverterType,
    inverterMaxContOutput,
    batteryMake,
    batteryModel,
    batteryQuantity,
    batteryMaxContOutput,
    couplingType,
    hasSMS,
    hasBackupPanel,
    backupOption,
    existingBOS,
    systemNumber,
    hasInverter,
  } = equipment;

  if (!isAPSUtility(utilityName)) {
    console.log('[APS AC-Coupled Micro + No SMS + No Backup] Not APS utility, skipping');
    return null;
  }

  console.log('[APS AC-Coupled Micro + No SMS + No Backup] Checking conditions:', {
    hasSolarPanels,
    hasInverter,
    inverterType,
    batteryQuantity,
    couplingType,
    hasSMS,
    hasBackupPanel,
  });

  if (
    systemNumber !== 1 ||
    !hasSolarPanels ||
    !hasInverter ||
    !inverterMake ||
    !inverterModel ||
    inverterType !== 'microinverter' ||
    batteryQuantity === 0 ||
    !batteryMake ||
    !batteryModel ||
    couplingType !== 'AC' ||
    hasSMS ||
    hasBackupPanel ||
    backupOption === 'Whole Home' ||
    backupOption === 'Partial Home'
  ) {
    console.log('[APS AC-Coupled Micro + No SMS + No Backup] Conditions not met');
    return null;
  }

  if (!inverterMaxContOutput || inverterMaxContOutput === 0) {
    console.log('[APS AC-Coupled Micro + No SMS + No Backup] No inverter output data');
    return null;
  }

  const bosEquipment: BOSEquipmentItem[] = [];

  const inverterOutput = inverterMaxContOutput;
  const batteryOutput = batteryMaxContOutput || 0;
  const totalOutput = inverterOutput + batteryOutput;

  // COMBINE (microinverter + battery - no SMS, no backup)
  const combineAmps = Math.ceil(totalOutput * 1.25);
  const combineCalculation = `(${inverterOutput}A microinverter + ${batteryOutput}A battery) × 1.25 = ${combineAmps}A`;

  const utilitySlot1 = getNextAvailableSlot(existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot2 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter DER Side Disconnect',
      position: utilitySlot2,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot3 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : [])],
    'utility'
  );
  if (utilitySlot3) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter',
      position: utilitySlot3,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot4 = getNextAvailableSlot(
    [...existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : []), ...(utilitySlot3 ? [utilitySlot3] : [])],
    'utility'
  );
  if (utilitySlot4) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter Line Side Disconnect',
      position: utilitySlot4,
      section: 'utility',
      systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  if (bosEquipment.length === 0) {
    return null;
  }

  console.log('[APS AC-Coupled Micro + No SMS + No Backup] ✅ MATCHED - returning', bosEquipment.length, 'BOS items');
  console.log('[APS AC-Coupled Micro + No SMS + No Backup] Calculation: ${combineCalculation}');

  return {
    configId: 'aps-ac-coupled-micro-no-sms-no-backup',
    configName: 'APS AC-Coupled Microinverter (No SMS, No Backup)',
    description: 'AC-coupled battery system with microinverter, no SMS, no backup',
    confidence: 'high',
    bosEquipment,
  };
}

// ============================================
// TESLA POWERWALL 3 DETECTORS (Equipment-Specific)
// Provides optimized detection for Tesla Powerwall 3 systems
// Must run BEFORE generic AC/DC-coupled detectors
// ============================================

/**
 * Tesla Powerwall 3 Multi-System + Whole Home Backup
 * Detection runs on System 2, checks System 1 for microinverter PV system
 *
 * System 1: Microinverter + Solar (no battery, no SMS)
 * System 2: Tesla PW3 + Gateway 3 + Battery + Whole Home backup
 *
 * BOS: 2 items on sys1, 2 items on sys2 backup, 3 post-combine
 */
export async function detectTeslaPW3MultiSystemWholeHome(
  equipment: EquipmentState,
  fetchSystemDetails: (projectUuid?: string) => Promise<Record<string, any> | null>
): Promise<ConfigurationMatch | null> {
  console.log('[Tesla PW3 Multi-System] Testing Tesla PW3 Multi-System + Whole Home detector...');

  // STEP 1: Must be System 2 for multi-system detection
  if (equipment.systemNumber !== 2) {
    console.log('[Tesla PW3 Multi-System] ❌ Not System 2 (multi-system detection runs on Sys2)');
    return null;
  }

  // STEP 2: Check System 2 criteria
  if (!isAPSUtility(equipment.utilityName)) {
    console.log('[Tesla PW3 Multi-System] ❌ Not APS utility');
    return null;
  }

  // Check if Tesla Powerwall 3
  const isTeslaPW3 = (equipment.inverterMake?.toLowerCase() || '').includes('tesla') ||
                     (equipment.inverterMake?.toLowerCase() || '').includes('powerwall');

  if (!isTeslaPW3) {
    console.log('[Tesla PW3 Multi-System] ❌ Not Tesla Powerwall 3');
    return null;
  }

  // Check if Gateway 3 present (stored in SMS fields)
  const hasGateway3 = equipment.hasSMS &&
                      (equipment.smsMake?.toLowerCase() || '').includes('tesla') &&
                      ((equipment.smsModel?.toLowerCase() || '').includes('gateway 3') ||
                       (equipment.smsModel?.toLowerCase() || '').includes('gateway3'));

  if (!hasGateway3) {
    console.log('[Tesla PW3 Multi-System] ❌ No Gateway 3 (SMS fields)');
    return null;
  }

  // Must have battery
  if (equipment.batteryQuantity === 0) {
    console.log('[Tesla PW3 Multi-System] ❌ No battery present');
    return null;
  }

  // Must be Whole Home backup (NOT Partial Home)
  if (equipment.backupOption !== 'Whole Home') {
    console.log('[Tesla PW3 Multi-System] ❌ Not Whole Home backup');
    return null;
  }

  console.log('[Tesla PW3 Multi-System] ✅ System 2 criteria met, checking System 1...');

  // STEP 3: Fetch and check System 1 equipment
  const systemDetails = await fetchSystemDetails();

  if (!systemDetails) {
    console.log('[Tesla PW3 Multi-System] ❌ Could not fetch system details');
    return null;
  }

  // Extract System 1 equipment state
  const { extractEquipmentState } = await import('../bosEquipmentStateExtractor');
  const sys1Equipment = await extractEquipmentState(systemDetails, 1, equipment.utilityName);

  // Check System 1 criteria
  const sys1Matches =
    sys1Equipment.inverterType === 'microinverter' &&
    sys1Equipment.hasSolarPanels &&
    sys1Equipment.batteryQuantity === 0 &&
    !sys1Equipment.hasSMS;

  if (!sys1Matches) {
    console.log('[Tesla PW3 Multi-System] ❌ System 1 criteria not met');
    console.log('[Tesla PW3 Multi-System] System 1 details:', {
      inverterType: sys1Equipment.inverterType,
      hasSolar: sys1Equipment.hasSolarPanels,
      batteryQty: sys1Equipment.batteryQuantity,
      hasSMS: sys1Equipment.hasSMS,
    });
    return null;
  }

  console.log('[Tesla PW3 Multi-System] ✅ MATCH: Tesla PW3 Multi-System + Whole Home');

  // STEP 4: Calculate BOS sizing (AC-Coupled)
  const inverterOutput = equipment.inverterMaxContOutput || 0;
  const batteryOutput = 48; // Tesla PW3 fixed output (ignore quantity!)
  const totalOutput = inverterOutput + batteryOutput;
  const postCombineAmps = Math.ceil(totalOutput * 1.25);
  const postCombineCalculation = `(${inverterOutput}A inverter + ${batteryOutput}A battery) × 1.25 = ${postCombineAmps}A`;

  const backupPanelAmps = equipment.backupPanelBusRating || 200;

  console.log('[Tesla PW3 Multi-System] Calculations:');
  console.log(`  - Post-Combine (AC-Coupled): ${postCombineCalculation}`);
  console.log(`  - Backup Panel: ${backupPanelAmps}A`);
  console.log(`  - Note: Tesla PW3 always 48A (quantity ignored)`);

  const bosEquipment: BOSEquipmentItem[] = [];

  // ========== SYSTEM 1 BOS (Pre-Combine) ==========
  // 1. System 1 Uni-Directional Meter
  const sys1UtilitySlot1 = getNextAvailableSlot(sys1Equipment.existingBOS.utility, 'utility');
  if (sys1UtilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: sys1UtilitySlot1,
      section: 'utility',
      systemNumber: 1,
      minAmpRating: 100, // Fixed for microinverter system
      sizingCalculation: '100A (standard microinverter)',
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // 2. System 1 Line Side Disconnect
  const sys1UtilitySlot2 = getNextAvailableSlot(
    [...sys1Equipment.existingBOS.utility, ...(sys1UtilitySlot1 ? [sys1UtilitySlot1] : [])],
    'utility'
  );
  if (sys1UtilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',
      position: sys1UtilitySlot2,
      section: 'utility',
      systemNumber: 1,
      minAmpRating: 100,
      sizingCalculation: '100A (standard microinverter)',
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  // ========== SYSTEM 2 BACKUP BOS ==========
  // 3. System 2 Backup Uni-Directional Meter
  const sys2BackupSlot1 = getNextAvailableSlot(equipment.existingBOS.backup, 'backup');
  if (sys2BackupSlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: sys2BackupSlot1,
      section: 'backup',
      systemNumber: 2,
      minAmpRating: backupPanelAmps,
      sizingCalculation: `${backupPanelAmps}A (backup panel bus rating)`,
      blockName: 'ESS',
      isNew: true,
    });
  }

  // 4. System 2 Backup Line Side Disconnect
  const sys2BackupSlot2 = getNextAvailableSlot(
    [...equipment.existingBOS.backup, ...(sys2BackupSlot1 ? [sys2BackupSlot1] : [])],
    'backup'
  );
  if (sys2BackupSlot2) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',
      position: sys2BackupSlot2,
      section: 'backup',
      systemNumber: 2,
      minAmpRating: backupPanelAmps,
      sizingCalculation: `${backupPanelAmps}A (backup panel bus rating)`,
      blockName: 'ESS',
      isNew: true,
    });
  }

  // ========== POST-COMBINE BOS ==========
  // Combines ALL systems, renders on utility section
  const utilitySlot1 = getNextAvailableSlot(equipment.existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter DER Side Disconnect',
      position: utilitySlot1,
      section: 'utility',
      systemNumber: 2,
      minAmpRating: postCombineAmps,
      sizingCalculation: postCombineCalculation,
      blockName: 'POST COMBINE',
      isNew: true,
    });
  }

  const utilitySlot2 = getNextAvailableSlot(
    [...equipment.existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter',
      position: utilitySlot2,
      section: 'utility',
      systemNumber: 2,
      minAmpRating: postCombineAmps,
      sizingCalculation: postCombineCalculation,
      blockName: 'POST COMBINE',
      isNew: true,
    });
  }

  const utilitySlot3 = getNextAvailableSlot(
    [...equipment.existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : [])],
    'utility'
  );
  if (utilitySlot3) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: utilitySlot3,
      section: 'utility',
      systemNumber: 2,
      minAmpRating: postCombineAmps,
      sizingCalculation: postCombineCalculation,
      blockName: 'POST COMBINE',
      isNew: true,
    });
  }

  return {
    configId: 'tesla-pw3-multi-whole-home',
    configName: 'Tesla Powerwall 3 + Gateway 3 + APS Whole Home (Multi-System)',
    description: 'Multi-system: PV (Sys1) + Tesla PW3 (Sys2), Whole Home backup',
    confidence: 'high',
    bosEquipment,
  };
}

/**
 * Tesla Powerwall 3 Single-System + Any Backup
 * Simpler detection for single-system Tesla PW3 configurations
 *
 * System 1: Tesla PW3 + Battery + Any backup option
 *
 * BOS: 2 backup items (if backup panel present) + 5 utility items
 */
export function detectTeslaPW3SingleSystem(equipment: EquipmentState): ConfigurationMatch | null {
  console.log('[Tesla PW3 Single-System] Testing Tesla PW3 Single-System detector...');

  // Must be System 1 for single-system
  if (equipment.systemNumber !== 1) {
    console.log('[Tesla PW3 Single-System] ❌ Not System 1');
    return null;
  }

  if (!isAPSUtility(equipment.utilityName)) {
    console.log('[Tesla PW3 Single-System] ❌ Not APS utility');
    return null;
  }

  // Check if Tesla Powerwall 3
  const isTeslaPW3 = (equipment.inverterMake?.toLowerCase() || '').includes('tesla') ||
                     (equipment.inverterMake?.toLowerCase() || '').includes('powerwall');

  if (!isTeslaPW3) {
    console.log('[Tesla PW3 Single-System] ❌ Not Tesla Powerwall 3');
    return null;
  }

  // Must have battery
  if (equipment.batteryQuantity === 0) {
    console.log('[Tesla PW3 Single-System] ❌ No battery present');
    return null;
  }

  // Must have backup (Partial OR Whole Home)
  if (!equipment.backupOption || equipment.backupOption === 'None') {
    console.log('[Tesla PW3 Single-System] ❌ No backup configured');
    return null;
  }

  console.log('[Tesla PW3 Single-System] ✅ MATCH: Tesla PW3 Single-System');

  // Calculate BOS sizing (AC-Coupled)
  const inverterOutput = equipment.inverterMaxContOutput || 0;
  const batteryOutput = 48; // Tesla PW3 fixed output
  const totalOutput = inverterOutput + batteryOutput;
  const combineAmps = Math.ceil(totalOutput * 1.25);
  const combineCalculation = `(${inverterOutput}A inverter + ${batteryOutput}A battery) × 1.25 = ${combineAmps}A`;

  const backupPanelAmps = equipment.backupPanelBusRating || 200;
  const hasBackupPanel = equipment.hasBackupPanel;

  console.log('[Tesla PW3 Single-System] Calculations:');
  console.log(`  - Combine (AC-Coupled): ${combineCalculation}`);
  console.log(`  - Backup Panel: ${hasBackupPanel ? backupPanelAmps + 'A' : 'None'}`);
  console.log(`  - Backup Option: ${equipment.backupOption}`);

  const bosEquipment: BOSEquipmentItem[] = [];

  // Backup BOS (only if backup panel present)
  if (hasBackupPanel) {
    const backupSlot1 = getNextAvailableSlot(equipment.existingBOS.backup, 'backup');
    if (backupSlot1) {
      bosEquipment.push({
        equipmentType: 'Uni-Directional Meter',
        position: backupSlot1,
        section: 'backup',
        systemNumber: equipment.systemNumber,
        minAmpRating: backupPanelAmps,
        sizingCalculation: `${backupPanelAmps}A (backup panel bus rating)`,
        blockName: 'ESS',
        isNew: true,
      });
    }

    const backupSlot2 = getNextAvailableSlot(
      [...equipment.existingBOS.backup, ...(backupSlot1 ? [backupSlot1] : [])],
      'backup'
    );
    if (backupSlot2) {
      bosEquipment.push({
        equipmentType: 'Uni-Directional Meter Line Side Disconnect',
        position: backupSlot2,
        section: 'backup',
        systemNumber: equipment.systemNumber,
        minAmpRating: backupPanelAmps,
        sizingCalculation: `${backupPanelAmps}A (backup panel bus rating)`,
        blockName: 'ESS',
        isNew: true,
      });
    }
  }

  // Utility BOS (always present)
  const utilitySlot1 = getNextAvailableSlot(equipment.existingBOS.utility, 'utility');
  if (utilitySlot1) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter',
      position: utilitySlot1,
      section: 'utility',
      systemNumber: equipment.systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot2 = getNextAvailableSlot(
    [...equipment.existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : [])],
    'utility'
  );
  if (utilitySlot2) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter DER Side Disconnect',
      position: utilitySlot2,
      section: 'utility',
      systemNumber: equipment.systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot3 = getNextAvailableSlot(
    [...equipment.existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : [])],
    'utility'
  );
  if (utilitySlot3) {
    bosEquipment.push({
      equipmentType: 'Bi-Directional Meter',
      position: utilitySlot3,
      section: 'utility',
      systemNumber: equipment.systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot4 = getNextAvailableSlot(
    [...equipment.existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : []), ...(utilitySlot3 ? [utilitySlot3] : [])],
    'utility'
  );
  if (utilitySlot4) {
    bosEquipment.push({
      equipmentType: 'Utility Disconnect',
      position: utilitySlot4,
      section: 'utility',
      systemNumber: equipment.systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  const utilitySlot5 = getNextAvailableSlot(
    [...equipment.existingBOS.utility, ...(utilitySlot1 ? [utilitySlot1] : []), ...(utilitySlot2 ? [utilitySlot2] : []), ...(utilitySlot3 ? [utilitySlot3] : []), ...(utilitySlot4 ? [utilitySlot4] : [])],
    'utility'
  );
  if (utilitySlot5) {
    bosEquipment.push({
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',
      position: utilitySlot5,
      section: 'utility',
      systemNumber: equipment.systemNumber,
      minAmpRating: combineAmps,
      sizingCalculation: combineCalculation,
      blockName: 'PRE COMBINE',
      isNew: true,
    });
  }

  return {
    configId: 'tesla-pw3-single',
    configName: `Tesla Powerwall 3 + APS ${equipment.backupOption}`,
    description: `Single-system Tesla Powerwall 3, ${equipment.backupOption} backup`,
    confidence: 'high',
    bosEquipment,
  };
}
