import React from 'react';
import { KEYBOARD_SHORTCUTS } from '../../config/keyboardShortcuts';
import styles from './KeyboardShortcutsPanel.module.css';

/**
 * KeyboardShortcutsPanel Component
 * Simple table showing keyboard shortcuts for Mac and PC
 */
const KeyboardShortcutsPanel = () => {
  return (
    <div className={styles.container}>
      <h3>Keyboard Shortcuts</h3>

      <table className={styles.shortcutsTable}>
        <thead>
          <tr>
            <th>Action</th>
            <th>Mac</th>
            <th>Windows</th>
          </tr>
        </thead>
        <tbody>
          {KEYBOARD_SHORTCUTS.map(shortcut => {
            const macKey = shortcut.shortcut.replace('Cmd', '⌘');
            const pcKey = shortcut.shortcut.replace('Cmd', 'Ctrl');

            return (
              <tr key={shortcut.key}>
                <td>{shortcut.name}</td>
                <td><kbd>{macKey}</kbd></td>
                <td><kbd>{pcKey}</kbd></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default KeyboardShortcutsPanel;
