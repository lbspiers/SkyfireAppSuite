import api from '../config/axios';
import logger from './devLogger';

export interface UtilityRequirementRow {
  id: number;
  abbrev: string | null;
  utility: string;
  state: string;
  bos_1: string | null;
  bos_2: string | null;
  bos_3: string | null;
  bos_4: string | null;
  bos_5: string | null;
  combination: string | null;
  notes: string | null;
}

export interface ParsedBOSRequirement {
  equipmentType: string;      // e.g., "PV meter", "Fused AC Disconnect"
  standardType: string;       // Mapped to catalog type
  order: number;              // 1-5 based on bos_N position
  requiresPOICheck?: boolean; // True if equipment selection depends on POI type (e.g., Xcel)
}

// Cache to avoid repeated API calls
const requirementsCache = new Map<string, { data: UtilityRequirementRow | null; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Map utility-specific BOS names to standard catalog types
 */
const BOS_TYPE_MAPPING: Record<string, string> = {
  // Disconnects
  'ac disconnect': 'AC Disconnect',
  'fused ac disconnect': 'Fused AC Disconnect',
  'disconnect': 'AC Disconnect',
  'utility disconnect': 'AC Disconnect',
  'der disconnect': 'AC Disconnect',
  'dg disconnect': 'AC Disconnect',

  // Xcel Energy special case - will be resolved based on POI type
  'utility pv ac disconnect': 'AC Disconnect', // Default, overridden by POI check

  // Meters
  'pv meter': 'PV Meter',
  'production meter': 'PV Meter',
  'meter': 'PV Meter',
  'bi-directional meter': 'Bi-Directional Meter',

  // Others
  'rapid shutdown': 'Rapid Shutdown Device',
  'combiner box': 'Combiner Box',
  'load center': 'Load Center',
};

/**
 * POI types that require Fused AC Disconnect for Xcel Energy
 * NOTE: Using lowercase for case-insensitive matching
 */
const XCEL_FUSED_POI_TYPES = [
  'meter collar adapter',
  'line (supply) side tap',
  'load side tap',
];

/**
 * Known utility name → abbreviation mappings for common mismatches
 */
const UTILITY_NAME_TO_ABBREV: Record<string, string> = {
  'arizona public service': 'APS',
  'salt river project': 'SRP',
  'tucson electric power': 'TEP',
  'trico electric cooperative': 'TRICO',
  'southern california edison': 'SCE',
  'southern california edison co': 'SCE',
  'pacific gas & electric': 'PGE',
  'pacific gas & electric co.': 'PGE',
  'pacific gas and electric': 'PGE',
  'nevada energy': 'NVE',
  'duke': 'DUKE',
  'xcel energy': 'Xcel Energy',
  'psco': 'Xcel Energy',
  'psco (xcel energy)': 'Xcel Energy',
  'public service company of colorado': 'Xcel Energy',
};

/**
 * Normalize BOS type name to standard catalog type
 * For Xcel's "Utility PV AC Disconnect", returns default (will be resolved by POI check)
 */
export function normalizeEquipmentType(rawType: string): string {
  const normalized = rawType.trim().toLowerCase();
  return BOS_TYPE_MAPPING[normalized] || rawType; // Return original if no mapping
}

/**
 * Extract abbreviation from utility string
 * Handles: "APS", "Salt River Project (SRP)", "PSCo (Xcel Energy)"
 */
export function extractUtilityAbbrev(utilityString: string | null): string | null {
  if (!utilityString) return null;

  const trimmed = utilityString.trim();

  // 1. Extract from parentheses: "Salt River Project (SRP)" → "SRP"
  const parenMatch = trimmed.match(/\(([A-Za-z0-9\s]+)\)$/);
  if (parenMatch) {
    return parenMatch[1].trim();
  }

  // 2. Already an abbreviation (2-6 uppercase letters)
  if (/^[A-Z]{2,6}$/.test(trimmed)) {
    return trimmed;
  }

  // 3. Return as-is for API to handle
  return trimmed;
}

/**
 * Resolve utility string to abbreviation for API lookup
 * Handles various formats: "APS", "Arizona Public Service", "Salt River Project (SRP)"
 */
export function resolveUtilityAbbrev(utilityString: string | null): string | null {
  if (!utilityString) return null;

  // First try extraction (handles parentheses format)
  const extracted = extractUtilityAbbrev(utilityString);

  // Check if it's already a valid abbreviation
  if (extracted && /^[A-Z]{2,6}$/.test(extracted)) {
    return extracted;
  }

  // Try known mappings
  const normalized = utilityString.trim().toLowerCase();
  if (UTILITY_NAME_TO_ABBREV[normalized]) {
    return UTILITY_NAME_TO_ABBREV[normalized];
  }

  // Partial match on known mappings
  for (const [name, abbrev] of Object.entries(UTILITY_NAME_TO_ABBREV)) {
    if (normalized.includes(name) || name.includes(normalized)) {
      return abbrev;
    }
  }

  // Return extracted value for API to try
  return extracted;
}

/**
 * Resolve equipment type based on POI type (Xcel Energy special case)
 *
 * @param equipmentType - The utility-specific equipment type
 * @param poiType - Point of Interconnection type from system details
 * @returns Resolved standard equipment type
 */
export function resolveEquipmentTypeByPOI(
  equipmentType: string,
  poiType: string | null
): string {
  const normalized = equipmentType.trim().toLowerCase();

  // Xcel Energy: "Utility PV AC Disconnect" conditional logic
  if (normalized === 'utility pv ac disconnect') {
    // Case-insensitive POI type matching
    if (poiType && XCEL_FUSED_POI_TYPES.includes(poiType.toLowerCase())) {
      return 'Fused AC Disconnect';
    }
    return 'AC Disconnect';
  }

  // For all other equipment, use standard mapping
  return normalizeEquipmentType(equipmentType);
}

/**
 * Parse bos_1 through bos_5 into structured requirements
 */
export function parseBOSRequirements(row: UtilityRequirementRow): ParsedBOSRequirement[] {
  const requirements: ParsedBOSRequirement[] = [];

  const bosFields = [row.bos_1, row.bos_2, row.bos_3, row.bos_4, row.bos_5];

  bosFields.forEach((bos, index) => {
    if (bos && bos.trim() !== '') {
      const normalized = bos.trim().toLowerCase();
      const requiresPOICheck = normalized === 'utility pv ac disconnect';

      requirements.push({
        equipmentType: bos.trim(),
        standardType: normalizeEquipmentType(bos),
        order: index + 1,
        requiresPOICheck,
      });
    }
  });

  return requirements;
}

/**
 * Fetch utility requirements by utility name or abbreviation
 * Handles multiple formats: "APS", "Arizona Public Service", "Salt River Project (SRP)"
 *
 * @param utilityName - Utility name or abbreviation from projectData.site.utility
 * @returns Utility requirements row, or null if not found
 */
export async function fetchUtilityRequirements(
  utilityName: string | null
): Promise<UtilityRequirementRow | null> {
  if (!utilityName) return null;

  // Resolve to abbreviation
  const abbrev = resolveUtilityAbbrev(utilityName);
  if (!abbrev) return null;

  const cacheKey = abbrev.toUpperCase();

  // Check cache
  const cached = requirementsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.log('UtilityRequirements', `Cache hit for ${cacheKey}`);
    return cached.data;
  }

  try {
    // Try by resolved abbreviation first
    let response = await api.get(`/equipment/utility-requirements?abbrev=${encodeURIComponent(abbrev)}`);

    // If no results and original was different, try original string
    // (handles "PSCo (Xcel Energy)" case where abbrev field might match exactly)
    if ((!response.data?.data || response.data.data.length === 0) && abbrev !== utilityName) {
      logger.log('UtilityRequirements', `No match for ${abbrev}, trying original: ${utilityName}`);
      response = await api.get(`/equipment/utility-requirements?abbrev=${encodeURIComponent(utilityName)}`);
    }

    if (response.data?.data && response.data.data.length > 0) {
      const row = response.data.data[0];
      requirementsCache.set(cacheKey, { data: row, timestamp: Date.now() });
      logger.log('UtilityRequirements', `Found: ${utilityName} → ${row.abbrev}:`, row.combination);
      return row;
    }

    // No results - cache the miss
    requirementsCache.set(cacheKey, { data: null, timestamp: Date.now() });
    logger.log('UtilityRequirements', `No requirements found for: ${utilityName} (tried ${abbrev})`);
    return null;
  } catch (error: any) {
    logger.error('UtilityRequirements', `Failed to fetch for ${utilityName}:`, error);
    return null;
  }
}

/**
 * Get parsed BOS requirements for a utility
 *
 * @param utilityName - Utility name or abbreviation (e.g., "APS", "Arizona Public Service")
 * @returns Array of parsed BOS requirements
 */
export async function getUtilityBOSRequirements(
  utilityName: string | null
): Promise<ParsedBOSRequirement[]> {
  const row = await fetchUtilityRequirements(utilityName);
  if (!row) return [];
  return parseBOSRequirements(row);
}

/**
 * Check if utility has BOS requirements
 *
 * @param utilityName - Utility name or abbreviation (e.g., "APS", "Arizona Public Service")
 * @returns True if utility has any BOS requirements
 */
export async function hasUtilityBOSRequirements(utilityName: string | null): Promise<boolean> {
  const row = await fetchUtilityRequirements(utilityName);
  if (!row) return false;
  return !!(row.bos_1 || row.bos_2 || row.bos_3 || row.bos_4 || row.bos_5);
}

export function clearRequirementsCache(): void {
  requirementsCache.clear();
}
