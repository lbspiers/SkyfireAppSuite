/**
 * Safe storage utilities to prevent JSON.parse crashes from corrupted data
 *
 * These utilities wrap sessionStorage/localStorage access with error handling
 * to prevent app crashes when storage data is corrupted or malformed.
 */

/**
 * Safely parse JSON from storage with error handling
 * @param {string} key - Storage key to retrieve
 * @param {Storage} storage - Storage object (sessionStorage or localStorage)
 * @param {*} defaultValue - Default value if parsing fails or key doesn't exist
 * @returns {*} Parsed value or default value
 */
export const safeGetJSON = (key, storage = sessionStorage, defaultValue = null) => {
  try {
    const item = storage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (e) {
    console.error(`[Storage] Failed to parse ${key}:`, e);
    // Clear corrupted data to prevent repeated errors
    try {
      storage.removeItem(key);
    } catch (removeError) {
      console.error(`[Storage] Failed to remove corrupted ${key}:`, removeError);
    }
    return defaultValue;
  }
};

/**
 * Safely set JSON to storage with error handling
 * @param {string} key - Storage key to set
 * @param {*} value - Value to store (will be JSON stringified)
 * @param {Storage} storage - Storage object (sessionStorage or localStorage)
 * @returns {boolean} Success status
 */
export const safeSetJSON = (key, value, storage = sessionStorage) => {
  try {
    const jsonString = JSON.stringify(value);
    storage.setItem(key, jsonString);
    return true;
  } catch (e) {
    console.error(`[Storage] Failed to set ${key}:`, e);
    return false;
  }
};

/**
 * Safely remove item from storage
 * @param {string} key - Storage key to remove
 * @param {Storage} storage - Storage object (sessionStorage or localStorage)
 * @returns {boolean} Success status
 */
export const safeRemove = (key, storage = sessionStorage) => {
  try {
    storage.removeItem(key);
    return true;
  } catch (e) {
    console.error(`[Storage] Failed to remove ${key}:`, e);
    return false;
  }
};

/**
 * Helper for getting user data from session storage
 * @returns {Object} User data or empty object
 */
export const getUserData = () => {
  return safeGetJSON('userData', sessionStorage, {});
};

/**
 * Helper for setting user data to session storage
 * @param {Object} userData - User data object
 * @returns {boolean} Success status
 */
export const setUserData = (userData) => {
  return safeSetJSON('userData', userData, sessionStorage);
};
