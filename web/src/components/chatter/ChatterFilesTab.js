import React, { useState, useEffect, useCallback } from 'react';
import { Grid, List, Image, FileText, Download, MessageSquare, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserAvatar from './UserAvatar';
import * as chatterService from '../../services/chatterService';
import styles from '../../styles/Chatter.module.css';

/**
 * ChatterFilesTab - Gallery view of all project attachments
 *
 * @param {string} projectUuid - Project UUID
 * @param {function} onNavigateToThread - (threadUuid: string) => void
 */
const ChatterFilesTab = ({ projectUuid, onNavigateToThread }) => {
  const [attachments, setAttachments] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // View mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState('grid');

  // Filter: 'all', 'image/*', 'application/*'
  const [filter, setFilter] = useState('all');

  // Attachment viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerAttachment, setViewerAttachment] = useState(null);

  // Fetch attachments
  const fetchAttachments = useCallback(async (loadMore = false) => {
    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setAttachments([]);
    }

    try {
      const options = {
        limit: 50,
        offset: loadMore ? attachments.length : 0,
        mimeType: filter !== 'all' ? filter : undefined
      };

      const data = await chatterService.getProjectAttachments(projectUuid, options);

      if (loadMore) {
        setAttachments(prev => [...prev, ...(data.attachments || [])]);
      } else {
        setAttachments(data.attachments || []);
      }

      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error('[ChatterFilesTab] Failed to fetch attachments:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [projectUuid, filter, attachments.length]);

  // Initial load
  useEffect(() => {
    fetchAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]); // Re-fetch when filter changes

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

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

  // Check if attachment is an image
  const isImage = (mimeType) => {
    return mimeType?.startsWith('image/');
  };

  // Handle attachment click
  const handleAttachmentClick = (attachment) => {
    if (isImage(attachment.mimeType)) {
      setViewerAttachment(attachment);
      setViewerOpen(true);
    } else {
      // Download non-image files
      window.open(attachment.url, '_blank');
    }
  };

  // Handle navigate to thread
  const handleNavigateToThread = (threadUuid) => {
    if (onNavigateToThread) {
      onNavigateToThread(threadUuid);
    }
  };

  // Render attachment card (grid view)
  const renderAttachmentCard = (attachment) => (
    <motion.div
      key={attachment.uuid}
      className={styles.fileCard}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={styles.fileCardPreview}
        onClick={() => handleAttachmentClick(attachment)}
      >
        {isImage(attachment.mimeType) ? (
          <img src={attachment.url} alt={attachment.fileName} className={styles.fileCardImage} />
        ) : (
          <div className={styles.fileCardIcon}>
            <FileText size={32} />
          </div>
        )}
      </div>

      <div className={styles.fileCardInfo}>
        <div className={styles.fileCardName} title={attachment.fileName}>
          {attachment.fileName}
        </div>
        <div className={styles.fileCardMeta}>
          <UserAvatar user={attachment.uploader} size="xs" />
          <span className={styles.fileCardMetaText}>
            {attachment.uploader.firstName} {attachment.uploader.lastName}
          </span>
          <span className={styles.fileCardMetaText}>•</span>
          <span className={styles.fileCardMetaText}>{formatTime(attachment.uploadedAt)}</span>
        </div>
        <div className={styles.fileCardFooter}>
          <span className={styles.fileCardSize}>{formatFileSize(attachment.fileSize)}</span>
          <button
            className={styles.fileCardThreadBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleNavigateToThread(attachment.threadUuid);
            }}
            title="Go to thread"
          >
            <MessageSquare size={14} />
          </button>
          <button
            className={styles.fileCardDownloadBtn}
            onClick={(e) => {
              e.stopPropagation();
              window.open(attachment.url, '_blank');
            }}
            title="Download"
          >
            <Download size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Render attachment row (list view)
  const renderAttachmentRow = (attachment) => (
    <motion.div
      key={attachment.uuid}
      className={styles.fileRow}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div
        className={styles.fileRowPreview}
        onClick={() => handleAttachmentClick(attachment)}
      >
        {isImage(attachment.mimeType) ? (
          <img src={attachment.url} alt={attachment.fileName} className={styles.fileRowImage} />
        ) : (
          <div className={styles.fileRowIcon}>
            <FileText size={20} />
          </div>
        )}
      </div>

      <div className={styles.fileRowInfo}>
        <div className={styles.fileRowName} title={attachment.fileName}>
          {attachment.fileName}
        </div>
        <div className={styles.fileRowMeta}>
          <UserAvatar user={attachment.uploader} size="xs" />
          <span className={styles.fileRowMetaText}>
            {attachment.uploader.firstName} {attachment.uploader.lastName}
          </span>
          <span className={styles.fileRowMetaText}>•</span>
          <span className={styles.fileRowMetaText}>{formatFileSize(attachment.fileSize)}</span>
          <span className={styles.fileRowMetaText}>•</span>
          <span className={styles.fileRowMetaText}>{formatTime(attachment.uploadedAt)}</span>
        </div>
      </div>

      <div className={styles.fileRowActions}>
        <button
          className={styles.fileRowActionBtn}
          onClick={() => handleNavigateToThread(attachment.threadUuid)}
          title="Go to thread"
        >
          <MessageSquare size={16} />
        </button>
        <button
          className={styles.fileRowActionBtn}
          onClick={() => window.open(attachment.url, '_blank')}
          title="Download"
        >
          <Download size={16} />
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className={styles.filesTab}>
      {/* Header */}
      <div className={styles.filesHeader}>
        <div className={styles.filesHeaderLeft}>
          <h3 className={styles.filesTitle}>Files</h3>
          <span className={styles.filesCount}>
            {total} file{total !== 1 ? 's' : ''}
          </span>
        </div>

        <div className={styles.filesHeaderRight}>
          {/* Filter */}
          <select
            className={styles.filesFilter}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All files</option>
            <option value="image/*">Images</option>
            <option value="application/*">Documents</option>
          </select>

          {/* View toggle */}
          <div className={styles.filesViewToggle}>
            <button
              className={`${styles.filesViewBtn} ${viewMode === 'grid' ? styles.filesViewBtnActive : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <Grid size={16} />
            </button>
            <button
              className={`${styles.filesViewBtn} ${viewMode === 'list' ? styles.filesViewBtnActive : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={styles.filesLoading}>
          <Loader size={24} className={styles.filesLoadingSpinner} />
          <span>Loading files...</span>
        </div>
      ) : attachments.length === 0 ? (
        <div className={styles.filesEmpty}>
          <Image size={48} />
          <span>No files found</span>
          {filter !== 'all' && (
            <button className={styles.filesEmptyBtn} onClick={() => setFilter('all')}>
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={viewMode === 'grid' ? styles.filesGrid : styles.filesList}>
            {attachments.map(attachment =>
              viewMode === 'grid'
                ? renderAttachmentCard(attachment)
                : renderAttachmentRow(attachment)
            )}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className={styles.filesLoadMore}>
              <button
                className={styles.filesLoadMoreBtn}
                onClick={() => fetchAttachments(true)}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <Loader size={16} className={styles.filesLoadingSpinner} />
                    Loading...
                  </>
                ) : (
                  'Load more'
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Attachment Viewer (for images) */}
      <AnimatePresence>
        {viewerOpen && viewerAttachment && (
          <motion.div
            className={styles.attachmentViewerOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewerOpen(false)}
          >
            <motion.div
              className={styles.attachmentViewerContent}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.attachmentViewerHeader}>
                <div className={styles.attachmentViewerTitle}>
                  {viewerAttachment.fileName}
                </div>
                <button
                  className={styles.attachmentViewerClose}
                  onClick={() => setViewerOpen(false)}
                >
                  ×
                </button>
              </div>

              <div className={styles.attachmentViewerBody}>
                <img
                  src={viewerAttachment.url}
                  alt={viewerAttachment.fileName}
                  className={styles.attachmentViewerImage}
                />
              </div>

              <div className={styles.attachmentViewerFooter}>
                <button
                  className={styles.attachmentViewerBtn}
                  onClick={() => handleNavigateToThread(viewerAttachment.threadUuid)}
                >
                  <MessageSquare size={16} />
                  Go to thread
                </button>
                <button
                  className={styles.attachmentViewerBtn}
                  onClick={() => window.open(viewerAttachment.url, '_blank')}
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatterFilesTab;
