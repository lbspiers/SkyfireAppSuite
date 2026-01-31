import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import logger from '../../services/devLogger';
import UserAvatar from './UserAvatar';
import ChatterInput from './ChatterInput';
import ChatterDeleteModal from './ChatterDeleteModal';
import QuickReactions from './QuickReactions';
import ReplyItem from './ReplyItem';
import SeenByIndicator from './SeenByIndicator';
import { SendButton, Button } from '../ui';
import styles from '../../styles/Chatter.module.css';
import { FileText, Image, FileSpreadsheet, FileType, Paperclip, Download, Minus, Plus } from 'lucide-react';

/**
 * ChatterThread - Individual thread card with replies
 *
 * @param {object} thread - Thread data with replies array
 * @param {function} onReact - Callback when thumbs up is clicked
 * @param {function} onReply - Callback when a reply is sent
 * @param {function} onEditThread - Callback to edit thread
 * @param {function} onDeleteThread - Callback to delete thread
 * @param {function} onEditReply - Callback to edit reply
 * @param {function} onDeleteReply - Callback to delete reply
 * @param {string} currentUserUuid - Current user's UUID for permissions
 * @param {string} projectUuid - Project UUID for file uploads
 * @param {object} readReceipts - Read receipt data { totalViews, viewers }
 * @param {function} fetchReadReceipts - Function to fetch read receipts
 * @param {function} markAsRead - Function to mark thread as read
 */
const ChatterThread = ({
  thread,
  onReact,
  onReply,
  onEditThread,
  onDeleteThread,
  onEditReply,
  onDeleteReply,
  currentUserUuid,
  projectUuid,
  readReceipts,
  fetchReadReceipts,
  markAsRead
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showThreadMenu, setShowThreadMenu] = useState(false);
  const [isEditingThread, setIsEditingThread] = useState(false);
  const [editThreadContent, setEditThreadContent] = useState(thread.content);
  const [isSavingThread, setIsSavingThread] = useState(false);
  const [showDeleteThreadModal, setShowDeleteThreadModal] = useState(false);
  const [isDeletingThread, setIsDeletingThread] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState('');
  const [savingReplyId, setSavingReplyId] = useState(null);
  const [deletingReplyId, setDeletingReplyId] = useState(null);
  const [showDeleteReplyModal, setShowDeleteReplyModal] = useState(false);
  const [deleteReplyData, setDeleteReplyData] = useState(null);
  const threadTextareaRef = useRef(null);

  // Format timestamp to relative time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Render HTML content with @mention highlighting
  const renderContentWithMentions = (content) => {
    // Content is now HTML from RichTextEditor, render it directly
    return <span dangerouslySetInnerHTML={{ __html: content }} />;
  };

  // Get file icon based on mime type
  const getFileIcon = (mimeType) => {
    if (!mimeType) return <Paperclip size={14} />;

    if (mimeType.includes('pdf')) return <FileText size={14} />;
    if (mimeType.includes('image')) return <Image size={14} />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet size={14} />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileType size={14} />;

    return <Paperclip size={14} />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  // Get unique participants from replies
  const getParticipants = () => {
    const participants = new Map();

    // Add thread author
    participants.set(thread.user.uuid, thread.user);

    // Add reply authors
    thread.replies?.forEach(reply => {
      participants.set(reply.user.uuid, reply.user);
    });

    return Array.from(participants.values()).slice(0, 4); // Max 4 avatars
  };

  const participants = getParticipants();
  const replyCount = thread.replies?.length || 0;

  // Get all unique reactions for the thread
  const getUniqueReactions = () => {
    if (!thread.reactions || thread.reactions.length === 0) return [];
    return thread.reactions.filter(r => r.users && r.users.length > 0);
  };

  // Check if current user has reacted with specific emoji
  const hasReacted = (emoji) => {
    const reaction = thread.reactions?.find(r => r.emoji === emoji);
    return reaction?.users?.includes(currentUserUuid);
  };

  // Get reaction count for specific emoji
  const getReactionCount = (emoji) => {
    const reaction = thread.reactions?.find(r => r.emoji === emoji);
    return reaction?.users?.length || 0;
  };

  // Get array of emojis the current user has reacted with
  const getUserReactions = () => {
    if (!thread.reactions || !currentUserUuid) return [];
    return thread.reactions
      .filter(r => r.users && r.users.includes(currentUserUuid))
      .map(r => r.emoji);
  };

  const handleSendReply = async (content, mentions, attachments) => {
    try {
      await onReply(thread.id, content, mentions, attachments);
    } catch (error) {
      logger.error('Chatter', 'Failed to send reply:', error);
      throw error;
    }
  };

  const isThreadOwner = thread.user?.uuid === currentUserUuid;

  // Mark thread as read when expanded/viewed
  useEffect(() => {
    if (!isCollapsed && markAsRead && thread?.id) {
      // Small delay to avoid marking immediately
      const timer = setTimeout(() => {
        markAsRead(thread.id);
      }, 1000); // Mark as read after 1 second of viewing

      return () => clearTimeout(timer);
    }
  }, [isCollapsed, thread?.id, markAsRead]);

  // Thread edit handlers
  useEffect(() => {
    if (isEditingThread && threadTextareaRef.current) {
      threadTextareaRef.current.focus();
      threadTextareaRef.current.style.height = 'auto';
      threadTextareaRef.current.style.height = threadTextareaRef.current.scrollHeight + 'px';
    }
  }, [isEditingThread]);

  useEffect(() => {
    setEditThreadContent(thread.content);
  }, [thread.content]);

  const handleStartEditThread = () => {
    setEditThreadContent(thread.content);
    setIsEditingThread(true);
    setShowThreadMenu(false);
  };

  const handleCancelEditThread = () => {
    setEditThreadContent(thread.content);
    setIsEditingThread(false);
  };

  const handleSaveEditThread = async () => {
    if (!editThreadContent.trim() || isSavingThread) return;
    if (editThreadContent === thread.content) {
      setIsEditingThread(false);
      return;
    }
    if (editThreadContent.length > 5000) return;

    setIsSavingThread(true);
    try {
      await onEditThread(thread.id, editThreadContent);
      setIsEditingThread(false);
    } catch (error) {
      console.error('Failed to edit thread:', error);
    } finally {
      setIsSavingThread(false);
    }
  };

  const handleThreadKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancelEditThread();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSaveEditThread();
    }
  };

  const handleThreadChange = (e) => {
    setEditThreadContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleDeleteThreadClick = () => {
    setShowThreadMenu(false);
    setShowDeleteThreadModal(true);
  };

  const handleConfirmDeleteThread = async () => {
    console.log('[ChatterThread] Delete clicked for thread:', thread.id);
    setIsDeletingThread(true);
    try {
      console.log('[ChatterThread] Calling onDeleteThread...');
      await onDeleteThread(thread.id);
      console.log('[ChatterThread] Delete successful, closing modal');
      setShowDeleteThreadModal(false);
    } catch (error) {
      console.error('[ChatterThread] Failed to delete thread:', error);
    } finally {
      setIsDeletingThread(false);
    }
  };

  // Reply edit/delete handlers
  const handleStartEditReply = (reply) => {
    setEditingReplyId(reply.id);
    setEditReplyContent(reply.content);
  };

  const handleCancelEditReply = () => {
    setEditingReplyId(null);
    setEditReplyContent('');
  };

  const handleSaveEditReply = async (replyId) => {
    if (!editReplyContent.trim() || savingReplyId) return;
    if (editReplyContent.length > 2000) return;

    setSavingReplyId(replyId);
    try {
      await onEditReply(thread.id, replyId, editReplyContent);
      setEditingReplyId(null);
      setEditReplyContent('');
    } catch (error) {
      console.error('Failed to edit reply:', error);
    } finally {
      setSavingReplyId(null);
    }
  };

  const handleReplyKeyDown = (e, replyId) => {
    if (e.key === 'Escape') {
      handleCancelEditReply();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSaveEditReply(replyId);
    }
  };

  const handleDeleteReplyClick = (reply) => {
    setDeleteReplyData(reply);
    setShowDeleteReplyModal(true);
  };

  const handleConfirmDeleteReply = async () => {
    if (!deleteReplyData) return;
    setDeletingReplyId(deleteReplyData.id);
    try {
      await onDeleteReply(thread.id, deleteReplyData.id);
      setShowDeleteReplyModal(false);
      setDeleteReplyData(null);
    } catch (error) {
      console.error('Failed to delete reply:', error);
    } finally {
      setDeletingReplyId(null);
    }
  };

  return (
    <div id={`thread-${thread.id}`} className={styles.threadCard}>
      {/* Thread Header */}
      <div
        className={styles.threadHeader}
        onClick={isCollapsed ? () => setIsCollapsed(false) : undefined}
        style={isCollapsed ? { cursor: 'pointer' } : undefined}
      >
        <UserAvatar user={thread.user} size="md" />
        <div className={styles.threadHeaderContent}>
          <div className={styles.threadHeaderTop}>
            <div className={styles.threadAuthorSection}>
              <span className={styles.threadAuthor}>
                {thread.user.firstName} {thread.user.lastName}
              </span>
              {/* Participant Avatars - moved next to author name */}
              {participants.length > 1 && (
                <div className={styles.participantAvatars}>
                  {participants.map((participant, index) => (
                    <div key={participant.uuid} style={{ zIndex: participants.length - index }}>
                      <UserAvatar user={participant} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.threadHeaderActions}>
              <span className={styles.threadTimestamp}>
                {formatTime(thread.createdAt)}
              </span>
              {/* Seen By Indicator */}
              {fetchReadReceipts && (
                <SeenByIndicator
                  threadUuid={thread.id}
                  totalViews={readReceipts?.totalViews || 0}
                  viewers={readReceipts?.viewers || []}
                  onFetchReceipts={fetchReadReceipts}
                  isAuthor={isThreadOwner}
                />
              )}
              {isThreadOwner && (
                <div className={styles.messageMenuWrapper}>
                  <button
                    className={styles.chatterToolBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowThreadMenu(!showThreadMenu);
                    }}
                    title="More options"
                  >
                    ⋯
                  </button>
                  {showThreadMenu && (
                    <div className={styles.messageMenu}>
                      <button
                        onClick={handleStartEditThread}
                        className={styles.messageMenuItem}
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleDeleteThreadClick}
                        className={`${styles.messageMenuItem} ${styles.messageMenuItemDelete}`}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button
                className={styles.threadCollapseBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(!isCollapsed);
                }}
                title={isCollapsed ? "Expand chat" : "Collapse chat"}
              >
                {isCollapsed ? <Plus size={16} /> : <Minus size={16} />}
              </button>
            </div>
          </div>

          {!isCollapsed && (
            <>
              <div className={styles.threadContent}>
                {isEditingThread ? (
                  <div className={styles.editMode}>
                    <textarea
                      ref={threadTextareaRef}
                      className={styles.editTextarea}
                      value={editThreadContent}
                      onChange={handleThreadChange}
                      onKeyDown={handleThreadKeyDown}
                      disabled={isSavingThread}
                      placeholder="Edit your message..."
                    />
                    <div className={styles.editFooter}>
                      <div className={styles.editCharCount}>
                        <span className={editThreadContent.length > 5000 ? styles.editCharCountError : ''}>
                          {editThreadContent.length}/5000
                        </span>
                      </div>
                      <div className={styles.editActions}>
                        <Button
                          variant="ghost"
                          onClick={handleCancelEditThread}
                          disabled={isSavingThread}
                          size="sm"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleSaveEditThread}
                          disabled={!editThreadContent.trim() || editThreadContent.length > 5000 || isSavingThread}
                          loading={isSavingThread}
                          size="sm"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {renderContentWithMentions(thread.content)}
                    {thread.isEdited && (
                      <span className={styles.editedIndicator}> (edited)</span>
                    )}
                  </>
                )}
              </div>

              {/* Thread Attachments */}
              {thread.attachments && thread.attachments.length > 0 && (
                <div className={styles.messageAttachments}>
                  {thread.attachments.map((attachment, idx) => (
                    <div
                      key={attachment.id || idx}
                      className={styles.messageAttachment}
                      onClick={() => handleDownload(attachment.url, attachment.fileName)}
                      style={{ cursor: 'pointer' }}
                      title="Click to download"
                    >
                      <div className={styles.attachmentInfo}>
                        {getFileIcon(attachment.mimeType)}
                        <div className={styles.attachmentDetails}>
                          <span className={styles.messageAttachmentName}>{attachment.fileName}</span>
                          {attachment.fileSize && (
                            <span className={styles.messageAttachmentSize}>
                              {formatFileSize(attachment.fileSize)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.attachmentActions}>
                        <Download size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Thread Reactions - Temporarily disabled */}
              {/* <div className={styles.threadReactionsSection}>
                <QuickReactions
                  onReact={(emoji) => onReact && onReact(thread.id, emoji)}
                  userReactions={getUserReactions()}
                  size="sm"
                />

                {getUniqueReactions().length > 0 && (
                  <div className={styles.reactionsDisplay}>
                    {getUniqueReactions().map((reaction) => (
                      <button
                        key={reaction.emoji}
                        className={`${styles.reactionBubble} ${hasReacted(reaction.emoji) ? styles.reactionBubbleActive : ''}`}
                        onClick={() => onReact && onReact(thread.id, reaction.emoji)}
                        title={`${reaction.users.length} reaction${reaction.users.length > 1 ? 's' : ''}`}
                      >
                        <span className={styles.reactionEmoji}>{reaction.emoji}</span>
                        <span className={styles.reactionCount}>{reaction.users.length}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div> */}
            </>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Replies Container */}
          {thread.replies && thread.replies.length > 0 && (
            <div className={styles.repliesContainer}>
              {thread.replies.map(reply => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  currentUserUuid={currentUserUuid}
                  editingReplyId={editingReplyId}
                  savingReplyId={savingReplyId}
                  editReplyContent={editReplyContent}
                  onStartEdit={handleStartEditReply}
                  onCancelEdit={handleCancelEditReply}
                  onSaveEdit={handleSaveEditReply}
                  onDeleteClick={handleDeleteReplyClick}
                  onEditContentChange={setEditReplyContent}
                  onKeyDown={handleReplyKeyDown}
                  formatTime={formatTime}
                  renderContentWithMentions={renderContentWithMentions}
                  getFileIcon={getFileIcon}
                  formatFileSize={formatFileSize}
                  handleDownload={handleDownload}
                />
              ))}
            </div>
          )}

          {/* Delete Modals */}
          <ChatterDeleteModal
            isOpen={showDeleteThreadModal}
            onClose={() => setShowDeleteThreadModal(false)}
            onConfirm={handleConfirmDeleteThread}
            messagePreview={thread.content}
            isDeleting={isDeletingThread}
            itemType="thread"
            replyCount={thread.replies?.length || 0}
          />

          <ChatterDeleteModal
            isOpen={showDeleteReplyModal}
            onClose={() => {
              setShowDeleteReplyModal(false);
              setDeleteReplyData(null);
            }}
            onConfirm={handleConfirmDeleteReply}
            messagePreview={deleteReplyData?.content || ''}
            isDeleting={!!deletingReplyId}
            itemType="reply"
            replyCount={0}
          />

          {/* Thread Footer (Reply Input with Attachments) */}
          <div className={styles.threadFooter}>
            <ChatterInput
              projectUuid={projectUuid}
              onSend={handleSendReply}
              placeholder="Write a reply... (@ to mention)"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatterThread;
