import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as notificationService from '../../services/notificationService';
import { useSocket } from '../../hooks/useSocket';
import logger from '../../services/devLogger';
import styles from '../../styles/Chatter.module.css';

/**
 * NotificationBell - Bell icon with unread notification count and dropdown
 *
 * @param {function} onClick - Custom onClick handler
 */
const NotificationBell = ({ onClick }) => {
  const navigate = useNavigate();
  const { onNotification } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isNewNotification, setIsNewNotification] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data?.count || 0);
    } catch (error) {
      logger.error('NotificationBell', 'Failed to fetch unread count:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await notificationService.getNotifications(20);
      const notifs = response.data || [];

      setNotifications(notifs);
    } catch (error) {
      logger.error('NotificationBell', 'Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (showDropdown) {
      fetchNotifications();
    }
  }, [showDropdown, fetchNotifications]);

  // Real-time notification listener via Socket.io
  useEffect(() => {
    const unsubscribe = onNotification((notification) => {
      logger.log('NotificationBell', 'Received real-time notification:', notification);

      // Add to top of list
      setNotifications(prev => [{
        id: notification.id || Date.now(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt || new Date().toISOString(),
        isRead: false,
        projectUuid: notification.projectUuid,
        link: notification.link
      }, ...prev]);

      // Increment unread count
      setUnreadCount(prev => prev + 1);

      // Trigger pulse animation
      setIsNewNotification(true);
      setTimeout(() => setIsNewNotification(false), 2000);
    });

    return unsubscribe;
  }, [onNotification]);

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      logger.error('NotificationBell', 'Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      logger.error('NotificationBell', 'Failed to mark all as read:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      logger.error('NotificationBell', 'Failed to clear all notifications:', error);
    }
  };

  const handleClearNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await notificationService.clearNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // If the cleared notification was unread, decrement count
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      logger.error('NotificationBell', 'Failed to clear notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.isRead) {
      notificationService.markAsRead(notification.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Navigate based on notification type
    // For chat/mention notifications, navigate to project with chatter panel and specific message
    if (notification.type === 'chatter_mention' || notification.type === 'chatter_reply') {
      const projectUuid = notification.projectUuid || notification.project_uuid;
      const messageId = notification.messageId || notification.message_id;

      if (projectUuid) {
        // Navigate to project with chatter panel query param to open chatter
        // and messageId to scroll to specific message
        const queryParams = new URLSearchParams({
          openChatter: 'true',
          messageId: messageId || ''
        });
        navigate(`/project/${projectUuid}?${queryParams.toString()}`);
      }
    } else if (notification.link) {
      navigate(notification.link);
    } else if (notification.projectUuid || notification.project_uuid) {
      navigate(`/project/${notification.projectUuid || notification.project_uuid}`);
    }

    setShowDropdown(false);
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  const stripHtmlTags = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

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

  return (
    <div className={styles.notificationBellWrapper}>
      <button
        className={styles.notificationBell}
        onClick={handleClick}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={`${styles.notificationBadge} ${isNewNotification ? styles.notificationBadgePulse : ''}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={styles.notificationDropdown}
          >
            <div className={styles.notificationDropdownHeader}>
              <h3 className={styles.notificationDropdownTitle}>Notifications</h3>
              <div className={styles.notificationHeaderActions}>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllAsRead} className={styles.markAllRead}>
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={handleClearAll} className={styles.clearAllBtn}>
                    <Trash2 size={14} />
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className={styles.notificationDropdownContent}>
              {loading ? (
                <div className={styles.notificationLoading}>Loading...</div>
              ) : notifications.length === 0 ? (
                <div className={styles.notificationEmptyState}>
                  No notifications
                </div>
              ) : (
                notifications.map(notification => {
                  // Extract metadata with multiple fallbacks for field naming
                  const senderName = notification.senderName ||
                                    notification.sender_name ||
                                    notification.sender?.name ||
                                    notification.sender?.firstName + ' ' + notification.sender?.lastName ||
                                    notification.from_user_name ||
                                    notification.fromUserName;

                  const companyName = notification.companyName ||
                                     notification.company_name ||
                                     notification.company?.name ||
                                     notification.sender?.company?.name;

                  const projectId = notification.projectId ||
                                   notification.project_id ||
                                   notification.installer_project_id ||
                                   notification.installerProjectId ||
                                   notification.project?.installer_project_id;

                  return (
                    <div
                      key={notification.id}
                      className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className={styles.notificationContent}>
                        <p className={styles.notificationMessage}>
                          {stripHtmlTags(notification.message)}
                        </p>
                        <div className={styles.notificationMeta}>
                          {senderName && senderName !== 'undefined undefined' && senderName !== 'Unknown' && (
                            <span className={styles.notificationSender}>
                              From: {senderName}
                            </span>
                          )}
                          {companyName && companyName !== 'undefined' && (
                            <span className={styles.notificationCompany}>
                              {companyName}
                            </span>
                          )}
                          {projectId && projectId !== 'undefined' && (
                            <span className={styles.notificationProject}>
                              Project #{projectId}
                            </span>
                          )}
                        </div>
                        <span className={styles.notificationTime}>
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <div className={styles.notificationActions}>
                        {!notification.isRead && (
                          <button
                            className={styles.notificationMarkRead}
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          className={styles.notificationClearBtn}
                          onClick={(e) => handleClearNotification(notification.id, e)}
                          title="Clear notification"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
