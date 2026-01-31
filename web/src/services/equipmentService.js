import axios from 'axios';
import logger from './devLogger';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.skyfireapp.io';

// URL encode helper
const enc = (value) => encodeURIComponent(value);

// ============================================================================
// CRITICAL: In-memory cache to prevent duplicate API calls during re-renders
// Manufacturers lists are relatively static - cache them for the session
// ============================================================================
const manufacturersCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
  const cached = manufacturersCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    logger.debug('Equipment', `Using cached data for: ${key}`);
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  manufacturersCache.set(key, {
    data,
    timestamp: Date.now(),
  });
  logger.debug('Equipment', `Cached data for: ${key}`);
};

/**
 * Get manufacturers by equipment type
 * @param {string} type - Equipment type (e.g., "Inverter", "Solar Panel", "Inverter Optimizer")
 * @returns {Promise} API response with manufacturers list
 */
export const getManufacturersByType = async (type) => {
  const cacheKey = `manufacturers-${type.toLowerCase()}`;

  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const url = `${API_BASE_URL}/equipment/manufacturers?type=${enc(type)}`;
    logger.debug('Equipment', `Fetching manufacturers for type "${type}" from API`);
    const response = await axios.get(url);
    setCachedData(cacheKey, response.data);
    return response.data;
  } catch (error) {
    logger.error('Equipment', `Error fetching manufacturers for type "${type}":`, error);
    throw error;
  }
};

/**
 * Get models by equipment type and manufacturer
 * @param {string} type - Equipment type (e.g., "Inverter", "Solar Panel")
 * @param {string} manufacturer - Manufacturer name
 * @returns {Promise} API response with models list
 */
export const getModelsByTypeAndManufacturer = async (type, manufacturer) => {
  try {
    // Add cache-busting timestamp to force fresh data from server
    const cacheBust = Date.now();
    const url = `${API_BASE_URL}/equipment/models?type=${enc(type)}&manufacturer=${enc(manufacturer)}&_=${cacheBust}`;
    logger.debug('Equipment', `Fetching models for ${type} - ${manufacturer} (cache-bust: ${cacheBust})`);
    const response = await axios.get(url);

    const modelCount = response?.data?.data?.length || 0;
    logger.debug('Equipment', `Response: ${modelCount} models found`);

    if (modelCount > 0) {
      const firstModel = response.data.data[0];
      logger.debug('Equipment', 'First model:', firstModel);
      logger.debug('Equipment', `All models:`, response.data.data.map(m => `${m.model_number} (id: ${m.id})`).join(', '));
    }

    return response.data;
  } catch (error) {
    logger.error('Equipment', `Error fetching models for "${manufacturer}":`, error);
    throw error;
  }
};

/**
 * Get solar panel manufacturers
 * Uses dedicated solar panel endpoint with fallback to generic endpoint
 * @returns {Promise} API response with solar panel manufacturers
 */
export const getSolarPanelManufacturers = async () => {
  const cacheKey = 'solar-panel-manufacturers';

  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const url = `${API_BASE_URL}/api/solar-panels/manufacturers`;
    logger.debug('Equipment', 'Fetching solar panel manufacturers from API');
    const response = await axios.get(url);
    setCachedData(cacheKey, response.data);
    return response.data;
  } catch (error) {
    logger.warn('Equipment', 'Dedicated endpoint failed, falling back to generic endpoint:', error);
    const fallbackData = await getManufacturersByType('Solar Panel');
    setCachedData(cacheKey, fallbackData);
    return fallbackData;
  }
};

/**
 * Get solar panel models by manufacturer
 * Uses dedicated solar panel endpoint that returns nameplate_pmax (wattage) for sizing calculations
 * @param {string} manufacturer - Manufacturer name
 * @returns {Promise} API response with solar panel models including:
 *   - id (number): Database ID
 *   - model_number (string): Panel model number
 *   - manufacturer_model (string): Full manufacturer + model string
 *   - nameplate_pmax (string): Panel wattage in watts (useful for system sizing)
 */
export const getSolarPanelModels = async (manufacturer) => {
  try {
    // Add cache-busting timestamp to force fresh data from server
    const cacheBust = Date.now();
    const url = `${API_BASE_URL}/api/solar-panels/models?manufacturer=${enc(manufacturer)}&_=${cacheBust}`;
    logger.debug('Equipment', `Using dedicated solar panel endpoint for ${manufacturer} (cache-bust: ${cacheBust})`);
    const response = await axios.get(url);

    const modelCount = response?.data?.data?.length || 0;
    logger.debug('Equipment', `Response: ${modelCount} models found`);

    if (modelCount > 0) {
      const firstModel = response.data.data[0];
      logger.debug('Equipment', 'First model:', firstModel);
      logger.debug('Equipment', `Nameplate Pmax: ${firstModel.nameplate_pmax}W`);
      logger.debug('Equipment', `All models:`, response.data.data.map(m => `${m.model_number} (id: ${m.id})`).join(', '));
    }

    return response.data;
  } catch (error) {
    logger.warn('Equipment', `Dedicated endpoint failed for "${manufacturer}", falling back to generic endpoint:`, error);
    return getModelsByTypeAndManufacturer('Solar Panel', manufacturer);
  }
};

/**
 * Get inverter manufacturers
 * Uses dedicated inverter endpoint with fallback to generic endpoint
 * @returns {Promise} API response with inverter manufacturers
 */
export const getInverterManufacturers = async () => {
  const cacheKey = 'inverter-manufacturers';

  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const url = `${API_BASE_URL}/api/inverters/manufacturers`;
    logger.debug('Equipment', 'Fetching inverter manufacturers from API');
    const response = await axios.get(url);
    setCachedData(cacheKey, response.data);
    return response.data;
  } catch (error) {
    logger.warn('Equipment', 'Dedicated endpoint failed, falling back to generic endpoint:', error);
    const fallbackData = await getManufacturersByType('Inverter');
    setCachedData(cacheKey, fallbackData);
    return fallbackData;
  }
};

/**
 * Get inverter models by manufacturer
 * Uses dedicated inverter endpoint that returns microinverter flag and max_strings_branches
 * @param {string} manufacturer - Manufacturer name
 * @returns {Promise} API response with inverter models including:
 *   - microinverter (boolean): true for microinverters, false for string inverters
 *   - equipment_type (string): "Inverter" or "MicroInverter"
 *   - max_strings_branches (number|null): For string inverters, number of supported strings
 *   - hybrid (string): "Yes" or "No"
 */
export const getInverterModels = async (manufacturer) => {
  try {
    // Add cache-busting timestamp to force fresh data from server
    const cacheBust = Date.now();
    const url = `${API_BASE_URL}/api/inverters/models?manufacturer=${enc(manufacturer)}&_=${cacheBust}`;
    logger.debug('Equipment', `Using dedicated inverter endpoint for ${manufacturer} (cache-bust: ${cacheBust})`);
    const response = await axios.get(url);

    const modelCount = response?.data?.data?.length || 0;
    logger.debug('Equipment', `Response: ${modelCount} models found`);

    if (modelCount > 0) {
      const firstModel = response.data.data[0];
      logger.debug('Equipment', 'First model:', firstModel);
      logger.debug('Equipment', `Microinverter: ${firstModel.microinverter}, Type: ${firstModel.equipment_type}`);
      logger.debug('Equipment', `All models:`, response.data.data.map(m => `${m.model_number} (id: ${m.id})`).join(', '));
    }

    return response.data;
  } catch (error) {
    logger.warn('Equipment', `Dedicated endpoint failed for "${manufacturer}", falling back to generic endpoint:`, error);
    return getModelsByTypeAndManufacturer('Inverter', manufacturer);
  }
};

/**
 * Get optimizer manufacturers
 * @returns {Promise} API response with optimizer manufacturers
 */
export const getOptimizerManufacturers = async () => {
  return getManufacturersByType('Inverter Optimizer');
};

/**
 * Get optimizer models by manufacturer
 * @param {string} manufacturer - Manufacturer name
 * @returns {Promise} API response with optimizer models
 */
export const getOptimizerModels = async (manufacturer) => {
  return getModelsByTypeAndManufacturer('Inverter Optimizer', manufacturer);
};

/**
 * Manufacturers that support power optimizers
 */
export const INVERTER_MANUFACTURERS_WITH_OPTIMIZERS = [
  'SolarEdge',
  'SOL-ARK',
  'TIGO Energy',
];

/**
 * Check if a manufacturer supports optimizers
 * @param {string} manufacturer - Manufacturer name
 * @returns {boolean} True if manufacturer supports optimizers
 */
export const manufacturerSupportsOptimizers = (manufacturer) => {
  if (!manufacturer) {
    return false;
  }
  return INVERTER_MANUFACTURERS_WITH_OPTIMIZERS.some(
    (supported) => manufacturer.toLowerCase().includes(supported.toLowerCase())
  );
};

/**
 * Get combiner panel (String Combiner Panel) manufacturers
 * @returns {Promise} API response with combiner panel manufacturers
 */
export const getCombinerPanelManufacturers = async () => {
  return getManufacturersByType('String Combiner Panel');
};

/**
 * Get combiner panel models by manufacturer
 * @param {string} manufacturer - Manufacturer name
 * @returns {Promise} API response with combiner panel models
 */
export const getCombinerPanelModels = async (manufacturer) => {
  return getModelsByTypeAndManufacturer('String Combiner Panel', manufacturer);
};

/**
 * Get battery manufacturers
 * @returns {Promise} API response with battery manufacturers
 */
export const getBatteryManufacturers = async () => {
  return getManufacturersByType('Battery');
};

/**
 * Get battery models by manufacturer
 * @param {string} manufacturer - Manufacturer name
 * @returns {Promise} API response with battery models
 */
export const getBatteryModels = async (manufacturer) => {
  return getModelsByTypeAndManufacturer('Battery', manufacturer);
};

/**
 * Get SMS (Storage Management System) manufacturers
 * @returns {Promise} API response with SMS manufacturers
 */
export const getSMSManufacturers = async () => {
  return getManufacturersByType('SMS');
};

/**
 * Get SMS models by manufacturer
 * @param {string} manufacturer - Manufacturer name
 * @returns {Promise} API response with SMS models
 */
export const getSMSModels = async (manufacturer) => {
  return getModelsByTypeAndManufacturer('SMS', manufacturer);
};

/**
 * Get rail manufacturers
 * @returns {Promise} API response with rail manufacturers
 */
export const getRailManufacturers = async () => {
  return getManufacturersByType('Rail');
};

/**
 * Get rail models by manufacturer
 * @param {string} manufacturer - Manufacturer name
 * @returns {Promise} API response with rail models
 */
export const getRailModels = async (manufacturer) => {
  return getModelsByTypeAndManufacturer('Rail', manufacturer);
};

/**
 * Get mounting hardware manufacturers
 * @returns {Promise} API response with mounting hardware manufacturers
 */
export const getMountingHardwareManufacturers = async () => {
  return getManufacturersByType('Mounting Hardware');
};

/**
 * Get mounting hardware models by manufacturer
 * @param {string} manufacturer - Manufacturer name
 * @returns {Promise} API response with mounting hardware models
 */
export const getMountingHardwareModels = async (manufacturer) => {
  return getModelsByTypeAndManufacturer('Mounting Hardware', manufacturer);
};

/**
 * Cached versions of equipment data functions
 * Simple pass-through for now - caching layer to be added if needed
 */
export const getCachedManufacturers = async (equipmentType) => {
  return getManufacturersByType(equipmentType);
};

export const getCachedModels = async (equipmentType, manufacturer) => {
  return getModelsByTypeAndManufacturer(equipmentType, manufacturer);
};

export const getCachedSpecs = async (type, make, model) => {
  // TODO: Implement specs endpoint when backend is ready
  logger.warn('Equipment', 'getCachedSpecs not yet implemented');
  return null;
};
