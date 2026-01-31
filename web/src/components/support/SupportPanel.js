import React, { useState } from 'react';
import KeyboardShortcutsPanel from './KeyboardShortcutsPanel';
import styles from './SupportPanel.module.css';

/**
 * Support Panel with Subtabs
 * Contains Keyboard Shortcuts and other help resources
 */
const SupportPanel = () => {
  const [activeSubTab, setActiveSubTab] = useState('shortcuts');

  return (
    <div className={styles.container}>
      {/* Subtab Navigation */}
      <div className={styles.subTabContainer}>
        <a
          href="#"
          className={`${styles.subTab} ${activeSubTab === 'shortcuts' ? styles.subTabActive : ''}`}
          onClick={(e) => { e.preventDefault(); setActiveSubTab('shortcuts'); }}
        >
          Keyboard Shortcuts
          {activeSubTab === 'shortcuts' && <span className={styles.subTabUnderline}></span>}
        </a>
        <a
          href="#"
          className={`${styles.subTab} ${activeSubTab === 'help' ? styles.subTabActive : ''}`}
          onClick={(e) => { e.preventDefault(); setActiveSubTab('help'); }}
        >
          Help & Resources
          {activeSubTab === 'help' && <span className={styles.subTabUnderline}></span>}
        </a>
      </div>

      {/* Subtab Content */}
      <div className={styles.subTabContent}>
        {activeSubTab === 'shortcuts' && <KeyboardShortcutsPanel />}
        {activeSubTab === 'help' && (
          <div className={styles.placeholder}>
            <p>Help and resources coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportPanel;
