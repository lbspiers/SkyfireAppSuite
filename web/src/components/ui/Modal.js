import React, { useEffect, useCallback } from 'react';
import styles from './Modal.module.css';

const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  footer = null,        // React node for footer buttons
  size = 'md',          // sm, md, lg, xl, full
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  scopedToPanel = false, // If true, position relative to parent panel instead of viewport
  contained = false,     // If true, renders within parent container instead of viewport
}) => {
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape' && closeOnEscape && onClose) {
      onClose();
    }
  }, [closeOnEscape, onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlay && onClose) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Only lock body scroll for full-page modals
      if (!contained) {
        document.body.style.overflow = 'hidden';
      }
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (!contained) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, handleEscape, contained]);

  if (!isOpen) return null;

  return (
    <div
      className={`${styles.overlay} ${scopedToPanel ? styles.panelScoped : ''} ${contained ? styles.overlayContained : ''}`}
      onClick={handleOverlayClick}
    >
      <div
        className={`${styles.modal} ${styles[size]} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {(title || showCloseButton) && (
          <div className={styles.header}>
            {title && <h2 id="modal-title" className={styles.title}>{title}</h2>}
            {showCloseButton && (
              <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close modal"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        )}

        <div className={styles.body}>
          {children}
        </div>

        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
