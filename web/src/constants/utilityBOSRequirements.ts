import type { BOSSectionType, BOSBlockName } from '../types/bosTypes';

// ============================================
// Types
// ============================================

export interface UtilityBOSRequirement {
  /** Equipment type (uses utility-specific name) */
  equipmentType: string;

  /** Standard equipment type for catalog lookup */
  standardType: string;

  /** Which BOS section this belongs to */
  section: BOSSectionType;

  /** Block classification */
  blockName: BOSBlockName;

  /** Whether this is required or optional */
  required: boolean;

  /** Order/priority for display (lower = first) */
  order: number;

  /** Amp sizing rule */
  ampSizing: 'inverter' | 'battery' | 'backupPanel' | 'fixed' | 'manual';

  /** Fixed amp rating (if ampSizing is 'fixed') */
  fixedAmp?: string;

  /** Preferred make (optional default) */
  preferredMake?: string;

  /** Preferred model (optional default) */
  preferredModel?: string;

  /** Notes/description for UI tooltips */
  notes?: string;
}

export interface UtilityBOSConfig {
  /** Utility abbreviation */
  utilityCode: string;

  /** Full utility name */
  utilityName: string;

  /** BOS requirements for utility section */
  utilityBOS: UtilityBOSRequirement[];

  /** BOS requirements for battery sections */
  batteryBOS: UtilityBOSRequirement[];

  /** BOS requirements for backup section */
  backupBOS: UtilityBOSRequirement[];

  /** BOS requirements for post-SMS section */
  postSMSBOS: UtilityBOSRequirement[];

  /** BOS requirements for post-combine section */
  combineBOS: UtilityBOSRequirement[];

  /** General notes about this utility's requirements */
  notes?: string;
}

// ============================================
// APS - Arizona Public Service
// ============================================

export const APS_BOS_CONFIG: UtilityBOSConfig = {
  utilityCode: 'APS',
  utilityName: 'Arizona Public Service (APS)',
  notes: 'APS requires a visible, lockable utility disconnect at the meter.',

  utilityBOS: [
    {
      equipmentType: 'Uni-Directional Meter',  // APS production meter (PV-Only slot 1)
      standardType: 'PV Meter',
      section: 'utility',
      blockName: 'PRE COMBINE',
      required: true,
      order: 1,
      ampSizing: 'fixed',
      fixedAmp: '200A',
      preferredMake: 'ITRON',
      notes: 'Required for all APS solar installations',
    },
    {
      equipmentType: 'Uni-Directional Meter Line Side Disconnect',  // DER-side disconnect (PV-Only slot 2)
      standardType: 'AC Disconnect',
      section: 'utility',
      blockName: 'PRE COMBINE',
      required: true,
      order: 2,
      ampSizing: 'inverter',
      preferredMake: 'EATON',
      notes: 'DER-side non-fused disconnect',
    },
    {
      equipmentType: 'Utility Disconnect',  // Utility-side disconnect (AC-Coupled/Battery configs only)
      standardType: 'Fused AC Disconnect',
      section: 'utility',
      blockName: 'PRE COMBINE',
      required: false,  // Only for battery/AC-coupled systems
      order: 3,
      ampSizing: 'inverter',
      preferredMake: 'EATON',
      notes: 'Utility-side lockable disconnect - required for battery systems',
    },
  ],

  batteryBOS: [
    {
      equipmentType: 'AC Disconnect',
      standardType: 'AC Disconnect',
      section: 'battery1',
      blockName: 'BATTERY CHAIN',
      required: true,
      order: 1,
      ampSizing: 'battery',
      preferredMake: 'EATON',
      notes: 'Required disconnect for battery system',
    },
  ],

  backupBOS: [
    {
      equipmentType: 'Load Center',
      standardType: 'Load Center',
      section: 'backup',
      blockName: 'BACKUP',
      required: false,
      order: 1,
      ampSizing: 'backupPanel',
      preferredMake: 'SQUARE D',
      notes: 'For backed-up loads subpanel',
    },
  ],

  postSMSBOS: [],

  combineBOS: [],
};

// ============================================
// SRP - Salt River Project
// ============================================

export const SRP_BOS_CONFIG: UtilityBOSConfig = {
  utilityCode: 'SRP',
  utilityName: 'Salt River Project (SRP)',
  notes: 'SRP requires DER meter disconnect switch for all interconnections.',

  utilityBOS: [
    {
      equipmentType: 'DER Meter Disconnect Switch',  // SRP-specific name
      standardType: 'AC Disconnect',
      section: 'utility',
      blockName: 'PRE COMBINE',
      required: true,
      order: 1,
      ampSizing: 'inverter',
      preferredMake: 'EATON',
      notes: 'SRP-specific disconnect requirement',
    },
    {
      equipmentType: 'Dedicated DER Meter',  // SRP-specific name
      standardType: 'PV Meter',
      section: 'utility',
      blockName: 'PRE COMBINE',
      required: true,
      order: 2,
      ampSizing: 'fixed',
      fixedAmp: '200A',
      preferredMake: 'ITRON',
      notes: 'Required for all SRP solar interconnections',
    },
  ],

  batteryBOS: [
    {
      equipmentType: 'AC Disconnect',
      standardType: 'AC Disconnect',
      section: 'battery1',
      blockName: 'BATTERY CHAIN',
      required: true,
      order: 1,
      ampSizing: 'battery',
      preferredMake: 'EATON',
    },
  ],

  backupBOS: [],

  postSMSBOS: [],

  combineBOS: [],
};

// ============================================
// TEP - Tucson Electric Power
// ============================================

export const TEP_BOS_CONFIG: UtilityBOSConfig = {
  utilityCode: 'TEP',
  utilityName: 'Tucson Electric Power (TEP)',
  notes: 'TEP requires DG disconnect switch and may require dedicated meter.',

  utilityBOS: [
    {
      equipmentType: 'DG Disconnect Switch',  // TEP-specific name
      standardType: 'AC Disconnect',
      section: 'utility',
      blockName: 'PRE COMBINE',
      required: true,
      order: 1,
      ampSizing: 'inverter',
      preferredMake: 'EATON',
      notes: 'TEP Distributed Generation disconnect',
    },
    {
      equipmentType: 'Utility DG Meter',  // TEP-specific name
      standardType: 'PV Meter',
      section: 'utility',
      blockName: 'PRE COMBINE',
      required: false,
      order: 2,
      ampSizing: 'fixed',
      fixedAmp: '200A',
      preferredMake: 'ITRON',
      notes: 'May be required depending on system size',
    },
  ],

  batteryBOS: [
    {
      equipmentType: 'AC Disconnect',
      standardType: 'AC Disconnect',
      section: 'battery1',
      blockName: 'BATTERY CHAIN',
      required: true,
      order: 1,
      ampSizing: 'battery',
      preferredMake: 'EATON',
    },
  ],

  backupBOS: [],

  postSMSBOS: [],

  combineBOS: [],
};

// ============================================
// TRICO - Trico Electric Cooperative
// ============================================

export const TRICO_BOS_CONFIG: UtilityBOSConfig = {
  utilityCode: 'TRICO',
  utilityName: 'Trico Electric Cooperative (TRICO)',
  notes: 'TRICO requires co-generation system utility disconnect.',

  utilityBOS: [
    {
      equipmentType: 'Co-Generation System Utility Disconnect',  // TRICO-specific name
      standardType: 'AC Disconnect',
      section: 'utility',
      blockName: 'PRE COMBINE',
      required: true,
      order: 1,
      ampSizing: 'inverter',
      preferredMake: 'EATON',
      notes: 'TRICO co-generation disconnect requirement',
    },
  ],

  batteryBOS: [
    {
      equipmentType: 'AC Disconnect',
      standardType: 'AC Disconnect',
      section: 'battery1',
      blockName: 'BATTERY CHAIN',
      required: true,
      order: 1,
      ampSizing: 'battery',
      preferredMake: 'EATON',
    },
  ],

  backupBOS: [],

  postSMSBOS: [],

  combineBOS: [],
};

// ============================================
// Default Config (for unknown utilities)
// ============================================

export const DEFAULT_BOS_CONFIG: UtilityBOSConfig = {
  utilityCode: 'DEFAULT',
  utilityName: 'Default Utility',
  notes: 'Standard BOS requirements when utility is not specified.',

  utilityBOS: [
    {
      equipmentType: 'AC Disconnect',
      standardType: 'AC Disconnect',
      section: 'utility',
      blockName: 'PRE COMBINE',
      required: true,
      order: 1,
      ampSizing: 'inverter',
      preferredMake: 'EATON',
      notes: 'Standard utility disconnect',
    },
  ],

  batteryBOS: [
    {
      equipmentType: 'AC Disconnect',
      standardType: 'AC Disconnect',
      section: 'battery1',
      blockName: 'BATTERY CHAIN',
      required: true,
      order: 1,
      ampSizing: 'battery',
      preferredMake: 'EATON',
    },
  ],

  backupBOS: [],

  postSMSBOS: [],

  combineBOS: [],
};

// ============================================
// Utility Config Map
// ============================================

export const UTILITY_BOS_CONFIGS: Record<string, UtilityBOSConfig> = {
  'APS': APS_BOS_CONFIG,
  'Arizona Public Service': APS_BOS_CONFIG,
  'Arizona Public Service (APS)': APS_BOS_CONFIG,

  'SRP': SRP_BOS_CONFIG,
  'Salt River Project': SRP_BOS_CONFIG,
  'Salt River Project (SRP)': SRP_BOS_CONFIG,

  'TEP': TEP_BOS_CONFIG,
  'Tucson Electric Power': TEP_BOS_CONFIG,
  'Tucson Electric Power (TEP)': TEP_BOS_CONFIG,

  'TRICO': TRICO_BOS_CONFIG,
  'Trico Electric Cooperative': TRICO_BOS_CONFIG,
  'Trico Electric Cooperative (TRICO)': TRICO_BOS_CONFIG,

  'DEFAULT': DEFAULT_BOS_CONFIG,
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get BOS configuration for a utility
 * Falls back to DEFAULT if utility not found
 */
export function getUtilityBOSConfig(utilityName: string | null | undefined): UtilityBOSConfig {
  if (!utilityName) return DEFAULT_BOS_CONFIG;

  // Try exact match first
  if (UTILITY_BOS_CONFIGS[utilityName]) {
    return UTILITY_BOS_CONFIGS[utilityName];
  }

  // Try case-insensitive match
  const upperName = utilityName.toUpperCase();
  for (const [key, config] of Object.entries(UTILITY_BOS_CONFIGS)) {
    if (key.toUpperCase() === upperName) {
      return config;
    }
  }

  // Try partial match (e.g., "APS" in "Arizona Public Service (APS)")
  for (const [key, config] of Object.entries(UTILITY_BOS_CONFIGS)) {
    if (key.toUpperCase().includes(upperName) || upperName.includes(key.toUpperCase())) {
      return config;
    }
  }

  return DEFAULT_BOS_CONFIG;
}

/**
 * Get requirements for a specific section
 */
export function getUtilityRequirementsForSection(
  utilityName: string | null | undefined,
  section: BOSSectionType
): UtilityBOSRequirement[] {
  const config = getUtilityBOSConfig(utilityName);

  switch (section) {
    case 'utility':
      return config.utilityBOS;
    case 'battery1':
    case 'battery2':
      return config.batteryBOS;
    case 'backup':
      return config.backupBOS;
    case 'postSMS':
      return config.postSMSBOS;
    case 'combine':
      return config.combineBOS;
    default:
      return [];
  }
}

/**
 * Get all required BOS for a utility (across all sections)
 */
export function getAllRequiredBOS(utilityName: string | null | undefined): UtilityBOSRequirement[] {
  const config = getUtilityBOSConfig(utilityName);

  return [
    ...config.utilityBOS,
    ...config.batteryBOS,
    ...config.backupBOS,
    ...config.postSMSBOS,
    ...config.combineBOS,
  ].filter(req => req.required).sort((a, b) => a.order - b.order);
}

/**
 * Check if a utility has specific requirements
 */
export function utilityHasRequirements(utilityName: string | null | undefined): boolean {
  const config = getUtilityBOSConfig(utilityName);
  return config.utilityCode !== 'DEFAULT';
}
