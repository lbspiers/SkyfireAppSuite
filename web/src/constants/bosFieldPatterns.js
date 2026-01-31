/**
 * BOS Field Pattern Definitions
 * Matches mobile app database schema exactly (~622 fields)
 *
 * CRITICAL DIFFERENCES BY SECTION:
 * - Utility BOS: Has _active and _trigger fields
 * - Battery BOS: Has _trigger but NO _active field
 * - Backup BOS: Has both _active and _trigger fields
 * - Post-SMS BOS: Has both _active and _trigger fields
 * - Combine BOS: NO system prefix, uses _existing instead of _is_new, NO _trigger, NO _active
 */

export const BOS_FIELD_PATTERNS = {
  // ==================== UTILITY BOS ====================
  // Pattern: bos_sys{N}_type{slot}_{field}
  // 6 slots × 8 fields × 4 systems = 192 fields
  utility: {
    prefix: (sysNum) => `bos_sys${sysNum}`,
    slotPattern: (sysNum, slot) => `bos_sys${sysNum}_type${slot}`,
    maxSlots: 6,
    fields: ['equipment_type', 'make', 'model', 'amp_rating', 'is_new', 'active', 'trigger', 'block_name'],
    hasTrigger: true,
    hasActive: true,
    triggerValue: (sysNum) => `sys${sysNum}_stringCombiner`,
    defaultBlockName: 'PRE COMBINE',
  },

  // ==================== BATTERY 1 BOS ====================
  // Pattern: bos_sys{N}_battery1_type{slot}_{field}
  // 3 slots × 7 fields (NO _active) × 4 systems = 84 fields
  battery1: {
    prefix: (sysNum) => `bos_sys${sysNum}_battery1`,
    slotPattern: (sysNum, slot) => `bos_sys${sysNum}_battery1_type${slot}`,
    maxSlots: 3,
    fields: ['equipment_type', 'make', 'model', 'amp_rating', 'is_new', 'trigger', 'block_name'],
    hasTrigger: true,
    hasActive: false, // CRITICAL: Battery BOS has NO _active field
    triggerValue: (sysNum) => `sys${sysNum}_battery1`,
    defaultBlockName: 'ESS',
    isDraggable: true,
  },

  // ==================== BATTERY 2 BOS ====================
  // Pattern: bos_sys{N}_battery2_type{slot}_{field}
  // 3 slots × 7 fields (NO _active) × 4 systems = 84 fields
  battery2: {
    prefix: (sysNum) => `bos_sys${sysNum}_battery2`,
    slotPattern: (sysNum, slot) => `bos_sys${sysNum}_battery2_type${slot}`,
    maxSlots: 3,
    fields: ['equipment_type', 'make', 'model', 'amp_rating', 'is_new', 'trigger', 'block_name'],
    hasTrigger: true,
    hasActive: false, // CRITICAL: Battery BOS has NO _active field
    triggerValue: (sysNum) => `sys${sysNum}_battery2`,
    defaultBlockName: 'ESS',
    isDraggable: true,
  },

  // ==================== BACKUP BOS ====================
  // Pattern: bos_sys{N}_backup_type{slot}_{field}
  // 3 slots × 8 fields × 4 systems = 96 fields
  backup: {
    prefix: (sysNum) => `bos_sys${sysNum}_backup`,
    slotPattern: (sysNum, slot) => `bos_sys${sysNum}_backup_type${slot}`,
    maxSlots: 3,
    fields: ['equipment_type', 'make', 'model', 'amp_rating', 'is_new', 'active', 'trigger', 'block_name'],
    hasTrigger: true,
    hasActive: true,
    triggerValue: (sysNum) => `sys${sysNum}_backup`,
    defaultBlockName: 'BACKUP LOAD SUB PANEL',
    isDraggable: true,
  },

  // ==================== POST-SMS BOS ====================
  // Pattern: post_sms_bos_sys{N}_type{slot}_{field}
  // 3 slots × 8 fields × 4 systems = 96 fields
  postSMS: {
    prefix: (sysNum) => `post_sms_bos_sys${sysNum}`,
    slotPattern: (sysNum, slot) => `post_sms_bos_sys${sysNum}_type${slot}`,
    maxSlots: 3,
    fields: ['equipment_type', 'make', 'model', 'amp_rating', 'is_new', 'active', 'trigger', 'block_name'],
    hasTrigger: true,
    hasActive: true,
    triggerValue: (sysNum) => `sys${sysNum}_postSMS`,
    defaultBlockName: 'POST SMS',
  },

  // ==================== COMBINE BOS ====================
  // Pattern: postcombine_{position}_{slot}_{field}
  // CRITICAL: NO system prefix, uses _existing instead of _is_new
  // 3 positions × 3 slots × 6 fields = 54 fields
  combine: {
    prefix: () => 'postcombine',
    slotPattern: (position, slot) => `postcombine_${position}_${slot}`,
    maxPositions: 3,
    maxSlotsPerPosition: 3,
    fields: ['equipment_type', 'make', 'model', 'amp_rating', 'existing', 'position'],
    hasTrigger: false,
    hasActive: false,
    usesExisting: true, // Uses _existing instead of _is_new
    hasPosition: true,
    defaultBlockName: 'POST COMBINE',
  },
};

// ==================== TRIGGER SOURCES ====================
// Defines what equipment enables each BOS type
export const BOS_TRIGGERS = {
  utility: {
    source: 'stringCombinerPanel',
    requiredFields: ['make', 'model'],
    description: 'String Combiner Panel must have make and model',
  },
  battery1: {
    source: 'batteryType1',
    requiredFields: ['quantity'],
    description: 'Battery Type 1 quantity must be > 0',
  },
  battery2: {
    source: 'batteryType2',
    requiredFields: ['quantity'],
    description: 'Battery Type 2 quantity must be > 0',
  },
  backup: {
    source: 'backupOption',
    requiredValues: ['Whole Home', 'Partial Home'],
    description: 'Backup option must be Whole Home or Partial Home',
  },
  postSMS: {
    source: 'sms',
    requiredFields: ['make', 'model'],
    description: 'SMS must have make and model (or noSMS is false)',
  },
  combine: {
    source: 'activeSystems',
    minCount: 2,
    description: 'At least 2 active systems required',
  },
};

// ==================== FIELD COUNT SUMMARY ====================
// For reference and validation
export const BOS_FIELD_COUNTS = {
  utility: { slots: 6, fields: 8, systems: 4, total: 192 },
  battery: { slots: 3, fields: 7, batteries: 2, systems: 4, total: 168 }, // battery1 + battery2
  backup: { slots: 3, fields: 8, systems: 4, total: 96 },
  postSMS: { slots: 3, fields: 8, systems: 4, total: 96 },
  combine: { positions: 3, slotsPerPos: 3, fields: 6, total: 54 },
  grandTotal: 606, // Plus ~16 visibility control fields = 622
};

// ==================== BOS EQUIPMENT TYPES ====================
export const BOS_EQUIPMENT_TYPES = [
  'AC Disconnect',
  'Fused AC Disconnect',
  'Visible Lockable Labeled Disconnect',
  'PV Meter',
  'Bi-Directional Meter',
  'Uni-Directional Meter',
  'DC Disconnect',
  'DER Disconnect',
  'Rapid Shutdown Device',
  'Combiner Box',
  'Junction Box',
  'Surge Protection Device',
  'Grounding Equipment',
  'Conduit',
  'Load Center',
  'Meter Main Combo',
  'Circuit Breaker',
  'Fused Disconnect Switch',
  'Emergency Disconnect',
  'Critical Loads Panel',
  'Transfer Switch',
  'Other',
];

// ==================== UTILITY-SPECIFIC EQUIPMENT ====================
// Equipment types that are specific to certain utilities
export const UTILITY_SPECIFIC_EQUIPMENT = {
  'Oncor': ['Visible Lockable Labeled Disconnect'],
  'APS': ['Visible Lockable Labeled Disconnect'],
  'SRP': ['Visible Lockable Labeled Disconnect'],
};

/**
 * Get BOS equipment types filtered by utility
 * @param {string|null} utilityName - Name of the utility company
 * @returns {Array<string>} - Filtered equipment types
 */
export const getBOSEquipmentTypes = (utilityName) => {
  if (!utilityName) return BOS_EQUIPMENT_TYPES;

  // Check if this utility has specific equipment
  const specificEquipment = UTILITY_SPECIFIC_EQUIPMENT[utilityName];
  if (!specificEquipment) return BOS_EQUIPMENT_TYPES;

  // Return all types (utility-specific equipment is already in the base list)
  return BOS_EQUIPMENT_TYPES;
};

/**
 * Check if an equipment type is available for a given utility
 * @param {string} equipmentType - Equipment type to check
 * @param {string|null} utilityName - Name of the utility company
 * @returns {boolean} - True if equipment is available for this utility
 */
export const isEquipmentAvailableForUtility = (equipmentType, utilityName) => {
  // Non utility-specific equipment is always available
  const allUtilitySpecific = Object.values(UTILITY_SPECIFIC_EQUIPMENT).flat();
  if (!allUtilitySpecific.includes(equipmentType)) {
    return true;
  }

  // If no utility specified, show all equipment
  if (!utilityName) return true;

  // Check if this specific equipment is for this utility
  const specificEquipment = UTILITY_SPECIFIC_EQUIPMENT[utilityName];
  return specificEquipment && specificEquipment.includes(equipmentType);
};
