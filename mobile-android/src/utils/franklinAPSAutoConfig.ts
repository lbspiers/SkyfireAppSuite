// src/utils/franklinAPSAutoConfig.ts
// Franklin Battery + APS Auto-Configuration Utility

import { EQUIPMENT_CATALOG } from './constants';
import { saveSystemDetailsPartialExact } from '../screens/Project/SystemDetails/services/equipmentService';

/**
 * Equipment state interface for detection
 */
export interface EquipmentStateForDetection {
  // Utility
  utilityName?: string;

  // Solar
  hasSolarPanels: boolean;
  solarMake?: string;
  solarModel?: string;

  // Inverter/Micro
  microMake?: string;
  microModel?: string;
  inverterMake?: string;
  inverterModel?: string;

  // SMS
  smsMake?: string;
  smsModel?: string;

  // Battery
  battery1Make?: string;
  battery1Model?: string;
  battery1Quantity?: number;

  // Backup
  backupOption?: string;

  // BOS Equipment (existing)
  existingUtilityBOS?: Array<{ equipmentType: string; make: string; model: string; ampRating: string }>;
  existingBatteryBOS?: Array<{ equipmentType: string; make: string; model: string; ampRating: string }>;
}

/**
 * BOS Equipment configuration
 */
export interface BOSEquipment {
  equipmentType: string;
  make: string;
  model: string;
  ampRating: string;
  isNew: boolean;
}

/**
 * Auto-configuration result
 */
export interface AutoConfigResult {
  success: boolean;
  utilityBOS: BOSEquipment[];
  batteryBOS: BOSEquipment[];
  smsEquipment?: {
    make: string;
    model: string;
  };
  message: string;
}

/**
 * Check if the current configuration meets Franklin + APS auto-configuration criteria
 */
export function isFranklinAPSConfiguration(equipment: EquipmentStateForDetection): boolean {
  console.log('[Franklin Auto-Config] Checking detection criteria:', {
    utility: equipment.utilityName,
    hasSolar: equipment.hasSolarPanels,
    smsMake: equipment.smsMake,
    smsModel: equipment.smsModel,
    battery1Make: equipment.battery1Make,
    battery1Model: equipment.battery1Model,
    backupOption: equipment.backupOption,
  });

  // Criterion 1: Utility = "APS"
  if (equipment.utilityName !== 'APS') {
    console.log('[Franklin Auto-Config] ❌ Utility is not APS:', equipment.utilityName);
    return false;
  }

  // Criterion 2: Has Solar (either micro-inverter OR inverter path)
  const hasSolar = equipment.hasSolarPanels &&
    ((equipment.microMake && equipment.microModel) || (equipment.inverterMake && equipment.inverterModel));

  if (!hasSolar) {
    console.log('[Franklin Auto-Config] ❌ No solar panels detected');
    return false;
  }

  // Criterion 3: Has Franklin SMS (Make contains "Franklin" AND Model contains "Agate")
  const hasFranklinSMS =
    equipment.smsMake?.toLowerCase().includes('franklin') &&
    equipment.smsModel?.toLowerCase().includes('agate');

  if (!hasFranklinSMS) {
    console.log('[Franklin Auto-Config] ❌ No Franklin Agate SMS detected');
    return false;
  }

  // Criterion 4: Has Franklin Battery (Make="Franklin" AND Model contains "aPower")
  const hasFranklinBattery =
    equipment.battery1Make?.toLowerCase().includes('franklin') &&
    equipment.battery1Model?.toLowerCase().includes('apower') &&
    (equipment.battery1Quantity ?? 0) > 0;

  if (!hasFranklinBattery) {
    console.log('[Franklin Auto-Config] ❌ No Franklin aPower battery detected');
    return false;
  }

  // Criterion 5: Backup Setting = "Whole Home"
  if (equipment.backupOption !== 'Whole Home') {
    console.log('[Franklin Auto-Config] ❌ Backup option is not "Whole Home":', equipment.backupOption);
    return false;
  }

  console.log('[Franklin Auto-Config] ✅ All criteria met - Franklin + APS configuration detected!');
  return true;
}

/**
 * Check if equipment type already exists in the existing BOS array
 */
function equipmentTypeExists(equipmentType: string, existingBOS?: Array<{ equipmentType: string }>): boolean {
  if (!existingBOS || existingBOS.length === 0) return false;
  return existingBOS.some(item => item.equipmentType === equipmentType);
}

/**
 * Find equipment in catalog by type, make, and amp rating
 * Auto-selects make and model if only one option exists
 */
function findEquipmentInCatalog(
  equipmentType: string,
  ampRating: number,
  preferredMake?: string
): { make: string; model: string; ampRating: string } | null {
  // Filter catalog by equipment type and amp rating >= required
  const matchingItems = EQUIPMENT_CATALOG.filter(item =>
    item.type.toLowerCase() === equipmentType.toLowerCase() &&
    parseFloat(item.amp) >= ampRating
  );

  if (matchingItems.length === 0) {
    console.log(`[Franklin Auto-Config] No equipment found for type "${equipmentType}" with amp >= ${ampRating}`);
    return null;
  }

  // Get the smallest amp rating that meets the requirement
  const minAmp = Math.min(...matchingItems.map(item => parseFloat(item.amp)));
  const itemsWithMinAmp = matchingItems.filter(item => parseFloat(item.amp) === minAmp);

  // Get unique makes for this amp rating
  const uniqueMakes = [...new Set(itemsWithMinAmp.map(item => item.make))];

  let selectedMake: string;

  // If preferred make is specified and available, use it
  if (preferredMake && uniqueMakes.includes(preferredMake)) {
    selectedMake = preferredMake;
  } else if (uniqueMakes.length === 1) {
    // Auto-select if only one make available
    selectedMake = uniqueMakes[0];
  } else {
    // Multiple makes available, return null (cannot auto-select)
    console.log(`[Franklin Auto-Config] Multiple makes available for "${equipmentType}" at ${minAmp}A:`, uniqueMakes);
    return null;
  }

  // Get unique models for selected make
  const modelsForMake = itemsWithMinAmp.filter(item => item.make === selectedMake);
  const uniqueModels = [...new Set(modelsForMake.map(item => item.model))];

  if (uniqueModels.length === 1) {
    // Auto-select model
    return {
      make: selectedMake,
      model: uniqueModels[0],
      ampRating: minAmp.toString(),
    };
  } else {
    // Multiple models available, cannot auto-select
    console.log(`[Franklin Auto-Config] Multiple models available for ${selectedMake} at ${minAmp}A:`, uniqueModels);
    return null;
  }
}

/**
 * Auto-configure Franklin Battery + APS BOS equipment
 */
export function autoConfigureFranklinBOS(
  equipment: EquipmentStateForDetection,
  maxContinuousOutputAmps: number
): AutoConfigResult {
  console.log('[Franklin Auto-Config] Starting auto-configuration', {
    maxContinuousOutputAmps,
  });

  const result: AutoConfigResult = {
    success: false,
    utilityBOS: [],
    batteryBOS: [],
    message: '',
  };

  try {
    // Calculate required amp rating (1.25x safety factor)
    const minRequiredAmps = maxContinuousOutputAmps * 1.25;
    console.log(`[Franklin Auto-Config] Calculated min required amps: ${minRequiredAmps.toFixed(2)}A (${maxContinuousOutputAmps}A * 1.25)`);

    // PART 1: Utility BOS Equipment (Slots 1-2)

    // Slot 1: Uni-Directional Meter (Fixed: Milbank U5929XL @ 100A)
    if (!equipmentTypeExists('Uni-Directional Meter', equipment.existingUtilityBOS)) {
      result.utilityBOS.push({
        equipmentType: 'Uni-Directional Meter',
        make: 'Milbank',
        model: 'U5929XL',
        ampRating: '100',
        isNew: true,
      });
      console.log('[Franklin Auto-Config] ✅ Added Uni-Directional Meter');
    } else {
      console.log('[Franklin Auto-Config] ⏭️  Skipped Uni-Directional Meter (already exists)');
    }

    // Slot 2: Uni-Directional Meter Line Side Disconnect
    if (!equipmentTypeExists('Uni-Directional Meter Line Side Disconnect', equipment.existingUtilityBOS)) {
      const lineSideDisconnect = findEquipmentInCatalog(
        'Uni-Directional Meter Line Side Disconnect',
        minRequiredAmps,
        'Siemens' // Preferred make
      );

      if (lineSideDisconnect) {
        result.utilityBOS.push({
          equipmentType: 'Uni-Directional Meter Line Side Disconnect',
          ...lineSideDisconnect,
          isNew: true,
        });
        console.log('[Franklin Auto-Config] ✅ Added Uni-Directional Meter Line Side Disconnect');
      } else {
        console.log('[Franklin Auto-Config] ⚠️  Could not auto-select Uni-Directional Meter Line Side Disconnect');
      }
    } else {
      console.log('[Franklin Auto-Config] ⏭️  Skipped Uni-Directional Meter Line Side Disconnect (already exists)');
    }

    // PART 2: Battery BOS Equipment (Slots 1-3)

    // Battery Slot 1: Bi-Directional Meter DER Side Disconnect
    if (!equipmentTypeExists('Bi-Directional Meter DER Side Disconnect', equipment.existingBatteryBOS)) {
      const derSideDisconnect = findEquipmentInCatalog(
        'Bi-Directional Meter DER Side Disconnect',
        minRequiredAmps
      );

      if (derSideDisconnect) {
        result.batteryBOS.push({
          equipmentType: 'Bi-Directional Meter DER Side Disconnect',
          ...derSideDisconnect,
          isNew: true,
        });
        console.log('[Franklin Auto-Config] ✅ Added Bi-Directional Meter DER Side Disconnect');
      } else {
        console.log('[Franklin Auto-Config] ⚠️  Could not auto-select Bi-Directional Meter DER Side Disconnect');
      }
    } else {
      console.log('[Franklin Auto-Config] ⏭️  Skipped Bi-Directional Meter DER Side Disconnect (already exists)');
    }

    // Battery Slot 2: Bi-Directional Meter
    if (!equipmentTypeExists('Bi-Directional Meter', equipment.existingBatteryBOS)) {
      const biDirectionalMeter = findEquipmentInCatalog(
        'Bi-Directional Meter',
        minRequiredAmps
      );

      if (biDirectionalMeter) {
        result.batteryBOS.push({
          equipmentType: 'Bi-Directional Meter',
          ...biDirectionalMeter,
          isNew: true,
        });
        console.log('[Franklin Auto-Config] ✅ Added Bi-Directional Meter');
      } else {
        console.log('[Franklin Auto-Config] ⚠️  Could not auto-select Bi-Directional Meter');
      }
    } else {
      console.log('[Franklin Auto-Config] ⏭️  Skipped Bi-Directional Meter (already exists)');
    }

    // Battery Slot 3: Bi-Directional Meter Line Side Disconnect
    if (!equipmentTypeExists('Bi-Directional Meter Line Side Disconnect', equipment.existingBatteryBOS)) {
      const lineSideDisconnect = findEquipmentInCatalog(
        'Bi-Directional Meter Line Side Disconnect',
        minRequiredAmps
      );

      if (lineSideDisconnect) {
        result.batteryBOS.push({
          equipmentType: 'Bi-Directional Meter Line Side Disconnect',
          ...lineSideDisconnect,
          isNew: true,
        });
        console.log('[Franklin Auto-Config] ✅ Added Bi-Directional Meter Line Side Disconnect');
      } else {
        console.log('[Franklin Auto-Config] ⚠️  Could not auto-select Bi-Directional Meter Line Side Disconnect');
      }
    } else {
      console.log('[Franklin Auto-Config] ⏭️  Skipped Bi-Directional Meter Line Side Disconnect (already exists)');
    }

    // Build success message
    const totalAdded = result.utilityBOS.length + result.batteryBOS.length;
    if (totalAdded > 0) {
      result.success = true;
      result.message = `Successfully configured ${totalAdded} BOS equipment items for Franklin + APS installation.`;
    } else {
      result.success = true;
      result.message = 'All required BOS equipment is already configured.';
    }

    console.log('[Franklin Auto-Config] ✅ Auto-configuration complete:', result);
    return result;

  } catch (error) {
    console.error('[Franklin Auto-Config] ❌ Error during auto-configuration:', error);
    result.success = false;
    result.message = `Auto-configuration failed: ${error}`;
    return result;
  }
}

/**
 * Save auto-configured BOS equipment to database
 */
export async function saveFranklinAutoConfig(
  projectId: string,
  systemPrefix: string,
  utilityBOS: BOSEquipment[],
  batteryBOS: BOSEquipment[]
): Promise<boolean> {
  try {
    console.log('[Franklin Auto-Config] Saving to database...', {
      projectId,
      systemPrefix,
      utilityBOSCount: utilityBOS.length,
      batteryBOSCount: batteryBOS.length,
    });

    const payload: Record<string, any> = {};

    // Save Utility BOS Equipment (BOS Type 1 and Type 2)
    utilityBOS.forEach((item, index) => {
      const bosType = index === 0 ? 'bos_type_1' : 'bos_type_2';
      payload[`${systemPrefix}${bosType}_equipment_type`] = item.equipmentType;
      payload[`${systemPrefix}${bosType}_amp_rating`] = item.ampRating;
      payload[`${systemPrefix}${bosType}_make`] = item.make;
      payload[`${systemPrefix}${bosType}_model`] = item.model;
      payload[`${systemPrefix}${bosType}_existing`] = !item.isNew;
    });

    // Save Battery BOS Equipment (Post-SMS BOS Type 1, 2, 3)
    batteryBOS.forEach((item, index) => {
      const bosType = index === 0 ? 'post_sms_bos_type_1' : index === 1 ? 'post_sms_bos_type_2' : 'post_sms_bos_type_3';
      payload[`${systemPrefix}${bosType}_equipment_type`] = item.equipmentType;
      payload[`${systemPrefix}${bosType}_amp_rating`] = item.ampRating;
      payload[`${systemPrefix}${bosType}_make`] = item.make;
      payload[`${systemPrefix}${bosType}_model`] = item.model;
      payload[`${systemPrefix}${bosType}_existing`] = !item.isNew;
    });

    console.log('[Franklin Auto-Config] Saving payload:', payload);

    await saveSystemDetailsPartialExact(projectId, payload);

    console.log('[Franklin Auto-Config] ✅ Successfully saved to database');
    return true;
  } catch (error) {
    console.error('[Franklin Auto-Config] ❌ Error saving to database:', error);
    return false;
  }
}
