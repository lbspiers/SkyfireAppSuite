import React, { useState } from 'react';
import { motion } from 'framer-motion';
import UserAvatar from './UserAvatar';
import { Button } from '../ui';
import styles from '../../styles/Chatter.module.css';
import { FileText, Image, FileSpreadsheet, FileType, Paperclip, Download } from 'lucide-react';

/**
 * ReplyItem - Individual reply in a thread
 */
const ReplyItem = ({
  reply,
  currentUserUuid,
  editingReplyId,
  savingReplyId,
  editReplyContent,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDeleteClick,
  onEditContentChange,
  onKeyDown,
  formatTime,
  renderContentWithMentions,
  getFileIcon,
  formatFileSize,
  handleDownload,
}) => {
  const [showReplyMenu, setShowReplyMenu] = useState(false);

  const isReplyOwner = reply.user?.uuid === currentUserUuid;
  const isEditingThisReply = editingReplyId === reply.id;
  const isSavingThisReply = savingReplyId === reply.id;

  return (
    <motion.div
      key={reply.id}
      className={styles.replyItem}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <UserAvatar user={reply.user} size="sm" />
      <div className={styles.replyContent}>
        <div className={styles.replyHeader}>
          <span className={styles.replyAuthor}>
            {reply.user.firstName} {reply.user.lastName}
          </span>
          <span className={styles.replyTimestamp}>
            {formatTime(reply.createdAt)}
          </span>
          {isReplyOwner && (
            <div className={styles.messageMenuWrapper}>
              <button
                className={styles.chatterToolBtn}
                onClick={() => setShowReplyMenu(!showReplyMenu)}
                title="More options"
              >
                ⋯
              </button>
              {showReplyMenu && (
                <div className={styles.messageMenu}>
                  <button
                    onClick={() => {
                      onStartEdit(reply);
                      setShowReplyMenu(false);
                    }}
                    className={styles.messageMenuItem}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDeleteClick(reply);
                      setShowReplyMenu(false);
                    }}
                    className={`${styles.messageMenuItem} ${styles.messageMenuItemDelete}`}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className={styles.replyText}>
          {isEditingThisReply ? (
            <div className={styles.editMode}>
              <textarea
                className={styles.editTextarea}
                value={editReplyContent}
                onChange={(e) => onEditContentChange(e.target.value)}
                onKeyDown={(e) => onKeyDown(e, reply.id)}
                disabled={isSavingThisReply}
                placeholder="Edit your reply..."
                autoFocus
              />
              <div className={styles.editFooter}>
                <div className={styles.editCharCount}>
                  <span className={editReplyContent.length > 2000 ? styles.editCharCountError : ''}>
                    {editReplyContent.length}/2000
                  </span>
                </div>
                <div className={styles.editActions}>
                  <Button
                    variant="ghost"
                    onClick={onCancelEdit}
                    disabled={isSavingThisReply}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => onSaveEdit(reply.id)}
                    disabled={!editReplyContent.trim() || editReplyContent.length > 2000 || isSavingThisReply}
                    loading={isSavingThisReply}
                    size="sm"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {renderContentWithMentions(reply.content)}
              {reply.isEdited && (
                <span className={styles.editedIndicator}> (edited)</span>
              )}
            </>
          )}
        </div>

        {/* Reply Attachments */}
        {reply.attachments && reply.attachments.length > 0 && (
          <div className={styles.replyAttachments}>
            {reply.attachments.map((attachment, idx) => (
              <div
                key={attachment.id || idx}
                className={styles.replyAttachment}
                onClick={() => handleDownload(attachment.url, attachment.fileName)}
                style={{ cursor: 'pointer' }}
                title="Click to download"
              >
                <div className={styles.attachmentInfo}>
                  {getFileIcon(attachment.mimeType)}
                  <div className={styles.attachmentDetails}>
                    <span className={styles.replyAttachmentName}>{attachment.fileName}</span>
                    {attachment.fileSize && (
                      <span className={styles.replyAttachmentSize}>
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
      </div>
    </motion.div>
  );
};

export default ReplyItem;
