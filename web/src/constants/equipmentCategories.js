/**
 * Equipment categories for inventory management
 * Matches mobile app exactly
 */

export const EQUIPMENT_CATEGORIES = [
  { id: 'solar-panels', label: 'Solar Panels' },
  { id: 'inverters', label: 'Inverters' },
  { id: 'micro-inverters', label: 'Microinverters' },
  { id: 'batteries', label: 'Batteries' },
  { id: 'storage-management', label: 'Storage Management Systems' },
  { id: 'ac-disconnects', label: 'AC Disconnects' },
  { id: 'pv-meters', label: 'PV Meters' },
  { id: 'load-centers', label: 'Load Centers' },
  { id: 'rails', label: 'Rails' },
  { id: 'attachments', label: 'Attachments' },
  { id: 'ev-chargers', label: 'EV Chargers', disabled: true, comingSoon: true },
];

/**
 * Categories where model selection is optional (make-only allowed)
 * These equipment types are sized based on system requirements
 */
export const MODEL_OPTIONAL_CATEGORIES = ['ac-disconnects', 'pv-meters', 'load-centers'];

/**
 * Check if model is optional for the given category
 * @param {string} categoryId - Category ID
 * @returns {boolean}
 */
export const isModelOptional = (categoryId) => {
  return MODEL_OPTIONAL_CATEGORIES.includes(categoryId);
};

/**
 * Map category ID to API equipment type string
 * @param {string} categoryId - Category ID from EQUIPMENT_CATEGORIES
 * @returns {string} - Equipment type for API calls
 */
export const getEquipmentTypeForCategory = (categoryId) => {
  const mapping = {
    'solar-panels': 'Solar Panel',
    'inverters': 'Inverter',
    'micro-inverters': 'Microinverter',
    'batteries': 'Battery',
    'storage-management': 'Storage Management System',
    'ac-disconnects': 'AC Disconnect',
    'pv-meters': 'PV Meter',
    'load-centers': 'Load Center',
    'rails': 'Rail',
    'attachments': 'Attachment',
    'ev-chargers': 'EV Charger',
  };
  return mapping[categoryId] || categoryId;
};

/**
 * Get category by ID
 * @param {string} categoryId - Category ID
 * @returns {Object|undefined} - Category object or undefined
 */
export const getCategoryById = (categoryId) => {
  return EQUIPMENT_CATEGORIES.find(cat => cat.id === categoryId);
};
