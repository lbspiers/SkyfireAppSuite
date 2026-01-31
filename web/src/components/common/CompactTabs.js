import React, { useState, useEffect } from 'react';
import styles from '../../styles/CompactTabs.module.css';

/**
 * CompactTabs - Sub-tab navigation with underline indicators
 *
 * Uses the standard sub-tab pattern from Dashboard (Equipment/BOS style)
 *
 * @param {Array} tabs - Array of tab objects: [{id: 'tab1', label: 'Tab 1'}, ...]
 * @param {string} defaultTab - Initial active tab ID (defaults to first tab)
 * @param {string} activeTab - Controlled active tab (optional, for external state control)
 * @param {function} onTabChange - Callback when tab changes: (tabId) => {}
 * @param {Object} tabContent - Object mapping tab IDs to their content: {tab1: <Component />, tab2: <Component />}
 * @param {string} storageKey - Optional sessionStorage key to persist active tab
 * @param {function} renderControls - Optional function to render controls on the right side: (activeTab) => ReactNode
 */
const CompactTabs = ({
  tabs = [],
  defaultTab,
  activeTab: controlledActiveTab,
  onTabChange,
  tabContent = {},
  storageKey,
  renderControls
}) => {
  // Get saved tab state or use default
  const getSavedTab = () => {
    if (storageKey) {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) return saved;
    }
    return defaultTab || tabs[0]?.id;
  };

  const [internalActiveTab, setInternalActiveTab] = useState(getSavedTab());

  // Use controlled activeTab if provided, otherwise use internal state
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  // Update internalActiveTab if defaultTab changes externally (only in uncontrolled mode)
  useEffect(() => {
    if (controlledActiveTab === undefined && defaultTab) {
      setInternalActiveTab(defaultTab);
      if (storageKey) {
        sessionStorage.setItem(storageKey, defaultTab);
      }
    }
  }, [defaultTab, storageKey, controlledActiveTab]);

  const handleTabChange = (tabId) => {
    // Update internal state only if not controlled
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }

    // Save to sessionStorage if storageKey provided
    if (storageKey) {
      sessionStorage.setItem(storageKey, tabId);
    }

    // Call parent callback if provided
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  return (
    <div className={styles.compactTabsContainer}>
      {/* Tabs Navigation - Standard Sub-Tab Pattern */}
      <div className={styles.viewNavigation}>
        <div className={styles.viewNavigationTabs}>
          {tabs.map((tab, index) => (
            <a
              key={tab.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleTabChange(tab.id);
              }}
              className={`${styles.viewLink} ${
                index === 0 ? styles.viewLinkFirst : ''
              } ${activeTab === tab.id ? styles.viewLinkActive : ''}`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div
                  className={`${styles.viewLinkIndicator} ${
                    index === 0 ? styles.viewLinkIndicatorFirst : styles.viewLinkIndicatorCenter
                  }`}
                />
              )}
            </a>
          ))}
        </div>
        {renderControls && (
          <div className={styles.viewNavigationControls}>
            {typeof renderControls === 'function' && renderControls(activeTab)}
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className={styles.contentArea}>
        {tabContent[activeTab] || (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📋</div>
            <div className={styles.emptyStateTitle}>No content</div>
            <div className={styles.emptyStateText}>
              Content for this tab has not been configured
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactTabs;
