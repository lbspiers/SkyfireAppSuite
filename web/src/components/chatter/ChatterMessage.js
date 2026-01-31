import React, { useState, useRef, useEffect } from 'react';
import UserAvatar from './UserAvatar';
import AttachmentViewer from './AttachmentViewer';
import ChatterDeleteModal from './ChatterDeleteModal';
import QuickReactions from './QuickReactions';
import { Button } from '../ui';
import styles from '../../styles/Chatter.module.css';
import { FileText, Image, FileSpreadsheet, FileType, Paperclip, Download, Eye } from 'lucide-react';

/**
 * ChatterMessage - Individual message display
 *
 * @param {object} message - Message object with id, content, user, createdAt, mentions, reactions
 * @param {function} onReply - Callback to reply to message
 * @param {function} onReact - Callback to add reaction
 * @param {function} onDelete - Callback to delete message
 * @param {function} onEdit - Callback to edit message
 * @param {string} currentUserUuid - Current logged-in user's UUID
 */
const ChatterMessage = ({
  message,
  onReply,
  onReact,
  onDelete,
  onEdit,
  currentUserUuid,
  maxLength = 2000, // Default for replies, can be overridden for threads
  isThread = false, // If true, this is a thread (5000 char limit)
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const textareaRef = useRef(null);

  const characterLimit = isThread ? 5000 : maxLength;

  // Format relative time
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  // Render HTML content (from RichTextEditor)
  const renderContent = (content, mentions = []) => {
    // Content is now HTML from RichTextEditor, render it directly
    return <span dangerouslySetInnerHTML={{ __html: content }} />;
  };

  // Get all unique emojis that have been reacted with
  const getUniqueReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return [];
    return message.reactions.filter(r => r.users && r.users.length > 0);
  };

  // Check if current user has reacted with specific emoji
  const hasReacted = (emoji) => {
    const reaction = message.reactions?.find(r => r.emoji === emoji);
    return reaction?.users?.includes(currentUserUuid);
  };

  // Get reaction count for specific emoji
  const getReactionCount = (emoji) => {
    const reaction = message.reactions?.find(r => r.emoji === emoji);
    return reaction?.users?.length || 0;
  };

  // Get array of emojis the current user has reacted with
  const getUserReactions = () => {
    if (!message.reactions || !currentUserUuid) return [];
    return message.reactions
      .filter(r => r.users && r.users.includes(currentUserUuid))
      .map(r => r.emoji);
  };

  const isOwnMessage = message.user?.uuid === currentUserUuid;

  // Auto-resize textarea and focus when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  // Reset edit content when message changes
  useEffect(() => {
    setEditContent(message.content);
  }, [message.content]);

  const handleStartEdit = () => {
    setEditContent(message.content);
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || isSaving) return;
    if (editContent === message.content) {
      setIsEditing(false);
      return;
    }
    if (editContent.length > characterLimit) return;

    setIsSaving(true);
    try {
      await onEdit(message.id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit message:', error);
      // Stay in edit mode on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancelEdit();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSaveEdit();
    }
  };

  const handleEditChange = (e) => {
    setEditContent(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(message.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete message:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Get file icon based on mime type
  const getFileIcon = (mimeType) => {
    if (!mimeType) return <Paperclip size={16} />;

    if (mimeType.includes('pdf')) return <FileText size={16} />;
    if (mimeType.includes('image')) return <Image size={16} />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet size={16} />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileType size={16} />;

    return <Paperclip size={16} />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '';
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

  return (
    <div className={styles.messageCard}>
      <div className={styles.messageHeader}>
        <UserAvatar user={message.user} size="md" showTooltip />
        <div className={styles.messageUserInfo}>
          <div className={styles.messageUserName}>
            {message.user.firstName} {message.user.lastName}
          </div>
          <div className={styles.messageTimestamp}>
            {getRelativeTime(message.createdAt)}
          </div>
        </div>

        {isOwnMessage && (
          <div className={styles.messageMenuWrapper}>
            <button
              className={styles.chatterToolBtn}
              onClick={() => setShowMenu(!showMenu)}
              title="More options"
            >
              ⋯
            </button>
            {showMenu && (
              <div className={styles.messageMenu}>
                <button
                  onClick={handleStartEdit}
                  className={styles.messageMenuItem}
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteClick}
                  className={`${styles.messageMenuItem} ${styles.messageMenuItemDelete}`}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.messageContent}>
        {isEditing ? (
          <div className={styles.editMode}>
            <textarea
              ref={textareaRef}
              className={styles.editTextarea}
              value={editContent}
              onChange={handleEditChange}
              onKeyDown={handleEditKeyDown}
              disabled={isSaving}
              placeholder="Edit your message..."
            />
            <div className={styles.editFooter}>
              <div className={styles.editCharCount}>
                <span className={editContent.length > characterLimit ? styles.editCharCountError : ''}>
                  {editContent.length}/{characterLimit}
                </span>
              </div>
              <div className={styles.editActions}>
                <Button
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim() || editContent.length > characterLimit || isSaving}
                  loading={isSaving}
                  size="sm"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {renderContent(message.content, message.mentions)}
            {message.isEdited && (
              <span className={styles.editedIndicator}>(edited)</span>
            )}
          </>
        )}
      </div>

      {/* Attachments */}
      {message.attachments && message.attachments.length > 0 && (
        <div className={styles.messageAttachments}>
          {message.attachments.map((attachment, idx) => (
            <div key={attachment.id || idx} className={styles.messageAttachment}>
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
                <button
                  className={styles.attachmentActionBtn}
                  onClick={() => {
                    setViewerIndex(idx);
                    setViewerOpen(true);
                  }}
                  title="View"
                >
                  <Eye size={16} />
                </button>
                <button
                  className={styles.attachmentActionBtn}
                  onClick={() => handleDownload(attachment.url, attachment.fileName)}
                  title="Download"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attachment Viewer Modal */}
      <AttachmentViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        attachments={message.attachments || []}
        initialIndex={viewerIndex}
      />

      {/* Delete Confirmation Modal */}
      <ChatterDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        messagePreview={message.content}
        isDeleting={isDeleting}
        itemType={isThread ? 'thread' : 'reply'}
        replyCount={0}
      />

      <div className={styles.messageActions}>
        {/* Quick Reactions Bar */}
        <QuickReactions
          onReact={(emoji) => onReact && onReact(message.id, emoji)}
          userReactions={getUserReactions()}
          size="sm"
        />
      </div>

      {/* Reaction Display */}
      {getUniqueReactions().length > 0 && (
        <div className={styles.reactionsDisplay}>
          {getUniqueReactions().map((reaction) => (
            <button
              key={reaction.emoji}
              className={`${styles.reactionBubble} ${hasReacted(reaction.emoji) ? styles.reactionBubbleActive : ''}`}
              onClick={() => onReact && onReact(message.id, reaction.emoji)}
              title={`${reaction.users.length} reaction${reaction.users.length > 1 ? 's' : ''}`}
            >
              <span className={styles.reactionEmoji}>{reaction.emoji}</span>
              <span className={styles.reactionCount}>{reaction.users.length}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatterMessage;
