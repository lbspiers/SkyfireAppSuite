import React from 'react';
import {
  Sun,
  Zap,
  ClipboardCheck,
  MessageCircle
} from 'lucide-react';
import { RoofSimpleIcon } from '../../assets/icons/CustomIcons';
import ProjectPanelTabs from '../common/ProjectPanelTabs';

// Tab configuration for project details
const STATUS_CONFIG = [
  { key: 'overview', label: 'Overview', color: 'var(--color-info)', step: null, icon: null },
  { key: 'checklist', label: 'Checklist', color: 'var(--color-success)', step: null, icon: null },
  { key: 'tasks', label: 'Tasks', color: 'var(--color-warning)', step: null, icon: null },
  { key: 'equipment', label: 'System', color: 'var(--color-primary)', step: null, icon: <Sun size={16} /> },
  { key: 'electrical', label: 'Electrical', color: 'var(--status-commissioning)', step: null, icon: <Zap size={16} /> },
  { key: 'structural', label: 'Structural', color: 'var(--status-permits)', step: null, icon: <RoofSimpleIcon size={16} /> },
  { key: 'submit', label: 'Review', color: 'var(--status-site-survey)', step: null, icon: <ClipboardCheck size={16} /> },
  { key: 'chat', label: 'Chat', color: '#8B5CF6', step: null, icon: <MessageCircle size={16} /> },
];

/**
 * ProjectDetailsTabs - File folder style status filter tabs for project details
 * Now uses shared ProjectPanelTabs component
 *
 * @param {object} statusCounts - Object with count for each status (unused, kept for API compatibility)
 * @param {object} statusChanges - Object with change from last month for each status (unused, kept for API compatibility)
 * @param {string} selectedStatus - Currently selected status key
 * @param {function} onStatusChange - Callback when status changes
 * @param {boolean} loading - Loading state (unused, kept for API compatibility)
 * @param {node} children - Content panel that connects to selected tab
 * @param {Array<string>} tabKeys - Optional array of tab keys to display. If not provided, shows all tabs.
 */
const ProjectDetailsTabs = ({
  statusCounts = {},
  statusChanges = {},
  selectedStatus = 'overview',
  onStatusChange,
  loading = false,
  children,
  tabKeys = null
}) => {
  // Filter tabs if specific keys are provided
  const visibleTabs = tabKeys ? STATUS_CONFIG.filter(tab => tabKeys.includes(tab.key)) : STATUS_CONFIG;

  return (
    <ProjectPanelTabs
      tabs={visibleTabs}
      selectedTab={selectedStatus}
      onTabChange={onStatusChange}
    >
      {children}
    </ProjectPanelTabs>
  );
};

export default ProjectDetailsTabs;
export { STATUS_CONFIG };
