import React, { useState, useRef } from 'react';
import { Button } from '../ui';
import styles from './RevisionRequestForm.module.css';

const UploadIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const DocumentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

/**
 * RevisionRequestForm - Form to submit a new revision request
 *
 * @param {string} revisionType - 'ahj' or 'utility'
 * @param {function} onSubmit - Callback when form is submitted: (formData) => {}
 * @param {boolean} submitting - Loading state during submission
 */
const RevisionRequestForm = ({ revisionType = 'ahj', onSubmit, submitting = false }) => {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    notes: '',
    reviewerName: '',
    reviewerPhone: '',
    reviewerEmail: '',
  });
  const [errors, setErrors] = useState({});

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
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

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(f => f.type === 'application/pdf');

    if (pdfFile) {
      setSelectedFile(pdfFile);
      setErrors(prev => ({ ...prev, file: null }));
    } else {
      setErrors(prev => ({ ...prev, file: 'Please upload a PDF file' }));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setErrors(prev => ({ ...prev, file: null }));
      } else {
        setErrors(prev => ({ ...prev, file: 'Please upload a PDF file' }));
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedFile) {
      newErrors.file = 'Revision document is required';
    }

    if (formData.reviewerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.reviewerEmail)) {
      newErrors.reviewerEmail = 'Please enter a valid email address';
    }

    if (formData.reviewerPhone && !/^[\d\s\-\(\)\+]+$/.test(formData.reviewerPhone)) {
      newErrors.reviewerPhone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit?.({
      file: selectedFile,
      ...formData,
      revisionType,
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const typeLabel = revisionType === 'ahj' ? 'AHJ' : 'Utility';

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.uploadSection}>
        <label className={styles.sectionLabel}>
          Revision Document <span className={styles.required}>*</span>
        </label>

        {!selectedFile ? (
          <div
            className={`${styles.uploadZone} ${isDragActive ? styles.uploadZoneDragActive : ''} ${errors.file ? styles.uploadZoneError : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon />
            <div className={styles.uploadText}>
              Drop {typeLabel} revision document here
            </div>
            <div className={styles.uploadHint}>
              or click to browse (PDF only)
            </div>
          </div>
        ) : (
          <div className={styles.selectedFile}>
            <div className={styles.fileInfo}>
              <DocumentIcon />
              <div className={styles.fileDetails}>
                <span className={styles.fileName}>{selectedFile.name}</span>
                <span className={styles.fileSize}>{formatFileSize(selectedFile.size)}</span>
              </div>
            </div>
            <button
              type="button"
              className={styles.removeFileButton}
              onClick={handleRemoveFile}
              title="Remove file"
            >
              <TrashIcon />
            </button>
          </div>
        )}

        {errors.file && (
          <div className={styles.errorMessage}>{errors.file}</div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Notes (Optional)</label>
        <textarea
          className={styles.textarea}
          value={formData.notes}
          onChange={(e) => handleFieldChange('notes', e.target.value)}
          placeholder="Add any additional context or details..."
          rows={2}
        />
      </div>

      <div className={styles.contactSection}>
        <label className={styles.sectionLabel}>Reviewer Contact (Optional)</label>

        <div className={styles.contactFields}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Name</label>
            <input
              type="text"
              className={styles.input}
              value={formData.reviewerName}
              onChange={(e) => handleFieldChange('reviewerName', e.target.value)}
              placeholder="Reviewer name"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Phone</label>
            <input
              type="tel"
              className={`${styles.input} ${errors.reviewerPhone ? styles.inputError : ''}`}
              value={formData.reviewerPhone}
              onChange={(e) => handleFieldChange('reviewerPhone', e.target.value)}
              placeholder="(555) 555-5555"
            />
            {errors.reviewerPhone && (
              <div className={styles.errorMessage}>{errors.reviewerPhone}</div>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Email</label>
            <input
              type="email"
              className={`${styles.input} ${errors.reviewerEmail ? styles.inputError : ''}`}
              value={formData.reviewerEmail}
              onChange={(e) => handleFieldChange('reviewerEmail', e.target.value)}
              placeholder="reviewer@email.com"
            />
            {errors.reviewerEmail && (
              <div className={styles.errorMessage}>{errors.reviewerEmail}</div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.submitSection}>
        <Button
          type="submit"
          variant="primary"
          disabled={submitting}
          loading={submitting}
        >
          {submitting ? 'Submitting...' : `Submit ${typeLabel} Revision`}
        </Button>
      </div>
    </form>
  );
};

export default RevisionRequestForm;
