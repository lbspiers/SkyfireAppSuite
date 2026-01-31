/**
 * BOS (Balance of System) Utility Functions
 * Pure utility functions for BOS data management, calculations, and transformations
 */

import {
  BOS_EQUIPMENT_CATALOG,
  BOS_SECTION_CONFIG,
  NEC_CONSTANTS,
  STANDARD_AMP_RATINGS,
  UTILITY_EQUIPMENT_TRANSLATIONS,
  UTILITY_TO_STANDARD_TYPE,
} from '../constants/bosConstants';
import {
  getUtilityBOSConfig,
  getUtilityRequirementsForSection,
  type UtilityBOSRequirement,
  type UtilityBOSConfig,
} from '../constants/utilityBOSRequirements';
import type {
  BOSEquipmentCatalogItem,
  BOSSlot,
  BOSSectionType,
  BOSBlockName,
  SystemNumber,
  BOSFieldMapping,
  BOSSavePayload,
  AmpCalculationContext,
  UtilityCompany,
  BOSSystemData,
} from '../types/bosTypes';

// ============================================
// SECTION 1: Amp Rating Calculations (NEC Code)
// ============================================

/**
 * Calculate minimum amp rating based on NEC 215.2(A)(1)
 * Continuous loads require 125% sizing (multiply by 1.25)
 *
 * @param continuousAmps - Continuous load amperage
 * @returns Minimum required amp rating
 */
export function calculateMinAmpRating(continuousAmps: number): number {
  if (!continuousAmps || continuousAmps <= 0) {
    return 0;
  }
  return Math.ceil(continuousAmps * NEC_CONSTANTS.CONTINUOUS_LOAD_MULTIPLIER);
}

/**
 * Get the next standard amp rating that meets or exceeds minimum
 * Uses NEC standard amp ratings: 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, etc.
 *
 * @param minAmps - Minimum required amperage
 * @returns Next standard amp rating, or the minimum if above all standard ratings
 *
 * @example
 * getNextStandardAmpRating(77.5) // → 80
 * getNextStandardAmpRating(32) // → 35
 * getNextStandardAmpRating(650) // → 650 (no standard rating above)
 */
export function getNextStandardAmpRating(minAmps: number): number {
  if (!minAmps || minAmps <= 0) {
    return STANDARD_AMP_RATINGS[0];
  }

  const nextRating = STANDARD_AMP_RATINGS.find((rating) => rating >= minAmps);
  return nextRating ?? minAmps;
}

/**
 * Full amp calculation with context
 * Combines inverter output + battery output × quantity
 * Applies NEC 1.25 multiplier for continuous loads
 *
 * @param context - Calculation context with inverter/battery data
 * @returns Complete calculation context with results
 *
 * @example
 * calculateBOSAmpRating({ inverterMaxContinuousOutput: 32 })
 * // → { ..., minimumAmpRating: 40, recommendedAmpRating: 40 }
 */
export function calculateBOSAmpRating(
  context: Partial<AmpCalculationContext>
): AmpCalculationContext {
  const {
    inverterAmperage = null,
    batteryMaxChargeCurrent = null,
    batteryMaxDischargeCurrent = null,
    systemVoltage = NEC_CONSTANTS.STANDARD_VOLTAGE,
    continuousLoadMultiplier = NEC_CONSTANTS.CONTINUOUS_LOAD_MULTIPLIER,
  } = context;

  let totalContinuousAmps = 0;

  // Add inverter amperage if present
  if (inverterAmperage && inverterAmperage > 0) {
    totalContinuousAmps += inverterAmperage;
  }

  // Add battery charge/discharge current (use max of charge or discharge)
  if (batteryMaxChargeCurrent && batteryMaxChargeCurrent > 0) {
    totalContinuousAmps += batteryMaxChargeCurrent;
  } else if (batteryMaxDischargeCurrent && batteryMaxDischargeCurrent > 0) {
    totalContinuousAmps += batteryMaxDischargeCurrent;
  }

  // Apply NEC continuous load multiplier
  const minimumAmpRating = totalContinuousAmps > 0
    ? Math.ceil(totalContinuousAmps * continuousLoadMultiplier)
    : null;

  const recommendedAmpRating = minimumAmpRating
    ? getNextStandardAmpRating(minimumAmpRating)
    : null;

  return {
    inverterAmperage,
    solarPanelWattage: context.solarPanelWattage ?? null,
    solarPanelQuantity: context.solarPanelQuantity ?? null,
    systemVoltage,
    utilityServiceAmps: context.utilityServiceAmps ?? null,
    allowableBackfeed: context.allowableBackfeed ?? null,
    batteryMaxChargeCurrent,
    batteryMaxDischargeCurrent,
    continuousLoadMultiplier,
    minimumAmpRating,
    recommendedAmpRating,
  };
}

// ============================================
// SECTION 2: Equipment Catalog Lookup
// ============================================

/**
 * Find equipment in catalog by type
 * Handles utility-specific name translation automatically
 *
 * @param equipmentType - Standard or utility-specific equipment type
 * @returns Array of matching equipment items
 */
export function findEquipmentByType(equipmentType: string): BOSEquipmentCatalogItem[] {
  if (!equipmentType) return [];

  // Translate utility-specific name to standard type if needed
  const standardType = UTILITY_TO_STANDARD_TYPE[equipmentType] ?? equipmentType;

  return BOS_EQUIPMENT_CATALOG.filter((item) => item.type === standardType);
}

/**
 * Find equipment matching type AND minimum amp rating
 * Returns sorted by amp rating (ascending)
 *
 * @param equipmentType - Equipment type to search
 * @param minAmpRating - Minimum amp rating (optional)
 * @returns Array of matching equipment items, sorted by amp
 */
export function findEquipmentByTypeAndMinAmp(
  equipmentType: string,
  minAmpRating?: number
): BOSEquipmentCatalogItem[] {
  const items = findEquipmentByType(equipmentType);

  if (!minAmpRating || minAmpRating <= 0) {
    return items.sort((a, b) => a.ampNumeric - b.ampNumeric);
  }

  return items
    .filter((item) => item.ampNumeric >= minAmpRating)
    .sort((a, b) => a.ampNumeric - b.ampNumeric);
}

/**
 * Get smallest amp equipment that meets requirement
 * Used for auto-selection
 *
 * @param equipmentType - Equipment type
 * @param minAmpRating - Minimum required amp rating
 * @returns First matching equipment item, or null if none found
 */
export function findSmallestMatchingEquipment(
  equipmentType: string,
  minAmpRating: number
): BOSEquipmentCatalogItem | null {
  const items = findEquipmentByTypeAndMinAmp(equipmentType, minAmpRating);
  return items[0] ?? null;
}

/**
 * Get unique manufacturers for an equipment type
 *
 * @param equipmentType - Equipment type
 * @returns Array of unique make names, sorted alphabetically
 */
export function getUniqueMakes(equipmentType: string): string[] {
  const items = findEquipmentByType(equipmentType);
  const makes = new Set(items.map((item) => item.make));
  return Array.from(makes).sort();
}

/**
 * Get models for specific type and make
 * Returns sorted by amp rating (ascending)
 *
 * @param equipmentType - Equipment type
 * @param make - Manufacturer name
 * @returns Array of matching equipment items
 */
export function getModelsForMake(
  equipmentType: string,
  make: string
): BOSEquipmentCatalogItem[] {
  const items = findEquipmentByType(equipmentType);
  return items
    .filter((item) => item.make === make)
    .sort((a, b) => a.ampNumeric - b.ampNumeric);
}

// ============================================
// SECTION 3: Utility Name Translation
// ============================================

/**
 * Translate standard type to utility-specific name
 *
 * @param standardType - Standard equipment type name
 * @param utilityAbbreviation - Utility abbreviation (APS, SRP, TEP, TRICO)
 * @returns Utility-specific name, or standard type if no translation exists
 *
 * @example
 * translateToUtilityName('AC Disconnect', 'APS') // → 'Utility Disconnect'
 * translateToUtilityName('AC Disconnect', 'SRP') // → 'DER Meter Disconnect Switch'
 */
export function translateToUtilityName(
  standardType: string,
  utilityAbbreviation: string | null
): string {
  if (!utilityAbbreviation || !standardType) {
    return standardType;
  }

  const utilityTranslations = UTILITY_EQUIPMENT_TRANSLATIONS[utilityAbbreviation];
  return utilityTranslations?.[standardType] ?? standardType;
}

/**
 * Translate utility-specific name back to standard type
 *
 * @param utilityName - Utility-specific equipment name
 * @returns Standard equipment type name
 *
 * @example
 * translateToStandardType('Utility Disconnect') // → 'AC Disconnect'
 */
export function translateToStandardType(utilityName: string): string {
  if (!utilityName) return utilityName;
  return UTILITY_TO_STANDARD_TYPE[utilityName] ?? utilityName;
}

/**
 * Extract utility abbreviation from full name
 * Handles formats like "Arizona Public Service (APS)" or just "APS"
 *
 * @param utilityName - Full utility name or abbreviation
 * @returns Utility abbreviation (APS, SRP, TEP, TRICO), or null
 *
 * @example
 * getUtilityAbbreviation('Arizona Public Service (APS)') // → 'APS'
 * getUtilityAbbreviation('APS') // → 'APS'
 * getUtilityAbbreviation('Salt River Project') // → null
 */
export function getUtilityAbbreviation(utilityName: string | null): UtilityCompany {
  if (!utilityName) return null;

  const upperName = utilityName.toUpperCase();

  // Extract from parentheses if present
  const parenMatch = upperName.match(/\(([A-Z]+)\)/);
  if (parenMatch) {
    const abbrev = parenMatch[1];
    if (['APS', 'SRP', 'TEP', 'TRICO'].includes(abbrev)) {
      return abbrev as UtilityCompany;
    }
  }

  // Check if the name itself is an abbreviation
  if (['APS', 'SRP', 'TEP', 'TRICO'].includes(upperName)) {
    return upperName as UtilityCompany;
  }

  // Check if utility name contains the abbreviation
  if (upperName.includes('APS')) return 'APS';
  if (upperName.includes('SRP')) return 'SRP';
  if (upperName.includes('TEP')) return 'TEP';
  if (upperName.includes('TRICO')) return 'TRICO';

  return null;
}

// ============================================
// SECTION 4: Database Field Mapping
// ============================================

/**
 * Get database field prefix for a BOS slot
 * Uses BOS_SECTION_CONFIG field prefix function
 *
 * @param section - BOS section type
 * @param systemNumber - System number (1-4)
 * @param slotNumber - Slot number within section
 * @returns Database field prefix (without trailing underscore)
 *
 * @example
 * getBOSFieldPrefix('utility', 1, 3) // → 'bos_sys1_type3'
 * getBOSFieldPrefix('battery1', 2, 1) // → 'bos_sys2_battery1_type1'
 * getBOSFieldPrefix('postSMS', 1, 2) // → 'post_sms_bos_sys1_type2'
 * getBOSFieldPrefix('combine', 1, 2) // → 'postcombine2_1'
 */
export function getBOSFieldPrefix(
  section: BOSSectionType,
  systemNumber: SystemNumber,
  slotNumber: number
): string {
  const config = BOS_SECTION_CONFIG[section];
  if (!config) {
    throw new Error(`Invalid BOS section: ${section}`);
  }

  const prefix = config.getFieldPrefix(systemNumber, slotNumber);

  // Remove trailing underscore if present
  return prefix.endsWith('_') ? prefix.slice(0, -1) : prefix;
}

/**
 * Get complete field mapping for a slot
 * Returns object with all database field names
 *
 * Handles section-specific differences:
 * - Battery BOS has NO _active field
 * - Combine BOS uses 'existing' instead of 'is_new' (inverted logic)
 * - Combine BOS has NO trigger or block_name fields
 *
 * @param section - BOS section type
 * @param systemNumber - System number (1-4)
 * @param slotNumber - Slot number within section
 * @returns Complete field mapping object
 *
 * @example
 * getBOSFieldMapping('utility', 1, 1)
 * // → {
 * //   equipmentType: 'bos_sys1_type1_equipment_type',
 * //   make: 'bos_sys1_type1_make',
 * //   model: 'bos_sys1_type1_model',
 * //   ampRating: 'bos_sys1_type1_amp_rating',
 * //   isNew: 'bos_sys1_type1_is_new',
 * //   active: 'bos_sys1_type1_active',
 * //   trigger: 'bos_sys1_type1_trigger',
 * //   blockName: 'bos_sys1_type1_block_name'
 * // }
 */
export function getBOSFieldMapping(
  section: BOSSectionType,
  systemNumber: SystemNumber,
  slotNumber: number
): BOSFieldMapping {
  const config = BOS_SECTION_CONFIG[section];
  if (!config) {
    throw new Error(`Invalid BOS section: ${section}`);
  }

  const prefix = getBOSFieldPrefix(section, systemNumber, slotNumber);

  const mapping: BOSFieldMapping = {
    equipmentType: `${prefix}_equipment_type`,
    make: `${prefix}_make`,
    model: `${prefix}_model`,
    ampRating: `${prefix}_amp_rating`,
    isNew: config.useExistingField ? `${prefix}_existing` : `${prefix}_is_new`,
  };

  // Add optional fields based on section config
  if (config.hasActiveField) {
    mapping.active = `${prefix}_active`;
  }

  if (config.hasTriggerField) {
    mapping.trigger = `${prefix}_trigger`;
  }

  if (config.hasBlockNameField) {
    mapping.blockName = `${prefix}_block_name`;
  }

  return mapping;
}

/**
 * Build database save payload from BOSSlot
 * Converts slot object to flat field:value object ready for API
 * Handles is_new vs existing inversion for combine section
 *
 * @param slot - BOS slot to convert
 * @returns Database payload object
 */
export function buildBOSSavePayload(slot: BOSSlot): BOSSavePayload {
  const config = BOS_SECTION_CONFIG[slot.section];
  const mapping = getBOSFieldMapping(slot.section, slot.systemNumber, slot.slotNumber);

  const payload: BOSSavePayload = {
    [mapping.equipmentType]: slot.equipmentType,
    [mapping.make]: slot.make,
    [mapping.model]: slot.model,
    [mapping.ampRating]: slot.ampRating,
  };

  // Handle is_new vs existing (combine section uses inverted 'existing' field)
  if (config.useExistingField) {
    // Combine section: existing = NOT is_new
    payload[mapping.isNew] = slot.isNew === null ? null : !slot.isNew;
  } else {
    payload[mapping.isNew] = slot.isNew;
  }

  // Add optional fields
  if (mapping.active !== undefined) {
    payload[mapping.active] = slot.active;
  }

  if (mapping.trigger !== undefined) {
    payload[mapping.trigger] = slot.trigger;
  }

  if (mapping.blockName !== undefined) {
    payload[mapping.blockName] = slot.blockName;
  }

  return payload;
}

/**
 * Parse database fields into BOSSlot object
 * Reverse of buildBOSSavePayload
 * Returns null if slot is empty (no equipment_type)
 *
 * @param data - Database record with BOS fields
 * @param section - BOS section type
 * @param systemNumber - System number (1-4)
 * @param slotNumber - Slot number
 * @returns BOSSlot object, or null if slot is empty
 */
export function parseBOSSlotFromData(
  data: Record<string, any>,
  section: BOSSectionType,
  systemNumber: SystemNumber,
  slotNumber: number
): BOSSlot | null {
  const config = BOS_SECTION_CONFIG[section];
  const mapping = getBOSFieldMapping(section, systemNumber, slotNumber);

  const equipmentType = data[mapping.equipmentType];

  // If no equipment type, slot is empty
  if (!equipmentType) {
    return null;
  }

  const prefix = getBOSFieldPrefix(section, systemNumber, slotNumber);

  // Handle is_new vs existing inversion
  let isNew: boolean | null = null;
  if (config.useExistingField) {
    // Combine section: is_new = NOT existing
    const existing = data[mapping.isNew];
    isNew = existing === null ? null : !existing;
  } else {
    isNew = data[mapping.isNew] ?? null;
  }

  const slot: BOSSlot = {
    section,
    systemNumber,
    slotNumber,
    fieldPrefix: prefix,
    equipmentType,
    make: data[mapping.make] ?? null,
    model: data[mapping.model] ?? null,
    ampRating: data[mapping.ampRating] ?? null,
    isNew,
    active: mapping.active ? (data[mapping.active] ?? null) : null,
    trigger: mapping.trigger ? (data[mapping.trigger] ?? null) : null,
    blockName: mapping.blockName ? (data[mapping.blockName] ?? null) : null,
  };

  // Add existing flag for combine section
  if (config.useExistingField) {
    slot.existing = data[mapping.isNew] ?? null;
  }

  return slot;
}

/**
 * Build clear payload for a slot (all fields set to null)
 * Used when removing equipment
 *
 * @param slot - Slot to clear
 * @returns Payload with all fields set to null
 */
export function buildBOSClearPayload(slot: BOSSlot): BOSSavePayload {
  const mapping = getBOSFieldMapping(slot.section, slot.systemNumber, slot.slotNumber);

  const payload: BOSSavePayload = {
    [mapping.equipmentType]: null,
    [mapping.make]: null,
    [mapping.model]: null,
    [mapping.ampRating]: null,
    [mapping.isNew]: null,
  };

  if (mapping.active !== undefined) {
    payload[mapping.active] = null;
  }

  if (mapping.trigger !== undefined) {
    payload[mapping.trigger] = null;
  }

  if (mapping.blockName !== undefined) {
    payload[mapping.blockName] = null;
  }

  return payload;
}

// ============================================
// SECTION 5: Trigger Detection
// ============================================

/**
 * Determine if a BOS section should be visible
 * Based on whether "trigger" equipment is configured
 *
 * Rules:
 * - utility: show if solar panels OR inverter exists
 * - battery1: show if battery_1_make AND battery_1_qty exist
 * - battery2: show if battery_2_make AND battery_2_qty exist
 * - backup: show if backup panel OR gateway exists
 * - postSMS: show if sms_make exists AND no_sms is not true
 * - combine: show if combiner panel exists
 *
 * @param data - System details data
 * @param section - BOS section type
 * @param systemNumber - System number (1-4)
 * @returns True if section should be visible
 */
export function shouldShowBOSSection(
  data: Record<string, any>,
  section: BOSSectionType,
  systemNumber: SystemNumber
): boolean {
  const prefix = `sys${systemNumber}_`;

  switch (section) {
    case 'utility':
      // Show if solar panels OR inverter OR string combiner exists
      return !!(
        data[`${prefix}solar_panel_make`] ||
        data[`${prefix}micro_inverter_make`] ||
        data[`${prefix}combiner_panel_make`]
      );

    case 'battery1':
      // Show if battery type 1 is configured
      return !!(
        data[`${prefix}battery_1_make`] &&
        data[`${prefix}battery_1_qty`]
      );

    case 'battery2':
      // Show if battery type 2 is configured
      return !!(
        data[`${prefix}battery_2_make`] &&
        data[`${prefix}battery_2_qty`]
      );

    case 'backup':
      // Show if backup panel OR gateway exists
      return !!(
        data[`${prefix}teslagatewaytype`] ||
        data[`${prefix}backup_option`]
      );

    case 'postSMS':
      // Show if SMS exists and no_sms is not true
      return !!(
        data[`${prefix}sms_make`] &&
        data[`${prefix}no_sms`] !== true
      );

    case 'combine':
      // Show if combiner panel exists (combine is always system 1)
      return !!(data['sys1_combiner_panel_make']);

    default:
      return false;
  }
}

/**
 * Get the trigger identifier for a BOS section
 * Used to determine what equipment triggered this BOS section
 *
 * @param section - BOS section type
 * @param systemNumber - System number (1-4)
 * @returns Trigger identifier string
 *
 * @example
 * getBOSTrigger('utility', 1) // → 'sys1_utility'
 * getBOSTrigger('battery1', 2) // → 'sys2_battery1'
 */
export function getBOSTrigger(
  section: BOSSectionType,
  systemNumber: SystemNumber
): string {
  return `sys${systemNumber}_${section}`;
}

// ============================================
// SECTION 6: Slot Management
// ============================================

/**
 * Find next available slot number in a section
 * Returns null if section is full
 *
 * @param existingSlots - Array of existing slots in section
 * @param section - BOS section type
 * @returns Next available slot number (1-based), or null if full
 */
export function findNextAvailableSlot(
  existingSlots: BOSSlot[],
  section: BOSSectionType
): number | null {
  const config = BOS_SECTION_CONFIG[section];
  if (!config) {
    throw new Error(`Invalid BOS section: ${section}`);
  }

  const usedSlots = new Set(existingSlots.map((slot) => slot.slotNumber));

  for (let i = 1; i <= config.maxSlots; i++) {
    if (!usedSlots.has(i)) {
      return i;
    }
  }

  return null; // Section is full
}

/**
 * Get default block name for a section
 *
 * @param section - BOS section type
 * @returns Default block name for the section
 */
export function getDefaultBlockName(section: BOSSectionType): BOSBlockName {
  switch (section) {
    case 'utility':
    case 'battery1':
    case 'battery2':
      return 'PRE COMBINE';
    case 'backup':
      return 'BACKUP';
    case 'postSMS':
    case 'combine':
      return 'POST COMBINE';
    default:
      return 'PRE COMBINE';
  }
}

// ============================================
// SECTION 7: Validation
// ============================================

/**
 * Validate a BOS slot has required fields
 *
 * @param slot - Partial BOS slot to validate
 * @returns Validation result with errors
 */
export function validateBOSSlot(slot: Partial<BOSSlot>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!slot.section) {
    errors.push('Section is required');
  }

  if (!slot.systemNumber || slot.systemNumber < 1 || slot.systemNumber > 4) {
    errors.push('System number must be 1-4');
  }

  if (!slot.slotNumber || slot.slotNumber < 1) {
    errors.push('Slot number must be positive');
  }

  if (!slot.equipmentType) {
    errors.push('Equipment type is required');
  }

  if (!slot.make) {
    errors.push('Make is required');
  }

  if (!slot.model) {
    errors.push('Model is required');
  }

  if (!slot.ampRating) {
    errors.push('Amp rating is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if equipment type is valid for catalog lookup
 *
 * @param equipmentType - Equipment type to check
 * @param section - BOS section type
 * @returns True if equipment type exists in catalog
 */
export function isValidEquipmentForSection(
  equipmentType: string,
  section: BOSSectionType
): boolean {
  if (!equipmentType) return false;

  const items = findEquipmentByType(equipmentType);
  return items.length > 0;
}

// ============================================
// SECTION 8: Display Helpers
// ============================================

/**
 * Format slot for display
 *
 * @param slot - BOS slot to format
 * @returns Formatted display string
 *
 * @example
 * formatBOSSlotDisplay(slot)
 * // → 'AC Disconnect - EATON - DG222NRB - 60A'
 */
export function formatBOSSlotDisplay(slot: BOSSlot): string {
  const parts = [
    slot.equipmentType,
    slot.make,
    slot.model,
    slot.ampRating,
  ].filter(Boolean);

  return parts.join(' - ');
}

/**
 * Get summary of BOS for a system
 *
 * @param slots - Array of BOS slots
 * @returns Summary with count and unique types
 */
export function getBOSSystemSummary(slots: BOSSlot[]): {
  count: number;
  types: string[];
} {
  const types = new Set(
    slots.map((slot) => slot.equipmentType).filter(Boolean) as string[]
  );

  return {
    count: slots.length,
    types: Array.from(types).sort(),
  };
}

// ============================================
// SECTION 9: Utility Auto-Population
// ============================================

// Re-export for convenience
export { getUtilityBOSConfig, getUtilityRequirementsForSection };

/**
 * Context for calculating amp ratings during auto-population
 */
export interface AutoPopulateContext {
  /** Utility name or code */
  utilityName: string | null;

  /** Inverter max continuous output amps */
  inverterAmps?: number | null;

  /** Battery max output amps */
  batteryAmps?: number | null;

  /** Battery quantity */
  batteryQuantity?: number | null;

  /** Backup panel bus rating */
  backupPanelRating?: number | null;

  /** System number (1-4) */
  systemNumber: SystemNumber;
}

/**
 * Result of auto-populate calculation for a single requirement
 */
export interface AutoPopulateResult {
  /** The requirement being fulfilled */
  requirement: UtilityBOSRequirement;

  /** Equipment type to use (utility-specific name) */
  equipmentType: string;

  /** Selected make */
  make: string | null;

  /** Selected model */
  model: string | null;

  /** Calculated or fixed amp rating */
  ampRating: string | null;

  /** Minimum amp required (for display) */
  minAmpRequired: number | null;

  /** BOS section */
  section: BOSSectionType;

  /** Block name */
  blockName: BOSBlockName;

  /** Whether this is a new installation */
  isNew: boolean;
}

/**
 * Calculate the amp rating for a requirement based on its sizing rule
 */
export function calculateRequirementAmp(
  requirement: UtilityBOSRequirement,
  context: AutoPopulateContext
): { minAmp: number | null; selectedAmp: string | null } {
  let minAmp: number | null = null;

  switch (requirement.ampSizing) {
    case 'inverter':
      if (context.inverterAmps) {
        minAmp = calculateMinAmpRating(context.inverterAmps);
      }
      break;

    case 'battery':
      if (context.batteryAmps && context.batteryQuantity) {
        const totalBatteryAmps = context.batteryAmps * context.batteryQuantity;
        minAmp = calculateMinAmpRating(totalBatteryAmps);
      } else if (context.batteryAmps) {
        minAmp = calculateMinAmpRating(context.batteryAmps);
      }
      break;

    case 'backupPanel':
      if (context.backupPanelRating) {
        minAmp = context.backupPanelRating;  // No 1.25 multiplier for panel rating
      }
      break;

    case 'fixed':
      // Parse fixed amp (e.g., "200A" -> 200)
      if (requirement.fixedAmp) {
        const parsed = parseInt(requirement.fixedAmp.replace(/[^0-9]/g, ''));
        if (!isNaN(parsed)) {
          minAmp = parsed;
        }
      }
      break;

    case 'manual':
    default:
      minAmp = null;
      break;
  }

  // Get the standard amp rating
  let selectedAmp: string | null = null;
  if (minAmp !== null) {
    const standardAmp = getNextStandardAmpRating(minAmp);
    selectedAmp = `${standardAmp}A`;
  }

  return { minAmp, selectedAmp };
}

/**
 * Find the best matching equipment from catalog for a requirement
 */
export function findEquipmentForRequirement(
  requirement: UtilityBOSRequirement,
  minAmp: number | null
): { make: string | null; model: string | null; amp: string | null } {
  // Use standard type for catalog lookup
  const catalogType = requirement.standardType;

  // First, try to find equipment with preferred make
  if (requirement.preferredMake) {
    const preferredEquipment = BOS_EQUIPMENT_CATALOG.filter(
      item => item.type === catalogType && item.make === requirement.preferredMake
    );

    if (preferredEquipment.length > 0) {
      // If we have a min amp, find smallest that meets requirement
      if (minAmp !== null) {
        const suitable = preferredEquipment
          .filter(item => (item.ampNumeric || 0) >= minAmp)
          .sort((a, b) => (a.ampNumeric || 0) - (b.ampNumeric || 0));

        if (suitable.length > 0) {
          return {
            make: suitable[0].make,
            model: suitable[0].model,
            amp: suitable[0].amp,
          };
        }
      }

      // No amp requirement or none suitable, return first preferred
      return {
        make: preferredEquipment[0].make,
        model: preferredEquipment[0].model,
        amp: preferredEquipment[0].amp,
      };
    }
  }

  // Fallback: find any equipment of this type
  const allEquipment = BOS_EQUIPMENT_CATALOG.filter(item => item.type === catalogType);

  if (allEquipment.length > 0) {
    if (minAmp !== null) {
      const suitable = allEquipment
        .filter(item => (item.ampNumeric || 0) >= minAmp)
        .sort((a, b) => (a.ampNumeric || 0) - (b.ampNumeric || 0));

      if (suitable.length > 0) {
        return {
          make: suitable[0].make,
          model: suitable[0].model,
          amp: suitable[0].amp,
        };
      }
    }

    return {
      make: allEquipment[0].make,
      model: allEquipment[0].model,
      amp: allEquipment[0].amp,
    };
  }

  // Nothing found
  return { make: null, model: null, amp: null };
}

/**
 * Generate auto-populate results for a section
 */
export function generateAutoPopulateResults(
  section: BOSSectionType,
  context: AutoPopulateContext,
  existingSlots: BOSSlot[]
): AutoPopulateResult[] {
  const requirements = getUtilityRequirementsForSection(context.utilityName, section);
  const results: AutoPopulateResult[] = [];

  for (const requirement of requirements) {
    // Check if this equipment type already exists in slots
    const alreadyExists = existingSlots.some(
      slot => slot.equipmentType === requirement.equipmentType ||
              slot.equipmentType === requirement.standardType
    );

    if (alreadyExists) {
      continue;  // Skip - don't overwrite existing equipment
    }

    // Calculate amp rating
    const { minAmp, selectedAmp } = calculateRequirementAmp(requirement, context);

    // Find matching equipment
    const equipment = findEquipmentForRequirement(requirement, minAmp);

    results.push({
      requirement,
      equipmentType: requirement.equipmentType,  // Use utility-specific name
      make: equipment.make,
      model: equipment.model,
      ampRating: equipment.amp || selectedAmp,
      minAmpRequired: minAmp,
      section: requirement.section,
      blockName: requirement.blockName,
      isNew: true,  // Auto-populated equipment is always new
    });
  }

  return results;
}

/**
 * Generate all auto-populate results for a system
 */
export function generateAllAutoPopulateResults(
  context: AutoPopulateContext,
  systemBOS: BOSSystemData
): {
  utility: AutoPopulateResult[];
  battery1: AutoPopulateResult[];
  battery2: AutoPopulateResult[];
  backup: AutoPopulateResult[];
  postSMS: AutoPopulateResult[];
} {
  return {
    utility: generateAutoPopulateResults('utility', context, systemBOS.utilitySlots),
    battery1: generateAutoPopulateResults('battery1', context, systemBOS.battery1Slots),
    battery2: generateAutoPopulateResults('battery2', context, systemBOS.battery2Slots),
    backup: generateAutoPopulateResults('backup', context, systemBOS.backupSlots),
    postSMS: generateAutoPopulateResults('postSMS', context, systemBOS.postSMSSlots),
  };
}

/**
 * Check if auto-population would add any equipment
 * Useful for showing/hiding the auto-populate button
 */
export function hasAutoPopulateResults(
  context: AutoPopulateContext,
  systemBOS: BOSSystemData
): boolean {
  const results = generateAllAutoPopulateResults(context, systemBOS);

  return (
    results.utility.length > 0 ||
    results.battery1.length > 0 ||
    results.battery2.length > 0 ||
    results.backup.length > 0 ||
    results.postSMS.length > 0
  );
}

/**
 * Get count of equipment that would be auto-populated
 */
export function getAutoPopulateCount(
  context: AutoPopulateContext,
  systemBOS: BOSSystemData
): number {
  const results = generateAllAutoPopulateResults(context, systemBOS);

  return (
    results.utility.length +
    results.battery1.length +
    results.battery2.length +
    results.backup.length +
    results.postSMS.length
  );
}

// ============================================
// SECTION 10: System Configuration Detection & Database-Driven Auto-Population
// ============================================

export interface SystemConfiguration {
  systemNumber: SystemNumber;
  activeSystemCount: number;
  hasSMS: boolean;
  hasBatteryType1: boolean;
  hasBatteryType2: boolean;
  inverterType: 'microinverter' | 'inverter' | null;
  microinverterQty: number | null;
}

/**
 * Detect system configuration from system details
 */
export function detectSystemConfiguration(
  systemDetails: Record<string, any>,
  systemNumber: SystemNumber
): SystemConfiguration {
  const prefix = `sys${systemNumber}_`;

  // Count active systems
  let activeSystemCount = 0;
  for (let i = 1; i <= 4; i++) {
    const sysPrefix = `sys${i}_`;
    const hasInverter = !!(
      systemDetails?.[`${sysPrefix}micro_inverter_make`] ||
      systemDetails?.[`${sysPrefix}inverter_make`]
    );
    const selectedSystem = systemDetails?.[`${sysPrefix}selectedsystem`];
    if (hasInverter || selectedSystem) {
      activeSystemCount++;
    }
  }

  // Check SMS presence
  const hasSMS = !!(
    systemDetails?.[`${prefix}sms_make`] &&
    systemDetails?.[`${prefix}sms_model`]
  );

  // Check Battery Type 1
  const battery1Qty = parseInt(systemDetails?.[`${prefix}battery_1_qty`] || '0');
  const hasBatteryType1 = !!(
    (systemDetails?.[`${prefix}battery_1_make`] || systemDetails?.[`${prefix}battery_1_model`]) &&
    battery1Qty > 0
  );

  // Check Battery Type 2
  const battery2Qty = parseInt(systemDetails?.[`${prefix}battery_2_qty`] || '0');
  const hasBatteryType2 = !!(
    (systemDetails?.[`${prefix}battery_2_make`] || systemDetails?.[`${prefix}battery_2_model`]) &&
    battery2Qty > 0
  );

  // Determine inverter type
  const selectedSystem = systemDetails?.[`${prefix}selectedsystem`];
  let inverterType: 'microinverter' | 'inverter' | null = null;
  if (selectedSystem === 'microinverter') {
    inverterType = 'microinverter';
  } else if (selectedSystem === 'inverter' || systemDetails?.[`${prefix}micro_inverter_make`]) {
    inverterType = 'inverter';
  }

  const microQty = parseInt(systemDetails?.[`${prefix}micro_inverter_qty`] || '0');

  return {
    systemNumber,
    activeSystemCount,
    hasSMS,
    hasBatteryType1,
    hasBatteryType2,
    inverterType,
    microinverterQty: microQty > 0 ? microQty : null,
  };
}

/**
 * Determine target BOS section based on configuration
 *
 * PLACEMENT LOGIC:
 * - 2+ systems → Post-Combine (combine)
 * - 1 system, has SMS → Post-SMS (postSMS)
 * - 1 system, no SMS → Pre-Combine (utility)
 */
export function determineBOSTargetSection(config: SystemConfiguration): BOSSectionType {
  if (config.activeSystemCount >= 2) {
    return 'combine';
  }
  if (config.hasSMS) {
    return 'postSMS';
  }
  return 'utility';
}

/**
 * Get block name for BOS placement
 */
export function getUtilityBOSBlockName(config: SystemConfiguration): BOSBlockName {
  if (config.activeSystemCount >= 2) {
    return 'POST COMBINE';
  }
  if (config.hasSMS) {
    return 'POST COMBINE';
  }
  return 'PRE COMBINE';
}

/**
 * Calculate max continuous output
 * Microinverters: amps × qty
 * String inverters: amps as-is
 */
export function calculateMaxContinuousOutput(
  maxContOutputAmps: number | null,
  inverterType: 'microinverter' | 'inverter' | null,
  microinverterQty: number | null
): number | null {
  if (!maxContOutputAmps || maxContOutputAmps <= 0 || !inverterType) {
    return null;
  }

  if (inverterType === 'microinverter') {
    if (!microinverterQty || microinverterQty <= 0) return null;
    return Math.round(maxContOutputAmps * microinverterQty);
  }

  return Math.round(maxContOutputAmps);
}

/**
 * Calculate minimum amp rating with NEC 1.25× rule
 */
export function calculateMinimumAmpRating(maxContinuousOutput: number | null): number | null {
  if (!maxContinuousOutput || maxContinuousOutput <= 0) return null;
  return Math.ceil(maxContinuousOutput * NEC_CONSTANTS.CONTINUOUS_LOAD_MULTIPLIER);
}

/**
 * Find smallest standard amp rating that meets requirement
 */
export function findRecommendedAmpRating(minimumAmps: number | null): number | null {
  if (!minimumAmps || minimumAmps <= 0) return STANDARD_AMP_RATINGS[0];
  return STANDARD_AMP_RATINGS.find(r => r >= minimumAmps) || STANDARD_AMP_RATINGS[STANDARD_AMP_RATINGS.length - 1];
}

export interface AmpRatingInfo {
  maxContinuousOutput: number | null;
  minimumRequired: number | null;
  recommended: number | null;
  calculation: string;
}

export function calculateAmpRatingInfo(
  maxContOutputAmps: number | null,
  inverterType: 'microinverter' | 'inverter' | null,
  microinverterQty: number | null
): AmpRatingInfo {
  const maxOutput = calculateMaxContinuousOutput(maxContOutputAmps, inverterType, microinverterQty);
  const minRequired = calculateMinimumAmpRating(maxOutput);
  const recommended = findRecommendedAmpRating(minRequired);

  let calculation = 'Unable to calculate';
  if (maxOutput && minRequired) {
    if (inverterType === 'microinverter' && microinverterQty) {
      calculation = `${maxContOutputAmps}A × ${microinverterQty} = ${maxOutput}A → ×1.25 = ${minRequired}A min → ${recommended}A`;
    } else {
      calculation = `${maxOutput}A × 1.25 = ${minRequired}A min → ${recommended}A`;
    }
  }

  return { maxContinuousOutput: maxOutput, minimumRequired: minRequired, recommended, calculation };
}

/**
 * Filter BOS equipment by type and minimum amp
 */
export function filterBOSEquipmentByAmp(
  equipmentType: string,
  minAmpRating: number | null
): BOSEquipmentCatalogItem[] {
  return BOS_EQUIPMENT_CATALOG.filter(item => {
    if (item.type.toLowerCase() !== equipmentType.toLowerCase()) return false;
    if (minAmpRating && minAmpRating > 0) {
      const itemAmp = item.ampNumeric || parseFloat(item.amp) || 0;
      return itemAmp >= minAmpRating;
    }
    return true;
  });
}

/**
 * Auto-select smallest suitable equipment
 */
export function autoSelectEquipment(
  equipmentType: string,
  minAmpRating: number | null,
  preferredMake?: string | null
): { make: string | null; model: string | null; amp: string | null } {
  const filtered = filterBOSEquipmentByAmp(equipmentType, minAmpRating);
  if (filtered.length === 0) return { make: null, model: null, amp: null };

  const sorted = [...filtered].sort((a, b) => (a.ampNumeric || 0) - (b.ampNumeric || 0));

  if (preferredMake) {
    const preferred = sorted.filter(i => i.make.toUpperCase() === preferredMake.toUpperCase());
    if (preferred.length > 0) {
      return { make: preferred[0].make, model: preferred[0].model, amp: preferred[0].amp };
    }
  }

  return { make: sorted[0].make, model: sorted[0].model, amp: sorted[0].amp };
}

// ============================================
// SECTION 11: Database-to-BOS Conversion for Hardcoded System Integration
// ============================================

/**
 * Convert database utility requirements to BOSEquipmentItem[] format
 * Used as fallback when hardcoded configurations return no results
 *
 * This bridges the NEW database-driven system with the EXISTING hardcoded BOS detection system
 *
 * @param dbRequirements - Parsed requirements from database (from utilityRequirementsService)
 * @param systemDetails - Full system details object (formData)
 * @param projectUuid - Project UUID for API calls
 * @returns Array of BOSEquipmentItem matching the hardcoded system format
 */
export async function convertDatabaseToBOSItems(
  dbRequirements: Array<{
    equipmentType: string;
    standardType: string;
    order: number;
    requiresPOICheck?: boolean;
  }>,
  systemDetails: Record<string, any>,
  projectUuid: string
): Promise<import('../types/bosConfigurationTypes').BOSEquipmentItem[]> {
  const bosItems: import('../types/bosConfigurationTypes').BOSEquipmentItem[] = [];

  // Import services we need
  const { resolveEquipmentTypeByPOI } = await import('../services/utilityRequirementsService');
  const api = (await import('../config/axios')).default;

  // Determine which system to apply BOS to
  // For now, default to System 1 - could be enhanced to detect active systems
  const systemNumber = 1;

  // Detect system configuration to determine target section
  const config = detectSystemConfiguration(systemDetails, systemNumber as SystemNumber);
  const targetSection = determineBOSTargetSection(config);

  // Determine block name for BOSEquipmentItem (limited to valid blockName values)
  let blockName: 'PRE COMBINE' | 'POST COMBINE' | 'POST SMS' | 'ESS' | 'BACKUP LOAD SUB PANEL' = 'PRE COMBINE';
  if (targetSection === 'combine') {
    blockName = 'POST COMBINE';
  } else if (targetSection === 'postSMS') {
    blockName = 'POST SMS';
  } else if (targetSection === 'battery1' || targetSection === 'battery2') {
    blockName = 'ESS';
  } else if (targetSection === 'backup') {
    blockName = 'BACKUP LOAD SUB PANEL';
  }
  // else targetSection === 'utility' → 'PRE COMBINE' (default)

  // Get POI type for conditional equipment resolution (Xcel Energy)
  const poiType = systemDetails?.['ele_method_of_interconnection'] || null;

  // Get inverter max continuous output for amp calculations
  let inverterMaxAmps: number | null = null;
  try {
    const inverterMake = systemDetails?.[`sys${systemNumber}_inverter_make`];
    const inverterModel = systemDetails?.[`sys${systemNumber}_inverter_model`];

    if (inverterMake && inverterModel) {
      const inverterResponse = await api.get('/equipment/models', {
        params: {
          type: 'Inverter',
          manufacturer: inverterMake,
        },
      });

      const inverters = inverterResponse.data?.data || [];
      const match = inverters.find((inv: any) => inv.model === inverterModel);
      if (match?.max_cont_output) {
        inverterMaxAmps = parseFloat(match.max_cont_output);
      }
    }
  } catch (error) {
    console.warn('Failed to fetch inverter amp data for database BOS conversion:', error);
  }

  // Get existing BOS equipment to find next available positions
  const existingBOS = extractExistingBOSPositions(systemDetails, systemNumber as SystemNumber, targetSection);
  let nextPosition = findNextAvailablePosition(existingBOS, targetSection);

  // Convert each database requirement to BOSEquipmentItem
  for (const req of dbRequirements) {
    // ALWAYS store the original utility-specific name from database
    // This is what gets displayed in the UI and saved to the database
    const equipmentTypeToStore = req.equipmentType; // e.g., "Utility PV AC Disconnect"

    // Calculate amp rating if we have inverter data
    let minAmpRating = 30; // Default minimum
    let sizingCalculation = 'Default 30A minimum';

    if (inverterMaxAmps) {
      const ampInfo = calculateAmpRatingInfo(
        inverterMaxAmps,
        config.inverterType || 'inverter',
        config.microinverterQty || 1
      );
      minAmpRating = ampInfo.minimumRequired || 30;
      sizingCalculation = ampInfo.calculation;
    }

    // Create BOS item
    // Note: equipmentType is the utility-specific name
    // The catalog lookup in prepareBOSPopulation() will translate it using EQUIPMENT_TYPE_TRANSLATIONS
    bosItems.push({
      equipmentType: equipmentTypeToStore, // Utility-specific name (e.g., "Utility PV AC Disconnect")
      position: nextPosition,
      section: targetSection,
      systemNumber,
      minAmpRating,
      sizingCalculation,
      blockName,
      isNew: true,
    });

    nextPosition++;
  }

  return bosItems;
}

/**
 * Extract existing BOS positions for a system and section
 * Helper for database-to-BOS conversion
 */
function extractExistingBOSPositions(
  formData: Record<string, any>,
  systemNumber: SystemNumber,
  section: BOSSectionType
): number[] {
  const positions: number[] = [];
  const maxPositions = section === 'utility' ? 6 : 3;

  for (let pos = 1; pos <= maxPositions; pos++) {
    let fieldPrefix = '';

    if (section === 'utility') {
      fieldPrefix = `bos_sys${systemNumber}_type${pos}`;
    } else if (section === 'battery1') {
      fieldPrefix = `bos_sys${systemNumber}_battery1_type${pos}`;
    } else if (section === 'battery2') {
      fieldPrefix = `bos_sys${systemNumber}_battery2_type${pos}`;
    } else if (section === 'backup') {
      fieldPrefix = `bos_sys${systemNumber}_backup_type${pos}`;
    } else if (section === 'postSMS') {
      fieldPrefix = `post_sms_bos_sys${systemNumber}_type${pos}`;
    } else if (section === 'combine') {
      fieldPrefix = `post_combine_bos_type${pos}`;
    }

    const equipmentType = formData[`${fieldPrefix}_equipment_type`];
    if (equipmentType && equipmentType.trim() !== '') {
      positions.push(pos);
    }
  }

  return positions;
}

/**
 * Find next available position in a BOS section
 * Helper for database-to-BOS conversion
 */
function findNextAvailablePosition(existingPositions: number[], section: BOSSectionType): number {
  const maxPositions = section === 'utility' ? 6 : 3;

  for (let pos = 1; pos <= maxPositions; pos++) {
    if (!existingPositions.includes(pos)) {
      return pos;
    }
  }

  // All positions filled, return maxPositions + 1 (will be handled as error)
  return maxPositions + 1;
}
