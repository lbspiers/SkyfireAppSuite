import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import logger from '../../services/devLogger';
import styles from './PdfFullScreenModal.module.css';
import PdfAnnotationLayer from './PdfAnnotationLayer';
import PdfToolbar from './PdfToolbar';

/**
 * PdfFullScreenModal - Full screen modal overlay for PDF viewing
 *
 * Features:
 * - Full-screen modal overlay
 * - Dark semi-transparent backdrop
 * - Close via X button or ESC key
 * - Header with filename/version
 * - Footer with Tools and zoom controls (Phase 3)
 *
 * @param {boolean} isOpen - Whether modal is visible
 * @param {function} onClose - Callback to close modal
 * @param {string} presignedUrl - S3 presigned URL for PDF
 * @param {number} versionNumber - Version number for display
 * @param {string} fileName - Optional PDF filename
 */
const PdfFullScreenModal = ({
  isOpen,
  onClose,
  presignedUrl,
  versionNumber,
  fileName = 'Plan Set'
}) => {
  const [isAnnotationMode, setIsAnnotationMode] = useState(true); // Start with tools open by default
  const [currentTool, setCurrentTool] = useState('select');
  const [currentColor, setCurrentColor] = useState('var(--color-danger)'); // Red default
  const [annotations, setAnnotations] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const annotationLayerRef = React.useRef(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Handle annotations change
  const handleAnnotationsChange = (newAnnotations) => {
    setAnnotations(newAnnotations);
    setHasChanges(true);
  };

  // Handle save markup (Phase 4 - placeholder)
  const handleSaveMarkup = () => {
    logger.debug('PDF', 'Save markup clicked - Phase 4 implementation');
    logger.debug('PDF', 'Annotations:', annotations);
    // TODO: API call to save revision
    setHasChanges(false);
  };

  // Toggle annotation mode
  const handleToggleAnnotationMode = () => {
    setIsAnnotationMode(!isAnnotationMode);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      showCloseButton={false}
      closeOnOverlay={true}
      closeOnEscape={true}
      className={styles.pdfModal}
    >
      {/* Header Bar */}
      <div className={styles.modalHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.fileName}>
            {fileName} - V{versionNumber}
          </span>
        </div>

        <Button
          variant="ghost"
          onClick={onClose}
          aria-label="Close modal"
          className={styles.closeButton}
        >
          ✕
        </Button>
      </div>

      {/* PDF Viewer Area */}
      <div className={styles.pdfViewerArea}>
        {presignedUrl ? (
          <>
            <iframe
              src={presignedUrl}
              className={styles.pdfIframe}
              title={`Plan Set Version ${versionNumber}`}
            />

            {/* Annotation Layer Overlay */}
            <PdfAnnotationLayer
              ref={annotationLayerRef}
              isActive={isAnnotationMode}
              currentTool={currentTool}
              currentColor={currentColor}
              annotations={annotations}
              onAnnotationsChange={handleAnnotationsChange}
              onToolChange={setCurrentTool}
              currentPage={1}
            />
          </>
        ) : (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}>⏳</div>
            <p>Loading PDF...</p>
          </div>
        )}

        {/* Annotation Toolbar */}
        {isAnnotationMode && (
          <PdfToolbar
            currentTool={currentTool}
            onToolChange={setCurrentTool}
            currentColor={currentColor}
            onColorChange={setCurrentColor}
            canSave={hasChanges}
            onSave={handleSaveMarkup}
            statusTab="draft"
          />
        )}
      </div>

      {/* Footer Bar */}
      <div className={styles.modalFooter}>
        <div className={styles.footerLeft}>
          <span className={styles.annotationCount}>
            {annotations.length} annotations
          </span>
        </div>

        <div className={styles.footerRight}>
          <Button
            variant={isAnnotationMode ? "primary" : "secondary"}
            onClick={handleToggleAnnotationMode}
            className={styles.toolsButton}
          >
            Tools
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PdfFullScreenModal;
