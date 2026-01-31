import React, { useState } from 'react';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './AttachmentViewer.module.css';

/**
 * AttachmentViewer - Full screen modal to view attachments
 *
 * @param {boolean} isOpen - Whether the viewer is open
 * @param {function} onClose - Close callback
 * @param {Array} attachments - Array of attachment objects [{id, fileName, url, mimeType, fileSize}]
 * @param {number} initialIndex - Index of attachment to show initially
 */
const AttachmentViewer = ({ isOpen, onClose, attachments = [], initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen || attachments.length === 0) return null;

  const currentAttachment = attachments[currentIndex];
  const hasMultiple = attachments.length > 1;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : attachments.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : 0));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentAttachment.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = currentAttachment.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(currentAttachment.url, '_blank');
    }
  };

  const isImage = currentAttachment.mimeType?.includes('image');
  const isPdf = currentAttachment.mimeType?.includes('pdf');

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <span className={styles.fileName}>{currentAttachment.fileName}</span>
            {hasMultiple && (
              <span className={styles.counter}>
                {currentIndex + 1} / {attachments.length}
              </span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {isImage && (
            <img
              src={currentAttachment.url}
              alt={currentAttachment.fileName}
              className={styles.image}
            />
          )}

          {isPdf && (
            <iframe
              src={currentAttachment.url}
              title={currentAttachment.fileName}
              className={styles.pdf}
            />
          )}

          {!isImage && !isPdf && (
            <div className={styles.fileInfo}>
              <div className={styles.fileIcon}>📄</div>
              <p className={styles.fileInfoText}>
                Preview not available for this file type
              </p>
              <p className={styles.fileName}>{currentAttachment.fileName}</p>
            </div>
          )}
        </div>

        {/* Navigation Arrows */}
        {hasMultiple && (
          <>
            <button className={styles.navBtn} style={{ left: '20px' }} onClick={handlePrevious}>
              <ChevronLeft size={32} />
            </button>
            <button className={styles.navBtn} style={{ right: '20px' }} onClick={handleNext}>
              <ChevronRight size={32} />
            </button>
          </>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.downloadBtn} onClick={handleDownload}>
            <Download size={18} />
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttachmentViewer;
