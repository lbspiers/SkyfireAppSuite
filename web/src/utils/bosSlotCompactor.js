/**
 * BOS Slot Compaction Utilities
 * Removes gaps when slots are deleted and renumbers remaining slots
 * Also handles drag-and-drop reordering for Battery and Backup BOS chains
 */

import { BOS_FIELD_PATTERNS } from '../constants/bosFieldPatterns';
import { generateSlotFields, extractSlotData } from './bosFieldUtils';

/**
 * Compact BOS slots to remove gaps after deletion
 * Returns payload to save for compaction
 *
 * @param {Object} systemDetails - Current system details from API
 * @param {string} section - BOS section type
 * @param {number} systemNumber - System number (1-4)
 * @returns {Object} Payload for API PATCH to compact slots
 */
export const compactBOSSlots = (systemDetails, section, systemNumber) => {
  const pattern = BOS_FIELD_PATTERNS[section];
  if (!pattern || section === 'combine') {
    // Combine BOS doesn't support compaction (fixed positions)
    return {};
  }

  const maxSlots = pattern.maxSlots;
  const populatedSlots = [];

  // Collect all populated slots in order
  for (let slot = 1; slot <= maxSlots; slot++) {
    const data = extractSlotData(systemDetails, section, systemNumber, slot);
    if (data.equipment_type) {
      populatedSlots.push(data);
    }
  }

  // Build compacted payload
  const payload = {};

  // Reassign populated slots to consecutive positions
  populatedSlots.forEach((slotData, index) => {
    const newSlotNumber = index + 1;
    const { fields } = generateSlotFields(section, systemNumber, newSlotNumber);

    // Copy all field values
    payload[fields.equipment_type] = slotData.equipment_type;
    payload[fields.make] = slotData.make;
    payload[fields.model] = slotData.model;
    payload[fields.amp_rating] = slotData.amp_rating;

    if (section === 'combine') {
      payload[fields.existing] = slotData.existing;
      payload[fields.position] = slotData.position;
    } else {
      payload[fields.is_new] = slotData.is_new ?? true;

      if (pattern.hasTrigger && fields.trigger) {
        payload[fields.trigger] = slotData.trigger;
      }

      if (pattern.hasActive && fields.active) {
        payload[fields.active] = slotData.active ?? true;
      }

      if (fields.block_name) {
        payload[fields.block_name] = slotData.block_name;
      }
    }
  });

  // Clear trailing empty slots
  for (let slot = populatedSlots.length + 1; slot <= maxSlots; slot++) {
    const { fields } = generateSlotFields(section, systemNumber, slot);

    payload[fields.equipment_type] = null;
    payload[fields.make] = null;
    payload[fields.model] = null;
    payload[fields.amp_rating] = null;

    if (section !== 'combine') {
      payload[fields.is_new] = true;

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
  }

  return payload;
};

/**
 * Reorder chain items after drag-and-drop
 * For Battery BOS and Backup BOS chains
 *
 * @param {Array} reorderedItems - Array of slot data in new order
 * @param {string} section - BOS section type (must be draggable)
 * @param {number} systemNumber - System number (1-4)
 * @returns {Object} Payload for API PATCH to save new order
 */
export const reorderChainItems = (reorderedItems, section, systemNumber) => {
  const pattern = BOS_FIELD_PATTERNS[section];
  if (!pattern?.isDraggable) {
    console.warn(`Section ${section} is not draggable`);
    return {};
  }

  const payload = {};

  // Reassign items to new slot positions
  reorderedItems.forEach((item, index) => {
    const newSlotNumber = index + 1;
    const { fields } = generateSlotFields(section, systemNumber, newSlotNumber);

    payload[fields.equipment_type] = item.equipment_type;
    payload[fields.make] = item.make;
    payload[fields.model] = item.model;
    payload[fields.amp_rating] = item.amp_rating;
    payload[fields.is_new] = item.is_new ?? true;

    if (pattern.hasTrigger && fields.trigger) {
      payload[fields.trigger] = item.trigger || pattern.triggerValue(systemNumber);
    }

    if (pattern.hasActive && fields.active) {
      // Backup BOS has active field, but not battery BOS
      payload[fields.active] = item.active ?? true;
    }

    if (fields.block_name) {
      payload[fields.block_name] = item.block_name || pattern.defaultBlockName;
    }
  });

  // Clear any remaining slots beyond the reordered items
  const maxSlots = pattern.maxSlots;
  for (let slot = reorderedItems.length + 1; slot <= maxSlots; slot++) {
    const { fields } = generateSlotFields(section, systemNumber, slot);

    payload[fields.equipment_type] = null;
    payload[fields.make] = null;
    payload[fields.model] = null;
    payload[fields.amp_rating] = null;
    payload[fields.is_new] = true;

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
 * Check if a slot has any data (not empty)
 * @param {Object} systemDetails - System details from API
 * @param {string} section - BOS section type
 * @param {number} systemNumber - System number
 * @param {number} slotNumber - Slot number
 * @returns {boolean} True if slot has data
 */
export const isSlotPopulated = (systemDetails, section, systemNumber, slotNumber) => {
  const data = extractSlotData(systemDetails, section, systemNumber, slotNumber);
  return !!data.equipment_type;
};

/**
 * Count populated slots in a section
 * @param {Object} systemDetails - System details from API
 * @param {string} section - BOS section type
 * @param {number} systemNumber - System number
 * @returns {number} Count of populated slots
 */
export const countPopulatedSlots = (systemDetails, section, systemNumber) => {
  const pattern = BOS_FIELD_PATTERNS[section];
  if (!pattern) return 0;

  let count = 0;
  const maxSlots = pattern.maxSlots;

  for (let slot = 1; slot <= maxSlots; slot++) {
    if (isSlotPopulated(systemDetails, section, systemNumber, slot)) {
      count++;
    }
  }

  return count;
};
