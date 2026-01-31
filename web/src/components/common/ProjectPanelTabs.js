import React from 'react';
import { motion } from 'framer-motion';
import StatusTabCard from '../dashboard/StatusTabCard';
import styles from '../../styles/Dashboard.module.css';

/**
 * ProjectPanelTabs - Reusable tab panel with MSN Weather-style curved tabs
 * Used by both Dashboard ChatterPanel and Design Portal ProjectDetailsTabs
 */
const ProjectPanelTabs = ({
  tabs,              // Array of {key, label, icon}
  selectedTab,
  onTabChange,
  children,          // Content to render in panel
  customColor = 'var(--bg-panel)'  // Panel background color
}) => {
  return (
    <div className={styles.statusTabsWrapper}>
      <motion.div className={styles.statusTabsContainer}>
        {tabs.map((tab) => (
          <StatusTabCard
            key={tab.key}
            label={tab.label}
            icon={tab.icon}
            isSelected={selectedTab === tab.key}
            onClick={() => onTabChange(tab.key)}
            showMetrics={false}
            customColor={customColor}
          />
        ))}
      </motion.div>

      <div className={`${styles.statusContentPanel} ${
        selectedTab === tabs[0]?.key ? styles.statusContentPanelFirstTab :
        selectedTab === tabs[tabs.length - 1]?.key ? styles.statusContentPanelLastTab :
        styles.statusContentPanelMiddleTab
      }`}>
        {children}
      </div>
    </div>
  );
};

export default ProjectPanelTabs;
