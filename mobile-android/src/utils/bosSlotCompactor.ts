// bosSlotCompactor.ts
// Utility for automatically compacting Pre-Combine BOS equipment slots when equipment is removed

import { saveSystemDetailsPartialExact } from '../screens/Project/SystemDetails/services/equipmentService';

interface BOSSlotData {
  equipmentType: string | null;
  make: string | null;
  model: string | null;
  ampRating: string | null;
  isNew: boolean | null;
  trigger: string | null;
  blockName: string | null;
  active: boolean | null;
}

interface BOSSlot extends BOSSlotData {
  originalSlot: number;
}

/**
 * Compact Pre-Combine BOS equipment slots by removing gaps
 * Simple version - just maintains insertion order and removes empty slots
 *
 * @param systemPrefix - e.g., "sys1", "sys2"
 * @param projectID - Project UUID
 * @param currentData - Current system details from database
 * @returns Promise that resolves when compaction is complete
 */
export async function compactBOSSlots(
  systemPrefix: string,
  projectID: string,
  currentData: Record<string, any>
): Promise<void> {
  console.log(`\n========================================`);
  console.log(`[MARBLE TUBE] Starting Pre-Combine BOS Compaction`);
  console.log(`[MARBLE TUBE] System: ${systemPrefix}`);
  console.log(`========================================`);

  // Remove trailing underscore if present (sys1_ → sys1)
  const cleanPrefix = systemPrefix.replace(/_$/, '');
  const prefix = `bos_${cleanPrefix}`;

  console.log(`[MARBLE TUBE] Database prefix: ${prefix}`);

  // 1. Extract all occupied BOS slots from current data
  const slots: BOSSlot[] = [];

  for (let i = 1; i <= 6; i++) {
    const slotPrefix = `${prefix}_type${i}`;
    const equipmentType = currentData[`${slotPrefix}_equipment_type`];

    // Only include non-empty slots
    if (equipmentType) {
      const slot: BOSSlot = {
        equipmentType,
        make: currentData[`${slotPrefix}_make`],
        model: currentData[`${slotPrefix}_model`],
        ampRating: currentData[`${slotPrefix}_amp_rating`],
        isNew: currentData[`${slotPrefix}_is_new`],
        trigger: currentData[`${slotPrefix}_trigger`],
        blockName: currentData[`${slotPrefix}_block_name`],
        active: currentData[`${slotPrefix}_active`],
        originalSlot: i,
      };

      slots.push(slot);
      console.log(`[MARBLE TUBE] Slot ${i}: ${equipmentType}`);
    }
  }

  console.log(`[MARBLE TUBE] Total equipment found: ${slots.length}`);

  // 2. Sort by original slot number to maintain insertion order
  const sortedSlots = slots.sort((a, b) => a.originalSlot - b.originalSlot);

  console.log(`[MARBLE TUBE] Equipment order:`);
  sortedSlots.forEach((s, i) => {
    console.log(`[MARBLE TUBE]   Position ${i + 1}: ${s.equipmentType} (was slot ${s.originalSlot})`);
  });

  // 3. Check if any changes are needed
  const needsCompaction = sortedSlots.some((slot, index) => slot.originalSlot !== index + 1);

  if (!needsCompaction) {
    console.log(`[MARBLE TUBE] No compaction needed - equipment already in consecutive positions`);
    console.log(`========================================\n`);
    return;
  }

  console.log(`[MARBLE TUBE] Compaction required - removing gaps...`);

  // 4. Build update object to reassign to consecutive slots
  const updates: Record<string, any> = {};

  // Assign slots to positions 1, 2, 3, etc.
  sortedSlots.forEach((slot, index) => {
    const newSlot = index + 1;
    const newSlotPrefix = `${prefix}_type${newSlot}`;

    updates[`${newSlotPrefix}_equipment_type`] = slot.equipmentType;
    updates[`${newSlotPrefix}_make`] = slot.make;
    updates[`${newSlotPrefix}_model`] = slot.model;
    updates[`${newSlotPrefix}_amp_rating`] = slot.ampRating;
    updates[`${newSlotPrefix}_is_new`] = slot.isNew;
    updates[`${newSlotPrefix}_trigger`] = slot.trigger;
    updates[`${newSlotPrefix}_block_name`] = slot.blockName;
    updates[`${newSlotPrefix}_active`] = slot.active;

    console.log(`[MARBLE TUBE]   Slot ${slot.originalSlot} → Slot ${newSlot} (${slot.equipmentType})`);
  });

  // 5. Clear any trailing empty slots
  for (let i = sortedSlots.length + 1; i <= 6; i++) {
    const clearPrefix = `${prefix}_type${i}`;
    updates[`${clearPrefix}_equipment_type`] = null;
    updates[`${clearPrefix}_make`] = null;
    updates[`${clearPrefix}_model`] = null;
    updates[`${clearPrefix}_amp_rating`] = null;
    updates[`${clearPrefix}_is_new`] = null;
    updates[`${clearPrefix}_trigger`] = null;
    updates[`${clearPrefix}_block_name`] = null;
    updates[`${clearPrefix}_active`] = null;

    console.log(`[MARBLE TUBE]   Clearing slot ${i}`);
  }

  // 6. Save to database
  console.log(`[MARBLE TUBE] Saving ${Object.keys(updates).length} field updates to database...`);
  await saveSystemDetailsPartialExact(projectID, updates);

  console.log(`[MARBLE TUBE] Compaction complete!`);
  console.log(`========================================\n`);
}

/**
 * Find if specific equipment type already exists in BOS slots
 * NOTE: Used by BOSAutoPopulationService - keeping for compatibility
 *
 * @param systemPrefix - e.g., "sys1", "sys2"
 * @param currentData - Current system details from database
 * @param equipmentType - "Gateway" or "SMS"
 * @returns Slot number if found, null otherwise
 */
export function findExistingSystemCoreEquipment(
  systemPrefix: string,
  currentData: Record<string, any>,
  equipmentType: 'Gateway' | 'SMS'
): number | null {
  const prefix = `bos_${systemPrefix}`;

  for (let i = 1; i <= 6; i++) {
    const slotPrefix = `${prefix}_type${i}`;
    const existingType = currentData[`${slotPrefix}_equipment_type`];

    if (!existingType) continue;

    // Simple string matching - no complex categorization
    const isGateway = existingType.toLowerCase().includes('gateway');
    const isSMS = existingType.toLowerCase() === 'sms' ||
                  existingType.toLowerCase().includes('storage management');

    const isMatch = equipmentType === 'Gateway' ? isGateway : isSMS;

    if (isMatch) {
      console.log(`[BOS Compaction] Found existing ${equipmentType} at slot ${i}`);
      return i;
    }
  }

  return null;
}

/**
 * Find if equipment with a specific trigger already exists
 *
 * @param systemPrefix - e.g., "sys1", "sys2"
 * @param currentData - Current system details from database
 * @param trigger - e.g., "sys1_powerwall"
 * @returns Slot number if found, null otherwise
 */
export function findEquipmentByTrigger(
  systemPrefix: string,
  currentData: Record<string, any>,
  trigger: string
): number | null {
  const prefix = `bos_${systemPrefix}`;

  for (let i = 1; i <= 6; i++) {
    const slotPrefix = `${prefix}_type${i}`;
    const existingTrigger = currentData[`${slotPrefix}_trigger`];

    if (existingTrigger === trigger) {
      console.log(`[BOS Compaction] Found equipment with trigger "${trigger}" at slot ${i}`);
      return i;
    }
  }

  return null;
}
