import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ChatterThread from '../chatter/ChatterThread';
import ChatterInput from '../chatter/ChatterInput';
import useChatter from '../../hooks/useChatter';
import logger from '../../services/devLogger';
import styles from '../../styles/Chatter.module.css';
import localStyles from './ProjectChatTab.module.css';

/**
 * ProjectChatTab - Simplified chat-only view for project tabs
 * Shows ONLY chat threads without any sub-tabs (no Overview/Checklist/Tasks)
 *
 * @param {string} projectUuid - The project UUID
 * @param {object} projectData - Full project data from Design Portal
 */
const ProjectChatTab = ({ projectUuid, projectData }) => {
  const {
    notes,
    loading,
    error,
    sendNote,
    sendReply,
    addReaction,
    updateNote,
    deleteNote,
    updateReply,
    deleteReply,
    readReceipts,
    markAsRead,
    fetchReadReceipts,
  } = useChatter(projectUuid);
  const [showNewThread, setShowNewThread] = useState(false);
  const threadListRef = useRef(null);
  const currentUser = JSON.parse(sessionStorage.getItem('userData') || '{}');

  // Auto-scroll to bottom when new threads arrive
  useEffect(() => {
    if (threadListRef.current) {
      threadListRef.current.scrollTop = threadListRef.current.scrollHeight;
    }
  }, [notes]);

  const handleReply = async (threadId, content, mentions = [], attachments = []) => {
    await sendReply(threadId, content, mentions, attachments);
  };

  const handleReact = async (threadId, emoji) => {
    await addReaction(threadId, emoji);
  };

  const handleEditThread = async (threadId, content) => {
    console.log('[ProjectChatTab] handleEditThread called with threadId:', threadId);
    await updateNote(threadId, content);
  };

  const handleDeleteThread = async (threadId) => {
    console.log('[ProjectChatTab] handleDeleteThread called with threadId:', threadId);
    try {
      await deleteNote(threadId);
      console.log('[ProjectChatTab] deleteNote completed successfully');
    } catch (error) {
      console.error('[ProjectChatTab] Error in handleDeleteThread:', error);
      throw error;
    }
  };

  const handleEditReply = async (threadId, replyId, content) => {
    await updateReply(threadId, replyId, content);
  };

  const handleDeleteReply = async (threadId, replyId) => {
    await deleteReply(threadId, replyId);
  };

  const renderThreads = () => {
    if (loading) {
      return (
        <>
          {[1, 2, 3].map(i => (
            <div key={i} className={`${styles.skeleton} ${styles.skeletonMessage}`} />
          ))}
        </>
      );
    }

    if (error) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>⚠️</div>
          <div className={styles.emptyStateTitle}>Error loading threads</div>
          <div className={styles.emptyStateText}>{error}</div>
        </div>
      );
    }

    if (notes.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>💬</div>
          <div className={styles.emptyStateTitle}>No chats yet</div>
          <div className={styles.emptyStateText}>
            Start a conversation with your team
          </div>
          <button
            className={styles.startThreadBtn}
            onClick={() => setShowNewThread(true)}
          >
            + Start New Chat
          </button>
        </div>
      );
    }

    return notes.map((thread) => (
      <motion.div
        key={thread.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChatterThread
          thread={thread}
          onReact={handleReact}
          onReply={handleReply}
          onEditThread={handleEditThread}
          onDeleteThread={handleDeleteThread}
          onEditReply={handleEditReply}
          onDeleteReply={handleDeleteReply}
          currentUserUuid={currentUser.uuid}
          projectUuid={projectUuid}
          readReceipts={readReceipts[thread.id]}
          fetchReadReceipts={fetchReadReceipts}
          markAsRead={markAsRead}
        />
      </motion.div>
    ));
  };

  return (
    <div className={localStyles.projectChatContainer}>
      {/* Thread List */}
      <div
        ref={threadListRef}
        className={styles.threadList}
        style={{ maxHeight: 'calc(100vh - 280px)' }}
      >
        {renderThreads()}
      </div>

      {/* Chat Footer with New Chat Button or Input */}
      <div className={styles.chatFooter}>
        {showNewThread ? (
          <div className={styles.newThreadContainer}>
            <ChatterInput
              projectUuid={projectUuid}
              onSend={async (content, mentions, attachments) => {
                try {
                  await sendNote(content, mentions, attachments);
                  setShowNewThread(false);
                } catch (error) {
                  logger.error('Chatter', 'Failed to create chat:', error);
                }
              }}
              onCancel={() => setShowNewThread(false)}
              placeholder="Write your message... (@ to mention someone)"
            />
          </div>
        ) : notes.length > 0 ? (
          <button
            className={styles.floatingNewThreadBtn}
            onClick={() => setShowNewThread(true)}
            title="Start new chat"
          >
            + Chat
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default ProjectChatTab;
