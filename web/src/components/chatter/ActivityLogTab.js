import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, Edit, UserPlus, Plus, Upload, MessageSquare,
  Filter, ChevronDown, Loader, Clock, Activity
} from 'lucide-react';
import UserAvatar from './UserAvatar';
import * as chatterService from '../../services/chatterService';
import styles from '../../styles/Chatter.module.css';

/**
 * ActivityLogTab - Timeline of project changes
 *
 * @param {string} projectUuid - Project UUID
 */
const ActivityLogTab = ({ projectUuid }) => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const LIMIT = 30;

  // Action type configuration
  const actionConfig = {
    status_changed: {
      icon: ArrowRight,
      color: '#0EA5E9',
      bgColor: 'rgba(14, 165, 233, 0.1)',
      label: 'Status Change'
    },
    field_updated: {
      icon: Edit,
      color: 'var(--color-primary)',
      bgColor: 'rgba(253, 115, 50, 0.1)',
      label: 'Field Update'
    },
    assignment_changed: {
      icon: UserPlus,
      color: '#A855F7',
      bgColor: 'rgba(168, 85, 247, 0.1)',
      label: 'Assignment'
    },
    created: {
      icon: Plus,
      color: '#22C55E',
      bgColor: 'rgba(34, 197, 94, 0.1)',
      label: 'Created'
    },
    file_uploaded: {
      icon: Upload,
      color: '#06B6D4',
      bgColor: 'rgba(6, 182, 212, 0.1)',
      label: 'File Upload'
    },
    note_added: {
      icon: MessageSquare,
      color: 'var(--text-muted)',
      bgColor: 'var(--bg-tertiary)',
      label: 'Note Added'
    },
  };

  const getActionConfig = (actionType) => {
    return actionConfig[actionType] || {
      icon: Activity,
      color: 'var(--text-muted)',
      bgColor: 'var(--bg-tertiary)',
      label: 'Activity'
    };
  };

  // Fetch activities
  const fetchActivities = useCallback(async (reset = false) => {
    setIsLoading(true);
    try {
      const newOffset = reset ? 0 : offset;
      const data = await chatterService.getProjectActivity(projectUuid, {
        limit: LIMIT,
        offset: newOffset,
        actionType: filter === 'all' ? undefined : filter
      });

      if (reset) {
        setActivities(data.activities || []);
        setOffset(LIMIT);
      } else {
        setActivities(prev => [...prev, ...(data.activities || [])]);
        setOffset(prev => prev + LIMIT);
      }

      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectUuid, filter, offset]);

  // Initial load and filter change
  useEffect(() => {
    fetchActivities(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectUuid, filter]);

  // Format relative time
  const formatTime = (dateString) => {
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

  // Format full date for tooltip
  const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Group activities by date
  const groupActivitiesByDate = (activities) => {
    const groups = {};
    activities.forEach(activity => {
      const date = new Date(activity.createdAt);
      const dateKey = date.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = {
          label: getDateLabel(date),
          activities: []
        };
      }
      groups[dateKey].activities.push(activity);
    });
    return Object.values(groups);
  };

  // Get date label (Today, Yesterday, or date)
  const getDateLabel = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const filterOptions = [
    { value: 'all', label: 'All Activity' },
    { value: 'status_changed', label: 'Status Changes' },
    { value: 'field_updated', label: 'Field Updates' },
    { value: 'assignment_changed', label: 'Assignments' },
    { value: 'file_uploaded', label: 'File Uploads' },
  ];

  const groupedActivities = groupActivitiesByDate(activities);

  return (
    <div className={styles.activityTab}>
      {/* Header with filters */}
      <div className={styles.activityHeader}>
        <div className={styles.activityTitle}>
          <Activity size={18} />
          <span>{total} activit{total !== 1 ? 'ies' : 'y'}</span>
        </div>
        <div className={styles.activityControls}>
          {/* Filter dropdown */}
          <div className={styles.filterDropdown}>
            <button
              className={styles.filterBtn}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <Filter size={16} />
              <span>{filterOptions.find(f => f.value === filter)?.label}</span>
              <ChevronDown size={14} />
            </button>
            {showFilterMenu && (
              <div className={styles.filterMenu}>
                {filterOptions.map(option => (
                  <button
                    key={option.value}
                    className={`${styles.filterMenuItem} ${filter === option.value ? styles.filterMenuItemActive : ''}`}
                    onClick={() => {
                      setFilter(option.value);
                      setShowFilterMenu(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity content */}
      {isLoading && activities.length === 0 ? (
        <div className={styles.activityLoading}>
          <Loader size={24} className={styles.activityLoadingSpinner} />
          <span>Loading activity...</span>
        </div>
      ) : activities.length === 0 ? (
        <div className={styles.activityEmpty}>
          <Clock size={48} />
          <span>No activity recorded yet</span>
          <p>Changes to this project will appear here</p>
        </div>
      ) : (
        <div className={styles.activityTimeline}>
          {groupedActivities.map((group, groupIndex) => (
            <div key={groupIndex} className={styles.activityGroup}>
              <div className={styles.activityDateHeader}>
                {group.label}
              </div>
              <div className={styles.activityList}>
                {group.activities.map((activity, index) => {
                  const config = getActionConfig(activity.actionType);
                  const IconComponent = config.icon;

                  return (
                    <motion.div
                      key={activity.uuid}
                      className={styles.activityItem}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.02 }}
                    >
                      {/* Timeline connector */}
                      <div className={styles.activityConnector}>
                        <div
                          className={styles.activityIcon}
                          style={{ // eslint-disable-line react/forbid-dom-props
                            backgroundColor: config.bgColor,
                            color: config.color
                          }}
                        >
                          <IconComponent size={14} />
                        </div>
                        {index < group.activities.length - 1 && (
                          <div className={styles.activityLine} />
                        )}
                      </div>

                      {/* Activity content */}
                      <div className={styles.activityContent}>
                        <div className={styles.activityMain}>
                          <span className={styles.activityDescription}>
                            {activity.description}
                          </span>
                        </div>

                        {/* Show old → new value for field changes */}
                        {activity.oldValue && activity.newValue && (
                          <div className={styles.activityChange}>
                            <span className={styles.activityOldValue}>{activity.oldValue}</span>
                            <ArrowRight size={12} />
                            <span className={styles.activityNewValue}>{activity.newValue}</span>
                          </div>
                        )}

                        <div className={styles.activityMeta}>
                          {activity.user && (
                            <>
                              <UserAvatar user={activity.user} size="xs" />
                              <span className={styles.activityUser}>
                                {activity.user.firstName} {activity.user.lastName}
                              </span>
                            </>
                          )}
                          <span
                            className={styles.activityTime}
                            title={formatFullDate(activity.createdAt)}
                          >
                            {formatTime(activity.createdAt)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div className={styles.activityLoadMore}>
              <button
                className={styles.activityLoadMoreBtn}
                onClick={() => fetchActivities(false)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader size={16} className={styles.activityLoadingSpinner} />
                    Loading...
                  </>
                ) : (
                  `Load more (${total - activities.length} remaining)`
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityLogTab;
