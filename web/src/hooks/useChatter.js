import { useState, useEffect, useCallback } from 'react';
import { safeGetJSON } from '../utils/safeStorage';
import * as chatterService from '../services/chatterService';
import logger from '../services/devLogger';

/**
 * useChatter - Custom hook for managing chatter operations
 *
 * @param {string} projectUuid - The project UUID to fetch notes for
 * @returns {object} - Chatter state and operations
 */
export const useChatter = (projectUuid) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [readReceipts, setReadReceipts] = useState({}); // { threadUuid: { totalViews, viewers } }

  const fetchNotes = useCallback(async () => {
    if (!projectUuid) return;

    try {
      setLoading(true);
      setError(null);
      const data = await chatterService.getProjectNotes(projectUuid);
      setNotes(data);
    } catch (err) {
      setError(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [projectUuid]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const sendNote = async (content, mentions = [], attachments = []) => {
    try {
      setSending(true);
      const newNote = await chatterService.createNote(projectUuid, content, mentions, attachments);
      setNotes(prev => [...prev, newNote]);
      return newNote;
    } catch (err) {
      setError(err.message || 'Failed to send note');
      throw err;
    } finally {
      setSending(false);
    }
  };

  const sendReply = async (threadId, content, mentions = [], attachments = []) => {
    try {
      const newReply = await chatterService.createReply(threadId, content, mentions, attachments);
      // Update the thread with the new reply
      setNotes(prev => prev.map(thread => {
        if (thread.id === threadId) {
          return {
            ...thread,
            replies: [...(thread.replies || []), newReply]
          };
        }
        return thread;
      }));
      return newReply;
    } catch (err) {
      setError(err.message || 'Failed to send reply');
      throw err;
    }
  };

  const addReaction = async (noteId, emoji) => {
    try {
      await chatterService.addReaction(noteId, emoji);
      // Optimistically update local state
      setNotes(prev => prev.map(note => {
        if (note.id === noteId) {
          const currentUser = safeGetJSON('userData', sessionStorage, {});
          const existingReaction = note.reactions.find(r => r.emoji === emoji);

          if (existingReaction) {
            // Toggle user in reaction
            const userIndex = existingReaction.users.indexOf(currentUser.uuid);
            if (userIndex > -1) {
              existingReaction.users.splice(userIndex, 1);
            } else {
              existingReaction.users.push(currentUser.uuid);
            }
          } else {
            note.reactions.push({ emoji, users: [currentUser.uuid] });
          }
        }
        return note;
      }));
    } catch (err) {
      logger.error('Chatter', 'Failed to add reaction:', err);
    }
  };

  const deleteNote = async (noteId) => {
    console.log('[useChatter] deleteNote called with noteId:', noteId);
    try {
      console.log('[useChatter] Calling chatterService.deleteNote...');
      await chatterService.deleteNote(noteId);
      console.log('[useChatter] chatterService.deleteNote completed, updating state...');
      setNotes(prev => prev.filter(note => note.id !== noteId));
      console.log('[useChatter] State updated successfully');
    } catch (err) {
      console.error('[useChatter] Error in deleteNote:', err);
      logger.error('Chatter', 'Failed to delete note:', err);
      setError(err.message || 'Failed to delete note');
    }
  };

  const updateNote = async (noteId, content) => {
    try {
      await chatterService.updateNote(noteId, content);
      setNotes(prev => prev.map(note => {
        if (note.id === noteId) {
          return { ...note, content, isEdited: true };
        }
        return note;
      }));
    } catch (err) {
      logger.error('Chatter', 'Failed to update note:', err);
      setError(err.message || 'Failed to update note');
      throw err;
    }
  };

  const deleteReply = async (threadId, replyId) => {
    try {
      await chatterService.deleteReply(replyId);
      // Remove reply from thread
      setNotes(prev => prev.map(thread => {
        if (thread.id === threadId) {
          return {
            ...thread,
            replies: thread.replies.filter(reply => reply.id !== replyId)
          };
        }
        return thread;
      }));
    } catch (err) {
      logger.error('Chatter', 'Failed to delete reply:', err);
      setError(err.message || 'Failed to delete reply');
      throw err;
    }
  };

  const updateReply = async (threadId, replyId, content) => {
    try {
      await chatterService.updateReply(replyId, content);
      // Update reply in thread
      setNotes(prev => prev.map(thread => {
        if (thread.id === threadId) {
          return {
            ...thread,
            replies: thread.replies.map(reply => {
              if (reply.id === replyId) {
                return { ...reply, content, isEdited: true };
              }
              return reply;
            })
          };
        }
        return thread;
      }));
    } catch (err) {
      logger.error('Chatter', 'Failed to update reply:', err);
      setError(err.message || 'Failed to update reply');
      throw err;
    }
  };

  // Mark thread as read (call when thread is viewed/expanded)
  const markAsRead = useCallback(async (threadUuid) => {
    try {
      await chatterService.markThreadAsRead(threadUuid);
    } catch (err) {
      // Silent fail - not critical
      logger.error('Chatter', 'Failed to mark as read:', err);
    }
  }, []);

  // Fetch read receipts for a thread
  const fetchReadReceipts = useCallback(async (threadUuid) => {
    try {
      const data = await chatterService.getReadReceipts(threadUuid);
      setReadReceipts(prev => ({ ...prev, [threadUuid]: data }));
      return data;
    } catch (err) {
      logger.error('Chatter', 'Failed to fetch read receipts:', err);
      return null;
    }
  }, []);

  return {
    notes,
    loading,
    error,
    sending,
    sendNote,
    sendReply,
    addReaction,
    deleteNote,
    updateNote,
    deleteReply,
    updateReply,
    readReceipts,
    markAsRead,
    fetchReadReceipts,
    refetch: fetchNotes,
  };
};

export default useChatter;
