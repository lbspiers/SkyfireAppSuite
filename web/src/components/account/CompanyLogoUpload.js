import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import Button from '../ui/Button';
import styles from './CompanyLogoUpload.module.css';

/**
 * CompanyLogoUpload - Circular logo upload with preview
 * Features gradient border, upload/remove buttons
 */
const CompanyLogoUpload = ({ logoUrl, onUpload, onRemove, loading = false }) => {
  const [preview, setPreview] = useState(logoUrl);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file', {
        position: 'top-center',
        autoClose: 4000,
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB', {
        position: 'top-center',
        autoClose: 4000,
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Call upload handler
    if (onUpload) {
      const formData = new FormData();
      formData.append('logo', file);
      onUpload(formData);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.uploadSection}>
        <div className={styles.logoPreviewWrapper}>
          <div className={styles.logoPreview}>
            {preview ? (
              <img src={preview} alt="Company logo" className={styles.logoImage} />
            ) : (
              <div className={styles.logoPlaceholder}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}
          </div>
        </div>

        <div className={styles.uploadActions}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className={styles.fileInput}
            disabled={loading}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            {preview ? 'Change Logo' : 'Upload Logo'}
          </Button>
          {preview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={loading}
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      <div className={styles.uploadHint}>
        Recommended: Square image, at least 200x200px. Max 5MB.
      </div>
    </div>
  );
};

export default CompanyLogoUpload;
