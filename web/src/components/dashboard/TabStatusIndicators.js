import React from 'react';
import styles from './TabStatusIndicators.module.css';
import { getStatusConfig } from '../../constants/tabStatusConfig';

/**
 * TabStatusIndicators - Display compact tab status dots for dashboard
 * Shows status dots for Survey, Site Plan, Plan Set, and Revisions tabs
 *
 * @param {Object|Array} tabStatuses - Tab status objects from API
 *   - Object format: { survey: {...}, site_plan: {...}, plan_set: {...}, revisions: {...} }
 *   - Array format (legacy): [{ tab_name: 'survey', ... }, ...]
 * @param {boolean} showLabels - Show tab labels (default: false, only dots)
 *
 * Status colors:
 * - Gray: pending/none
 * - Blue: draft
 * - Green: complete
 * - Orange: needs_attention
 */
const TabStatusIndicators = ({ tabStatuses = {}, showLabels = false }) => {
  // Map tab names to display info
  const TAB_CONFIG = [
    { name: 'survey', label: 'S', fullLabel: 'Survey' },
    { name: 'site_plan', label: 'SP', fullLabel: 'Site Plan' },
    { name: 'plan_set', label: 'PS', fullLabel: 'Plan Set' },
    { name: 'revisions', label: 'R', fullLabel: 'Revisions' },
  ];

  // Get color and label from config
  const getColor = (status) => {
    const config = getStatusConfig(status);
    return config.hex;
  };

  const getLabel = (status) => {
    const config = getStatusConfig(status);
    return config.label;
  };

  // Handle both object and array formats
  let statusMap = {};
  if (Array.isArray(tabStatuses)) {
    // Legacy array format: [{ tab_name: 'survey', status: 'complete' }, ...]
    tabStatuses.forEach(ts => {
      statusMap[ts.tab_name] = ts;
    });
  } else {
    // New object format: { survey: { tab_name: 'survey', status: 'complete' }, ... }
    statusMap = tabStatuses;
  }

  // Check if any statuses exist
  const hasAnyStatus = TAB_CONFIG.some(tab => statusMap[tab.name]);
  if (!hasAnyStatus) {
    return <span className={styles.noStatus}>-</span>;
  }

  // Only show tabs that have needs_attention status (or show all if none need attention)
  const hasNeedsAttention = TAB_CONFIG.some(tab => statusMap[tab.name]?.status === 'needs_attention');
  const visibleTabs = hasNeedsAttention
    ? TAB_CONFIG.filter(tab => statusMap[tab.name]?.status === 'needs_attention')
    : TAB_CONFIG.filter(tab => statusMap[tab.name]); // Only show tabs with status data

  return (
    <div className={styles.container}>
      {visibleTabs.map(tab => {
        const tabStatus = statusMap[tab.name];
        const status = tabStatus?.status || 'none';
        const color = getColor(status);
        const reason = tabStatus?.status_reason;

        // Build tooltip
        const statusLabel = getLabel(status);
        let title = `${tab.fullLabel}: ${statusLabel}`;
        if (reason) {
          title += ` - ${reason}`;
        }

        return (
          <div key={tab.name} className={styles.indicator} title={title}>
            <span
              className={styles.dot}
              style={{ backgroundColor: color }}
            />
            {showLabels && (
              <span className={styles.label}>{tab.label}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TabStatusIndicators;
