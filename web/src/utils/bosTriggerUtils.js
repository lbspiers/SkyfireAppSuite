/**
 * BOS Trigger Detection Utilities
 * Determines which BOS sections should be visible based on equipment configuration
 */

import { BOS_TRIGGERS, BOS_FIELD_PATTERNS } from '../constants/bosFieldPatterns';

/**
 * Check if a BOS section should be visible for a given system
 * @param {Object} formData - System details/form data
 * @param {string} section - BOS section type
 * @param {number} systemNumber - System number (1-4)
 * @returns {boolean} True if section should be visible
 */
export const shouldShowBOSSection = (formData, section, systemNumber) => {
  const trigger = BOS_TRIGGERS[section];
  if (!trigger) return false;

  const sysPrefix = `sys${systemNumber}_`;

  switch (section) {
    case 'utility':
      // Show when String Combiner Panel has make AND model OR when inverter exists
      const scpMake = formData?.[`${sysPrefix}string_combiner_panel_make`];
      const scpModel = formData?.[`${sysPrefix}string_combiner_panel_model`];
      const hasStringCombiner = !!(scpMake && scpModel);

      // Also check for inverter (micro or string)
      const inverterMake = formData?.[`${sysPrefix}micro_inverter_make`] || formData?.[`${sysPrefix}inverter_make`];
      const inverterModel = formData?.[`${sysPrefix}micro_inverter_model`] || formData?.[`${sysPrefix}inverter_model`];
      const hasInverter = !!(inverterMake && inverterModel);

      return hasStringCombiner || hasInverter;

    case 'battery1':
      // Show when Battery Type 1 has quantity > 0
      const bat1Qty = parseInt(formData?.[`${sysPrefix}battery1_qty`] || formData?.[`${sysPrefix}battery_type1_quantity`] || 0);
      return bat1Qty > 0;

    case 'battery2':
      // Show when Battery Type 2 has quantity > 0
      const bat2Qty = parseInt(formData?.[`${sysPrefix}battery2_qty`] || formData?.[`${sysPrefix}battery_type2_quantity`] || 0);
      return bat2Qty > 0;

    case 'backup':
      // Show when backup option is Whole Home or Partial Home
      const backupOption = formData?.[`${sysPrefix}backup_option`] || formData?.[`${sysPrefix}ess_backup_option`];
      return backupOption === 'Whole Home' || backupOption === 'Partial Home';

    case 'postSMS':
      // Show when SMS has make AND model (or noSMS is explicitly false)
      const smsMake = formData?.[`${sysPrefix}sms_make`];
      const smsModel = formData?.[`${sysPrefix}sms_model`];
      const noSMS = formData?.[`${sysPrefix}no_sms`];
      return !!(smsMake && smsModel) || noSMS === false;

    case 'combine':
      // Show when 2+ active systems exist
      return getActiveSystemCount(formData) >= 2;

    default:
      return false;
  }
};

/**
 * Count active systems (systems with equipment configured)
 * @param {Object} formData - System details/form data
 * @returns {number} Number of active systems
 */
export const getActiveSystemCount = (formData) => {
  let count = 0;

  for (let sys = 1; sys <= 4; sys++) {
    const prefix = `sys${sys}_`;

    // Check for any core equipment that indicates an active system
    const hasSolarPanel = formData?.[`${prefix}solar_panel_make`];
    const hasMicroInverter = formData?.[`${prefix}micro_inverter_make`];
    const hasInverter = formData?.[`${prefix}inverter_make`];
    const hasBattery1 = parseInt(formData?.[`${prefix}battery1_qty`] || 0) > 0;
    const hasBattery2 = parseInt(formData?.[`${prefix}battery2_qty`] || 0) > 0;

    if (hasSolarPanel || hasMicroInverter || hasInverter || hasBattery1 || hasBattery2) {
      count++;
    }
  }

  return count;
};

/**
 * Get trigger value for a section
 * @param {string} section - BOS section type
 * @param {number} systemNumber - System number (1-4)
 * @returns {string|null} Trigger value or null
 */
export const getTriggerValue = (section, systemNumber) => {
  const pattern = BOS_FIELD_PATTERNS[section];
  if (!pattern?.hasTrigger) return null;
  return pattern.triggerValue(systemNumber);
};

/**
 * Extract trigger equipment details for display
 * @param {Object} formData - System details/form data
 * @param {string} section - BOS section type
 * @param {number} systemNumber - System number (1-4)
 * @returns {Object} Trigger equipment details
 */
export const getTriggerEquipmentDetails = (formData, section, systemNumber) => {
  const sysPrefix = `sys${systemNumber}_`;

  switch (section) {
    case 'utility':
      return {
        solarPanel: {
          present: !!formData?.[`${sysPrefix}solar_panel_make`],
          make: formData?.[`${sysPrefix}solar_panel_make`],
          model: formData?.[`${sysPrefix}solar_panel_model`],
          quantity: formData?.[`${sysPrefix}solar_panel_quantity`],
          isNew: !formData?.[`${sysPrefix}solar_panel_existing`],
        },
        inverter: {
          present: !!formData?.[`${sysPrefix}micro_inverter_make`] || !!formData?.[`${sysPrefix}inverter_make`],
          type: formData?.[`${sysPrefix}micro_inverter_make`] ? 'microinverter' : 'string',
          make: formData?.[`${sysPrefix}micro_inverter_make`] || formData?.[`${sysPrefix}inverter_make`],
          model: formData?.[`${sysPrefix}micro_inverter_model`] || formData?.[`${sysPrefix}inverter_model`],
          quantity: formData?.[`${sysPrefix}micro_inverter_quantity`] || formData?.[`${sysPrefix}inverter_quantity`],
        },
        stringCombiner: {
          present: !!formData?.[`${sysPrefix}string_combiner_panel_make`],
          make: formData?.[`${sysPrefix}string_combiner_panel_make`],
          model: formData?.[`${sysPrefix}string_combiner_panel_model`],
        },
      };

    case 'battery1':
      return {
        battery1: {
          present: parseInt(formData?.[`${sysPrefix}battery1_qty`] || 0) > 0,
          make: formData?.[`${sysPrefix}battery1_make`],
          model: formData?.[`${sysPrefix}battery1_model`],
          quantity: formData?.[`${sysPrefix}battery1_qty`],
        },
      };

    case 'battery2':
      return {
        battery2: {
          present: parseInt(formData?.[`${sysPrefix}battery2_qty`] || 0) > 0,
          make: formData?.[`${sysPrefix}battery2_make`],
          model: formData?.[`${sysPrefix}battery2_model`],
          quantity: formData?.[`${sysPrefix}battery2_qty`],
        },
      };

    case 'backup':
      return {
        backupPanel: {
          present: !!formData?.[`${sysPrefix}backup_panel_make`],
          make: formData?.[`${sysPrefix}backup_panel_make`],
          model: formData?.[`${sysPrefix}backup_panel_model`],
        },
      };

    case 'postSMS':
      return {
        sms: {
          present: !!formData?.[`${sysPrefix}sms_make`],
          make: formData?.[`${sysPrefix}sms_make`],
          model: formData?.[`${sysPrefix}sms_model`],
        },
      };

    default:
      return {};
  }
};

/**
 * Get all visible sections for a system
 * @param {Object} formData - System details/form data
 * @param {number} systemNumber - System number (1-4)
 * @returns {Array<string>} Array of visible section names
 */
export const getVisibleSections = (formData, systemNumber) => {
  const allSections = ['utility', 'battery1', 'battery2', 'backup', 'postSMS'];
  return allSections.filter(section => shouldShowBOSSection(formData, section, systemNumber));
};

/**
 * Check if combine BOS should be visible
 * @param {Object} formData - System details/form data
 * @returns {boolean} True if combine BOS should be visible
 */
export const shouldShowCombineBOS = (formData) => {
  return shouldShowBOSSection(formData, 'combine', null);
};
