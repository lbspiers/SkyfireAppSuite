// src/types/bosTypes.ts
// TypeScript types for Balance of System (BOS) equipment management

// ============================================
// Type Aliases
// ============================================

export type SystemNumber = 1 | 2 | 3 | 4;
export type SystemPrefix = 'sys1_' | 'sys2_' | 'sys3_' | 'sys4_';

export type BOSSectionType =
  | 'utility'      // Main utility BOS (6 slots)
  | 'battery1'     // Battery Type 1 BOS (3 slots)
  | 'battery2'     // Battery Type 2 BOS (3 slots)
  | 'backup'       // Backup Panel BOS (3 slots)
  | 'postSMS'      // Post-SMS BOS (3 slots)
  | 'combine';     // Post-Combine BOS (3 slots)

export type BOSBlockName =
  | 'PRE COMBINE'
  | 'POST COMBINE'
  | 'BATTERY CHAIN'
  | 'BACKUP';

// ============================================
// BOS Equipment Catalog
// ============================================

/**
 * Equipment item in the BOS catalog
 */
export interface BOSEquipmentCatalogItem {
  type: string;         // e.g., "AC Disconnect", "Fused AC Disconnect"
  make: string;         // e.g., "EATON", "SIEMENS", "SQUARE D"
  model: string;        // e.g., "DG222NRB", "HF222N"
  amp: string;          // Display string: "30", "60", "100", "200" (or "30A", "60A", etc.)
  ampNumeric?: number;  // Optional numeric value for calculations: 30, 60, 100, 200
}

// ============================================
// BOS Equipment Slot
// ============================================

/**
 * A single BOS equipment slot representing one piece of BOS equipment
 */
export interface BOSSlot {
  // Identity
  section: BOSSectionType;
  systemNumber: SystemNumber;
  slotNumber: number;           // 1-6 for utility, 1-3 for others
  fieldPrefix: string;          // e.g., "bos_sys1_type1_", "bos_sys1_battery1_type1_"

  // Equipment data
  equipmentType: string | null;  // e.g., "AC Disconnect", "Fused AC Disconnect"
  make: string | null;           // e.g., "EATON", "SIEMENS"
  model: string | null;          // e.g., "DG222NRB", "HF222N"
  ampRating: string | null;      // e.g., "30A", "60A", "100A"

  // Status flags
  isNew: boolean | null;         // true = new equipment, false = existing, null = not set
  active: boolean | null;        // Slot is active (only for utility/backup/postSMS sections)
  trigger: boolean | null;       // Auto-populated by system (only for utility/battery sections)
  blockName: BOSBlockName | null; // Classification metadata

  // Special flags (combine section only)
  existing?: boolean | null;     // For combine section: inverted from isNew
}

// ============================================
// BOS System Data
// ============================================

/**
 * All BOS slots for a single system (1-4)
 */
export interface BOSSystemData {
  systemNumber: SystemNumber;

  // Main utility BOS (up to 6 slots)
  utilitySlots: BOSSlot[];

  // Battery Type 1 BOS (up to 3 slots)
  battery1Slots: BOSSlot[];

  // Battery Type 2 BOS (up to 3 slots)
  battery2Slots: BOSSlot[];

  // Backup Panel BOS (up to 3 slots)
  backupSlots: BOSSlot[];

  // Post-SMS BOS (up to 3 slots)
  postSMSSlots: BOSSlot[];

  // Post-Combine BOS (up to 3 slots) - System 1 only
  combineSlots?: BOSSlot[];

  // Last slot used (tracking)
  lastSlot?: number;
}

// ============================================
// BOS Trigger Equipment (Read-Only Context)
// ============================================

/**
 * Solar panel trigger equipment
 */
export interface BOSSolarPanelTrigger {
  present: boolean;
  make: string | null;
  model: string | null;
  quantity: number | null;
  isNew: boolean | null;
  type2Present?: boolean;      // Second panel type
  type2Make?: string | null;
  type2Model?: string | null;
  type2Quantity?: number | null;
  type2IsNew?: boolean | null;
}

/**
 * Inverter trigger equipment
 */
export interface BOSInverterTrigger {
  present: boolean;
  type: 'micro' | 'string' | 'hybrid' | null;
  make: string | null;
  model: string | null;
  quantity: number | null;
  isNew: boolean | null;
}

/**
 * String combiner panel trigger equipment
 */
export interface BOSStringCombinerTrigger {
  present: boolean;
  make: string | null;
  model: string | null;
  isNew: boolean | null;
  busRating: string | null;
  mainBreakerRating: string | null;
}

/**
 * Battery trigger equipment
 */
export interface BOSBatteryTrigger {
  present: boolean;
  make: string | null;
  model: string | null;
  quantity: number | null;
  isNew: boolean | null;
  tieInLocation: string | null;
}

/**
 * SMS (Smart Module System) trigger equipment
 */
export interface BOSSMSTrigger {
  present: boolean;
  make: string | null;
  model: string | null;
  isNew: boolean | null;
  equipmentType: string | null;
  breakerRating: string | null;
  rsdEnabled: boolean | null;
}

/**
 * Backup panel trigger equipment
 */
export interface BOSBackupPanelTrigger {
  present: boolean;
  make: string | null;
  model: string | null;
  busRating: string | null;
  mainBreakerRating: string | null;
}

/**
 * Gateway/Tesla trigger equipment
 */
export interface BOSGatewayTrigger {
  present: boolean;
  type: string | null;
  extensions: number | null;
  backupSwitchLocation: string | null;
}

/**
 * All trigger equipment for a system (read-only context)
 */
export interface BOSTriggerEquipment {
  systemNumber: SystemNumber;

  solarPanel: BOSSolarPanelTrigger;
  inverter: BOSInverterTrigger;
  stringCombiner: BOSStringCombinerTrigger;
  battery1: BOSBatteryTrigger;
  battery2: BOSBatteryTrigger;
  sms: BOSSMSTrigger;
  backupPanel: BOSBackupPanelTrigger;
  gateway: BOSGatewayTrigger;

  // Additional context
  batteryConfiguration: string | null;      // "Series", "Parallel", "Series-Parallel"
  combinationMethod: string | null;         // How batteries are combined
  backupOption: string | null;              // Backup configuration
  batteryOnly: boolean;                     // Battery-only system (no solar)
}

// ============================================
// NEC Amp Calculations
// ============================================

/**
 * Context needed for NEC 125% amp rating calculations
 */
export interface AmpCalculationContext {
  inverterAmperage: number | null;
  solarPanelWattage: number | null;
  solarPanelQuantity: number | null;
  systemVoltage: number;                    // 240V typical for residential
  utilityServiceAmps: number | null;
  allowableBackfeed: number | null;

  // Battery-specific
  batteryMaxChargeCurrent: number | null;
  batteryMaxDischargeCurrent: number | null;

  // Calculated values
  continuousLoadMultiplier: number;         // 1.25 for NEC compliance
  minimumAmpRating: number | null;          // Calculated minimum
  recommendedAmpRating: number | null;      // Next standard size up
}

// ============================================
// BOS Field Mapping
// ============================================

/**
 * Maps a BOS slot to its database field names
 */
export interface BOSFieldMapping {
  equipmentType: string;  // e.g., "bos_sys1_type1_equipment_type"
  make: string;           // e.g., "bos_sys1_type1_make"
  model: string;          // e.g., "bos_sys1_type1_model"
  ampRating: string;      // e.g., "bos_sys1_type1_amp_rating"
  isNew: string;          // e.g., "bos_sys1_type1_is_new"
  active?: string;        // e.g., "bos_sys1_type1_active" (not for battery sections)
  trigger?: string;       // e.g., "bos_sys1_type1_trigger" (only utility/battery)
  blockName?: string;     // e.g., "bos_sys1_type1_block_name" (not for combine)
  existing?: string;      // e.g., "postcombine1_existing" (combine only, inverted from isNew)
}

/**
 * Database payload ready for save
 */
export interface BOSSavePayload {
  [fieldName: string]: string | number | boolean | null;
}

// ============================================
// Utility Equipment Translations
// ============================================

/**
 * Utility company (for equipment name translations)
 */
export type UtilityCompany = 'APS' | 'SRP' | 'TEP' | 'TRICO' | null;

/**
 * Mapping from standard equipment type to utility-specific name
 */
export interface UtilityEquipmentTranslation {
  standardType: string;
  utilityType: string;
  utility: UtilityCompany;
}

// ============================================
// BOS Section Configuration
// ============================================

/**
 * Configuration for each BOS section type
 */
export interface BOSSectionConfig {
  section: BOSSectionType;
  label: string;                                      // Display label
  maxSlots: number;                                   // Maximum slots allowed
  hasActiveField: boolean;                            // Section uses _active field
  hasTriggerField: boolean;                           // Section uses _trigger field
  hasBlockNameField: boolean;                         // Section uses _block_name field
  useExistingField: boolean;                          // Section uses _existing instead of _is_new

  // Functions
  getFieldPrefix: (systemNumber: SystemNumber, slotNumber: number) => string;
  getTriggerEquipment: (triggerData: BOSTriggerEquipment) => boolean; // Should section appear?
}

// ============================================
// BOS Equipment Modal Props
// ============================================

/**
 * Props for the BOS equipment modal (edit/add)
 */
export interface BOSEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (slot: BOSSlot) => Promise<void>;
  slot: BOSSlot | null;
  section: BOSSectionType;
  systemNumber: SystemNumber;
  utility: UtilityCompany;
}

// ============================================
// BOS Panel Props
// ============================================

/**
 * Props for the main BOS panel component
 */
export interface BOSPanelProps {
  systemNumber: SystemNumber;
  projectUuid: string;
  utility: UtilityCompany;
  onDataChange?: () => void;
}

// ============================================
// BOS Hook Return Types
// ============================================

/**
 * Return type for useBOSData hook
 */
export interface UseBOSDataReturn {
  // Data
  bosData: BOSSystemData | null;
  triggerEquipment: BOSTriggerEquipment | null;

  // Loading states
  loading: boolean;
  saving: boolean;

  // Operations
  addSlot: (section: BOSSectionType) => Promise<BOSSlot>;
  updateSlot: (slot: BOSSlot) => Promise<void>;
  deleteSlot: (slot: BOSSlot) => Promise<void>;
  refreshData: () => Promise<void>;

  // Helpers
  getAvailableSlots: (section: BOSSectionType) => number;
  canAddSlot: (section: BOSSectionType) => boolean;
  calculateMinimumAmpRating: (context: AmpCalculationContext) => number | null;

  // Error
  error: Error | null;
}
