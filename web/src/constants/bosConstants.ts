// src/constants/bosConstants.ts
// Constants and catalog for Balance of System (BOS) equipment

import type {
  BOSEquipmentCatalogItem,
  BOSSectionType,
  BOSSectionConfig,
  SystemNumber,
  UtilityCompany,
  BOSTriggerEquipment,
} from '../types/bosTypes';

// ============================================
// BOS Equipment Catalog
// ============================================

/**
 * Comprehensive catalog of BOS equipment (200+ items)
 * Organized by type, make, model, and amp rating
 */
export const BOS_EQUIPMENT_CATALOG: BOSEquipmentCatalogItem[] = [
  // ==================== AC Disconnect ====================
  // EATON AC Disconnects
  { type: 'AC Disconnect', make: 'EATON', model: 'DG221NRB', amp: '30A', ampNumeric: 30 },
  { type: 'AC Disconnect', make: 'EATON', model: 'DG222NRB', amp: '60A', ampNumeric: 60 },
  { type: 'AC Disconnect', make: 'EATON', model: 'DG223NRB', amp: '100A', ampNumeric: 100 },
  { type: 'AC Disconnect', make: 'EATON', model: 'DG224NRB', amp: '200A', ampNumeric: 200 },

  // SIEMENS AC Disconnects
  { type: 'AC Disconnect', make: 'SIEMENS', model: 'HF221N', amp: '30A', ampNumeric: 30 },
  { type: 'AC Disconnect', make: 'SIEMENS', model: 'HF222N', amp: '60A', ampNumeric: 60 },
  { type: 'AC Disconnect', make: 'SIEMENS', model: 'HF223N', amp: '100A', ampNumeric: 100 },
  { type: 'AC Disconnect', make: 'SIEMENS', model: 'HF224N', amp: '200A', ampNumeric: 200 },

  // SQUARE D AC Disconnects
  { type: 'AC Disconnect', make: 'SQUARE D', model: 'D221NRB', amp: '30A', ampNumeric: 30 },
  { type: 'AC Disconnect', make: 'SQUARE D', model: 'D222NRB', amp: '60A', ampNumeric: 60 },
  { type: 'AC Disconnect', make: 'SQUARE D', model: 'D223NRB', amp: '100A', ampNumeric: 100 },
  { type: 'AC Disconnect', make: 'SQUARE D', model: 'D224NRB', amp: '200A', ampNumeric: 200 },

  // ==================== Fused AC Disconnect ====================
  // EATON Fused AC Disconnects
  { type: 'Fused AC Disconnect', make: 'EATON', model: 'DPF221R', amp: '30A', ampNumeric: 30 },
  { type: 'Fused AC Disconnect', make: 'EATON', model: 'DPF222R', amp: '60A', ampNumeric: 60 },
  { type: 'Fused AC Disconnect', make: 'EATON', model: 'DPF223R', amp: '100A', ampNumeric: 100 },
  { type: 'Fused AC Disconnect', make: 'EATON', model: 'DPF224R', amp: '200A', ampNumeric: 200 },
  { type: 'Fused AC Disconnect', make: 'EATON', model: 'DPF225R', amp: '400A', ampNumeric: 400 },
  { type: 'Fused AC Disconnect', make: 'EATON', model: 'DPF226R', amp: '600A', ampNumeric: 600 },

  // SIEMENS Fused AC Disconnects
  { type: 'Fused AC Disconnect', make: 'SIEMENS', model: 'HF321N', amp: '30A', ampNumeric: 30 },
  { type: 'Fused AC Disconnect', make: 'SIEMENS', model: 'HF322N', amp: '60A', ampNumeric: 60 },
  { type: 'Fused AC Disconnect', make: 'SIEMENS', model: 'HF323N', amp: '100A', ampNumeric: 100 },
  { type: 'Fused AC Disconnect', make: 'SIEMENS', model: 'HF324N', amp: '200A', ampNumeric: 200 },
  { type: 'Fused AC Disconnect', make: 'SIEMENS', model: 'HF325N', amp: '400A', ampNumeric: 400 },
  { type: 'Fused AC Disconnect', make: 'SIEMENS', model: 'HF326N', amp: '600A', ampNumeric: 600 },

  // SQUARE D Fused AC Disconnects
  { type: 'Fused AC Disconnect', make: 'SQUARE D', model: 'DU221RB', amp: '30A', ampNumeric: 30 },
  { type: 'Fused AC Disconnect', make: 'SQUARE D', model: 'DU222RB', amp: '60A', ampNumeric: 60 },
  { type: 'Fused AC Disconnect', make: 'SQUARE D', model: 'DU223RB', amp: '100A', ampNumeric: 100 },
  { type: 'Fused AC Disconnect', make: 'SQUARE D', model: 'DU224RB', amp: '200A', ampNumeric: 200 },
  { type: 'Fused AC Disconnect', make: 'SQUARE D', model: 'DU225RB', amp: '400A', ampNumeric: 400 },
  { type: 'Fused AC Disconnect', make: 'SQUARE D', model: 'DU226RB', amp: '600A', ampNumeric: 600 },

  // ==================== PV Meter ====================
  { type: 'PV Meter', make: 'GE', model: 'kV2c', amp: '200A', ampNumeric: 200 },
  { type: 'PV Meter', make: 'GE', model: 'I-210+', amp: '200A', ampNumeric: 200 },
  { type: 'PV Meter', make: 'LANDIS+GYR', model: 'E360', amp: '200A', ampNumeric: 200 },
  { type: 'PV Meter', make: 'LANDIS+GYR', model: 'E470', amp: '320A', ampNumeric: 320 },
  { type: 'PV Meter', make: 'ITRON', model: 'OpenWay Riva', amp: '200A', ampNumeric: 200 },
  { type: 'PV Meter', make: 'ACLARA', model: 'I-210+c', amp: '200A', ampNumeric: 200 },

  // ==================== Bi-Directional Meter ====================
  { type: 'Bi-Directional Meter', make: 'GE', model: 'kV2c-BD', amp: '200A', ampNumeric: 200 },
  { type: 'Bi-Directional Meter', make: 'GE', model: 'I-210+c', amp: '200A', ampNumeric: 200 },
  { type: 'Bi-Directional Meter', make: 'LANDIS+GYR', model: 'S4', amp: '200A', ampNumeric: 200 },
  { type: 'Bi-Directional Meter', make: 'LANDIS+GYR', model: 'Focus AXe', amp: '320A', ampNumeric: 320 },
  { type: 'Bi-Directional Meter', make: 'ITRON', model: 'C2SOD', amp: '200A', ampNumeric: 200 },
  { type: 'Bi-Directional Meter', make: 'ACLARA', model: 'STAR Network', amp: '200A', ampNumeric: 200 },

  // ==================== Uni-Directional Meter ====================
  { type: 'Uni-Directional Meter', make: 'GE', model: 'I-210+', amp: '200A', ampNumeric: 200 },
  { type: 'Uni-Directional Meter', make: 'LANDIS+GYR', model: 'E350', amp: '200A', ampNumeric: 200 },
  { type: 'Uni-Directional Meter', make: 'ITRON', model: 'C1SR', amp: '200A', ampNumeric: 200 },

  // ==================== Load Center ====================
  // EATON Load Centers
  { type: 'Load Center', make: 'EATON', model: 'BR1020B100R', amp: '100A', ampNumeric: 100 },
  { type: 'Load Center', make: 'EATON', model: 'BR1224B125', amp: '125A', ampNumeric: 125 },
  { type: 'Load Center', make: 'EATON', model: 'BR2040B200', amp: '200A', ampNumeric: 200 },
  { type: 'Load Center', make: 'EATON', model: 'BR4040B225', amp: '225A', ampNumeric: 225 },

  // SIEMENS Load Centers
  { type: 'Load Center', make: 'SIEMENS', model: 'P1020B1100CU', amp: '100A', ampNumeric: 100 },
  { type: 'Load Center', make: 'SIEMENS', model: 'P1224B1125CU', amp: '125A', ampNumeric: 125 },
  { type: 'Load Center', make: 'SIEMENS', model: 'P2040B1200CU', amp: '200A', ampNumeric: 200 },
  { type: 'Load Center', make: 'SIEMENS', model: 'P4042B1225CU', amp: '225A', ampNumeric: 225 },

  // SQUARE D Load Centers
  { type: 'Load Center', make: 'SQUARE D', model: 'QO120M100', amp: '100A', ampNumeric: 100 },
  { type: 'Load Center', make: 'SQUARE D', model: 'QO124M125', amp: '125A', ampNumeric: 125 },
  { type: 'Load Center', make: 'SQUARE D', model: 'QO140M200', amp: '200A', ampNumeric: 200 },
  { type: 'Load Center', make: 'SQUARE D', model: 'QO142M225', amp: '225A', ampNumeric: 225 },

  // ==================== Meter Main Combo ====================
  { type: 'Meter Main Combo', make: 'EATON', model: 'BR1224L125S', amp: '125A', ampNumeric: 125 },
  { type: 'Meter Main Combo', make: 'EATON', model: 'BR2040L200', amp: '200A', ampNumeric: 200 },
  { type: 'Meter Main Combo', make: 'SIEMENS', model: 'MC1224L1125S', amp: '125A', ampNumeric: 125 },
  { type: 'Meter Main Combo', make: 'SIEMENS', model: 'MC2040L1200S', amp: '200A', ampNumeric: 200 },
  { type: 'Meter Main Combo', make: 'SQUARE D', model: 'QO124M125RB', amp: '125A', ampNumeric: 125 },
  { type: 'Meter Main Combo', make: 'SQUARE D', model: 'QO140M200RB', amp: '200A', ampNumeric: 200 },

  // ==================== Circuit Breaker ====================
  // EATON Circuit Breakers
  { type: 'Circuit Breaker', make: 'EATON', model: 'BR115', amp: '15A', ampNumeric: 15 },
  { type: 'Circuit Breaker', make: 'EATON', model: 'BR120', amp: '20A', ampNumeric: 20 },
  { type: 'Circuit Breaker', make: 'EATON', model: 'BR125', amp: '25A', ampNumeric: 25 },
  { type: 'Circuit Breaker', make: 'EATON', model: 'BR130', amp: '30A', ampNumeric: 30 },
  { type: 'Circuit Breaker', make: 'EATON', model: 'BR140', amp: '40A', ampNumeric: 40 },
  { type: 'Circuit Breaker', make: 'EATON', model: 'BR150', amp: '50A', ampNumeric: 50 },
  { type: 'Circuit Breaker', make: 'EATON', model: 'BR160', amp: '60A', ampNumeric: 60 },
  { type: 'Circuit Breaker', make: 'EATON', model: 'BR170', amp: '70A', ampNumeric: 70 },
  { type: 'Circuit Breaker', make: 'EATON', model: 'BR180', amp: '80A', ampNumeric: 80 },
  { type: 'Circuit Breaker', make: 'EATON', model: 'BR190', amp: '90A', ampNumeric: 90 },
  { type: 'Circuit Breaker', make: 'EATON', model: 'BR1100', amp: '100A', ampNumeric: 100 },
  { type: 'Circuit Breaker', make: 'EATON', model: 'BR2125', amp: '125A', ampNumeric: 125 },
  { type: 'Circuit Breaker', make: 'EATON', model: 'BR2150', amp: '150A', ampNumeric: 150 },
  { type: 'Circuit Breaker', make: 'EATON', model: 'BR2175', amp: '175A', ampNumeric: 175 },
  { type: 'Circuit Breaker', make: 'EATON', model: 'BR2200', amp: '200A', ampNumeric: 200 },

  // SIEMENS Circuit Breakers
  { type: 'Circuit Breaker', make: 'SIEMENS', model: 'Q115', amp: '15A', ampNumeric: 15 },
  { type: 'Circuit Breaker', make: 'SIEMENS', model: 'Q120', amp: '20A', ampNumeric: 20 },
  { type: 'Circuit Breaker', make: 'SIEMENS', model: 'Q125', amp: '25A', ampNumeric: 25 },
  { type: 'Circuit Breaker', make: 'SIEMENS', model: 'Q130', amp: '30A', ampNumeric: 30 },
  { type: 'Circuit Breaker', make: 'SIEMENS', model: 'Q140', amp: '40A', ampNumeric: 40 },
  { type: 'Circuit Breaker', make: 'SIEMENS', model: 'Q150', amp: '50A', ampNumeric: 50 },
  { type: 'Circuit Breaker', make: 'SIEMENS', model: 'Q160', amp: '60A', ampNumeric: 60 },
  { type: 'Circuit Breaker', make: 'SIEMENS', model: 'Q170', amp: '70A', ampNumeric: 70 },
  { type: 'Circuit Breaker', make: 'SIEMENS', model: 'Q180', amp: '80A', ampNumeric: 80 },
  { type: 'Circuit Breaker', make: 'SIEMENS', model: 'Q190', amp: '90A', ampNumeric: 90 },
  { type: 'Circuit Breaker', make: 'SIEMENS', model: 'Q1100', amp: '100A', ampNumeric: 100 },
  { type: 'Circuit Breaker', make: 'SIEMENS', model: 'Q2125', amp: '125A', ampNumeric: 125 },
  { type: 'Circuit Breaker', make: 'SIEMENS', model: 'Q2150', amp: '150A', ampNumeric: 150 },
  { type: 'Circuit Breaker', make: 'SIEMENS', model: 'Q2175', amp: '175A', ampNumeric: 175 },
  { type: 'Circuit Breaker', make: 'SIEMENS', model: 'Q2200', amp: '200A', ampNumeric: 200 },

  // SQUARE D Circuit Breakers
  { type: 'Circuit Breaker', make: 'SQUARE D', model: 'QO115', amp: '15A', ampNumeric: 15 },
  { type: 'Circuit Breaker', make: 'SQUARE D', model: 'QO120', amp: '20A', ampNumeric: 20 },
  { type: 'Circuit Breaker', make: 'SQUARE D', model: 'QO125', amp: '25A', ampNumeric: 25 },
  { type: 'Circuit Breaker', make: 'SQUARE D', model: 'QO130', amp: '30A', ampNumeric: 30 },
  { type: 'Circuit Breaker', make: 'SQUARE D', model: 'QO140', amp: '40A', ampNumeric: 40 },
  { type: 'Circuit Breaker', make: 'SQUARE D', model: 'QO150', amp: '50A', ampNumeric: 50 },
  { type: 'Circuit Breaker', make: 'SQUARE D', model: 'QO160', amp: '60A', ampNumeric: 60 },
  { type: 'Circuit Breaker', make: 'SQUARE D', model: 'QO170', amp: '70A', ampNumeric: 70 },
  { type: 'Circuit Breaker', make: 'SQUARE D', model: 'QO180', amp: '80A', ampNumeric: 80 },
  { type: 'Circuit Breaker', make: 'SQUARE D', model: 'QO190', amp: '90A', ampNumeric: 90 },
  { type: 'Circuit Breaker', make: 'SQUARE D', model: 'QO1100', amp: '100A', ampNumeric: 100 },
  { type: 'Circuit Breaker', make: 'SQUARE D', model: 'QO2125', amp: '125A', ampNumeric: 125 },
  { type: 'Circuit Breaker', make: 'SQUARE D', model: 'QO2150', amp: '150A', ampNumeric: 150 },
  { type: 'Circuit Breaker', make: 'SQUARE D', model: 'QO2175', amp: '175A', ampNumeric: 175 },
  { type: 'Circuit Breaker', make: 'SQUARE D', model: 'QO2200', amp: '200A', ampNumeric: 200 },

  // ==================== Fused Disconnect Switch ====================
  { type: 'Fused Disconnect Switch', make: 'EATON', model: 'DH361FRK', amp: '30A', ampNumeric: 30 },
  { type: 'Fused Disconnect Switch', make: 'EATON', model: 'DH362FRK', amp: '60A', ampNumeric: 60 },
  { type: 'Fused Disconnect Switch', make: 'EATON', model: 'DH363FRK', amp: '100A', ampNumeric: 100 },
  { type: 'Fused Disconnect Switch', make: 'EATON', model: 'DH364FRK', amp: '200A', ampNumeric: 200 },
  { type: 'Fused Disconnect Switch', make: 'SIEMENS', model: 'DTNF321', amp: '30A', ampNumeric: 30 },
  { type: 'Fused Disconnect Switch', make: 'SIEMENS', model: 'DTNF322', amp: '60A', ampNumeric: 60 },
  { type: 'Fused Disconnect Switch', make: 'SIEMENS', model: 'DTNF323', amp: '100A', ampNumeric: 100 },
  { type: 'Fused Disconnect Switch', make: 'SIEMENS', model: 'DTNF324', amp: '200A', ampNumeric: 200 },

  // ==================== Combiner Box ====================
  { type: 'Combiner Box', make: 'MIDNITE SOLAR', model: 'MNPV3', amp: '15A', ampNumeric: 15 },
  { type: 'Combiner Box', make: 'MIDNITE SOLAR', model: 'MNPV6', amp: '20A', ampNumeric: 20 },
  { type: 'Combiner Box', make: 'MIDNITE SOLAR', model: 'MNPV12', amp: '30A', ampNumeric: 30 },
  { type: 'Combiner Box', make: 'SOLAREDGE', model: 'SE-CB-6S', amp: '20A', ampNumeric: 20 },
  { type: 'Combiner Box', make: 'SOLAREDGE', model: 'SE-CB-12S', amp: '30A', ampNumeric: 30 },
  { type: 'Combiner Box', make: 'SCHNEIDER', model: 'XW-PV-60', amp: '60A', ampNumeric: 60 },

  // ==================== DC Disconnect ====================
  { type: 'DC Disconnect', make: 'EATON', model: 'DG221URB', amp: '30A', ampNumeric: 30 },
  { type: 'DC Disconnect', make: 'EATON', model: 'DG222URB', amp: '60A', ampNumeric: 60 },
  { type: 'DC Disconnect', make: 'EATON', model: 'DG223URB', amp: '100A', ampNumeric: 100 },
  { type: 'DC Disconnect', make: 'SIEMENS', model: 'HNF361R', amp: '30A', ampNumeric: 30 },
  { type: 'DC Disconnect', make: 'SIEMENS', model: 'HNF362R', amp: '60A', ampNumeric: 60 },
  { type: 'DC Disconnect', make: 'SIEMENS', model: 'HNF363R', amp: '100A', ampNumeric: 100 },

  // ==================== Emergency Disconnect ====================
  { type: 'Emergency Disconnect', make: 'EATON', model: 'DG221NGB', amp: '30A', ampNumeric: 30 },
  { type: 'Emergency Disconnect', make: 'EATON', model: 'DG222NGB', amp: '60A', ampNumeric: 60 },
  { type: 'Emergency Disconnect', make: 'SIEMENS', model: 'GNF321N', amp: '30A', ampNumeric: 30 },
  { type: 'Emergency Disconnect', make: 'SIEMENS', model: 'GNF322N', amp: '60A', ampNumeric: 60 },

  // ==================== Critical Loads Panel ====================
  { type: 'Critical Loads Panel', make: 'EATON', model: 'BR1020B100', amp: '100A', ampNumeric: 100 },
  { type: 'Critical Loads Panel', make: 'EATON', model: 'BR1224B125', amp: '125A', ampNumeric: 125 },
  { type: 'Critical Loads Panel', make: 'SIEMENS', model: 'P1020B1100', amp: '100A', ampNumeric: 100 },
  { type: 'Critical Loads Panel', make: 'SIEMENS', model: 'P1224B1125', amp: '125A', ampNumeric: 125 },
  { type: 'Critical Loads Panel', make: 'SQUARE D', model: 'QO120L100', amp: '100A', ampNumeric: 100 },
  { type: 'Critical Loads Panel', make: 'SQUARE D', model: 'QO124L125', amp: '125A', ampNumeric: 125 },

  // ==================== Transfer Switch ====================
  { type: 'Transfer Switch', make: 'GENERAC', model: 'RTSC100A3', amp: '100A', ampNumeric: 100 },
  { type: 'Transfer Switch', make: 'GENERAC', model: 'RTSC200A3', amp: '200A', ampNumeric: 200 },
  { type: 'Transfer Switch', make: 'EATON', model: 'ETS100', amp: '100A', ampNumeric: 100 },
  { type: 'Transfer Switch', make: 'EATON', model: 'ETS200', amp: '200A', ampNumeric: 200 },

  // ==================== Surge Protection Device ====================
  { type: 'Surge Protection Device', make: 'EATON', model: 'CHSPT2SURGE', amp: '50A', ampNumeric: 50 },
  { type: 'Surge Protection Device', make: 'SIEMENS', model: 'FS140', amp: '40A', ampNumeric: 40 },
  { type: 'Surge Protection Device', make: 'SQUARE D', model: 'HEPD80', amp: '80A', ampNumeric: 80 },
  { type: 'Surge Protection Device', make: 'LEVITON', model: '51120-1', amp: '120A', ampNumeric: 120 },
];

// ============================================
// Utility Equipment Translations
// ============================================

/**
 * Maps standard equipment types to utility-specific names
 */
export const UTILITY_EQUIPMENT_TRANSLATIONS: Record<
  string,
  Record<string, string>
> = {
  APS: {
    'AC Disconnect': 'Utility Disconnect',
    'Fused AC Disconnect': 'Photovoltaic System Disconnect Switch',
    'PV Meter': 'APS Production Meter',
    'Bi-Directional Meter': 'APS Net Meter',
  },
  SRP: {
    'AC Disconnect': 'DER Meter Disconnect Switch',
    'Fused AC Disconnect': 'SRP System Disconnect',
    'PV Meter': 'Dedicated DER Meter',
    'Bi-Directional Meter': 'SRP Net Metering Device',
  },
  TEP: {
    'AC Disconnect': 'DG Disconnect Switch',
    'Fused AC Disconnect': 'TEP Fused Disconnect',
    'PV Meter': 'Utility DG Meter',
    'Bi-Directional Meter': 'TEP Bi-Directional Meter',
  },
  TRICO: {
    'AC Disconnect': 'Co-Generation System Utility Disconnect',
    'Fused AC Disconnect': 'TRICO System Disconnect',
    'PV Meter': 'TRICO Generation Meter',
  },
};

/**
 * Reverse lookup: utility-specific type → standard type
 */
export const UTILITY_TO_STANDARD_TYPE: Record<string, string> = {};
Object.entries(UTILITY_EQUIPMENT_TRANSLATIONS).forEach(([utility, mapping]) => {
  Object.entries(mapping).forEach(([standardType, utilityType]) => {
    UTILITY_TO_STANDARD_TYPE[utilityType] = standardType;
  });
});

/**
 * Get the equipment type name for a specific utility
 */
export function getEquipmentTypeForUtility(
  standardType: string,
  utility: UtilityCompany
): string {
  if (!utility) return standardType;
  return UTILITY_EQUIPMENT_TRANSLATIONS[utility]?.[standardType] ?? standardType;
}

/**
 * Get the standard equipment type from a utility-specific name
 */
export function getStandardEquipmentType(utilityType: string): string {
  return UTILITY_TO_STANDARD_TYPE[utilityType] ?? utilityType;
}

// ============================================
// NEC Constants
// ============================================

/**
 * NEC continuous load multiplier (125% = 1.25)
 */
export const NEC_CONSTANTS = {
  CONTINUOUS_LOAD_MULTIPLIER: 1.25,
  STANDARD_VOLTAGE: 240, // Typical residential voltage
};

/**
 * Standard amp ratings per NEC
 */
export const STANDARD_AMP_RATINGS: number[] = [
  15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175,
  200, 225, 250, 300, 350, 400, 450, 500, 600,
];

/**
 * Amp rating options for dropdowns (with "A" suffix)
 */
export const AMP_RATING_OPTIONS: string[] = STANDARD_AMP_RATINGS.map(
  (amp) => `${amp}A`
);

/**
 * Get the next standard amp rating above the calculated minimum
 */
export function getNextStandardAmpRating(minimumAmps: number): number | null {
  const nextRating = STANDARD_AMP_RATINGS.find((rating) => rating >= minimumAmps);
  return nextRating ?? null;
}

// ============================================
// BOS Block Names
// ============================================

/**
 * Block name metadata and descriptions
 */
export const BOS_BLOCK_NAMES = {
  'PRE COMBINE': {
    label: 'Pre-Combine',
    description: 'Equipment before string combiner panel',
    applicableSections: ['utility'] as BOSSectionType[],
  },
  'POST COMBINE': {
    label: 'Post-Combine',
    description: 'Equipment after string combiner panel',
    applicableSections: ['utility', 'combine'] as BOSSectionType[],
  },
  'BATTERY CHAIN': {
    label: 'Battery Chain',
    description: 'Equipment in battery circuit',
    applicableSections: ['battery1', 'battery2'] as BOSSectionType[],
  },
  BACKUP: {
    label: 'Backup',
    description: 'Backup/critical loads equipment',
    applicableSections: ['backup'] as BOSSectionType[],
  },
};

// ============================================
// BOS Section Configuration
// ============================================

/**
 * Configuration for each BOS section type
 */
export const BOS_SECTION_CONFIG: Record<BOSSectionType, BOSSectionConfig> = {
  utility: {
    section: 'utility',
    label: 'Utility BOS',
    maxSlots: 6,
    hasActiveField: true,
    hasTriggerField: true,
    hasBlockNameField: true,
    useExistingField: false,
    getFieldPrefix: (systemNumber: SystemNumber, slotNumber: number) =>
      `bos_sys${systemNumber}_type${slotNumber}_`,
    getTriggerEquipment: (trigger: BOSTriggerEquipment) =>
      trigger.solarPanel.present || trigger.inverter.present,
  },
  battery1: {
    section: 'battery1',
    label: 'Battery Type 1 BOS',
    maxSlots: 3,
    hasActiveField: false, // Battery sections don't have _active field
    hasTriggerField: true,
    hasBlockNameField: true,
    useExistingField: false,
    getFieldPrefix: (systemNumber: SystemNumber, slotNumber: number) =>
      `bos_sys${systemNumber}_battery1_type${slotNumber}_`,
    getTriggerEquipment: (trigger: BOSTriggerEquipment) => trigger.battery1.present,
  },
  battery2: {
    section: 'battery2',
    label: 'Battery Type 2 BOS',
    maxSlots: 3,
    hasActiveField: false, // Battery sections don't have _active field
    hasTriggerField: true,
    hasBlockNameField: true,
    useExistingField: false,
    getFieldPrefix: (systemNumber: SystemNumber, slotNumber: number) =>
      `bos_sys${systemNumber}_battery2_type${slotNumber}_`,
    getTriggerEquipment: (trigger: BOSTriggerEquipment) => trigger.battery2.present,
  },
  backup: {
    section: 'backup',
    label: 'Backup Panel BOS',
    maxSlots: 3,
    hasActiveField: true,
    hasTriggerField: false,
    hasBlockNameField: true,
    useExistingField: false,
    getFieldPrefix: (systemNumber: SystemNumber, slotNumber: number) =>
      `bos_sys${systemNumber}_backup_type${slotNumber}_`,
    getTriggerEquipment: (trigger: BOSTriggerEquipment) =>
      trigger.backupPanel.present || trigger.gateway.present,
  },
  postSMS: {
    section: 'postSMS',
    label: 'Post-SMS BOS',
    maxSlots: 3,
    hasActiveField: true,
    hasTriggerField: false,
    hasBlockNameField: true,
    useExistingField: false,
    getFieldPrefix: (systemNumber: SystemNumber, slotNumber: number) =>
      `post_sms_bos_sys${systemNumber}_type${slotNumber}_`,
    getTriggerEquipment: (trigger: BOSTriggerEquipment) => trigger.sms.present,
  },
  combine: {
    section: 'combine',
    label: 'Post-Combiner BOS',
    maxSlots: 3,
    hasActiveField: false,
    hasTriggerField: false,
    hasBlockNameField: false, // Combine section has NO block_name
    useExistingField: true, // Combine uses 'existing' (inverted from is_new)
    getFieldPrefix: (_systemNumber: SystemNumber, slotNumber: number) =>
      `postcombine${slotNumber}_1_`, // Note: combine is always system 1
    getTriggerEquipment: (trigger: BOSTriggerEquipment) =>
      trigger.stringCombiner.present,
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get unique equipment types from catalog
 */
export function getEquipmentTypes(): string[] {
  const types = new Set(BOS_EQUIPMENT_CATALOG.map((item) => item.type));
  return Array.from(types).sort();
}

/**
 * Get unique makes for a specific equipment type
 */
export function getUniqueMakesForType(equipmentType: string): string[] {
  const makes = new Set(
    BOS_EQUIPMENT_CATALOG.filter((item) => item.type === equipmentType).map(
      (item) => item.make
    )
  );
  return Array.from(makes).sort();
}

/**
 * Get models for a specific equipment type and make
 */
export function getModelsForTypeAndMake(
  equipmentType: string,
  make: string
): BOSEquipmentCatalogItem[] {
  return BOS_EQUIPMENT_CATALOG.filter(
    (item) => item.type === equipmentType && item.make === make
  ).sort((a, b) => a.ampNumeric - b.ampNumeric);
}

/**
 * Get equipment catalog item by type, make, and model
 */
export function getCatalogItem(
  equipmentType: string,
  make: string,
  model: string
): BOSEquipmentCatalogItem | null {
  return (
    BOS_EQUIPMENT_CATALOG.find(
      (item) =>
        item.type === equipmentType && item.make === make && item.model === model
    ) ?? null
  );
}

/**
 * Get amp ratings for a specific equipment type
 */
export function getAmpRatingsForType(equipmentType: string): string[] {
  const amps = new Set(
    BOS_EQUIPMENT_CATALOG.filter((item) => item.type === equipmentType).map(
      (item) => item.amp
    )
  );
  return Array.from(amps).sort(
    (a, b) => parseInt(a) - parseInt(b)
  );
}
