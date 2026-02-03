import React, { useState } from 'react';
import CompactTabs from '../common/CompactTabs';
import AHJRevisionsPanel from './AHJRevisionsPanel';
import UtilityRevisionsPanel from './UtilityRevisionsPanel';
import SupportTicketsPanel from './SupportTicketsPanel';
import ComingSoon from '../common/ComingSoon';
import styles from './RevisionsPanel.module.css';

// Feature flag - set to true to enable Revisions panel, false to show Coming Soon
const REVISIONS_ENABLED = true;

/**
 * RevisionsPanel - Main revisions container with AHJ/Utility/Support sub-tabs
 *
 * @param {string} projectUuid - Project UUID
 * @param {object} projectData - Project data for context
 */
const RevisionsPanel = ({ projectUuid, projectData }) => {
  const [activeSubTab, setActiveSubTab] = useState('ahj');

  // Show Coming Soon overlay if feature is disabled
  if (!REVISIONS_ENABLED) {
    return (
      <div className={styles.comingSoonOverlay}>
        <ComingSoon
          feature="Revisions Panel"
          description="The Revisions panel is currently under development. Track AHJ revisions, utility revisions, and support tickets all in one place."
        />
      </div>
    );
  }

  const subTabs = [
    { id: 'ahj', label: 'AHJ Revisions' },
    { id: 'utility', label: 'Utility Revisions' },
    { id: 'support', label: 'Support Tickets' },
  ];

  const tabContent = {
    ahj: (
      <AHJRevisionsPanel
        projectUuid={projectUuid}
        projectData={projectData}
      />
    ),
    utility: (
      <UtilityRevisionsPanel
        projectUuid={projectUuid}
        projectData={projectData}
      />
    ),
    support: (
      <SupportTicketsPanel
        projectUuid={projectUuid}
        projectData={projectData}
      />
    ),
  };

  return (
    <div className={styles.revisionsPanel}>
      <CompactTabs
        tabs={subTabs}
        defaultTab="ahj"
        activeTab={activeSubTab}
        onTabChange={setActiveSubTab}
        tabContent={tabContent}
        storageKey={`revisions-subtab-${projectUuid}`}
      />
    </div>
  );
};

export default RevisionsPanel;
