import React, { useState } from 'react';
import { toast } from 'react-toastify';
import styles from './AdminQueueList.module.css';

/**
 * Admin queue list with reordering
 * @param {Object} props
 * @param {Array} props.queue - Queue items
 * @param {Function} props.onToggleUrgent - Toggle urgent handler
 * @param {Function} props.onReorder - Reorder handler
 * @param {Function} props.onRemove - Remove handler
 */
const AdminQueueList = ({ queue = [], onToggleUrgent, onReorder, onRemove }) => {
  const [togglingUrgent, setTogglingUrgent] = useState({});

  const formatWaitTime = (createdAt) => {
    if (!createdAt) return 'N/A';

    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const handleToggleUrgent = async (item) => {
    setTogglingUrgent(prev => ({ ...prev, [item.uuid]: true }));

    try {
      const newUrgentStatus = !item.isUrgent;
      await onToggleUrgent(item.uuid, newUrgentStatus);

      if (newUrgentStatus) {
        toast.success('Project marked as urgent');
      } else {
        toast.info('Urgent status removed');
      }
    } catch (error) {
      toast.error('Failed to update urgent status');
    } finally {
      setTogglingUrgent(prev => ({ ...prev, [item.uuid]: false }));
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;

    const newOrder = [...queue];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];

    try {
      await onReorder(newOrder.map(item => item.uuid));
      toast.success('Queue reordered');
    } catch (error) {
      toast.error('Failed to reorder queue');
    }
  };

  const handleMoveDown = async (index) => {
    if (index === queue.length - 1) return;

    const newOrder = [...queue];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];

    try {
      await onReorder(newOrder.map(item => item.uuid));
      toast.success('Queue reordered');
    } catch (error) {
      toast.error('Failed to reorder queue');
    }
  };

  const handleRemove = async (item) => {
    if (!window.confirm(`Remove "${item.projectAddress}" from queue?`)) {
      return;
    }

    try {
      await onRemove(item.uuid);
      toast.success('Removed from queue');
    } catch (error) {
      toast.error('Failed to remove from queue');
    }
  };

  if (queue.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No projects in queue</p>
      </div>
    );
  }

  return (
    <div className={styles.queueList}>
      {queue.map((item, index) => (
        <div
          key={item.uuid}
          className={`${styles.queueItem} ${item.isUrgent ? styles.urgent : ''}`}
        >
          <div className={styles.position}>#{index + 1}</div>

          <div className={styles.info}>
            <div className={styles.address}>
              {item.isUrgent && <span className={styles.urgentIcon}>🔥</span>}
              {item.projectAddress || 'Unknown Address'}
            </div>
            <div className={styles.customer}>{item.customerName || 'Unknown Customer'}</div>
            <div className={styles.waitTime}>{formatWaitTime(item.createdAt)}</div>
          </div>

          <div className={styles.actions}>
            <label className={styles.urgentToggle}>
              <input
                type="checkbox"
                checked={item.isUrgent || false}
                onChange={() => handleToggleUrgent(item)}
                disabled={togglingUrgent[item.uuid]}
                className={styles.urgentCheckbox}
              />
              <span className={styles.urgentLabel}>
                {togglingUrgent[item.uuid] ? 'Updating...' : 'Urgent'}
              </span>
            </label>

            <div className={styles.moveButtons}>
              <button
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className={styles.moveButton}
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => handleMoveDown(index)}
                disabled={index === queue.length - 1}
                className={styles.moveButton}
                title="Move down"
              >
                ↓
              </button>
            </div>

            <button
              onClick={() => handleRemove(item)}
              className={styles.removeButton}
              title="Remove from queue"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminQueueList;
