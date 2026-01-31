/**
 * Keyboard Shortcuts Configuration
 *
 * Single source of truth for all keyboard shortcuts in the app.
 * Used by:
 * - useKeyboardShortcuts hook (functionality)
 * - KeyboardShortcutsPanel component (documentation/reference)
 *
 * Format:
 * {
 *   key: 'unique-id',
 *   name: 'Display name',
 *   shortcut: 'Cmd+Key' or 'Key',
 *   description: 'What this shortcut does',
 *   category: 'Navigation' | 'Actions' | 'General',
 *   platform: 'all' | 'desktop' | 'mac' | 'windows' (optional, defaults to 'all')
 * }
 */

export const KEYBOARD_SHORTCUTS = [
  // NAVIGATION
  {
    key: 'dashboard',
    name: 'Dashboard',
    shortcut: 'Cmd+D',
    description: 'Navigate to the main dashboard',
    category: 'Navigation'
  },
  {
    key: 'new-project',
    name: 'New Project',
    shortcut: 'Cmd+N',
    description: 'Create a new project (opens dashboard)',
    category: 'Navigation'
  },
  {
    key: 'search',
    name: 'Search',
    shortcut: 'Cmd+K',
    description: 'Open global search',
    category: 'Navigation'
  },
  {
    key: 'settings',
    name: 'Settings',
    shortcut: 'Cmd+,',
    description: 'Open account settings',
    category: 'Navigation'
  },

  // GENERAL
  {
    key: 'escape',
    name: 'Close / Cancel',
    shortcut: 'Escape',
    description: 'Close modals, dropdowns, or cancel current action',
    category: 'General'
  },
  {
    key: 'escape-blur',
    name: 'Blur Input',
    shortcut: 'Escape',
    description: 'Remove focus from input fields',
    category: 'General'
  }
];

/**
 * Get shortcuts grouped by category
 * @returns {Object} Object with categories as keys, shortcuts arrays as values
 */
export function getGroupedShortcuts() {
  const categories = {};

  KEYBOARD_SHORTCUTS.forEach(shortcut => {
    if (!categories[shortcut.category]) {
      categories[shortcut.category] = [];
    }
    categories[shortcut.category].push(shortcut);
  });

  return categories;
}

/**
 * Get shortcuts for a specific category
 * @param {string} category - Category name
 * @returns {Array} Array of shortcuts
 */
export function getShortcutsByCategory(category) {
  return KEYBOARD_SHORTCUTS.filter(s => s.category === category);
}

/**
 * Get all unique categories
 * @returns {Array} Array of category names
 */
export function getCategories() {
  const categories = new Set();
  KEYBOARD_SHORTCUTS.forEach(s => categories.add(s.category));
  return Array.from(categories);
}

/**
 * Category display order
 */
export const CATEGORY_ORDER = ['Navigation', 'Actions', 'General'];

export default KEYBOARD_SHORTCUTS;
