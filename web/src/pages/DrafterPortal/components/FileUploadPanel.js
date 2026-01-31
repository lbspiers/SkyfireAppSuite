import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import styles from './FileUploadPanel.module.css';

const REQUIRED_FILES = [
  { type: 'site_plan_pdf', label: 'Site Plan (PDF)', required: true, accept: '.pdf' },
  { type: 'site_plan_dwg', label: 'Site Plan (DWG)', required: true, accept: '.dwg,.dxf' },
  { type: 'single_line_pdf', label: 'Single Line Diagram (PDF)', required: true, accept: '.pdf' }
];

/**
 * File upload panel for workspace
 * @param {Object} props
 * @param {Array} props.files - Current files
 * @param {Function} props.onUpload - Upload file handler
 * @param {Function} props.onDelete - Delete file handler
 */
const FileUploadPanel = ({ files = [], onUpload, onDelete }) => {
  const [uploading, setUploading] = useState({});
  const [dragOver, setDragOver] = useState({});
  const fileInputRefs = useRef({});

  const getFileForType = (fileType) => {
    return files.find(f => f.fileType === fileType);
  };

  const handleDragEnter = (fileType, event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(prev => ({ ...prev, [fileType]: true }));
  };

  const handleDragLeave = (fileType, event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(prev => ({ ...prev, [fileType]: false }));
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = async (fileType, event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(prev => ({ ...prev, [fileType]: false }));

    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) return;

    // Validate file type
    const requiredFile = REQUIRED_FILES.find(rf => rf.type === fileType);
    if (requiredFile) {
      const extension = droppedFile.name.toLowerCase().split('.').pop();
      const acceptedExtensions = requiredFile.accept.split(',').map(ext => ext.replace('.', '').trim());

      if (!acceptedExtensions.includes(extension)) {
        toast.error(`Invalid file type. Expected: ${requiredFile.accept}`, {
          position: 'top-center',
          autoClose: 4000,
        });
        return;
      }
    }

    try {
      setUploading(prev => ({ ...prev, [fileType]: true }));
      await onUpload(droppedFile, fileType);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload file. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
      });
    } finally {
      setUploading(prev => ({ ...prev, [fileType]: false }));
    }
  };

  const handleFileSelect = async (fileType, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const requiredFile = REQUIRED_FILES.find(rf => rf.type === fileType);
    if (requiredFile) {
      const extension = file.name.toLowerCase().split('.').pop();
      const acceptedExtensions = requiredFile.accept.split(',').map(ext => ext.replace('.', '').trim());

      if (!acceptedExtensions.includes(extension)) {
        toast.error(`Invalid file type. Expected: ${requiredFile.accept}`, {
          position: 'top-center',
          autoClose: 4000,
        });
        return;
      }
    }

    try {
      setUploading(prev => ({ ...prev, [fileType]: true }));
      await onUpload(file, fileType);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload file. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
      });
    } finally {
      setUploading(prev => ({ ...prev, [fileType]: false }));
      // Clear the input
      if (fileInputRefs.current[fileType]) {
        fileInputRefs.current[fileType].value = '';
      }
    }
  };

  const handleDeleteClick = async (fileUuid, fileType) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await onDelete(fileUuid);
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete file. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const allRequiredUploaded = REQUIRED_FILES.every(rf =>
    rf.required ? getFileForType(rf.type) : true
  );

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>File Uploads</h2>

      {allRequiredUploaded && (
        <div className={styles.successBanner}>
          <span className={styles.successIcon}>✓</span>
          All required files uploaded
        </div>
      )}

      <div className={styles.fileList}>
        {REQUIRED_FILES.map(requiredFile => {
          const uploadedFile = getFileForType(requiredFile.type);
          const isUploading = uploading[requiredFile.type];
          const isDragOver = dragOver[requiredFile.type];

          return (
            <div
              key={requiredFile.type}
              className={`${styles.fileItem} ${isDragOver ? styles.dragOver : ''}`}
              onDragEnter={(e) => handleDragEnter(requiredFile.type, e)}
              onDragLeave={(e) => handleDragLeave(requiredFile.type, e)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(requiredFile.type, e)}
            >
              <div className={styles.fileHeader}>
                <div className={styles.fileTitle}>
                  <span className={`${styles.checkbox} ${uploadedFile ? styles.checked : ''}`}>
                    {uploadedFile ? '✓' : ''}
                  </span>
                  <span className={styles.fileName}>{requiredFile.label}</span>
                  {requiredFile.required && <span className={styles.required}>*</span>}
                </div>
                <div className={styles.fileStatus}>
                  {uploadedFile ? (
                    <span className={styles.statusUploaded}>Uploaded</span>
                  ) : (
                    <span className={styles.statusPending}>Pending</span>
                  )}
                </div>
              </div>

              {uploadedFile && (
                <div className={styles.fileDetails}>
                  <div className={styles.fileInfo}>
                    <div className={styles.fileInfoItem}>
                      <span className={styles.infoLabel}>File:</span>
                      <span className={styles.infoValue}>{uploadedFile.fileName}</span>
                    </div>
                    <div className={styles.fileInfoItem}>
                      <span className={styles.infoLabel}>Size:</span>
                      <span className={styles.infoValue}>{formatFileSize(uploadedFile.fileSizeBytes || 0)}</span>
                    </div>
                    {uploadedFile.uploadedAt && (
                      <div className={styles.fileInfoItem}>
                        <span className={styles.infoLabel}>Uploaded:</span>
                        <span className={styles.infoValue}>{formatDate(uploadedFile.uploadedAt)}</span>
                      </div>
                    )}
                    {uploadedFile.version && (
                      <div className={styles.fileInfoItem}>
                        <span className={styles.infoLabel}>Version:</span>
                        <span className={styles.infoValue}>{uploadedFile.version}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.fileActions}>
                <input
                  ref={el => fileInputRefs.current[requiredFile.type] = el}
                  type="file"
                  accept={requiredFile.accept}
                  onChange={(e) => handleFileSelect(requiredFile.type, e)}
                  style={{ display: 'none' }}
                  id={`file-input-${requiredFile.type}`}
                />

                {!uploadedFile && !isUploading && (
                  <div className={styles.uploadHint}>
                    Drag & drop or click to upload
                  </div>
                )}

                {isDragOver && (
                  <div className={styles.dropZoneOverlay}>
                    <span className={styles.dropIcon}>📁</span>
                    <span>Drop file here</span>
                  </div>
                )}

                {isUploading && (
                  <div className={styles.uploadingIndicator}>
                    <div className={styles.spinner}></div>
                    <span>Uploading...</span>
                  </div>
                )}

                <button
                  onClick={() => fileInputRefs.current[requiredFile.type]?.click()}
                  disabled={isUploading}
                  className={`${styles.uploadButton} ${uploadedFile ? styles.reupload : ''}`}
                >
                  {isUploading ? (
                    'Uploading...'
                  ) : uploadedFile ? (
                    'Replace'
                  ) : (
                    'Upload'
                  )}
                </button>

                {uploadedFile && !isUploading && (
                  <button
                    onClick={() => handleDeleteClick(uploadedFile.uuid, requiredFile.type)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileUploadPanel;
