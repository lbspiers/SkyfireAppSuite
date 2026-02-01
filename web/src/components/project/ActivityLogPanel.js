import React, { useRef, useEffect } from 'react';
import { useActivityLog } from '../../hooks/useActivityLog';
import ComingSoon from '../common/ComingSoon';
import styles from './ActivityLogPanel.module.css';

// Feature flag - set to true to enable Activity Log, false to show Coming Soon
const ACTIVITY_LOG_ENABLED = false;

/**
 * Format relative time (e.g., "2m ago", "3h ago", "Jan 31, 2:45 PM")
 */
function formatRelativeTime(dateStr) {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

/**
 * ActivityLogPanel - Simple activity log list
 */
const ActivityLogPanel = ({ projectUuid }) => {
  const { logs, loading, loadingMore, error, hasMore, loadMore, refresh } = useActivityLog(projectUuid);
  const scrollContainerRef = useRef(null);
  const loadMoreTriggerRef = useRef(null);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreTriggerRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreTriggerRef.current);

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  // Show Coming Soon if feature is disabled
  if (!ACTIVITY_LOG_ENABLED) {
    return (
      <ComingSoon
        feature="Activity Log"
        description="Track all changes made to your project in real-time. See who made what changes and when."
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Loading activity...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <span>Error: {error}</span>
          <button className={styles.retryButton} onClick={refresh}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!logs || logs.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <span>No activity yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Activity Log</h2>
          <span className={styles.count}>{logs.length}</span>
        </div>
      </div>

      <div className={styles.listContainer} ref={scrollContainerRef}>
        {logs.map((log) => {
          const fieldLabel = log.fieldLabel || log.field_label || log.fieldName || log.field_name;
          const oldValue = log.oldValueDisplay || log.old_value_display || log.oldValue || log.old_value;
          const newValue = log.newValueDisplay || log.new_value_display || log.newValue || log.new_value;
          const createdAt = log.createdAt || log.created_at;
          const userName = log.user?.firstName || 'System';

          return (
            <div key={log.uuid} className={styles.logRow}>
              <span className={styles.fieldName}>{fieldLabel}</span>
              <span className={styles.change}>
                {oldValue && <span className={styles.oldValue}>{oldValue}</span>}
                {oldValue && newValue && <span className={styles.arrow}>→</span>}
                {newValue && <span className={styles.newValue}>{newValue}</span>}
              </span>
              <span className={styles.time}>{formatRelativeTime(createdAt)}</span>
              <span className={styles.user}>{userName}</span>
            </div>
          );
        })}

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div ref={loadMoreTriggerRef} className={styles.loadMoreTrigger}>
            {loadingMore && (
              <div className={styles.loadingMore}>
                <div className={styles.spinner} />
                <span>Loading more...</span>
              </div>
            )}
          </div>
        )}

        {!hasMore && logs.length > 0 && (
          <div className={styles.noMore}>End of activity log</div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogPanel;
