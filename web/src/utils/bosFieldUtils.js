/**
 * BOS Field Utilities
 * Generates field names and handles data extraction for all BOS section types
 */

import { BOS_FIELD_PATTERNS } from '../constants/bosFieldPatterns';

/**
 * Generate all field names for a BOS slot
 * @param {string} section - BOS section type (utility, battery1, battery2, backup, postSMS, combine)
 * @param {number} systemNumber - System number (1-4) or position number for combine
 * @param {number} slotNumber - Slot number within the section
 * @returns {{prefix: string, fields: Object}} Field prefix and field name map
 */
export const generateSlotFields = (section, systemNumber, slotNumber) => {
  const pattern = BOS_FIELD_PATTERNS[section];
  if (!pattern) {
    console.error(`Unknown BOS section: ${section}`);
    return { prefix: '', fields: {} };
  }

  let prefix;
  if (section === 'combine') {
    // Combine uses position_slot pattern
    prefix = pattern.slotPattern(systemNumber, slotNumber); // systemNumber = position for combine
  } else {
    prefix = pattern.slotPattern(systemNumber, slotNumber);
  }

  const fields = {};
  pattern.fields.forEach(field => {
    fields[field] = `${prefix}_${field}`;
  });

  return { prefix, fields };
};

/**
 * Extract BOS slot data from system details
 * @param {Object} systemDetails - System details object from API
 * @param {string} section - BOS section type
 * @param {number} systemNumber - System number (1-4) or position for combine
 * @param {number} slotNumber - Slot number
 * @returns {Object} Slot data with normalized fields
 */
export const extractSlotData = (systemDetails, section, systemNumber, slotNumber) => {
  const { prefix, fields } = generateSlotFields(section, systemNumber, slotNumber);

  const data = {
    fieldPrefix: prefix,
    slotNumber,
    systemNumber,
    section,
  };

  // Extract all field values
  Object.entries(fields).forEach(([key, fieldName]) => {
    data[key] = systemDetails?.[fieldName] ?? null;
  });

  // Normalize is_new/existing for consistent interface
  if (section === 'combine') {
    data.isNew = !data.existing; // Invert existing to isNew
  } else {
    data.isNew = data.is_new ?? true;
  }

  return data;
};

/**
 * Get all populated slots for a section
 * @param {Object} systemDetails - System details from API
 * @param {string} section - BOS section type
 * @param {number} systemNumber - System number (1-4), null for combine
 * @returns {Array} Array of populated slot data objects
 */
export const getPopulatedSlots = (systemDetails, section, systemNumber) => {
  const pattern = BOS_FIELD_PATTERNS[section];
  if (!pattern) return [];

  const slots = [];

  if (section === 'combine') {
    // Combine: iterate positions and slots
    for (let pos = 1; pos <= pattern.maxPositions; pos++) {
      for (let slot = 1; slot <= pattern.maxSlotsPerPosition; slot++) {
        const data = extractSlotData(systemDetails, section, pos, slot);
        if (data.equipment_type) {
          slots.push({ ...data, position: pos });
        }
      }
    }
  } else {
    // Standard sections: iterate slots
    const maxSlots = pattern.maxSlots;
    for (let slot = 1; slot <= maxSlots; slot++) {
      const data = extractSlotData(systemDetails, section, systemNumber, slot);
      if (data.equipment_type) {
        slots.push(data);
      }
    }
  }

  return slots;
};

/**
 * Find next available slot number for a section
 * @param {Object} systemDetails - System details from API
 * @param {string} section - BOS section type
 * @param {number} systemNumber - System number (1-4)
 * @param {number} position - Position number (for combine BOS only)
 * @returns {number|null} Next available slot number, or null if full
 */
export const getNextSlotNumber = (systemDetails, section, systemNumber, position = null) => {
  const pattern = BOS_FIELD_PATTERNS[section];
  if (!pattern) return null;

  if (section === 'combine') {
    // For combine, check slots within a specific position
    const maxSlots = pattern.maxSlotsPerPosition;
    for (let slot = 1; slot <= maxSlots; slot++) {
      const { fields } = generateSlotFields(section, position, slot);
      if (!systemDetails?.[fields.equipment_type]) {
        return slot;
      }
    }
  } else {
    // For standard sections, check slots within system
    const maxSlots = pattern.maxSlots;
    for (let slot = 1; slot <= maxSlots; slot++) {
      const { fields } = generateSlotFields(section, systemNumber, slot);
      if (!systemDetails?.[fields.equipment_type]) {
        return slot;
      }
    }
  }

  return null; // All slots full
};

/**
 * Build payload for creating/updating a BOS slot
 * @param {string} section - BOS section type
 * @param {number} systemNumber - System number (1-4) or position for combine
 * @param {number} slotNumber - Slot number
 * @param {Object} equipmentData - Equipment data to save
 * @returns {Object} Payload for API PATCH request
 */
export const buildSlotPayload = (section, systemNumber, slotNumber, equipmentData) => {
  const { prefix, fields } = generateSlotFields(section, systemNumber, slotNumber);
  const pattern = BOS_FIELD_PATTERNS[section];
  const payload = {};

  // Core equipment fields
  payload[fields.equipment_type] = equipmentData.equipmentType || equipmentData.equipment_type;
  payload[fields.make] = equipmentData.make;
  payload[fields.model] = equipmentData.model;
  payload[fields.amp_rating] = equipmentData.ampRating || equipmentData.amp_rating;

  // New/Existing handling
  if (section === 'combine') {
    payload[fields.existing] = !equipmentData.isNew;
    payload[fields.position] = 'POST COMBINE';
  } else {
    payload[fields.is_new] = equipmentData.isNew ?? true;
  }

  // Trigger field (if applicable)
  if (pattern.hasTrigger && fields.trigger) {
    payload[fields.trigger] = pattern.triggerValue(systemNumber);
  }

  // Active field (if applicable)
  if (pattern.hasActive && fields.active) {
    payload[fields.active] = true;
  }

  // Block name (if applicable)
  if (fields.block_name) {
    payload[fields.block_name] = equipmentData.blockName || pattern.defaultBlockName;
  }

  return payload;
};

/**
 * Build payload for clearing a BOS slot (delete)
 * @param {string} section - BOS section type
 * @param {number} systemNumber - System number (1-4) or position for combine
 * @param {number} slotNumber - Slot number
 * @returns {Object} Payload to clear all fields
 */
export const buildClearPayload = (section, systemNumber, slotNumber) => {
  const { fields } = generateSlotFields(section, systemNumber, slotNumber);
  const pattern = BOS_FIELD_PATTERNS[section];
  const payload = {};

  // Clear all fields to null/defaults
  payload[fields.equipment_type] = null;
  payload[fields.make] = null;
  payload[fields.model] = null;
  payload[fields.amp_rating] = null;

  if (section === 'combine') {
    payload[fields.existing] = null;
    payload[fields.position] = null;
  } else {
    payload[fields.is_new] = true; // Reset to default
    if (pattern.hasTrigger && fields.trigger) {
      payload[fields.trigger] = null;
    }
    if (pattern.hasActive && fields.active) {
      payload[fields.active] = false;
    }
    if (fields.block_name) {
      payload[fields.block_name] = null;
    }
  }

  return payload;
};

/**
 * Get field count for a section
 * @param {string} section - BOS section type
 * @returns {number} Number of fields per slot
 */
export const getFieldCount = (section) => {
  const pattern = BOS_FIELD_PATTERNS[section];
  return pattern?.fields?.length || 0;
};

/**
 * Check if a section supports drag-and-drop reordering
 * @param {string} section - BOS section type
 * @returns {boolean} True if draggable
 */
export const isDraggableSection = (section) => {
  const pattern = BOS_FIELD_PATTERNS[section];
  return pattern?.isDraggable === true;
};
