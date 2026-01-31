import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import logger from '../../services/devLogger';
import surveyService from '../../services/surveyService';
import { downloadFileObject } from '../../utils/fileDownload';
import uploadManager from '../../services/uploadManager';
import styles from '../../styles/FilesTab.module.css';

// File extension categories for smart routing
const PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'bmp', 'tiff', 'svg'];
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v', '3gp', 'flv', 'wmv', 'mpg', 'mpeg'];
const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'rtf', 'odt', 'ods'];

/**
 * FilesTab - Central upload hub with smart file routing
 * Routes files to appropriate endpoints based on extension
 *
 * NOTE: Photos and videos are uploaded here but displayed in their respective tabs only.
 * Only documents (PDF, DOC, etc.) are displayed in this Files tab.
 *
 * @param {string} projectUuid - Project UUID for uploads
 */
const FilesTab = ({ projectUuid }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  // Debug: Log file extension constants on mount
  useEffect(() => {
    console.log('[FilesTab DEBUG] PHOTO_EXTENSIONS:', PHOTO_EXTENSIONS);
    console.log('[FilesTab DEBUG] HEIC included:', PHOTO_EXTENSIONS.includes('heic'));
    console.log('[FilesTab DEBUG] VIDEO_EXTENSIONS:', VIDEO_EXTENSIONS);
    console.log('[FilesTab DEBUG] DOCUMENT_EXTENSIONS:', DOCUMENT_EXTENSIONS);
  }, []);

  // Fetch documents on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        logger.log('FilesTab', '[Fetch] Loading documents...');
        const documents = await surveyService.documents.list(projectUuid);
        logger.log('FilesTab', `[Fetch] Loaded ${documents.length} documents`);
        setUploadedDocuments(documents);
      } catch (error) {
        logger.error('FilesTab', '[Fetch] Failed to load documents:', error);
        // Don't show error toast on mount - just log it
      } finally {
        setLoading(false);
      }
    };

    if (projectUuid) {
      fetchDocuments();
    }
  }, [projectUuid]);

  // Upload files with smart routing via uploadManager
  const uploadFiles = async (files) => {
    if (!files || files.length === 0) return;

    logger.log('FilesTab', `Enqueuing ${files.length} files to uploadManager`);

    // Enqueue files to global uploadManager
    uploadManager.enqueue(files, projectUuid);

    // Subscribe to completion event to refresh documents list
    const unsubscribe = uploadManager.subscribe((event, data) => {
      if (event === 'upload:complete') {
        logger.log('FilesTab', 'Upload batch complete, refreshing documents list');

        // Refresh documents list to show newly uploaded documents
        surveyService.documents.list(projectUuid)
          .then(documents => {
            setUploadedDocuments(documents);
          })
          .catch(error => {
            logger.error('FilesTab', 'Failed to refresh documents list:', error);
          });

        unsubscribe(); // Clean up subscription
      }
    });
  };

  // File input handlers
  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    await uploadFiles(files);
    e.target.value = '';
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFiles(files);
  };

  // Download handler using blob-fetch pattern
  const handleDownload = async (doc) => {
    await downloadFileObject(doc, 'FilesTab');
  };

  return (
    <div className={styles.filesTabContainer}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.heic,.heif,.pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.ppt,.pptx"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Upload Zone */}
      <div
        className={`${styles.uploadZone} ${dragActive ? styles.dragActive : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <UploadIcon className={styles.uploadIcon} />
        <h3 className={styles.uploadTitle}>
          Drag & drop files here
        </h3>
        <p className={styles.uploadHint}>
          or click to browse • Photos → Photos tab, Videos → Videos tab, Documents stay here
        </p>

        {/* Supported Formats */}
        <div className={styles.formatsList}>
            <div className={styles.formatGroup}>
              <PhotoIcon className={styles.formatIcon} />
              <span className={styles.formatLabel}>Photos</span>
              <span className={styles.formatTypes}>JPG, PNG, HEIC, WebP</span>
            </div>
            <div className={styles.formatGroup}>
              <VideoIcon className={styles.formatIcon} />
              <span className={styles.formatLabel}>Videos</span>
              <span className={styles.formatTypes}>MP4, MOV, WebM, AVI</span>
            </div>
            <div className={styles.formatGroup}>
              <DocumentIcon className={styles.formatIcon} />
              <span className={styles.formatLabel}>Documents</span>
              <span className={styles.formatTypes}>PDF, DOC, TXT, XLS</span>
            </div>
          </div>
      </div>

      {/* Uploaded Documents Section */}
      {!loading && uploadedDocuments.length > 0 && (
        <div className={styles.documentsSection}>
          <h3 className={styles.sectionHeader}>Documents ({uploadedDocuments.length})</h3>
          <div className={styles.documentsList}>
            {uploadedDocuments.map((doc) => (
              <div key={doc.id || doc.uuid} className={styles.documentItem}>
                <div className={styles.documentIcon}>
                  <DocumentIcon />
                </div>
                <div className={styles.documentInfo}>
                  <span className={styles.documentName}>{doc.file_name || doc.fileName || 'Untitled'}</span>
                  <span className={styles.documentMeta}>
                    {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : ''}
                    {doc.file_size && doc.created_at ? ' • ' : ''}
                    {doc.created_at ? new Date(doc.created_at).toLocaleString() : ''}
                  </span>
                </div>
                <button
                  onClick={() => handleDownload(doc)}
                  className={styles.documentDownload}
                  title="Download document"
                >
                  <DownloadIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className={styles.documentsSection}>
          <p className={styles.loadingText}>Loading documents...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && uploadedDocuments.length === 0 && (
        <div className={styles.documentsSection}>
          <p className={styles.emptyText}>No documents uploaded yet. Upload PDFs, DOCs, or other files to see them here.</p>
        </div>
      )}

      {/* Info Section */}
      <div className={styles.infoSection}>
        <InfoIcon className={styles.infoIcon} />
        <div className={styles.infoText}>
          <h4 className={styles.infoTitle}>Smart File Routing</h4>
          <ul className={styles.infoList}>
            <li>📸 Photos (JPG, PNG, HEIC, etc.) → Automatically routed to Photos tab</li>
            <li>🎥 Videos (MP4, MOV, etc.) → Automatically routed to Videos tab</li>
            <li>📄 Documents (PDF, DOC, XLS, etc.) → Stay here in Files tab</li>
            <li>Real-time updates keep all tabs synchronized</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Icon Components
const UploadIcon = ({ className }) => (
  <svg className={className} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PhotoIcon = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const VideoIcon = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

const DocumentIcon = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const DownloadIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const InfoIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round"/>
    <line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round"/>
  </svg>
);

export default FilesTab;
