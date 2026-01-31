import React, { useState, useEffect } from 'react';
import styles from '../../styles/TabbedPanel.module.css';

/**
 * TabbedPanel - Reusable tabbed interface component with MSN Weather-style curved tabs
 *
 * @param {Array} tabs - Array of tab objects: [{id: 'tab1', label: 'Tab 1', badge: 3, icon: '📝'}, ...]
 * @param {string} defaultTab - Initial active tab ID (defaults to first tab)
 * @param {function} onTabChange - Callback when tab changes: (tabId) => {}
 * @param {ReactNode} headerContent - Optional content to display above tabs (like compact header)
 * @param {Object} tabContent - Object mapping tab IDs to their content: {tab1: <Component />, tab2: <Component />}
 * @param {string} storageKey - Optional sessionStorage key to persist active tab
 * @param {boolean} showArcs - Toggle the concave arc effect (default: true)
 */
const TabbedPanel = ({
  tabs = [
    { id: 'tab1', label: 'Tab 1' },
    { id: 'tab2', label: 'Tab 2' }
  ],
  defaultTab,
  onTabChange,
  headerContent,
  tabContent = {},
  storageKey,
  showArcs = true
}) => {
  // Get saved tab state or use default
  const getSavedTab = () => {
    if (storageKey) {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) return saved;
    }
    return defaultTab || tabs[0]?.id;
  };

  const [activeTab, setActiveTab] = useState(getSavedTab());

  // Update activeTab if defaultTab changes externally
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
      if (storageKey) {
        sessionStorage.setItem(storageKey, defaultTab);
      }
    }
  }, [defaultTab, storageKey]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);

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
    <div className={styles.tabbedPanel}>
      {/* Tabs Wrapper */}
      <div className={styles.tabsWrapper}>
        {/* Tabs Navigation */}
        <div className={styles.tabsContainer}>
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''} ${showArcs ? '' : styles.tabNoArcs}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {/* Icon (if provided) */}
              {tab.icon && (
                <span className={styles.tabIcon}>
                  {typeof tab.icon === 'string' ? tab.icon : tab.icon}
                </span>
              )}

              {/* Label */}
              <span className={styles.tabLabel}>{tab.label}</span>

              {/* Badge (if provided) */}
              {tab.badge !== undefined && tab.badge !== null && (
                <span className={styles.tabBadge}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content Panel - connects to selected tab with MSN Weather curved borders */}
        <div className={`${styles.contentPanel} ${
          activeTab === tabs[0]?.id ? styles.contentPanelFirstTab : ''
        } ${
          activeTab === tabs[tabs.length - 1]?.id ? styles.contentPanelLastTab : ''
        }`}>
          {/* Optional Header Content */}
          {headerContent && (
            <div className={styles.headerContent}>
              {headerContent}
            </div>
          )}

          {/* Tab Content */}
          <div className={styles.tabContentWrapper}>
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
      </div>
    </div>
  );
};

export default TabbedPanel;
