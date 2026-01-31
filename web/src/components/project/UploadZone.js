import React, { useRef, useState, useCallback } from 'react';
import uploadManager from '../../services/uploadManager';
import styles from '../../styles/UploadZone.module.css';

const UploadIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

/**
 * UploadZone - Drag-and-drop file upload area with HEIC support
 *
 * Now uses global uploadManager for centralized upload orchestration.
 * All uploads are handled through the global upload manager with progress
 * displayed in the global UploadProgressModal in App.js.
 *
 * @param {string} projectUuid - Project UUID for uploading files
 * @param {function} onFilesSelected - Optional callback when files are selected
 * @param {boolean} disabled - Disable the upload zone
 */
const UploadZone = ({
  projectUuid,
  onFilesSelected,
  disabled = false,
}) => {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  /**
   * Handle file selection - enqueues files to uploadManager
   */
  const handleFilesSelected = useCallback(async (files) => {
    if (!files.length || disabled) return;

    console.log(`[UploadZone] Enqueuing ${files.length} files to uploadManager`);

    // Enqueue files to global uploadManager
    uploadManager.enqueue(files, projectUuid);

    // Notify parent component if callback provided
    onFilesSelected?.(files);
  }, [projectUuid, onFilesSelected, disabled]);

  // Drag handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFilesSelected(files);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFilesSelected(files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <>
      <div
        className={`${styles.uploadZone} ${isDragActive ? styles.dragActive : ''} ${disabled ? styles.disabled : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <UploadIcon />
        <div className={styles.uploadText}>
          Drag and drop files here
        </div>
        <div className={styles.uploadHint}>
          or click to browse from your computer
        </div>
        <div className={styles.supportedFormats}>
          Supported formats: JPG, PNG, HEIC, MP4, MOV
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.heic,.heif"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />
      </div>
    </>
  );
};

export default UploadZone;
