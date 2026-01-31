import React from 'react';
import styles from './PowerClerkPanel.module.css';

/**
 * PowerClerkPanel - PowerClerk integration panel
 * Phase 1: Coming Soon placeholder
 */
const PowerClerkPanel = ({ projectUuid, projectData }) => {
  return (
    <div className={styles.powerClerkPanel}>
      <div className={styles.comingSoon}>
        <div className={styles.comingSoonIcon}>⚡</div>
        <h2 className={styles.comingSoonTitle}>PowerClerk Integration</h2>
        <p className={styles.comingSoonText}>
          PowerClerk permit tracking and management integration coming soon.
        </p>
        <p className={styles.comingSoonHint}>
          This feature will allow seamless synchronization with PowerClerk for permit
          status updates, document management, and automated workflows.
        </p>
      </div>
    </div>
  );
};

export default PowerClerkPanel;
