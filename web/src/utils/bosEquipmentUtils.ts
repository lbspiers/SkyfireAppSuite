/**
 * BOS Equipment Utility Functions
 *
 * Helper functions for equipment translation, catalog lookup, and dropdown generation
 *
 * FLOW:
 * 1. User selects utility → get utility-specific equipment type options
 * 2. User selects equipment type (utility-specific name) → translate to standard → get makes
 * 3. User selects make → get models filtered by amp rating minimum
 * 4. User selects model → auto-fill amp rating
 */

import {
  BOS_EQUIPMENT_CATALOG,
  BOS_EQUIPMENT_TRANSLATION,
  UTILITY_EQUIPMENT_TO_STANDARD,
  EQUIPMENT_TYPE_OPTIONS,
} from '../constants/bosEquipmentCatalog';
import type { BOSEquipmentCatalogItem } from '../types/bosTypes';

// ============================================
// UTILITY NAME EXTRACTION
// ============================================

// Mapping from database utility names to translation keys
const UTILITY_NAME_TO_KEY: Record<string, string> = {
  // Direct abbreviation matches (lowercase variations)
  'APS': 'APS',
  'aps': 'APS',
  'SRP': 'SRP',
  'srp': 'SRP',
  'TEP': 'TEP',
  'tep': 'TEP',
  'TRICO': 'TRICO',
  'trico': 'TRICO',
  'UniSource': 'UniSource',
  'unisource': 'UniSource',
  'UNISOURCE': 'UniSource',

  // Full name variations → abbreviations
  'Arizona Public Service': 'APS',
  'Arizona Public Service Co': 'APS',
  'Arizona Public Service Company': 'APS',
  'Arizona Public Service (APS)': 'APS',

  'Salt River Project': 'SRP',
  'Salt River Project (SRP)': 'SRP',

  'Tucson Electric Power': 'TEP',
  'Tucson Electric Power Company': 'TEP',
  'Tucson Electric Power (TEP)': 'TEP',

  'Trico Electric Cooperative': 'TRICO',
  'Trico Electric Cooperative (TRICO)': 'TRICO',
  'TRICO Electric Cooperative': 'TRICO',

  'UniSource Energy Services': 'UniSource',
  'UniSource Energy Services (UniSource)': 'UniSource',
  'Unisource Energy Services': 'UniSource',

  // Full match for non-abbreviated utility
  'Sulphur Springs Valley Electric Cooperative': 'Sulphur Springs Valley Electric Cooperative',

  // Xcel Energy variations
  'Xcel Energy': 'Xcel Energy',
  'xcel energy': 'Xcel Energy',
  'XCEL ENERGY': 'Xcel Energy',
  'Xcel': 'Xcel Energy',
  'xcel': 'Xcel Energy',
  'PSCo (Xcel Energy)': 'Xcel Energy',
  'PSCo': 'Xcel Energy',
  'psco': 'Xcel Energy',
  'PSCO': 'Xcel Energy',
  'XCEL': 'Xcel Energy',
  'Public Service Company of Colorado': 'Xcel Energy',

  // Oncor variations
  'Oncor': 'Oncor',
  'oncor': 'Oncor',
  'ONCOR': 'Oncor',
  'Oncor Electric Delivery': 'Oncor',
  'Oncor Electric Delivery Company': 'Oncor',
  'Oncor Electric Delivery (Oncor)': 'Oncor',

  // California utilities (map to Gen)
  'Southern California Edison': 'Gen',
  'Southern California Edison Co': 'Gen',
  'Southern California Edison Company': 'Gen',
  'SCE': 'Gen',
  'sce': 'Gen',

  'Pacific Gas & Electric': 'Gen',
  'Pacific Gas & Electric Co': 'Gen',
  'Pacific Gas & Electric Co.': 'Gen',
  'Pacific Gas and Electric': 'Gen',
  'PG&E': 'Gen',
  'PGE': 'Gen',
  'pge': 'Gen',
};

/**
 * Extract utility abbreviation from full utility name
 *
 * Handles multiple database formats:
 * - Direct abbreviations: "APS", "SRP", "TEP"
 * - Full names: "Arizona Public Service Co"
 * - Full names with parentheses: "Salt River Project (SRP)"
 * - Empty strings: "" → "Gen"
 *
 * @param utilityName - Full utility name from database
 * @returns Utility abbreviation key for BOS_EQUIPMENT_TRANSLATION map
 *
 * @example
 * extractUtilityAbbrev("APS") // Returns: "APS"
 * extractUtilityAbbrev("Arizona Public Service Co") // Returns: "APS"
 * extractUtilityAbbrev("Arizona Public Service (APS)") // Returns: "APS"
 * extractUtilityAbbrev("Salt River Project (SRP)") // Returns: "SRP"
 * extractUtilityAbbrev("Sulphur Springs Valley Electric Cooperative") // Returns: "Sulphur Springs Valley Electric Cooperative"
 * extractUtilityAbbrev("Unknown Utility") // Returns: "Gen"
 * extractUtilityAbbrev("") // Returns: "Gen"
 */
function extractUtilityAbbrev(utilityName?: string | null): string {
  if (!utilityName || utilityName.trim() === '') {
    return 'Gen';
  }

  const trimmedName = utilityName.trim();
  const upperName = trimmedName.toUpperCase();

  // Check lookup table first (case-insensitive)
  // Build a case-insensitive lookup
  const lookupKey = Object.keys(UTILITY_NAME_TO_KEY).find(
    key => key.toUpperCase() === upperName
  );

  if (lookupKey) {
    const key = UTILITY_NAME_TO_KEY[lookupKey];
    return key;
  }

  // Check for exact match in translation keys (case-insensitive)
  const translationKey = Object.keys(BOS_EQUIPMENT_TRANSLATION).find(
    key => key.toUpperCase() === upperName
  );

  if (translationKey) {
    return translationKey;
  }

  // Try to extract abbreviation from parentheses (fallback for new variations)
  const match = trimmedName.match(/\(([^)]+)\)/);
  if (match) {
    const abbrev = match[1].toUpperCase();

    // Check if this abbreviation exists in translation map (case-insensitive)
    const abbrevKey = Object.keys(BOS_EQUIPMENT_TRANSLATION).find(
      key => key.toUpperCase() === abbrev
    );

    if (abbrevKey) {
      return abbrevKey;
    }
  }

  // Try partial match for common patterns (e.g., "Arizona Public Service" without "(APS)")
  const partialMatches: Record<string, string> = {
    'ARIZONA PUBLIC SERVICE': 'APS',
    'SALT RIVER': 'SRP',
    'TUCSON ELECTRIC': 'TEP',
    'TRICO': 'TRICO',
    'UNISOURCE': 'UniSource',
    'SULPHUR SPRINGS': 'Sulphur Springs Valley Electric Cooperative',
    'XCEL': 'XCEL',
  };

  for (const [pattern, result] of Object.entries(partialMatches)) {
    if (upperName.includes(pattern)) {
      return result;
    }
  }

  // Fallback to "Gen" (General/default)
  return 'Gen';
}

// ============================================
// HELPER: Parse amp rating from string
// ============================================

/**
 * Parse numeric amp rating from string
 * Examples: "30" → 30, "60A" → 60, "100 Amps" → 100
 */
function parseAmpRating(amp: string): number {
  const match = amp.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// ============================================
// 1. GET UTILITY EQUIPMENT TYPE OPTIONS
// ============================================

/**
 * Get dropdown options with utility-specific naming for a given utility
 *
 * @param utilityName - Utility name or abbreviation (e.g., "Arizona Public Service (APS)", "APS", "Gen")
 * @returns Array of { label, value } for dropdown (ONLY utility-specific names, no duplicates)
 *
 * @example
 * getUtilityEquipmentTypeOptions("Arizona Public Service (APS)")
 * // Returns: [
 * //   { label: "Dedicated Photovoltaic System Combiner Panel", value: "..." },
 * //   { label: "Photovoltaic System Disconnect Switch", value: "..." },
 * //   { label: "Uni-Directional Meter", value: "Uni-Directional Meter" },
 * //   { label: "Utility Disconnect", value: "Utility Disconnect" }
 * // ]
 */
export function getUtilityEquipmentTypeOptions(
  utilityName?: string
): Array<{ label: string; value: string }> {
  // Extract abbreviation from full utility name (e.g., "Arizona Public Service (APS)" → "APS")
  const utility = extractUtilityAbbrev(utilityName);

  // Get translation map for this utility (fallback to Gen if not found)
  const translations = BOS_EQUIPMENT_TRANSLATION[utility] || BOS_EQUIPMENT_TRANSLATION["Gen"];

  // Get all translated equipment types (values from translation map)
  // This ensures we only get utility-specific names with NO duplicates
  const utilitySpecificTypes = new Set<string>(Object.values(translations));

  // Convert to dropdown options, sorted alphabetically
  const options = Array.from(utilitySpecificTypes)
    .map((type) => ({ label: type, value: type }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return options;
}

// ============================================
// 2. TRANSLATE TO STANDARD NAME
// ============================================

/**
 * Translate utility-specific name back to standard catalog name
 *
 * @param utilitySpecificName - Utility-specific equipment name
 * @returns Standard catalog equipment name
 *
 * @example
 * translateToStandardName("Utility Disconnect") // Returns: "AC Disconnect"
 * translateToStandardName("DER Meter Disconnect Switch") // Returns: "AC Disconnect"
 * translateToStandardName("AC Disconnect") // Returns: "AC Disconnect"
 */
export function translateToStandardName(utilitySpecificName: string): string {
  return UTILITY_EQUIPMENT_TO_STANDARD[utilitySpecificName] || utilitySpecificName;
}

// ============================================
// 3. TRANSLATE TO UTILITY NAME
// ============================================

/**
 * Translate standard equipment name to utility-specific name
 *
 * @param standardName - Standard equipment name
 * @param utilityAbbrev - Utility abbreviation (default "Gen")
 * @returns Utility-specific equipment name
 *
 * @example
 * translateEquipmentName("AC Disconnect", "APS") // Returns: "Utility Disconnect"
 * translateEquipmentName("AC Disconnect", "SRP") // Returns: "DER Meter Disconnect Switch"
 */
export function translateEquipmentName(
  standardName: string,
  utilityAbbrev: string | null | undefined = 'Gen'
): string {
  const utility = utilityAbbrev || 'Gen';
  const translations = BOS_EQUIPMENT_TRANSLATION[utility] || BOS_EQUIPMENT_TRANSLATION["Gen"];

  return translations[standardName] || standardName;
}

// ============================================
// 4. GET AVAILABLE MAKES
// ============================================

/**
 * Get available makes for an equipment type
 * Automatically translates utility-specific names to standard names
 *
 * @param equipmentType - Equipment type (can be utility-specific or standard)
 * @param minAmpRating - Optional minimum amp rating filter
 * @returns Array of unique makes, sorted alphabetically
 *
 * @example
 * getAvailableMakes("Utility Disconnect") // Returns: ["CUTLER HAMMER", "EATON", "SIEMENS", "SQUARE D"]
 * getAvailableMakes("AC Disconnect", 60) // Returns: makes with 60A or higher
 */
export function getAvailableMakes(
  equipmentType: string,
  minAmpRating?: number
): string[] {
  if (!equipmentType) return [];

  // Translate to standard name for catalog lookup
  const standardType = translateToStandardName(equipmentType);

  // Filter catalog by type
  let items = BOS_EQUIPMENT_CATALOG.filter(
    (item) => item.type.toLowerCase() === standardType.toLowerCase()
  );

  // Apply amp rating filter if provided
  if (minAmpRating !== undefined && minAmpRating > 0) {
    items = items.filter(item => parseAmpRating(item.amp) >= minAmpRating);
  }

  // Extract unique makes
  const makes = [...new Set(items.map(item => item.make))];

  return makes.sort();
}

// ============================================
// 5. GET AVAILABLE MODELS
// ============================================

/**
 * Get available models for an equipment type and make
 * Automatically translates utility-specific names to standard names
 *
 * @param equipmentType - Equipment type (can be utility-specific or standard)
 * @param make - Manufacturer name
 * @param minAmpRating - Optional minimum amp rating filter
 * @returns Array of { model, amp } objects, sorted by amp rating ascending
 *
 * @example
 * getAvailableModels("Utility Disconnect", "EATON")
 * // Returns: [
 * //   { model: "DG221URB", amp: "30" },
 * //   { model: "DG222URB", amp: "60" },
 * //   { model: "DG223URB", amp: "100" },
 * //   { model: "DG324URK", amp: "200" }
 * // ]
 *
 * getAvailableModels("Utility Disconnect", "EATON", 60)
 * // Returns: only models with 60A or higher
 */
export function getAvailableModels(
  equipmentType: string,
  make: string,
  minAmpRating?: number
): Array<{ model: string; amp: string }> {
  if (!equipmentType || !make) return [];

  // Translate to standard name for catalog lookup
  const standardType = translateToStandardName(equipmentType);

  // Filter catalog
  let items = BOS_EQUIPMENT_CATALOG.filter(
    (item) =>
      item.type.toLowerCase() === standardType.toLowerCase() &&
      item.make.toLowerCase() === make.toLowerCase()
  );

  // Apply amp rating filter if provided
  if (minAmpRating !== undefined && minAmpRating > 0) {
    items = items.filter(item => parseAmpRating(item.amp) >= minAmpRating);
  }

  // Sort by amp rating ascending
  items.sort((a, b) => parseAmpRating(a.amp) - parseAmpRating(b.amp));

  return items.map(item => ({
    model: item.model,
    amp: item.amp,
  }));
}

// ============================================
// 6. GET CATALOG ITEM
// ============================================

/**
 * Get a specific catalog item by type, make, and model
 *
 * @param equipmentType - Equipment type (can be utility-specific or standard)
 * @param make - Manufacturer name
 * @param model - Model number
 * @returns Catalog item or null if not found
 */
export function getCatalogItem(
  equipmentType: string,
  make: string,
  model: string
): BOSEquipmentCatalogItem | null {
  if (!equipmentType || !make || !model) return null;

  // Translate to standard name for catalog lookup
  const standardType = translateToStandardName(equipmentType);

  const item = BOS_EQUIPMENT_CATALOG.find(
    (item) =>
      item.type.toLowerCase() === standardType.toLowerCase() &&
      item.make.toLowerCase() === make.toLowerCase() &&
      item.model.toLowerCase() === model.toLowerCase()
  );

  return item || null;
}

// ============================================
// 7. GET EQUIPMENT BY MIN AMP RATING
// ============================================

/**
 * Get all equipment of a type that meets minimum amp rating
 *
 * @param equipmentType - Equipment type (can be utility-specific or standard)
 * @param minAmpRating - Minimum amp rating required
 * @param make - Optional make filter
 * @returns Array of catalog items, sorted by amp rating ascending
 *
 * @example
 * getEquipmentByMinAmpRating("AC Disconnect", 50)
 * // Returns all AC Disconnects with 60A or higher
 */
export function getEquipmentByMinAmpRating(
  equipmentType: string,
  minAmpRating: number,
  make?: string
): BOSEquipmentCatalogItem[] {
  // Translate to standard name for catalog lookup
  const standardType = translateToStandardName(equipmentType);

  // Filter catalog
  let matchingItems = BOS_EQUIPMENT_CATALOG.filter(
    (item) =>
      item.type.toLowerCase() === standardType.toLowerCase() &&
      parseAmpRating(item.amp) >= minAmpRating
  );

  // Further filter by make if provided
  if (make) {
    matchingItems = matchingItems.filter(
      (item) => item.make.toLowerCase() === make.toLowerCase()
    );
  }

  // Sort by amp rating ascending
  return matchingItems.sort((a, b) => parseAmpRating(a.amp) - parseAmpRating(b.amp));
}

// ============================================
// 8. VALIDATION HELPERS
// ============================================

/**
 * Check if an equipment type is valid (exists in catalog or translations)
 */
export function isValidEquipmentType(
  equipmentType: string,
  utilityAbbrev?: string | null
): boolean {
  const utility = utilityAbbrev || 'Gen';
  const validTypes = getUtilityEquipmentTypeOptions(utility);
  return validTypes.some((opt) => opt.value === equipmentType);
}

/**
 * Check if a make is valid for an equipment type
 */
export function isValidMake(equipmentType: string, make: string): boolean {
  const validMakes = getAvailableMakes(equipmentType);
  return validMakes.some((m) => m.toLowerCase() === make.toLowerCase());
}

/**
 * Check if a model is valid for an equipment type and make
 */
export function isValidModel(
  equipmentType: string,
  make: string,
  model: string
): boolean {
  const validModels = getAvailableModels(equipmentType, make);
  return validModels.some((m) => m.model.toLowerCase() === model.toLowerCase());
}

// ============================================
// 9. SEARCH HELPERS
// ============================================

/**
 * Search catalog by keyword
 */
export function searchEquipment(searchText: string): BOSEquipmentCatalogItem[] {
  if (!searchText) return [];

  const query = searchText.toLowerCase();

  return BOS_EQUIPMENT_CATALOG.filter(
    (item) =>
      item.type.toLowerCase().includes(query) ||
      item.make.toLowerCase().includes(query) ||
      item.model.toLowerCase().includes(query) ||
      item.amp.toLowerCase().includes(query)
  );
}
