/**
 * Notification Service - Handles notification CRUD and real-time updates
 */
import axios from '../config/axios';

/**
 * Get notifications for current user
 * @param {number} limit - Maximum number of notifications to fetch
 * @param {boolean} unreadOnly - If true, only fetch unread notifications
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: Notification[] }
 */
export const getNotifications = async (limit = 20, unreadOnly = false) => {
  try {
    const params = { limit, unreadOnly };
    const response = await axios.get('/notify/user', { params });
    return response.data;
  } catch (error) {
    console.error('[NotificationService] Error fetching notifications:', error);
    throw new Error(error?.response?.data?.message || 'Unable to load notifications');
  }
};

/**
 * Get unread notification count
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: { count: number } }
 */
export const getUnreadCount = async () => {
  try {
    const response = await axios.get('/notify/unread-count');
    return response.data;
  } catch (error) {
    console.error('[NotificationService] Error fetching unread count:', error);
    return { data: { count: 0 } };
  }
};

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: Notification }
 */
export const markAsRead = async (notificationId) => {
  try {
    const response = await axios.put(`/notify/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('[NotificationService] Error marking as read:', error);
    throw new Error(error?.response?.data?.message || 'Unable to update notification');
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} - { status: 'SUCCESS', message: string }
 */
export const markAllAsRead = async () => {
  try {
    const response = await axios.put('/notify/read-all');
    return response.data;
  } catch (error) {
    console.error('[NotificationService] Error marking all as read:', error);
    throw new Error(error?.response?.data?.message || 'Unable to update notifications');
  }
};

/**
 * Delete a notification
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} - { status: 'SUCCESS', message: string }
 */
export const deleteNotification = async (notificationId) => {
  try {
    const response = await axios.delete(`/notify/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('[NotificationService] Error deleting notification:', error);
    throw new Error(error?.response?.data?.message || 'Unable to delete notification');
  }
};

/**
 * Clear (delete) a single notification
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} - { status: 'SUCCESS', message: string }
 */
export const clearNotification = async (notificationId) => {
  return deleteNotification(notificationId);
};

/**
 * Clear (delete) all notifications for the current user
 * @returns {Promise<Object>} - { status: 'SUCCESS', message: string }
 */
export const clearAllNotifications = async () => {
  try {
    const response = await axios.delete('/notify/clear-all');
    return response.data;
  } catch (error) {
    console.error('[NotificationService] Error clearing all notifications:', error);
    throw new Error(error?.response?.data?.message || 'Unable to clear notifications');
  }
};

/**
 * Send a notification (admin/internal use)
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.userUuid - Target user UUID
 * @param {string} notificationData.message - Notification message
 * @param {string} [notificationData.projectUuid] - Related project UUID
 * @param {string} [notificationData.link] - Direct link to navigate to
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: Notification }
 */
export const sendNotification = async (notificationData) => {
  try {
    const response = await axios.post('/notify/send', notificationData);
    return response.data;
  } catch (error) {
    console.error('[NotificationService] Error sending notification:', error);
    throw new Error(error?.response?.data?.message || 'Unable to send notification');
  }
};
