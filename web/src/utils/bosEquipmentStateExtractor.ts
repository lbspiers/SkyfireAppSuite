/**
 * BOS Equipment State Extractor
 * Extracts equipment data from systemDetails for BOS configuration detection
 */

import { EquipmentState } from '../types/bosConfigurationTypes';
import { determineCouplingType } from './inverterTypeDetection';
// @ts-ignore - equipmentService is a JS file
import { getBatteryModels } from '../services/equipmentService.js';

/**
 * Known microinverter manufacturers
 */
const MICROINVERTER_MANUFACTURERS = [
  'enphase',
  'hoymiles',
  'hoymiles power',
  'apsystems',
  'ap systems',
  'iq', // Enphase IQ series
];

/**
 * Check if make is a known microinverter manufacturer
 */
function isKnownMicroinverterMake(make: string): boolean {
  const makeLower = (make || '').toLowerCase().trim();
  return MICROINVERTER_MANUFACTURERS.some(mfr => makeLower.includes(mfr));
}

/**
 * Intelligently detect inverter type with fallback strategies
 */
function extractInverterType(
  systemDetails: Record<string, any>,
  prefix: string
): 'microinverter' | 'inverter' | '' {
  // Strategy 1: Direct field lookup
  const directType = systemDetails[`${prefix}_inverter_type`];
  if (directType === 'microinverter' || directType === 'inverter') {
    console.log('[InverterType] Strategy 1 - Direct field:', directType);
    return directType;
  }

  // Strategy 2: Check selectedsystem field
  const selectedSystem = systemDetails[`${prefix}_selectedsystem`];
  if (selectedSystem?.toLowerCase() === 'microinverter') {
    console.log('[InverterType] Strategy 2 - selectedsystem: microinverter');
    return 'microinverter';
  }
  if (selectedSystem?.toLowerCase() === 'inverter') {
    console.log('[InverterType] Strategy 2 - selectedsystem: inverter');
    return 'inverter';
  }

  // Strategy 3: Infer from inverter make
  const inverterMake = systemDetails[`${prefix}_micro_inverter_make`] || '';
  if (isKnownMicroinverterMake(inverterMake)) {
    console.log('[InverterType] Strategy 3 - Inferred from make:', inverterMake, '-> microinverter');
    return 'microinverter';
  }

  // Strategy 4: If model exists but no type, default to string inverter
  const inverterModel = systemDetails[`${prefix}_micro_inverter_model`] || '';
  if (inverterModel) {
    console.log('[InverterType] Strategy 4 - Default from model presence: inverter');
    return 'inverter';
  }

  console.log('[InverterType] No type detected - empty');
  return '';
}

/**
 * Extract equipment state for a specific system
 * IMPORTANT: This function is now async to support battery API lookup
 */
export async function extractEquipmentState(
  systemDetails: Record<string, any>,
  systemNumber: 1 | 2 | 3 | 4,
  utilityName?: string
): Promise<EquipmentState> {
  const prefix = `sys${systemNumber}`;
  const systemPrefix = `${prefix}_` as 'sys1_' | 'sys2_' | 'sys3_' | 'sys4_';

  // ============================================
  // Solar Panels - CORRECT FIELD NAMES
  // ============================================
  const solarMake = systemDetails[`${prefix}_solar_panel_make`] || '';
  const solarModel = systemDetails[`${prefix}_solar_panel_model`] || '';
  const hasSolarPanels = !!(solarMake && solarModel);
  const solarQuantity = parseInt(systemDetails[`${prefix}_solar_panel_qty`]) || 0;
  const solarWattage = parseInt(systemDetails[`${prefix}_solar_panel_wattage`]) || 0;
  // INVERSION: _existing=true means isNew=false
  const solarPanelIsNew = !systemDetails[`${prefix}_solar_panel_existing`];

  // ============================================
  // Inverter / Microinverter - CORRECT FIELD NAMES
  // NOTE: Field is "micro_inverter" even for string inverters!
  // ============================================
  const inverterMake = systemDetails[`${prefix}_micro_inverter_make`] || '';
  const inverterModel = systemDetails[`${prefix}_micro_inverter_model`] || '';
  // Use intelligent detection with fallback strategies
  const inverterType = extractInverterType(systemDetails, prefix);
  const inverterMaxContOutput = parseFloat(systemDetails[`${prefix}_inv_max_continuous_output`]) || 0;
  const inverterQty = parseInt(systemDetails[`${prefix}_micro_inverter_qty`]) || 1;
  // INVERSION: micro_inverter_existing=true means isNew=false
  const inverterIsNew = !systemDetails[`${prefix}_micro_inverter_existing`];

  // For microinverters: aggregate breaker for amp sizing
  const aggregatePVBreaker = parseInt(systemDetails[`${prefix}_aggregate_pv_breaker`]) || 0;

  // ============================================
  // Battery Type 1 - CORRECT FIELD NAMES
  // ============================================
  const battery1Make = systemDetails[`${prefix}_battery_1_make`] || '';
  const battery1Model = systemDetails[`${prefix}_battery_1_model`] || '';
  const battery1Qty = parseInt(systemDetails[`${prefix}_battery_1_qty`]) || 0;
  const hasBattery = !!(battery1Make && battery1Model && battery1Qty > 0);
  // INVERSION
  const battery1IsNew = !systemDetails[`${prefix}_battery_1_existing`];

  // Battery 1 max continuous output (for AC-coupled BOS sizing)
  const battery1MaxContOutput = parseFloat(systemDetails[`${prefix}_battery_1_max_continuous_output`]) || 0;
  console.log('[BatteryOutput] System', systemNumber, 'battery max output:', battery1MaxContOutput, 'A');

  // ============================================
  // Coupling Type Detection - DC vs AC
  // Priority 1: Battery API lookup (most accurate)
  // Priority 2: Inverter type inference (fallback)
  // ============================================
  let batteryCoupleType: 'AC' | 'DC' | undefined;

  if (battery1Qty > 0 && battery1Make && battery1Model) {
    try {
      console.log(`[CouplingType] 🔍 Fetching couple_type from battery API for ${battery1Make} ${battery1Model}...`);

      // Call battery API
      const response = await getBatteryModels(battery1Make);
      const batteries = response?.data || [];

      // Find matching battery by model or model_number
      const matchedBattery = batteries.find(
        (b: any) =>
          b.model === battery1Model ||
          b.model_number === battery1Model ||
          b.name === battery1Model
      );

      if (matchedBattery?.couple_type) {
        const apiCoupleType = matchedBattery.couple_type.toUpperCase();
        batteryCoupleType = apiCoupleType === 'DC' ? 'DC' : 'AC';
        console.log(`[CouplingType] ✅ Battery API returned couple_type: ${batteryCoupleType}`);
      } else {
        console.log(`[CouplingType] ⚠️ Battery found but no couple_type field`);
      }
    } catch (error) {
      console.error(`[CouplingType] ❌ Battery API error:`, error);
    }
  }

  // Determine final coupling type with fallback chain
  const couplingType = determineCouplingType(inverterModel, batteryCoupleType, battery1Qty);

  console.log('[CouplingType] System', systemNumber, 'detection:', {
    battery1Make,
    battery1Model,
    battery1Qty,
    inverterModel,
    batteryCoupleType: batteryCoupleType || 'not found',
    determinedCouplingType: couplingType,
    source: batteryCoupleType ? 'battery API' : 'inverter inference',
  });

  // ============================================
  // SMS (Storage Management System) - CORRECT FIELD NAMES
  // Treat "No SMS" as absence of SMS equipment
  // ============================================
  const smsMake = systemDetails[`${prefix}_sms_make`] || '';
  const smsModel = systemDetails[`${prefix}_sms_model`] || '';
  const hasSMS = !!(smsMake && smsModel) &&
                 smsMake?.toLowerCase() !== 'no sms' &&
                 smsModel?.toLowerCase() !== 'no sms';
  const smsIsNew = !systemDetails[`${prefix}_sms_existing`];

  // ============================================
  // Backup Load Sub Panel - CORRECT FIELD NAMES
  // NOTE: Uses bls{N}_ prefix for System 1, sys{N}_ for Systems 2-4
  // ============================================
  const backupMake = systemNumber === 1
    ? systemDetails[`bls${systemNumber}_backup_load_sub_panel_make`] || ''
    : systemDetails[`${prefix}_backuploadsubpanel_make`] || '';
  const backupModel = systemNumber === 1
    ? systemDetails[`bls${systemNumber}_backup_load_sub_panel_model`] || ''
    : systemDetails[`${prefix}_backuploadsubpanel_model`] || '';
  const hasBackupPanel = !!(backupMake && backupModel);

  // Bus bar rating field (for DC-coupled BOS sizing)
  const backupPanelBusRating = systemNumber === 1
    ? parseInt(systemDetails[`bls${systemNumber}_backuploader_bus_bar_rating`]) || undefined
    : parseInt(systemDetails[`${prefix}_backuploadsubpanel_bus_rating`]) || undefined;

  const backupBusRating = backupPanelBusRating || 200; // Default 200A if not specified
  const backupIsNew = systemNumber === 1
    ? !systemDetails[`bls${systemNumber}_backuploader_existing`]
    : !systemDetails[`${prefix}_backuploadsubpanel_existing`];
  const backupOption = systemDetails[`${prefix}_backup_option`] || '';

  // ============================================
  // Utility name - USE PASSED VALUE FIRST
  // ============================================
  const utility = utilityName || systemDetails.utility || systemDetails.site?.utility || '';

  console.log('[EquipmentStateExtractor] System', systemNumber, 'utility:', utility);

  // ============================================
  // Point of Interconnection (POI) - for utility-specific BOS detection
  // ============================================
  const poiRaw = systemDetails.ele_method_of_interconnection || '';
  let poiType: 'supply_side' | 'load_side' | null = null;
  if (poiRaw) {
    const poiLower = poiRaw.toLowerCase();
    if (poiLower.includes('supply') || poiLower.includes('supply side')) {
      poiType = 'supply_side';
    } else if (poiLower.includes('load') || poiLower.includes('load side')) {
      poiType = 'load_side';
    }
  }

  console.log('[EquipmentStateExtractor] POI:', poiRaw, '->', poiType);

  // ============================================
  // Existing BOS positions (to avoid duplicates)
  // ============================================
  const existingBOS = extractExistingBOS(systemDetails, prefix);

  return {
    systemPrefix,
    systemNumber,
    utilityName: utility,

    // Solar
    hasSolarPanels,
    solarPanelMake: solarMake,
    solarPanelModel: solarModel,
    solarQuantity,
    solarWattage,
    solarPanelIsNew,

    // Inverter
    hasInverter: !!(inverterMake && inverterModel),
    inverterMake,
    inverterModel,
    inverterType,
    inverterMaxContOutput,
    inverterQty,
    inverterIsNew,
    aggregatePVBreaker,

    // Battery
    hasBattery,
    batteryMake: battery1Make,
    batteryModel: battery1Model,
    batteryQuantity: battery1Qty,
    batteryMaxContOutput: battery1MaxContOutput,
    batteryIsNew: battery1IsNew,
    batteryCoupleType,
    couplingType,

    // SMS
    hasSMS,
    smsMake,
    smsModel,
    smsIsNew,

    // Backup
    hasBackupPanel,
    backupMake,
    backupModel,
    backupBusRating,
    backupPanelBusRating,
    backupOption: backupOption as 'Whole Home' | 'Partial Home' | 'None' | '',
    backupIsNew,

    // Point of Interconnection
    poiType,

    // Existing BOS
    existingBOS,
  };
}

/**
 * Extract existing BOS positions to avoid duplicates
 */
function extractExistingBOS(
  systemDetails: Record<string, any>,
  prefix: string
): EquipmentState['existingBOS'] {
  const existingBOS = {
    utility: [] as number[],
    battery1: [] as number[],
    battery2: [] as number[],
    backup: [] as number[],
    postSMS: [] as number[],
  };

  // Utility BOS: bos_sys1_type{1-6}_equipment_type
  for (let i = 1; i <= 6; i++) {
    if (systemDetails[`bos_${prefix}_type${i}_equipment_type`]) {
      existingBOS.utility.push(i);
    }
  }

  // Battery1 BOS: bos_sys1_battery1_type{1-3}_equipment_type
  for (let i = 1; i <= 3; i++) {
    if (systemDetails[`bos_${prefix}_battery1_type${i}_equipment_type`]) {
      existingBOS.battery1.push(i);
    }
  }

  // Battery2 BOS: bos_sys1_battery2_type{1-3}_equipment_type
  for (let i = 1; i <= 3; i++) {
    if (systemDetails[`bos_${prefix}_battery2_type${i}_equipment_type`]) {
      existingBOS.battery2.push(i);
    }
  }

  // Backup BOS: bos_sys1_backup_type{1-3}_equipment_type
  for (let i = 1; i <= 3; i++) {
    if (systemDetails[`bos_${prefix}_backup_type${i}_equipment_type`]) {
      existingBOS.backup.push(i);
    }
  }

  // PostSMS BOS: post_sms_bos_sys1_type{1-3}_equipment_type
  for (let i = 1; i <= 3; i++) {
    if (systemDetails[`post_sms_bos_${prefix}_type${i}_equipment_type`]) {
      existingBOS.postSMS.push(i);
    }
  }

  return existingBOS;
}

/**
 * Check if system has any equipment configured
 */
export function hasSystemData(
  systemDetails: Record<string, any>,
  systemNumber: 1 | 2 | 3 | 4
): boolean {
  const prefix = `sys${systemNumber}`;

  return !!(
    systemDetails[`${prefix}_solar_panel_make`] ||
    systemDetails[`${prefix}_micro_inverter_make`] ||
    systemDetails[`${prefix}_battery_1_make`]
  );
}

/**
 * Get next available slot for a BOS section
 */
export function getNextAvailableSlot(
  existingPositions: number[],
  section: 'utility' | 'battery1' | 'battery2' | 'backup' | 'postSMS' | 'combine'
): number | null {
  const maxSlots = section === 'utility' ? 6 : 3;

  for (let i = 1; i <= maxSlots; i++) {
    if (!existingPositions.includes(i)) {
      return i;
    }
  }

  return null;
}

/**
 * Extract combine point data for multi-system configurations
 */
export function extractCombinePointData(systemDetails: Record<string, any>): {
  hasCombinePoint: boolean;
  combineMethod: string;
  activeSystems: number[];
  combineAmpRating: number;
} {
  const eleCombinePositions = systemDetails.ele_combine_positions;

  if (!eleCombinePositions || eleCombinePositions.trim().length === 0) {
    return {
      hasCombinePoint: false,
      combineMethod: '',
      activeSystems: [],
      combineAmpRating: 0,
    };
  }

  try {
    const parsed = JSON.parse(eleCombinePositions);

    // Calculate combine amp rating from all active systems
    let combineAmpRating = 0;
    const activeSystems = parsed.active_systems || [];
    for (const sysNum of activeSystems) {
      const inverterOutput = parseFloat(systemDetails[`sys${sysNum}_inv_max_continuous_output`]) || 0;
      combineAmpRating += inverterOutput;
    }
    // Apply NEC 1.25x rule
    combineAmpRating = Math.ceil(combineAmpRating * 1.25);

    return {
      hasCombinePoint: true,
      combineMethod: parsed.method || '',
      activeSystems,
      combineAmpRating,
    };
  } catch {
    return {
      hasCombinePoint: false,
      combineMethod: '',
      activeSystems: [],
      combineAmpRating: 0,
    };
  }
}
