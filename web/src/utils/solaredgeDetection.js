/**
 * SolarEdge Multi-kW Inverter Detection Utilities
 *
 * SolarEdge inverters like USE11400H-USSKBEZ8 have multiple power output settings.
 * In the DB they're stored as: "USE11400H-USSKBEZ8 - 11400" (partNumber + " - " + setting)
 *
 * The dropdown shows ONLY the base part number. After selection, kW buttons appear
 * so the user can pick the power output setting. This mirrors the PowerWall 3 pattern.
 */

/**
 * Check if a model number is a SolarEdge multi-kW variant
 * These are stored in DB as "PARTNUM - WATTS" (e.g., "USE11400H-USSKBEZ8 - 11400")
 */
export const isSolarEdgeMultiKW = (modelNumber) => {
  if (!modelNumber || typeof modelNumber !== 'string') return false;
  return /^.+\s-\s\d+$/.test(modelNumber.trim());
};

/**
 * Extract the base part number from a SolarEdge multi-kW model
 * "USE11400H-USSKBEZ8 - 11400" → "USE11400H-USSKBEZ8"
 */
export const extractSolarEdgePartNumber = (modelNumber) => {
  if (!modelNumber || typeof modelNumber !== 'string') return null;
  const match = modelNumber.match(/^(.+)\s-\s\d+$/);
  return match ? match[1].trim() : null;
};

/**
 * Extract the power setting (watts) from a SolarEdge multi-kW model
 * "USE11400H-USSKBEZ8 - 11400" → "11400"
 */
export const extractSolarEdgeSetting = (modelNumber) => {
  if (!modelNumber || typeof modelNumber !== 'string') return null;
  const match = modelNumber.match(/\s-\s(\d+)$/);
  return match ? match[1] : null;
};

/**
 * Build a combined SolarEdge model number from part number + setting
 * ("USE11400H-USSKBEZ8", "11400") → "USE11400H-USSKBEZ8 - 11400"
 */
export const buildSolarEdgeModelNumber = (partNumber, setting) => {
  if (!partNumber) return '';
  if (!setting) return partNumber;
  return `${partNumber.trim()} - ${setting.trim()}`;
};

/**
 * Convert watts setting to display kW
 * "11400" → "11.4"  |  "3800" → "3.8"
 */
export const wattsToKW = (watts) => {
  const num = parseInt(watts, 10);
  if (isNaN(num)) return watts;
  return (num / 1000).toFixed(1).replace(/\.0$/, '');
};

/**
 * Get available kW options for a given SolarEdge part number from the models list
 * Returns sorted array of { value, label, modelData }
 */
export const getSolarEdgeKWOptions = (allModels, partNumber) => {
  if (!allModels || !partNumber) return [];

  const options = [];
  const seen = new Set();

  allModels.forEach(model => {
    const mn = model.model_number || '';
    if (mn.startsWith(partNumber + ' - ')) {
      const setting = extractSolarEdgeSetting(mn);
      if (setting && !seen.has(setting)) {
        seen.add(setting);
        options.push({
          value: setting,
          label: wattsToKW(setting),
          modelData: model,
        });
      }
    }
  });

  // Sort by numeric value ascending
  options.sort((a, b) => parseInt(a.value) - parseInt(b.value));
  return options;
};

/**
 * Check if the current inverter is a SolarEdge multi-kW model
 * (either already combined "PART - WATTS" or a base part with variants in the models list)
 */
export const isSolarEdgeWithKWOptions = (make, model, allModels) => {
  if (!make || !model || !allModels) return false;
  if (make !== 'SolarEdge') return false;

  const partNumber = extractSolarEdgePartNumber(model) || model;
  const options = getSolarEdgeKWOptions(allModels, partNumber);
  return options.length > 1;
};

/**
 * Deduplicate SolarEdge multi-kW models for dropdown display
 * Groups all "PARTNUM - XXXX" into a single "PARTNUM" entry
 */
export const deduplicateSolarEdgeModels = (modelsArray) => {
  if (!modelsArray) return [];

  const seen = new Set();
  const result = [];

  modelsArray.forEach(model => {
    const mn = model.model_number || '';
    const partNumber = extractSolarEdgePartNumber(mn);

    if (partNumber) {
      if (!seen.has(partNumber)) {
        seen.add(partNumber);
        result.push({
          ...model,
          display_name: partNumber,
          _isMultiKW: true,
          _basePartNumber: partNumber,
        });
      }
    } else {
      result.push(model);
    }
  });

  return result;
};
