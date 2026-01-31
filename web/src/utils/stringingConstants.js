/**
 * Stringing Constants for Microinverters and Inverters
 * Used by custom stringing UI to determine limits and auto-calculate distributions
 */

// ============================================
// HOYMILES MICROINVERTER SPECIFICATIONS
// ============================================
export const HOYMILES_STRINGING_SPECS = {
  // 1:1 Ratio Models (1 panel per micro)
  'HMS-300-1T-NA': { panelRatio: '1:1', maxPanelsPerMicro: 1, maxUnitsBranch: 16, maxPanelsBranch: 16 },
  'HMS-350-1T-NA': { panelRatio: '1:1', maxPanelsPerMicro: 1, maxUnitsBranch: 16, maxPanelsBranch: 16 },
  'HMS-400-1T-NA': { panelRatio: '1:1', maxPanelsPerMicro: 1, maxUnitsBranch: 15, maxPanelsBranch: 15 },
  'HMS-450-1T-NA': { panelRatio: '1:1', maxPanelsPerMicro: 1, maxUnitsBranch: 13, maxPanelsBranch: 13 },
  'HMS-500-1T-NA': { panelRatio: '1:1', maxPanelsPerMicro: 1, maxUnitsBranch: 12, maxPanelsBranch: 12 },
  'HM-300NT': { panelRatio: '1:1', maxPanelsPerMicro: 1, maxUnitsBranch: 16, maxPanelsBranch: 16 },
  'HM-350NT': { panelRatio: '1:1', maxPanelsPerMicro: 1, maxUnitsBranch: 16, maxPanelsBranch: 16 },
  'HM-400NT': { panelRatio: '1:1', maxPanelsPerMicro: 1, maxUnitsBranch: 15, maxPanelsBranch: 15 },

  // 2:1 Ratio Models (2 panels per micro)
  'HMS-600-2T-NA': { panelRatio: '2:1', maxPanelsPerMicro: 2, maxUnitsBranch: 9, maxPanelsBranch: 18 },
  'HMS-700-2T-NA': { panelRatio: '2:1', maxPanelsPerMicro: 2, maxUnitsBranch: 8, maxPanelsBranch: 16 },
  'HMS-800-2T-NA': { panelRatio: '2:1', maxPanelsPerMicro: 2, maxUnitsBranch: 8, maxPanelsBranch: 16 },
  'HMS-900-2T-NA': { panelRatio: '2:1', maxPanelsPerMicro: 2, maxUnitsBranch: 7, maxPanelsBranch: 14 },
  'HMS-1000-2T-NA': { panelRatio: '2:1', maxPanelsPerMicro: 2, maxUnitsBranch: 6, maxPanelsBranch: 12 },
  'HM-600NT': { panelRatio: '2:1', maxPanelsPerMicro: 2, maxUnitsBranch: 9, maxPanelsBranch: 18 },
  'HM-700NT': { panelRatio: '2:1', maxPanelsPerMicro: 2, maxUnitsBranch: 8, maxPanelsBranch: 16 },
  'HM-800NT': { panelRatio: '2:1', maxPanelsPerMicro: 2, maxUnitsBranch: 7, maxPanelsBranch: 14 },

  // 4:1 Ratio Models (4 panels per micro)
  'HMS-1600-4T-NA': { panelRatio: '4:1', maxPanelsPerMicro: 4, maxUnitsBranch: 4, maxPanelsBranch: 16 },
  'HMS-1800-4T-NA': { panelRatio: '4:1', maxPanelsPerMicro: 4, maxUnitsBranch: 3, maxPanelsBranch: 12 },
  'HMS-2000-4T-NA': { panelRatio: '4:1', maxPanelsPerMicro: 4, maxUnitsBranch: 2, maxPanelsBranch: 8 },
  'HM-1200NT': { panelRatio: '4:1', maxPanelsPerMicro: 4, maxUnitsBranch: 4, maxPanelsBranch: 16 },
  'HM-1500NT': { panelRatio: '4:1', maxPanelsPerMicro: 4, maxUnitsBranch: 4, maxPanelsBranch: 16 },
};

// ============================================
// APSYSTEMS MICROINVERTER SPECIFICATIONS
// ============================================
export const APSYSTEMS_STRINGING_SPECS = {
  // 1:1 Ratio Models
  'YC500': { panelRatio: '1:1', maxPanelsPerMicro: 1, maxUnitsBranch: 14, maxPanelsBranch: 14 },
  'YC600': { panelRatio: '2:1', maxPanelsPerMicro: 2, maxUnitsBranch: 7, maxPanelsBranch: 14 },

  // 2:1 Ratio Models
  'DS3': { panelRatio: '2:1', maxPanelsPerMicro: 2, maxUnitsBranch: 6, maxPanelsBranch: 12 },
  'DS3-H': { panelRatio: '2:1', maxPanelsPerMicro: 2, maxUnitsBranch: 6, maxPanelsBranch: 12 },
  'DS3-L': { panelRatio: '2:1', maxPanelsPerMicro: 2, maxUnitsBranch: 6, maxPanelsBranch: 12 },
  'DS3-S': { panelRatio: '2:1', maxPanelsPerMicro: 2, maxUnitsBranch: 7, maxPanelsBranch: 14 },

  // 4:1 Ratio Models
  'QS1': { panelRatio: '4:1', maxPanelsPerMicro: 4, maxUnitsBranch: 3, maxPanelsBranch: 12 },
  'QS1A': { panelRatio: '4:1', maxPanelsPerMicro: 4, maxUnitsBranch: 3, maxPanelsBranch: 12 },
};

// ============================================
// MANUFACTURER CLASSIFICATIONS
// ============================================

/**
 * Manufacturers that use dual-qty mode (Panel Qty + Micro Qty per branch)
 * These have multi-panel microinverters (2:1, 4:1 ratios)
 */
export const DUAL_QTY_MANUFACTURERS = ['Hoymiles Power', 'APSystems'];

/**
 * Manufacturers that use standard mode (Panel Qty only, 1:1 ratio)
 * Each microinverter handles one panel
 */
export const STANDARD_MICRO_MANUFACTURERS = ['Enphase'];

/**
 * Manufacturers that support power optimizers
 */
export const OPTIMIZER_MANUFACTURERS = ['SolarEdge', 'SOL-ARK', 'TIGO Energy'];

// ============================================
// LOOKUP FUNCTIONS
// ============================================

/**
 * Get stringing specs for a microinverter model
 * @param {string} manufacturer - Manufacturer name
 * @param {string} model - Model number
 * @returns {object|null} - Specs object or null if not found
 */
export const getStringingSpecs = (manufacturer, model) => {
  if (!manufacturer || !model) return null;

  let specsDb = null;

  if (manufacturer === 'Hoymiles Power' || manufacturer === 'Hoymiles') {
    specsDb = HOYMILES_STRINGING_SPECS;
  } else if (manufacturer === 'APSystems') {
    specsDb = APSYSTEMS_STRINGING_SPECS;
  }

  if (!specsDb) return null;

  // Try exact match first
  if (specsDb[model]) {
    return specsDb[model];
  }

  // Try partial match (model might have suffix variations)
  const matchingKey = Object.keys(specsDb).find(key =>
    model.includes(key) || key.includes(model)
  );

  return matchingKey ? specsDb[matchingKey] : null;
};

/**
 * Get max branches based on combiner panel make/model
 * @param {string} combinerMake - Combiner panel manufacturer
 * @param {string} combinerModel - Combiner panel model
 * @returns {number} - Maximum number of branches
 */
export const getMaxBranches = (combinerMake, combinerModel) => {
  if (!combinerMake || combinerMake !== 'Enphase') {
    return 8; // Default for non-Enphase
  }

  // Enphase-specific branch limits
  if (combinerModel?.includes('6C')) {
    return 5; // IQ Combiner 6C has 5 branches
  }

  return 4; // All other Enphase combiners have 4 branches
};

/**
 * Check if manufacturer uses dual-qty mode
 * @param {string} manufacturer - Manufacturer name
 * @returns {boolean}
 */
export const isDualQtyManufacturer = (manufacturer) => {
  return DUAL_QTY_MANUFACTURERS.some(m =>
    manufacturer?.toLowerCase().includes(m.toLowerCase())
  );
};

/**
 * Check if manufacturer is a standard microinverter (1:1 ratio)
 * @param {string} manufacturer - Manufacturer name
 * @returns {boolean}
 */
export const isStandardMicroManufacturer = (manufacturer) => {
  return STANDARD_MICRO_MANUFACTURERS.some(m =>
    manufacturer?.toLowerCase().includes(m.toLowerCase())
  );
};

/**
 * Get default panel ratio for a manufacturer
 * @param {string} manufacturer - Manufacturer name
 * @returns {string} - Panel ratio (e.g., "1:1", "2:1", "4:1")
 */
export const getDefaultPanelRatio = (manufacturer) => {
  if (isStandardMicroManufacturer(manufacturer)) return '1:1';
  return '1:1'; // Default
};
