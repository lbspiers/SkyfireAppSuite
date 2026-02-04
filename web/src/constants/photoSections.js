/**
 * Photo Organization System - Solar Industry Equipment Sections
 * Defines standard sections for organizing solar project photos
 */

export const PHOTO_SECTIONS = [
  // Site & Survey
  { value: 'general', label: 'General', icon: 'Folder', category: 'survey' },
  { value: 'site', label: 'Site Overview', icon: 'MapPin', category: 'survey' },
  { value: 'roof', label: 'Roof', icon: 'Home', category: 'survey' },
  { value: 'attic', label: 'Attic', icon: 'Layers', category: 'survey' },

  // Solar Equipment
  { value: 'solar_panel', label: 'Solar Panels', icon: 'Sun', category: 'equipment' },
  { value: 'inverter', label: 'Inverter', icon: 'Cpu', category: 'equipment' },
  { value: 'microinverter', label: 'Microinverter', icon: 'Grid', category: 'equipment' },
  { value: 'optimizer', label: 'Optimizer', icon: 'Sliders', category: 'equipment' },
  { value: 'string_combiner', label: 'String Combiner', icon: 'GitMerge', category: 'equipment' },
  { value: 'combine', label: 'Combined Systems', icon: 'Layers', category: 'equipment' },
  { value: 'utility', label: 'Utility Equipment', icon: 'Zap', category: 'equipment' },
  { value: 'postSMS', label: 'Post-SMS Equipment', icon: 'Box', category: 'equipment' },

  // Electrical
  { value: 'main_panel', label: 'Main Panel (MSP)', icon: 'Zap', category: 'electrical' },
  { value: 'sub_panel', label: 'Sub Panel', icon: 'GitBranch', category: 'electrical' },
  { value: 'meter', label: 'Meter', icon: 'Gauge', category: 'electrical' },
  { value: 'disconnect', label: 'AC Disconnect', icon: 'Power', category: 'electrical' },
  { value: 'pv_meter', label: 'PV Meter', icon: 'Activity', category: 'electrical' },
  { value: 'poi', label: 'Point of Interconnection', icon: 'Link', category: 'electrical' },

  // Energy Storage
  { value: 'battery', label: 'Battery', icon: 'Battery', category: 'storage' },
  { value: 'battery1', label: 'Battery 1', icon: 'Battery', category: 'storage' },
  { value: 'battery2', label: 'Battery 2', icon: 'Battery', category: 'storage' },
  { value: 'battery_combiner', label: 'Battery Combiner Panel', icon: 'Box', category: 'storage' },
  { value: 'gateway', label: 'Gateway', icon: 'Wifi', category: 'storage' },
  { value: 'sms', label: 'Storage Management System', icon: 'Server', category: 'storage' },
  { value: 'backup_panel', label: 'Backup Load Panel', icon: 'Shield', category: 'storage' },
  { value: 'backup', label: 'Backup Equipment', icon: 'Shield', category: 'storage' },

  // Structural
  { value: 'mounting_plane', label: 'Mounting Plane', icon: 'Square', category: 'structural' },
  { value: 'attachment', label: 'Roof Attachment', icon: 'Anchor', category: 'structural' },
  { value: 'racking', label: 'Racking/Rails', icon: 'AlignJustify', category: 'structural' },

  // Documents
  { value: 'permit', label: 'Permit Documents', icon: 'FileText', category: 'documents' },
  { value: 'label', label: 'Labels & Placards', icon: 'Tag', category: 'documents' },
];

export const SECTION_CATEGORIES = [
  { value: 'survey', label: 'Site Survey' },
  { value: 'equipment', label: 'Solar Equipment' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'storage', label: 'Energy Storage' },
  { value: 'structural', label: 'Structural' },
  { value: 'documents', label: 'Documents' },
];

// Common sub-tags for additional classification
export const PHOTO_TAGS = [
  // Condition tags
  { value: 'existing', label: 'Existing' },
  { value: 'new', label: 'New/Proposed' },
  { value: 'issue', label: 'Issue/Concern' },
  { value: 'complete', label: 'Completed' },

  // View tags
  { value: 'front', label: 'Front View' },
  { value: 'back', label: 'Back View' },
  { value: 'interior', label: 'Interior' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'closeup', label: 'Close-up' },
  { value: 'wide', label: 'Wide Shot' },

  // Label tags
  { value: 'nameplate', label: 'Nameplate/Label' },
  { value: 'serial', label: 'Serial Number' },
  { value: 'specs', label: 'Specifications' },

  // Location tags
  { value: 'north', label: 'North' },
  { value: 'south', label: 'South' },
  { value: 'east', label: 'East' },
  { value: 'west', label: 'West' },
];

/**
 * Format section value to human-readable label
 * @param {string} value - Section value (e.g., 'main_panel')
 * @returns {string} Formatted label (e.g., 'Main Panel (MSP)')
 */
export const formatSectionLabel = (value) => {
  const section = PHOTO_SECTIONS.find(s => s.value === value);
  return section?.label || value?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Unknown';
};

/**
 * Get icon name for a section
 * @param {string} value - Section value
 * @returns {string} Icon name from lucide-react
 */
export const getSectionIcon = (value) => {
  const section = PHOTO_SECTIONS.find(s => s.value === value);
  return section?.icon || 'Folder';
};

/**
 * Get all sections for a specific category
 * @param {string} category - Category value (e.g., 'electrical')
 * @returns {Array} Array of section objects
 */
export const getSectionsByCategory = (category) => {
  return PHOTO_SECTIONS.filter(s => s.category === category);
};

/**
 * Get category info for a section
 * @param {string} sectionValue - Section value
 * @returns {Object} Category object or null
 */
export const getCategoryForSection = (sectionValue) => {
  const section = PHOTO_SECTIONS.find(s => s.value === sectionValue);
  if (!section) return null;
  return SECTION_CATEGORIES.find(c => c.value === section.category);
};
