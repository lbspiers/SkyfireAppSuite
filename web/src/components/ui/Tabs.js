import React, { useState } from 'react';
import styles from './Tabs.module.css';

const Tabs = ({
  tabs = [],           // [{ id, label, icon, disabled, badge }]
  activeTab,           // Controlled active tab id
  defaultTab,          // Uncontrolled default tab id
  onChange,
  variant = 'default', // default, pills, underline
  size = 'md',         // sm, md, lg
  fullWidth = false,
  className = '',
}) => {
  const [internalTab, setInternalTab] = useState(defaultTab || tabs[0]?.id);
  const currentTab = activeTab !== undefined ? activeTab : internalTab;

  const handleTabClick = (tabId) => {
    if (activeTab === undefined) {
      setInternalTab(tabId);
    }
    if (onChange) onChange(tabId);
  };

  return (
    <div
      className={`${styles.tabs} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.fullWidth : ''} ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={currentTab === tab.id}
          className={`${styles.tab} ${currentTab === tab.id ? styles.active : ''}`}
          onClick={() => handleTabClick(tab.id)}
          disabled={tab.disabled}
        >
          {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
          <span className={styles.label}>{tab.label}</span>
          {tab.badge !== undefined && (
            <span className={styles.badge}>{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
};

const TabPanel = ({ children, tabId, activeTab, className = '' }) => {
  if (tabId !== activeTab) return null;
  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
};

Tabs.Panel = TabPanel;
export default Tabs;
