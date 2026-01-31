import React from 'react';
import { motion } from 'framer-motion';
import StatusTabCard from './StatusTabCard';
import styles from '../../styles/Dashboard.module.css';

// Status configuration based on completed_step values
const STATUS_CONFIG = [
  { key: 'all', label: 'All', color: 'var(--color-accent-indigo)', step: null },
  { key: 'sales', label: 'Sales', color: 'var(--status-sales)', step: 0 },
  { key: 'site_survey', label: 'Survey', color: 'var(--status-site-survey)', step: 1 },
  { key: 'design', label: 'Design', color: 'var(--status-design)', step: [2, 3] }, // Includes Design and Revisions
  { key: 'permits', label: 'Permits', color: 'var(--status-permits)', step: 4 },
  { key: 'install', label: 'Install', color: 'var(--status-install)', step: 5 },
  { key: 'commissioning', label: 'Commission', color: 'var(--status-commissioning)', step: 6 },
  { key: 'inspection', label: 'Inspect', color: 'var(--status-inspection)', step: 7 },
  { key: 'pto', label: 'PTO', color: 'var(--status-pto)', step: 8 },
];

/**
 * StatusTabs - File folder style status filter tabs
 *
 * @param {object} statusCounts - Object with count for each status
 * @param {object} statusChanges - Object with change from last month for each status
 * @param {string} selectedStatus - Currently selected status key
 * @param {function} onStatusChange - Callback when status changes
 * @param {boolean} loading - Loading state
 * @param {string} customColor - Custom background color for tabs and content panel
 * @param {node} children - Content panel that connects to selected tab
 */
const StatusTabs = ({
  statusCounts = {},
  statusChanges = {},
  selectedStatus = 'all',
  onStatusChange,
  loading = false,
  customColor,
  children
}) => {
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

  return (
    <div className={styles.statusTabsWrapper}>
      {/* Tabs Row */}
      <motion.div
        className={styles.statusTabsContainer}
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {STATUS_CONFIG.map((status) => {
          const isSelected = selectedStatus === status.key;
          const count = statusCounts[status.key] || 0;
          const change = statusChanges[status.key] || 0;

          return (
            <StatusTabCard
              key={status.key}
              label={status.label}
              count={count}
              change={change}
              color={status.color}
              isSelected={isSelected}
              onClick={() => onStatusChange(status.key)}
              loading={loading}
              customColor={customColor}
            />
          );
        })}
      </motion.div>

      {/* Content Panel - connects to selected tab */}
      <div
        className={`${styles.statusContentPanel} ${
          selectedStatus === 'all' ? styles.statusContentPanelFirstTab :
          selectedStatus === 'pto' ? styles.statusContentPanelLastTab :
          styles.statusContentPanelMiddleTab
        }`}
        style={{
          background: customColor || undefined
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default StatusTabs;
export { STATUS_CONFIG };
