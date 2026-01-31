/**
 * PowerWall Detection Utilities
 * Handles detection of Tesla PowerWall models and types
 */

/**
 * Detects if the inverter model is a PowerWall 3
 * @param {string} modelName - The inverter model name/label
 * @returns {boolean} - True if PowerWall 3 detected
 */
export const isPowerWall3 = (modelName) => {
  if (!modelName) return false;

  const modelLower = modelName.toLowerCase();

  const result = (
    modelLower.includes("powerwall 3") ||
    modelLower.includes("powerwall-3") ||
    modelLower.includes("powerwall_3") ||
    modelLower.includes("powerwall3") ||
    modelLower.includes("pw3") ||
    modelLower.includes("pw 3") ||
    // Also check if it contains both "powerwall" and "3" separately
    (modelLower.includes("powerwall") && modelLower.includes("3"))
  );

  return result;
};

/**
 * Detects if the inverter model is a PowerWall Plus
 * @param {string} modelName - The inverter model name/label
 * @returns {boolean} - True if PowerWall Plus detected
 */
export const isPowerWallPlus = (modelName) => {
  if (!modelName) return false;

  const modelLower = modelName.toLowerCase();

  return (
    modelLower.includes('powerwall+') ||
    modelLower.includes('powerwall +')
  );
};

/**
 * Detects if the inverter is any Tesla PowerWall model
 * @param {string} make - The inverter make
 * @param {string} modelName - The inverter model name/label
 * @returns {boolean} - True if any PowerWall model detected
 */
export const isTeslaPowerWall = (make, modelName) => {
  if (!make || !modelName) return false;

  const makeLower = make.toLowerCase();
  const modelLower = modelName.toLowerCase();

  const isTesla = makeLower.includes('tesla');
  const isPowerWall = modelLower.includes('powerwall');

  return isTesla && isPowerWall;
};

/**
 * Detects if Energy Storage Section should be suppressed
 * (PowerWall 3 or PowerWall Plus have integrated batteries)
 * @param {string} make - The inverter make
 * @param {string} modelName - The inverter model name/label
 * @returns {boolean} - True if ESS should be suppressed
 */
export const shouldSuppressESS = (make, modelName) => {
  if (!make || !modelName) return false;

  const isTesla = make.toLowerCase().includes('tesla');
  const isPW3 = isPowerWall3(modelName);
  const isPWPlus = isPowerWallPlus(modelName);

  return isTesla && (isPW3 || isPWPlus);
};

/**
 * Extracts the kW rating from a PowerWall 3 model name
 * @param {string} modelName - The model name (e.g., "Powerwall 3 (11.5 kW)")
 * @returns {string|null} - The kW rating or null if not found
 */
export const extractPowerWall3KW = (modelName) => {
  if (!modelName) return null;

  // Match patterns like "(11.5 kW)" or "(11.5kW)" or "11.5 kW"
  const kwMatch = modelName.match(/(\d+\.?\d*)\s*kw/i);
  if (kwMatch) {
    return kwMatch[1];
  }

  return null;
};

/**
 * Updates PowerWall 3 model name with new kW rating
 * @param {string} currentModel - Current model name
 * @param {string} kwRating - New kW rating (e.g., "11.5")
 * @returns {string} - Updated model name with kW rating
 */
export const updatePowerWall3ModelWithKW = (currentModel, kwRating) => {
  if (!currentModel) return `Powerwall 3 (${kwRating} kW)`;

  // Remove existing kW rating if present
  let baseName = currentModel.replace(/\s*\(?\d+\.?\d*\s*kw\)?/gi, '').trim();

  // Add new kW rating
  return `${baseName} (${kwRating} kW)`;
};
