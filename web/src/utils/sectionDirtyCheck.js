/**
 * Section Dirty Check Utility
 *
 * Provides utilities for checking if a section has data (is "dirty")
 * and for getting fields to clear when resetting a section.
 *
 * Uses frontend field names - handleFieldChange will handle DB mapping.
 */

/**
 * Section field definitions for dirty checking
 * Maps section names to their relevant form data fields (frontend field names)
 */
export const SECTION_FIELDS = {
  solarPanel: [
    'solar_panel_make',
    'solar_panel_model',
    'solar_panel_quantity',
    'solar_panel_wattage',
  ],

  solarPanel2: [
    'solar_panel_type2_manufacturer',
    'solar_panel_type2_model',
    'solar_panel_type2_quantity',
    'solar_panel_type2_wattage',
  ],

  inverter: [
    'inverter_make',
    'inverter_model',
    'inverter_type',
  ],

  optimizer: [
    'optimizer_make',
    'optimizer_model',
  ],

  stringCombinerPanel: [
    'combiner_panel_make',
    'combiner_panel_model',
    'combiner_panel_bus_amps',
    'combiner_panel_main_breaker',
  ],

  energyStorage: [
    'backup_option',
    'backup_system_size',
  ],

  sms: [
    'sms_make',
    'sms_model',
    'sms_main_breaker',
  ],

  battery1: [
    'battery1_make',
    'battery1_model',
    'battery1_quantity',
  ],

  battery2: [
    'battery2_make',
    'battery2_model',
    'battery2_quantity',
  ],

  backupLoadSubPanel: [
    'backup_panel_make',
    'backup_panel_model',
    'backup_panel_bus_amps',
  ],

  batteryCombinerPanel: [
    'battery_combiner_panel_make',
    'battery_combiner_panel_model',
    'battery_combiner_panel_bus_amps',
    'battery_combiner_panel_main_breaker',
    'battery_combiner_panel_tie_in_breaker',
  ],

  gatewayConfig: [
    'gatewayConfigMainBreaker',
    'gatewayConfigBackupPanel',
    'gatewayConfigPVBreaker',
  ],

  mountingHardware: [
    'mounting_hardware_make',
    'mounting_hardware_model',
  ],

  rails: [
    'rails_make',
    'rails_model',
  ],

  roofing: [
    'roofing_type',
    'roofing_material',
  ],
};

/**
 * Check if a section has any meaningful data (is "dirty")
 *
 * @param {string} sectionName - Name of the section from SECTION_FIELDS
 * @param {object} formData - Current form data
 * @returns {boolean} - True if section has data
 */
export const isSectionDirty = (sectionName, formData) => {
  const fields = SECTION_FIELDS[sectionName];
  if (!fields) {
    console.warn(`Unknown section name: ${sectionName}`);
    return false;
  }

  return fields.some(field => {
    const value = formData[field];

    // Check for meaningful value (not null, undefined, empty string, or false)
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'boolean') return value; // true = has data
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return true;

    return Boolean(value);
  });
};

/**
 * Get all fields that should be cleared for a section
 * Returns array of [fieldName, clearValue] pairs
 *
 * Uses frontend field names - handleFieldChange will map to DB schema
 *
 * @param {string} sectionName - Name of the section from SECTION_FIELDS
 * @returns {Array<[string, any]>} - Array of [fieldName, clearValue] tuples
 */
export const getSectionClearFields = (sectionName) => {
  const fields = SECTION_FIELDS[sectionName];
  if (!fields) {
    console.warn(`Unknown section name: ${sectionName}`);
    return [];
  }

  return fields.map(field => {
    // Determine appropriate "clear" value
    // Boolean fields (like _isnew or _is_new) reset to true (default)
    // All other fields clear to empty string (will be converted to null on save)
    if (field.includes('isnew') || field.includes('IsNew') || field.includes('is_new')) {
      return [field, true];
    }
    return [field, ''];
  });
};

/**
 * Get count of fields that would be cleared
 * Useful for showing in confirmation modals
 *
 * @param {string} sectionName - Name of the section from SECTION_FIELDS
 * @returns {number} - Number of fields that would be cleared
 */
export const getSectionFieldCount = (sectionName) => {
  const fields = SECTION_FIELDS[sectionName];
  return fields ? fields.length : 0;
};
