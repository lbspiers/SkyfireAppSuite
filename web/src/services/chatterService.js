/**
 * Chatter API Service
 * Connects to /api/chatter endpoints
 */
import axios from '../config/axios';

// ============================================================================
// TRANSFORM HELPERS
// ============================================================================

const transformReply = (backendReply) => ({
  id: backendReply.uuid,
  user: backendReply.author,
  content: backendReply.content,
  mentions: backendReply.mentions || [],
  reactions: (backendReply.reactions || []).map(r => ({
    emoji: r.emoji,
    users: r.users || []
  })),
  attachments: backendReply.attachments || [],
  createdAt: backendReply.createdAt
});

const transformThread = (backendThread) => ({
  id: backendThread.uuid,
  projectUuid: backendThread.projectUuid,
  user: backendThread.author,
  content: backendThread.content,
  mentions: backendThread.mentions || [],
  reactions: (backendThread.reactions || []).map(r => ({
    emoji: r.emoji,
    users: r.users || []
  })),
  replies: (backendThread.replies || []).map(transformReply),
  attachments: backendThread.attachments || [],
  createdAt: backendThread.createdAt,
  isEdited: backendThread.isEdited || false
});

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get all threads for a project
 */
export const getProjectNotes = async (projectUuid) => {
  try {
    const response = await axios.get(`/api/chatter/project/${projectUuid}/threads`);
    const threads = response.data.data || response.data || [];
    return threads.map(transformThread);
  } catch (error) {
    console.error('[Chatter] Failed to fetch threads:', error);
    throw error;
  }
};

/**
 * Create a new thread
 */
export const createNote = async (projectUuid, content, mentions = [], attachments = []) => {
  try {
    // Extract just UUIDs from mention objects
    const mentionUuids = mentions.map(m => m.uuid);

    const response = await axios.post(`/api/chatter/project/${projectUuid}/threads`, {
      content,
      mentions: mentionUuids,
      attachments
    });

    const thread = response.data.data || response.data;
    return transformThread(thread);
  } catch (error) {
    console.error('[Chatter] Failed to create thread:', error);
    throw error;
  }
};

/**
 * Create a reply to a thread
 */
export const createReply = async (threadId, content, mentions = [], attachments = []) => {
  try {
    const mentionUuids = mentions.map(m => m.uuid);

    const response = await axios.post(`/api/chatter/threads/${threadId}/replies`, {
      content,
      mentions: mentionUuids,
      attachments
    });

    const reply = response.data.data || response.data;
    return transformReply(reply);
  } catch (error) {
    console.error('[Chatter] Failed to create reply:', error);
    throw error;
  }
};

/**
 * Get company users for @mention autocomplete
 */
export const getCompanyUsers = async (companyUuid, searchTerm = '') => {
  try {
    const params = new URLSearchParams();
    if (searchTerm) params.append('q', searchTerm);
    if (companyUuid) params.append('companyId', companyUuid);
    params.append('limit', '20');

    const url = `/api/chatter/users/search?${params}`;
    console.log('[chatterService] Fetching users:', url);

    const response = await axios.get(url);
    console.log('[chatterService] Users response:', response.data);

    return response.data.data || response.data || [];
  } catch (error) {
    console.error('[chatterService] Failed to search users:', error);
    return [];
  }
};

/**
 * Get unread notification count
 */
export const getUnreadNotifications = async () => {
  try {
    const response = await axios.get('/api/chatter/notifications/unread-count');
    return response.data.data || { count: 0 };
  } catch (error) {
    console.error('[Chatter] Failed to get notification count:', error);
    return { count: 0 };
  }
};

/**
 * Toggle reaction on a thread (add/remove)
 */
export const addReaction = async (threadId, emoji) => {
  try {
    const response = await axios.post(`/api/chatter/threads/${threadId}/reactions`, {
      emoji
    });
    return response.data.data || { success: true };
  } catch (error) {
    console.error('[Chatter] Failed to toggle reaction:', error);
    throw error;
  }
};

/**
 * Toggle reaction on a reply
 */
export const addReplyReaction = async (replyId, emoji) => {
  try {
    const response = await axios.post(`/api/chatter/replies/${replyId}/reactions`, {
      emoji
    });
    return response.data.data || { success: true };
  } catch (error) {
    console.error('[Chatter] Failed to toggle reply reaction:', error);
    throw error;
  }
};

/**
 * Delete a thread (soft delete)
 */
export const deleteNote = async (threadId) => {
  try {
    console.log('[chatterService] deleteNote called with threadId:', threadId);
    console.log('[chatterService] Making DELETE request to:', `/api/chatter/threads/${threadId}`);
    const response = await axios.delete(`/api/chatter/threads/${threadId}`);
    console.log('[chatterService] DELETE request successful, response:', response);
    return { success: true };
  } catch (error) {
    console.error('[chatterService] Failed to delete thread:', error);
    console.error('[chatterService] Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

/**
 * Update a thread's content
 */
export const updateNote = async (threadId, content) => {
  try {
    const response = await axios.put(`/api/chatter/threads/${threadId}`, {
      content
    });
    return response.data.data || { success: true };
  } catch (error) {
    console.error('[Chatter] Failed to update thread:', error);
    throw error;
  }
};

/**
 * Delete a reply (soft delete)
 */
export const deleteReply = async (replyId) => {
  try {
    await axios.delete(`/api/chatter/replies/${replyId}`);
    return { success: true };
  } catch (error) {
    console.error('[Chatter] Failed to delete reply:', error);
    throw error;
  }
};

/**
 * Update a reply's content
 */
export const updateReply = async (replyId, content) => {
  try {
    const response = await axios.put(`/api/chatter/replies/${replyId}`, {
      content
    });
    return response.data.data || { success: true };
  } catch (error) {
    console.error('[Chatter] Failed to update reply:', error);
    throw error;
  }
};

/**
 * Get mentionable users for a project
 * Returns team members from project's company + Skyfire admins (Logan, Eli)
 */
export const getMentionableUsers = async (projectUuid) => {
  try {
    const response = await axios.get(`/api/project/${projectUuid}/mentionable-users`);
    return response.data.data || response.data || [];
  } catch (error) {
    console.error('[Chatter] Failed to fetch mentionable users:', error);
    // Fallback to empty array if backend endpoint not ready
    return [];
  }
};

/**
 * Mark a thread as read
 */
export const markThreadAsRead = async (threadUuid) => {
  try {
    const response = await axios.post(`/api/chatter/threads/${threadUuid}/read`);
    return response.data;
  } catch (error) {
    console.error('[Chatter] Failed to mark thread as read:', error);
    throw error;
  }
};

/**
 * Get read receipts for a thread
 */
export const getReadReceipts = async (threadUuid) => {
  try {
    const response = await axios.get(`/api/chatter/threads/${threadUuid}/read-receipts`);
    return response.data?.data || { totalViews: 0, viewers: [], hasCurrentUserRead: false };
  } catch (error) {
    console.error('[Chatter] Failed to fetch read receipts:', error);
    return { totalViews: 0, viewers: [], hasCurrentUserRead: false };
  }
};

/**
 * Search threads and replies
 */
export const searchChatter = async (projectUuid, searchTerm, limit = 20) => {
  try {
    const response = await axios.get(`/api/chatter/project/${projectUuid}/search`, {
      params: { q: searchTerm, limit }
    });
    return response.data?.data || { results: [], total: 0, query: '' };
  } catch (error) {
    console.error('[Chatter] Failed to search chatter:', error);
    return { results: [], total: 0, query: '' };
  }
};

/**
 * Get all attachments for a project
 */
export const getProjectAttachments = async (projectUuid, options = {}) => {
  try {
    const { limit = 50, offset = 0, mimeType } = options;
    const params = { limit, offset };
    if (mimeType) params.mimeType = mimeType;

    const response = await axios.get(`/api/chatter/project/${projectUuid}/attachments`, { params });
    return response.data?.data || { attachments: [], total: 0, hasMore: false };
  } catch (error) {
    console.error('[Chatter] Failed to fetch attachments:', error);
    return { attachments: [], total: 0, hasMore: false };
  }
};

/**
 * Get activity log for a project
 */
export const getProjectActivity = async (projectUuid, options = {}) => {
  try {
    const { limit = 50, offset = 0, actionType, userUuid } = options;
    const params = { limit, offset };
    if (actionType) params.actionType = actionType;
    if (userUuid) params.userUuid = userUuid;

    const response = await axios.get(`/api/chatter/project/${projectUuid}/activity`, { params });
    return response.data?.data || { activities: [], total: 0, hasMore: false };
  } catch (error) {
    console.error('[Chatter] Failed to fetch activity:', error);
    return { activities: [], total: 0, hasMore: false };
  }
};

/**
 * Get activity summary stats
 */
export const getActivitySummary = async (projectUuid, days = 30) => {
  try {
    const response = await axios.get(`/api/chatter/project/${projectUuid}/activity/summary`, {
      params: { days }
    });
    return response.data?.data || { actionCounts: [], activeUsers: [], recentActivityCount: 0 };
  } catch (error) {
    console.error('[Chatter] Failed to fetch activity summary:', error);
    return { actionCounts: [], activeUsers: [], recentActivityCount: 0 };
  }
};
