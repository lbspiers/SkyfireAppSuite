import React from 'react';
import { KEYBOARD_SHORTCUTS, formatShortcutDisplay, CATEGORY_ORDER } from '../../constants/keyboardShortcuts';
import styles from './KeyboardShortcutsPanel.module.css';

/**
 * Keyboard Shortcuts Table - Auto-generated from constants
 * Always in sync with actual shortcuts
 */
const KeyboardShortcutsPanel = () => {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Group shortcuts by category
  const shortcutsByCategory = {};
  Object.entries(KEYBOARD_SHORTCUTS).forEach(([id, shortcut]) => {
    // Skip context-only shortcuts (they're situational)
    if (shortcut.contextOnly) return;

    const category = shortcut.category || 'Other';
    if (!shortcutsByCategory[category]) {
      shortcutsByCategory[category] = [];
    }
    shortcutsByCategory[category].push({ id, ...shortcut });
  });

  return (
    <div className={styles.container}>
      {CATEGORY_ORDER.map(category => {
        const shortcuts = shortcutsByCategory[category];
        if (!shortcuts || shortcuts.length === 0) return null;

        return (
          <div key={category} className={styles.categorySection}>
            <h4 className={styles.categoryTitle}>{category}</h4>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Mac</th>
                  <th>Windows</th>
                </tr>
              </thead>
              <tbody>
                {shortcuts.map(shortcut => {
                  const macKey = formatShortcutDisplay(shortcut, true);
                  const pcKey = formatShortcutDisplay(shortcut, false);

                  return (
                    <tr key={shortcut.id}>
                      <td>
                        <div className={styles.actionName}>{shortcut.label}</div>
                        {shortcut.description && (
                          <div className={styles.actionDesc}>{shortcut.description}</div>
                        )}
                      </td>
                      <td><kbd>{macKey}</kbd></td>
                      <td><kbd>{pcKey}</kbd></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default KeyboardShortcutsPanel;
