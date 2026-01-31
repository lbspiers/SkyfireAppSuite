import React, { useState, useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';
import UserAvatar from './UserAvatar';
import styles from '../../styles/Chatter.module.css';

/**
 * SeenByIndicator - Shows eye icon with viewer count and tooltip
 *
 * @param {string} threadUuid - Thread to show read receipts for
 * @param {number} totalViews - Count of viewers
 * @param {array} viewers - List of viewer objects { uuid, firstName, lastName, readAt }
 * @param {function} onFetchReceipts - Called to load receipts on hover
 * @param {boolean} isAuthor - If current user is thread author
 */
const SeenByIndicator = ({
  threadUuid,
  totalViews = 0,
  viewers = [],
  onFetchReceipts,
  isAuthor = false
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  const handleMouseEnter = async () => {
    // Clear any pending hide
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Fetch receipts if not already fetched
    if (!hasFetched && onFetchReceipts) {
      setIsLoading(true);
      await onFetchReceipts(threadUuid);
      setIsLoading(false);
      setHasFetched(true);
    }

    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    // Delay hiding tooltip so user can move to it
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 200);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Format relative time for "read at"
  const formatReadTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={styles.seenByIndicator}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Eye size={14} className={styles.seenByIcon} />
      <span className={styles.seenByCount}>{totalViews}</span>

      {showTooltip && (
        <div
          ref={tooltipRef}
          className={styles.seenByTooltip}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        >
          <div className={styles.seenByTooltipHeader}>
            Seen by {totalViews} {totalViews === 1 ? 'person' : 'people'}
          </div>

          {isLoading ? (
            <div className={styles.seenByLoading}>Loading...</div>
          ) : viewers.length > 0 ? (
            <div className={styles.seenByList}>
              {viewers.slice(0, 10).map((viewer) => (
                <div key={viewer.uuid} className={styles.seenByViewer}>
                  <UserAvatar user={viewer} size="xs" />
                  <div className={styles.seenByViewerInfo}>
                    <span className={styles.seenByViewerName}>
                      {viewer.firstName} {viewer.lastName}
                    </span>
                    <span className={styles.seenByViewerTime}>
                      {formatReadTime(viewer.readAt)}
                    </span>
                  </div>
                </div>
              ))}
              {viewers.length > 10 && (
                <div className={styles.seenByMore}>
                  +{viewers.length - 10} more
                </div>
              )}
            </div>
          ) : (
            <div className={styles.seenByEmpty}>No one has seen this yet</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SeenByIndicator;
