/**
 * Centralized Keyboard Shortcuts Configuration
 *
 * Professional-grade shortcut system for Skyfire
 * Auto-syncs with KeyboardShortcutsPanel UI
 */

// Shortcut action types
export const SHORTCUT_ACTIONS = {
  NAVIGATE: 'navigate',
  TRIGGER: 'trigger',
  FOCUS: 'focus',
  TOGGLE: 'toggle',
};

// Browser conflict notes
const BROWSER_CONFLICTS = {
  'Cmd+P': 'Browser print dialog (we override with preventDefault)',
  'Cmd+F': 'Browser find (we override on pages with filters)',
};

/**
 * Main shortcuts configuration
 * Format: { key, meta, shift, label, description, action, handler, category, tier }
 */
export const KEYBOARD_SHORTCUTS = {
  // ========== NAVIGATION (Portal Switching) ==========
  DASHBOARD: {
    key: '1',
    meta: true,
    label: 'Dashboard',
    description: 'Go to main dashboard',
    action: SHORTCUT_ACTIONS.NAVIGATE,
    path: '/dashboard',
    category: 'Navigation',
    tier: 1,
  },
  PROJECTS: {
    key: '2',
    meta: true,
    label: 'Projects',
    description: 'View all projects',
    action: SHORTCUT_ACTIONS.NAVIGATE,
    path: '/existing-projects',
    category: 'Navigation',
    tier: 1,
  },
  INVENTORY: {
    key: '3',
    meta: true,
    label: 'Inventory',
    description: 'Open inventory management',
    action: SHORTCUT_ACTIONS.NAVIGATE,
    path: '/inventory',
    category: 'Navigation',
    tier: 1,
  },
  SCHEDULING: {
    key: '4',
    meta: true,
    label: 'Scheduling',
    description: 'Open scheduling portal',
    action: SHORTCUT_ACTIONS.NAVIGATE,
    path: '/scheduling',
    category: 'Navigation',
    tier: 1,
  },
  DRAFTER_PORTAL: {
    key: '5',
    meta: true,
    label: 'Drafter Portal',
    description: 'Open drafter dashboard',
    action: SHORTCUT_ACTIONS.NAVIGATE,
    path: '/drafter-portal',
    category: 'Navigation',
    tier: 1,
  },
  ACCOUNT: {
    key: '0',
    meta: true,
    label: 'Account',
    description: 'Open account settings',
    action: SHORTCUT_ACTIONS.NAVIGATE,
    path: '/account',
    category: 'Navigation',
    tier: 1,
  },
  GO_BACK: {
    key: '[',
    meta: true,
    label: 'Go Back',
    description: 'Navigate to previous page',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'history.back',
    category: 'Navigation',
    tier: 2,
  },
  GO_FORWARD: {
    key: ']',
    meta: true,
    label: 'Go Forward',
    description: 'Navigate to next page',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'history.forward',
    category: 'Navigation',
    tier: 2,
  },

  // ========== SEARCH & FILTER ==========
  GLOBAL_SEARCH: {
    key: 'k',
    meta: true,
    label: 'Global Search',
    description: 'Open global search',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'openGlobalSearch',
    category: 'Search',
    tier: 1,
  },
  QUICK_SEARCH: {
    key: '/',
    label: 'Quick Search',
    description: 'Quick search (when not typing)',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'openGlobalSearch',
    category: 'Search',
    tier: 1,
  },
  HELP_SHORTCUTS: {
    key: '?',
    shift: true, // ? is Shift+/
    label: 'Help',
    description: 'Show keyboard shortcuts',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'openKeyboardShortcuts',
    category: 'Help',
    tier: 1,
  },
  FILTER_PAGE: {
    key: 'f',
    meta: true,
    label: 'Filter',
    description: 'Focus filter on current page',
    action: SHORTCUT_ACTIONS.FOCUS,
    handler: 'focusFilter',
    category: 'Search',
    tier: 2,
  },

  // ========== PROJECT ACTIONS ==========
  NEW_PROJECT: {
    key: 'n',
    meta: true,
    label: 'New Project',
    description: 'Create a new project',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'createNewProject',
    category: 'Actions',
    tier: 1,
  },
  OPEN_PROJECT: {
    key: 'o',
    meta: true,
    label: 'Open Project',
    description: 'Open project picker',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'openProjectPicker',
    category: 'Actions',
    tier: 2,
  },
  COPY_LINK: {
    key: 'c',
    meta: true,
    shift: true,
    label: 'Copy Link',
    description: 'Copy current page URL',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'copyCurrentLink',
    category: 'Actions',
    tier: 2,
  },
  PRINT_EXPORT: {
    key: 'p',
    meta: true,
    label: 'Print/Export',
    description: 'Print or export to PDF',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'printOrExport',
    category: 'Actions',
    tier: 2,
  },

  // ========== FORMS & EDITING ==========
  SAVE: {
    key: 's',
    meta: true,
    label: 'Save',
    description: 'Save current form',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'saveForm',
    category: 'Editing',
    tier: 1,
  },
  SUBMIT: {
    key: 'Enter',
    meta: true,
    label: 'Submit',
    description: 'Submit current form',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'submitForm',
    category: 'Editing',
    tier: 1,
  },
  CANCEL: {
    key: 'Escape',
    label: 'Cancel',
    description: 'Close modal or cancel action',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'cancelOrClose',
    category: 'General',
    tier: 1,
  },

  // ========== COMMUNICATION ==========
  OPEN_CHATTER: {
    key: 'm',
    meta: true,
    shift: true,
    label: 'Messages',
    description: 'Open Chatter messages',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'openChatter',
    category: 'Communication',
    tier: 1,
  },
  SEND_MESSAGE: {
    key: 'Enter',
    meta: true,
    label: 'Send',
    description: 'Send message (in chat)',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'sendMessage',
    category: 'Communication',
    tier: 1,
    contextOnly: true, // Only works in chat
  },

  // ========== MEDIA & FILES ==========
  UPLOAD_FILE: {
    key: 'u',
    meta: true,
    shift: true,
    label: 'Upload',
    description: 'Upload file or photo',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'uploadFile',
    category: 'Media',
    tier: 2,
  },
  PREVIEW_FILE: {
    key: 'p',
    meta: true,
    shift: true,
    label: 'Preview',
    description: 'Preview selected file',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'previewFile',
    category: 'Media',
    tier: 2,
  },

  // ========== LIST NAVIGATION (J/K Gmail style) ==========
  NEXT_ITEM: {
    key: 'j',
    label: 'Next',
    description: 'Next item in list',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'listNext',
    category: 'List Navigation',
    tier: 2,
    contextOnly: true,
  },
  PREV_ITEM: {
    key: 'k',
    label: 'Previous',
    description: 'Previous item in list',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'listPrev',
    category: 'List Navigation',
    tier: 2,
    contextOnly: true,
  },
  OPEN_ITEM: {
    key: 'Enter',
    label: 'Open',
    description: 'Open selected item',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'listOpen',
    category: 'List Navigation',
    tier: 2,
    contextOnly: true,
  },
  TOGGLE_SELECT: {
    key: ' ',
    label: 'Select',
    description: 'Toggle selection',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'listToggleSelect',
    category: 'List Navigation',
    tier: 2,
    contextOnly: true,
  },
  SELECT_ALL: {
    key: 'a',
    meta: true,
    label: 'Select All',
    description: 'Select all items',
    action: SHORTCUT_ACTIONS.TRIGGER,
    handler: 'selectAll',
    category: 'List Navigation',
    tier: 2,
  },
};

/**
 * Get shortcuts by category
 */
export function getShortcutsByCategory() {
  const categories = {};

  Object.entries(KEYBOARD_SHORTCUTS).forEach(([id, shortcut]) => {
    const category = shortcut.category || 'Other';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push({ id, ...shortcut });
  });

  return categories;
}

/**
 * Get shortcuts by tier (for phased rollout)
 */
export function getShortcutsByTier(tier) {
  return Object.entries(KEYBOARD_SHORTCUTS)
    .filter(([_, shortcut]) => shortcut.tier === tier)
    .map(([id, shortcut]) => ({ id, ...shortcut }));
}

/**
 * Get all categories
 */
export function getCategories() {
  const categories = new Set();
  Object.values(KEYBOARD_SHORTCUTS).forEach(s => {
    categories.add(s.category || 'Other');
  });
  return Array.from(categories);
}

/**
 * Category display order
 */
export const CATEGORY_ORDER = [
  'Navigation',
  'Search',
  'Actions',
  'Editing',
  'Communication',
  'Media',
  'List Navigation',
  'Help',
  'General',
];

/**
 * Format shortcut for display
 * @param {Object} shortcut - Shortcut configuration
 * @param {boolean} isMac - Whether user is on Mac
 * @returns {string} Formatted shortcut string
 */
export function formatShortcutDisplay(shortcut, isMac = true) {
  const parts = [];

  if (shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push('Shift');
  }
  if (shortcut.alt) {
    parts.push(isMac ? 'Option' : 'Alt');
  }

  // Handle special keys
  const keyDisplay = {
    'Enter': '↵',
    'Escape': 'Esc',
    ' ': 'Space',
  }[shortcut.key] || shortcut.key.toUpperCase();

  parts.push(keyDisplay);

  return parts.join(isMac ? '' : ' + ');
}

export default KEYBOARD_SHORTCUTS;
