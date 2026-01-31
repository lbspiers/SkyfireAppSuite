import React, { useState } from 'react';
import { EquipmentRow, StatusBadge, Button } from '../ui';
import styles from './RevisionRequestList.module.css';

const DocumentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

/**
 * RevisionRequestList - Expandable list of submitted revision requests
 *
 * @param {Array} revisions - Array of revision objects
 * @param {function} onViewDocument - Callback to view document: (revision) => {}
 * @param {string} emptyMessage - Message when no revisions
 */
const RevisionRequestList = ({
  revisions = [],
  onViewDocument,
  emptyMessage = 'No revision requests submitted yet'
}) => {
  const [expandedId, setExpandedId] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'complete':
      case 'completed':
        return 'completed';
      case 'in_progress':
      case 'in-progress':
        return 'in-progress';
      case 'pending':
      default:
        return 'pending';
    }
  };

  if (revisions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📋</div>
        <div className={styles.emptyText}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={styles.revisionList}>
      <div className={styles.listHeader}>
        <h3 className={styles.listTitle}>Submitted Revisions</h3>
        <span className={styles.listCount}>{revisions.length} total</span>
      </div>

      <div className={styles.listItems}>
        {revisions.map((revision) => {
          const isExpanded = expandedId === revision.id;

          return (
            <EquipmentRow
              key={revision.id}
              title={`Revision #${revision.id?.slice(-6) || '------'}`}
              subtitle={formatDate(revision.createdAt)}
              expanded={isExpanded}
              onToggle={() => setExpandedId(isExpanded ? null : revision.id)}
              badge={<StatusBadge status={getStatusVariant(revision.status)} size="sm" />}
            >
              <div className={styles.revisionDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Status</span>
                  <StatusBadge status={getStatusVariant(revision.status)} />
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Submitted</span>
                  <span className={styles.detailValue}>{formatDate(revision.createdAt)}</span>
                </div>

                {revision.reviewerName && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Reviewer</span>
                    <span className={styles.detailValue}>{revision.reviewerName}</span>
                  </div>
                )}

                {revision.reviewerEmail && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Email</span>
                    <span className={styles.detailValue}>
                      <a href={`mailto:${revision.reviewerEmail}`} className={styles.link}>
                        {revision.reviewerEmail}
                      </a>
                    </span>
                  </div>
                )}

                {revision.reviewerPhone && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Phone</span>
                    <span className={styles.detailValue}>
                      <a href={`tel:${revision.reviewerPhone}`} className={styles.link}>
                        {revision.reviewerPhone}
                      </a>
                    </span>
                  </div>
                )}

                {revision.userNotes && (
                  <div className={styles.notesSection}>
                    <span className={styles.detailLabel}>Notes</span>
                    <div className={styles.notesContent}>{revision.userNotes}</div>
                  </div>
                )}

                <div className={styles.documentSection}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onViewDocument?.(revision)}
                  >
                    <DocumentIcon />
                    <span>View Document</span>
                  </Button>
                </div>

                {revision.status === 'complete' && revision.completedAt && (
                  <div className={styles.completedInfo}>
                    <span className={styles.completedLabel}>Resolved</span>
                    <span className={styles.completedDate}>{formatDate(revision.completedAt)}</span>
                  </div>
                )}
              </div>
            </EquipmentRow>
          );
        })}
      </div>
    </div>
  );
};

export default RevisionRequestList;
