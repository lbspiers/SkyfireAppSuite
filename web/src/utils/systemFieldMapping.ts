/**
 * System Field Mapping Utility
 *
 * Handles dynamic field mapping for multiple solar panel systems (sys1-sys10).
 * Provides utilities for field name conversion, data extraction, validation,
 * and progressive revelation of system tabs.
 */

// Type definitions for system prefixes
export type SystemPrefix = 'sys1' | 'sys2' | 'sys3' | 'sys4' | 'sys5' | 'sys6' | 'sys7' | 'sys8' | 'sys9' | 'sys10';
export type SystemNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// System prefix mapping array (1-indexed for convenience)
export const SYSTEM_PREFIXES: Record<SystemNumber, SystemPrefix> = {
  1: 'sys1',
  2: 'sys2',
  3: 'sys3',
  4: 'sys4',
  5: 'sys5',
  6: 'sys6',
  7: 'sys7',
  8: 'sys8',
  9: 'sys9',
  10: 'sys10'
};

// Field mapping types
export type FieldSuffix =
  | 'panel_qty'
  | 'panel_model'
  | 'panel_watt'
  | 'panel_price'
  | 'installed_kwh'
  | 'annual_production'
  | 'annual_value'
  | 'tilt'
  | 'azimuth'
  | 'location'
  | 'notes';

/**
 * Converts sys1_field → sys2_field (handles schema inconsistencies)
 *
 * @param fieldName - The source field name (e.g., 'sys1_panel_qty')
 * @param targetSystemNum - The target system number (e.g., 2)
 * @returns The mapped field name (e.g., 'sys2_panel_qty')
 */
export function mapFieldName(fieldName: string, targetSystemNum: SystemNumber): string {
  // Extract the field suffix from the source field name
  const parts = fieldName.split('_');
  if (parts.length < 2) {
    return fieldName; // Return as-is if format doesn't match
  }

  // Remove the system prefix (e.g., 'sys1') and reconstruct with new prefix
  const [, ...suffixParts] = parts;
  const suffix = suffixParts.join('_');

  return `sys${targetSystemNum}_${suffix}`;
}

/**
 * Gets a value for any system from raw data
 *
 * @param data - The raw data object containing system fields
 * @param systemNum - The system number (1-10)
 * @param fieldSuffix - The field suffix (e.g., 'panel_qty')
 * @returns The value for the specified field, or undefined if not found
 */
export function extractDynamicValue(
  data: Record<string, any> | null | undefined,
  systemNum: SystemNumber,
  fieldSuffix: FieldSuffix
): any {
  if (!data) return undefined;
  const fieldName = `sys${systemNum}_${fieldSuffix}`;
  return data[fieldName];
}

/**
 * Batch extracts multiple fields for a given system
 *
 * @param data - The raw data object containing system fields
 * @param systemNum - The system number (1-10)
 * @param fieldSuffixes - Array of field suffixes to extract
 * @returns Object with extracted field values
 */
export function extractDynamicFields(
  data: Record<string, any> | null | undefined,
  systemNum: SystemNumber,
  fieldSuffixes: FieldSuffix[]
): Record<string, any> {
  if (!data) return {};

  const result: Record<string, any> = {};

  for (const suffix of fieldSuffixes) {
    const value = extractDynamicValue(data, systemNum, suffix);
    if (value !== undefined) {
      result[suffix] = value;
    }
  }

  return result;
}

/**
 * Converts form payload to correct system prefix for saving
 *
 * @param formData - The form data object
 * @param systemNum - The target system number
 * @returns Object with properly prefixed field names
 */
export function createDynamicPayload(
  formData: Record<string, any>,
  systemNum: SystemNumber
): Record<string, any> {
  const payload: Record<string, any> = {};

  // Map each field to the correct system prefix
  for (const [key, value] of Object.entries(formData)) {
    // Skip non-system fields
    if (!key.includes('_')) {
      payload[key] = value;
      continue;
    }

    // Extract suffix and create properly prefixed field name
    const parts = key.split('_');
    const [, ...suffixParts] = parts;
    const suffix = suffixParts.join('_');
    const prefixedKey = `sys${systemNum}_${suffix}`;

    payload[prefixedKey] = value;
  }

  return payload;
}

/**
 * Checks if a system has meaningful data (qty + model)
 *
 * @param data - The raw data object
 * @param systemNum - The system number to check
 * @returns True if the system has both quantity and model
 */
export function systemHasData(data: Record<string, any> | null | undefined, systemNum: SystemNumber): boolean {
  if (!data) return false;

  const prefix = SYSTEM_PREFIXES[systemNum];

  // Check for solar panel qty and model (the most common indicator of a configured system)
  const qty = data[`${prefix}_solar_panel_qty`];
  const model = data[`${prefix}_solar_panel_model`];

  // System has data if both qty and model are present and non-empty
  return !!(qty && model && qty.toString().trim() !== '' && model.toString().trim() !== '');
}

/**
 * Returns array of system numbers that have data
 *
 * @param data - The raw data object
 * @returns Array of system numbers (1-10) that contain data
 */
export function getActiveSystems(data: Record<string, any> | null | undefined): SystemNumber[] {
  if (!data) return [];

  const activeSystems: SystemNumber[] = [];

  for (let i = 1; i <= 10; i++) {
    if (systemHasData(data, i as SystemNumber)) {
      activeSystems.push(i as SystemNumber);
    }
  }

  return activeSystems;
}

/**
 * Progressive revelation logic for tabs
 *
 * @param data - The raw data object
 * @param systemNum - The system number to check visibility for
 * @returns True if the tab should be visible
 */
export function isSystemTabVisible(data: Record<string, any> | null | undefined, systemNum: SystemNumber): boolean {
  // System 1 is always visible
  if (systemNum === 1) {
    return true;
  }

  // If no data, only System 1 is visible
  if (!data) {
    return false;
  }

  // System N is visible if System N-1 has data
  const previousSystemNum = (systemNum - 1) as SystemNumber;
  return systemHasData(data, previousSystemNum);
}

/**
 * Returns next empty system number
 *
 * @param data - The raw data object
 * @returns The next available system number, or null if all 10 are filled
 */
export function getNextAvailableSystem(data: Record<string, any> | null | undefined): SystemNumber | null {
  if (!data) return 1; // If no data, System 1 is available

  for (let i = 1; i <= 10; i++) {
    if (!systemHasData(data, i as SystemNumber)) {
      return i as SystemNumber;
    }
  }

  return null; // All 10 systems are filled
}

/**
 * Factory for form data hydration
 * Creates a function that hydrates form data for a specific system
 *
 * @param systemNum - The system number to create hydration function for
 * @returns Function that hydrates form data from raw data
 */
export function createHydrationFunction(systemNum: SystemNumber) {
  return function hydrateFormData(rawData: Record<string, any>): Record<string, any> {
    const formData: Record<string, any> = {};

    // List of all possible field suffixes
    const fieldSuffixes: FieldSuffix[] = [
      'panel_qty',
      'panel_model',
      'panel_watt',
      'panel_price',
      'installed_kwh',
      'annual_production',
      'annual_value',
      'tilt',
      'azimuth',
      'location',
      'notes'
    ];

    // Extract all fields for this system
    for (const suffix of fieldSuffixes) {
      const value = extractDynamicValue(rawData, systemNum, suffix);
      if (value !== undefined) {
        // Store with unprefixed key for form
        formData[suffix] = value;
      }
    }

    return formData;
  };
}

/**
 * Factory for save payload generation
 * Creates a function that generates save payload for a specific system
 *
 * @param systemNum - The system number to create save function for
 * @returns Function that creates save payload from form data
 */
export function createSaveFunction(systemNum: SystemNumber) {
  return function createSavePayload(formData: Record<string, any>): Record<string, any> {
    const payload: Record<string, any> = {};

    // Map each form field to the correct system prefix
    for (const [key, value] of Object.entries(formData)) {
      const prefixedKey = `sys${systemNum}_${key}`;
      payload[prefixedKey] = value;
    }

    return payload;
  };
}

/**
 * Validates that a system number is within valid range
 *
 * @param systemNum - The system number to validate
 * @returns True if valid (1-10)
 */
export function isValidSystemNumber(systemNum: number): systemNum is SystemNumber {
  return Number.isInteger(systemNum) && systemNum >= 1 && systemNum <= 10;
}

/**
 * Gets the display label for a system tab
 *
 * @param systemNum - The system number
 * @returns Display label (e.g., "System 1", "System 2")
 */
export function getSystemLabel(systemNum: SystemNumber): string {
  return `System ${systemNum}`;
}

/**
 * Handles schema inconsistencies between System 1 and Systems 2+
 * System 1 uses underscores (solar_panel_existing, solarpanel_id)
 * Systems 2+ have NO underscore (solarpanel_existing, solarpanel_id)
 *
 * @param systemNum - The system number
 * @param fieldSuffix - The field suffix (with underscores)
 * @returns The correct database field name
 */
export function getSchemaField(systemNum: SystemNumber, fieldSuffix: string): string {
  const prefix = SYSTEM_PREFIXES[systemNum];

  // System 1 uses underscores consistently
  if (systemNum === 1) {
    return `${prefix}_${fieldSuffix}`;
  }

  // Systems 2+ have inconsistencies - remove underscore from specific fields
  const fieldsWithoutUnderscore = [
    'solar_panel_existing',
    'solarpanel_id'
  ];

  if (fieldsWithoutUnderscore.includes(fieldSuffix)) {
    // Remove underscore: solar_panel_existing → solarpanel_existing
    const cleanSuffix = fieldSuffix.replace('_', '');
    return `${prefix}_${cleanSuffix}`;
  }

  // All other fields use underscores normally
  return `${prefix}_${fieldSuffix}`;
}

/**
 * Gets all field names for a specific system
 *
 * @param systemNum - The system number
 * @returns Array of all field names for the system
 */
export function getSystemFieldNames(systemNum: SystemNumber): string[] {
  const suffixes: FieldSuffix[] = [
    'panel_qty',
    'panel_model',
    'panel_watt',
    'panel_price',
    'installed_kwh',
    'annual_production',
    'annual_value',
    'tilt',
    'azimuth',
    'location',
    'notes'
  ];

  return suffixes.map(suffix => `sys${systemNum}_${suffix}`);
}
