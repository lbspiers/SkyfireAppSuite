import React from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  Map,
  History,
  FolderOpen
} from 'lucide-react';
import { SitePlanHouseIcon, PlanSetIcon } from '../../assets/icons/CustomIcons';
import StatusTabCard from './StatusTabCard';
import { TabStatusBadge } from '../ui';
import { useProjectTabStatuses } from '../../hooks/useProjectTabStatuses';
import styles from '../../styles/Dashboard.module.css';

// Tab configuration for project overview
const OVERVIEW_CONFIG = [
  { key: 'fordje', label: 'Fordje', color: '#06B6D4', step: null, icon: null },
  { key: 'solarapp', label: 'SolarAPP+', color: 'var(--color-primary)', step: null, icon: null },
  { key: 'powerclerk', label: 'PowerClerk', color: '#8B5CF6', step: null, icon: null },
  { key: 'survey', label: 'Survey', color: 'var(--color-warning)', step: null, icon: <Camera size={16} /> },
  { key: 'map', label: 'Map', color: '#EC4899', step: null, icon: <Map size={16} /> },
  { key: 'overview', label: 'Site Plan', color: '#6366F1', step: null, icon: <SitePlanHouseIcon size={16} /> },
  { key: 'planset', label: 'Plan Set', color: 'var(--color-success)', step: null, icon: <PlanSetIcon size={16} /> },
  { key: 'revisions', label: 'Revisions', color: 'var(--color-error)', step: null, icon: <History size={16} /> },
  { key: 'files', label: 'Files', color: 'var(--color-info)', step: null, icon: <FolderOpen size={16} /> },
];

// Map tab keys to API tab names
const TAB_KEY_TO_API_NAME = {
  survey: 'survey',
  overview: 'site_plan',
  planset: 'plan_set',
  revisions: 'revisions',
};

/**
 * ProjectOverviewTabs - File folder style tabs for project overview sections
 *
 * @param {string} projectUuid - Project UUID for fetching tab statuses
 * @param {string} selectedTab - Currently selected tab key
 * @param {function} onTabChange - Callback when tab changes
 * @param {boolean} loading - Loading state
 * @param {node} children - Content panel that connects to selected tab
 * @param {Array<string>} tabs - Optional array of tab keys to display. If not provided, shows all tabs.
 */
const ProjectOverviewTabs = ({
  projectUuid,
  selectedTab = 'overview',
  onTabChange,
  loading = false,
  children,
  tabs = null, // If null, show all tabs
}) => {
  // Fetch tab statuses for this project
  const { getStatus, updateStatus } = useProjectTabStatuses(projectUuid);

  // Handle status change callback
  const handleStatusChange = async (tabKey, newStatus, reason) => {
    const apiTabName = TAB_KEY_TO_API_NAME[tabKey];
    if (!apiTabName) return;

    try {
      await updateStatus(apiTabName, newStatus, reason);
    } catch (error) {
      console.error(`[ProjectOverviewTabs] Failed to update ${tabKey} status:`, error);
    }
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  // Midnight blue color to match statusContentPanel
  const customColor = 'var(--bg-panel)';

  // Filter tabs if a specific list is provided
  const visibleTabs = tabs ? OVERVIEW_CONFIG.filter(tab => tabs.includes(tab.key)) : OVERVIEW_CONFIG;

  return (
    <div className={styles.statusTabsWrapper}>
      {/* Tabs Row */}
      <motion.div
        className={styles.statusTabsContainer}
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {visibleTabs.map((tab) => {
          const isSelected = selectedTab === tab.key;

          // Get tab status for tabs that map to API tabs
          const apiTabName = TAB_KEY_TO_API_NAME[tab.key];
          const tabStatus = apiTabName ? getStatus(apiTabName) : null;
          const status = tabStatus?.status || null;

          return (
            <StatusTabCard
              key={tab.key}
              label={tab.label}
              icon={tab.icon}
              count={0}
              change={0}
              color={tab.color}
              isSelected={isSelected}
              onClick={() => onTabChange(tab.key)}
              loading={loading}
              showMetrics={false}
              customColor={customColor}
              status={status}
              onStatusChange={apiTabName ? (newStatus, reason) => handleStatusChange(tab.key, newStatus, reason) : null}
              tabName={apiTabName}
            />
          );
        })}
      </motion.div>

      {/* Content Panel - connects to selected tab */}
      <div
        className={`${styles.statusContentPanel} ${
          visibleTabs.length > 0 && selectedTab === visibleTabs[0].key ? styles.statusContentPanelFirstTab :
          visibleTabs.length > 0 && selectedTab === visibleTabs[visibleTabs.length - 1].key ? styles.statusContentPanelLastTab :
          styles.statusContentPanelMiddleTab
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default ProjectOverviewTabs;
export { OVERVIEW_CONFIG };
