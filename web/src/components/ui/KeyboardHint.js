import React from 'react';
import styles from './KeyboardHint.module.css';

/**
 * KeyboardHint Component
 *
 * Displays keyboard shortcut hints in UI elements (buttons, tooltips, etc.)
 * Automatically detects Mac vs Windows and shows appropriate modifier keys.
 *
 * Usage:
 *   <Button>
 *     New Project
 *     <KeyboardHint shortcut="Cmd+N" />
 *   </Button>
 *
 *   <KeyboardHint shortcut="Escape" variant="dark" />
 *
 * @param {string} shortcut - Shortcut string (e.g., "Cmd+N", "Ctrl+K", "Escape")
 * @param {string} variant - Display variant: "light", "dark", "subtle" (default: "subtle")
 * @param {string} size - Size: "sm", "md", "lg" (default: "sm")
 */
export function KeyboardHint({ shortcut, variant = 'subtle', size = 'sm' }) {
  // Detect platform
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Format shortcut for current platform
  const formatShortcut = (str) => {
    const modKey = isMac ? '⌘' : 'Ctrl';
    return str
      .replace('Cmd', modKey)
      .replace('Ctrl', modKey)
      .replace('+', ''); // Remove + for cleaner display
  };

  const displayShortcut = formatShortcut(shortcut);

  return (
    <kbd
      className={`${styles.keyboardHint} ${styles[variant]} ${styles[size]}`}
      title={`Keyboard shortcut: ${shortcut}`}
    >
      {displayShortcut}
    </kbd>
  );
}

export default KeyboardHint;
