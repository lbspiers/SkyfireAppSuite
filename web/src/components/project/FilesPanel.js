import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import logger from '../../services/devLogger';
import surveyService from '../../services/surveyService';
import uploadManager from '../../services/uploadManager';
import { Button, ConfirmDialog, UploadProgressInline } from '../ui';
import { downloadFileObject, downloadMultipleFiles } from '../../utils/fileDownload';
import { processFileForUpload, isHeicFile, isImageFile } from '../../utils/imageProcessor';
import styles from '../../styles/FilesPanel.module.css';

// Graceful import of documentService (try/catch in case backend not ready)
let documentService = null;
try {
  documentService = require('../../services/documentService').default;
} catch (error) {
  logger.warn('FilesPanel', 'documentService not available yet:', error);
}

// Document type labels
const DOCUMENT_TYPE_LABELS = {
  'sales_proposal': 'Sales Proposal',
  'supporting': 'Supporting',
  'contract': 'Contract',
  'permit': 'Permit',
  'utility': 'Utility',
  'other': 'Other',
};

/**
 * FilesPanel - Unified view of all project files (documents, photos, videos)
 * Displays tabs for filtering and supports drag & drop upload
 *
 * @param {string} projectUuid - Project UUID
 */
const FilesPanel = ({ projectUuid }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [dragActive, setDragActive] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch all files
  const fetchFiles = useCallback(async () => {
    if (!projectUuid) return;

    setLoading(true);
    try {
      logger.log('FilesPanel', `Fetching files for project: ${projectUuid}`);

      // Fetch photos, videos, and documents in parallel
      const [photos, videos, documents] = await Promise.all([
        surveyService.photos.list(projectUuid).catch(err => {
          logger.warn('FilesPanel', 'Failed to fetch photos:', err);
          return [];
        }),
        surveyService.videos.list(projectUuid).catch(err => {
          logger.warn('FilesPanel', 'Failed to fetch videos:', err);
          return [];
        }),
        documentService
          ? documentService.documents.list(projectUuid).catch(err => {
              logger.warn('FilesPanel', 'Failed to fetch documents:', err);
              toast.warning('Document service not available yet', {
                position: 'top-right',
                autoClose: 3000,
              });
              return [];
            })
          : Promise.resolve([]),
      ]);

      // Combine and normalize all files
      const allFiles = [
        ...photos.map(p => ({ ...p, fileType: 'photo', category: 'Photos' })),
        ...videos.map(v => ({ ...v, fileType: 'video', category: 'Videos' })),
        ...documents.map(d => ({ ...d, fileType: 'document', category: 'Documents' })),
      ];

      // Sort by date (newest first)
      allFiles.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.uploadedAt || 0);
        const dateB = new Date(b.createdAt || b.uploadedAt || 0);
        return dateB - dateA;
      });

      logger.log('FilesPanel', `Loaded ${allFiles.length} files (${photos.length} photos, ${videos.length} videos, ${documents.length} documents)`);
      setFiles(allFiles);
    } catch (error) {
      logger.error('FilesPanel', 'Error fetching files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [projectUuid]);

  // Load files on mount
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Filter files by active tab
  const filteredFiles = activeTab === 'all'
    ? files
    : files.filter(f => f.fileType === activeTab);

  // Get counts for tabs
  const counts = {
    all: files.length,
    documents: files.filter(f => f.fileType === 'document').length,
    photos: files.filter(f => f.fileType === 'photo').length,
    videos: files.filter(f => f.fileType === 'video').length,
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === filteredFiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFiles.map(f => f.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const toggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Delete handlers
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setShowDeleteModal(true);
  };

  // Actual deletion after confirmation
  const handleConfirmDelete = async () => {
    try {
      // Get user info for audit
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');

      // Group selected files by type
      const selectedFiles = files.filter(f => selectedIds.has(f.id));
      const photoIds = selectedFiles.filter(f => f.fileType === 'photo').map(f => f.id);
      const videoIds = selectedFiles.filter(f => f.fileType === 'video').map(f => f.id);
      const documentIds = selectedFiles.filter(f => f.fileType === 'document').map(f => f.id);

      // Delete photos (bulk)
      if (photoIds.length > 0) {
        await surveyService.photos.bulkDelete(projectUuid, photoIds);
      }

      // Delete videos (bulk)
      if (videoIds.length > 0) {
        await surveyService.videos.bulkDelete(projectUuid, videoIds);
      }

      // Delete documents one by one (bulk endpoint has issues)
      if (documentIds.length > 0 && documentService) {
        await Promise.all(
          documentIds.map(docId =>
            documentService.documents.deleteOne(projectUuid, docId)
              .catch(err => {
                logger.warn('FilesPanel', `Failed to delete document ${docId}:`, err);
                return null; // Continue with other deletions
              })
          )
        );
      }

      // Remove from UI
      setFiles(prev => prev.filter(f => !selectedIds.has(f.id)));
      clearSelection();
      setShowDeleteModal(false);

      toast.success(`Deleted ${selectedIds.size} file${selectedIds.size > 1 ? 's' : ''}`);
      logger.log('FilesPanel', `User ${userData.email || 'unknown'} deleted ${selectedIds.size} files`);
    } catch (error) {
      logger.error('FilesPanel', 'Delete error:', error);
      toast.error('Failed to delete files. Please try again.');
    }
  };

  // Upload handlers
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    console.log('🔥 [FilesPanel] handleFileChange - files selected:', selectedFiles.map(f => f.name));
    if (selectedFiles.length === 0) return;
    await uploadFiles(selectedFiles);
    e.target.value = '';
  };

  const uploadFiles = async (filesToUpload) => {
    if (!filesToUpload || filesToUpload.length === 0) return;

    logger.log('FilesPanel', `Enqueuing ${filesToUpload.length} files to uploadManager`);

    // Enqueue files to global uploadManager
    uploadManager.enqueue(filesToUpload, projectUuid);

    // Subscribe to completion event to refresh file list
    const unsubscribe = uploadManager.subscribe((event, data) => {
      if (event === 'upload:complete') {
        logger.log('FilesPanel', 'Upload batch complete, refreshing file list');
        fetchFiles();
        unsubscribe(); // Clean up subscription
      }
    });
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    console.log('🔥 [FilesPanel] handleDrop - files dropped:', droppedFiles.map(f => f.name));
    if (droppedFiles.length > 0) uploadFiles(droppedFiles);
  };

  // Direct download using shared utility
  const handleDownload = async (file) => {
    await downloadFileObject(file, 'FilesPanel');
  };

  // Download all selected files using shared utility
  const handleDownloadAll = async () => {
    const selectedFiles = files.filter(f => selectedIds.has(f.id));

    await downloadMultipleFiles(selectedFiles, {
      componentName: 'FilesPanel',
      delayMs: 300,
    });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get file icon
  const getFileIcon = (file) => {
    if (file.fileType === 'photo') return <PhotoIcon />;
    if (file.fileType === 'video') return <VideoIcon />;
    if (file.fileType === 'document') return <DocumentIcon />;
    return <FileIcon />;
  };

  return (
    <div className={styles.filesPanel}>
      {/* Tabs */}
      <div className={styles.tabsRow}>
        <button
          className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({counts.all})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'document' ? styles.active : ''}`}
          onClick={() => setActiveTab('document')}
        >
          Documents ({counts.documents})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'photo' ? styles.active : ''}`}
          onClick={() => setActiveTab('photo')}
        >
          Photos ({counts.photos})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'video' ? styles.active : ''}`}
          onClick={() => setActiveTab('video')}
        >
          Videos ({counts.videos})
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <label className={styles.selectAllCheckbox}>
            <div
              className={`${styles.checkboxInner} ${selectedIds.size === filteredFiles.length && filteredFiles.length > 0 ? styles.checked : ''}`}
              onClick={handleSelectAll}
            >
              {selectedIds.size === filteredFiles.length && filteredFiles.length > 0 && <CheckIcon />}
            </div>
            <span className={styles.selectAllLabel}>
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select All'}
            </span>
          </label>
        </div>
        <div className={styles.toolbarActions}>
          {selectedIds.size > 0 ? (
            <>
              <button className={styles.downloadAllBtn} onClick={handleDownloadAll}>
                <DownloadIcon /> Download All
              </button>
              <button className={styles.deleteAllBtn} onClick={handleBulkDelete}>
                <TrashIcon /> Delete ({selectedIds.size})
              </button>
            </>
          ) : (
            <Button onClick={handleUploadClick}>
              <UploadIcon /> Upload Files
            </Button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.heic,.heif,.pdf,.doc,.docx,.txt,.xls,.xlsx"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Inline Upload Progress */}
      <UploadProgressInline />

      {/* Content */}
      <div
        className={`${styles.contentArea} ${dragActive ? styles.dragActive : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Loading files...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.uploadZone} onClick={handleUploadClick}>
              <UploadIcon className={styles.uploadIcon} />
              <span className={styles.uploadText}>
                Drag & drop files here, or click to upload
              </span>
              <span className={styles.uploadHint}>
                Supports images, videos, PDFs, and other documents
              </span>
            </div>
          </div>
        ) : (
          <div className={styles.fileList}>
            {filteredFiles.map(file => (
              <div
                key={file.id}
                className={`${styles.fileRow} ${selectedIds.has(file.id) ? styles.selected : ''}`}
              >
                {/* Checkbox */}
                <div
                  className={styles.checkbox}
                  onClick={() => toggleSelection(file.id)}
                >
                  <div className={`${styles.checkboxInner} ${selectedIds.has(file.id) ? styles.checked : ''}`}>
                    {selectedIds.has(file.id) && <CheckIcon />}
                  </div>
                </div>

                {/* Icon/Thumbnail */}
                <div className={styles.fileIcon}>
                  {file.thumbnail_url || file.url ? (
                    <img
                      src={file.thumbnail_url || file.url}
                      alt={file.name || file.fileName}
                      className={styles.thumbnail}
                    />
                  ) : (
                    getFileIcon(file)
                  )}
                </div>

                {/* File info */}
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>
                    {file.name || file.fileName || 'Unnamed file'}
                  </div>
                  <div className={styles.fileMeta}>
                    {file.category} • {formatFileSize(file.size || file.fileSize)} • {formatDate(file.createdAt || file.uploadedAt)}
                  </div>
                </div>

                {/* Document type label (for documents only) */}
                {file.fileType === 'document' && file.documentType && file.documentType !== 'other' && (
                  <div className={styles.documentType}>
                    {DOCUMENT_TYPE_LABELS[file.documentType]}
                  </div>
                )}

                {/* Download button */}
                <button
                  className={styles.downloadBtn}
                  onClick={() => handleDownload(file)}
                  title="Download"
                >
                  <DownloadIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Drag overlay */}
        {dragActive && (
          <div className={styles.dragOverlay}>
            <UploadIcon className={styles.dragIcon} />
            <span>Drop files to upload</span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Files"
        message={`Are you sure you want to delete ${selectedIds.size} file${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

// Icon Components
const UploadIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 14V3M10 3L6 7M10 3L14 7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 14v2a2 2 0 002 2h10a2 2 0 002-2v-2" strokeLinecap="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M13 4v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4" strokeLinecap="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 2v8m0 0l-3-3m3 3l3-3M2 12v1a2 2 0 002 2h8a2 2 0 002-2v-1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PhotoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const VideoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

const DocumentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="9" y1="13" x2="15" y2="13"/>
    <line x1="9" y1="17" x2="15" y2="17"/>
  </svg>
);

const FileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
    <polyline points="13 2 13 9 20 9"/>
  </svg>
);

export default FilesPanel;
