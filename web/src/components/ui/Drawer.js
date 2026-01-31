import React, { useEffect } from 'react';
import styles from './Drawer.module.css';

const Drawer = ({
  isOpen = false,
  onClose,
  position = 'right',      // left, right, top, bottom
  size = 'md',             // sm, md, lg, xl, full
  title,
  children,
  footer,
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeOnEscape, onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlay && onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        className={`
          ${styles.drawer}
          ${styles[position]}
          ${styles[size]}
          ${className}
        `.trim()}
        role="dialog"
        aria-modal="true"
      >
        {(title || showCloseButton) && (
          <div className={styles.header}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {showCloseButton && (
              <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close drawer"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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

export default Drawer;
