import React, { useState, useEffect, useRef } from 'react';
import styles from './PhotoModal.module.css';

const PhotoModal = ({ photo, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const MIN_SCALE = 1;
  const MAX_SCALE = 5;
  const ZOOM_STEP = 0.25;

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newScale = Math.min(Math.max(scale + delta, MIN_SCALE), MAX_SCALE);

    if (newScale !== scale) {
      setScale(newScale);

      // Reset position when zooming back to 1x
      if (newScale === MIN_SCALE) {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  // Handle zoom in button
  const handleZoomIn = () => {
    const newScale = Math.min(scale + ZOOM_STEP, MAX_SCALE);
    setScale(newScale);
  };

  // Handle zoom out button
  const handleZoomOut = () => {
    const newScale = Math.max(scale - ZOOM_STEP, MIN_SCALE);
    setScale(newScale);

    // Reset position when zooming back to 1x
    if (newScale === MIN_SCALE) {
      setPosition({ x: 0, y: 0 });
    }
  };

  // Handle reset zoom
  const handleReset = () => {
    setScale(MIN_SCALE);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    if (scale > MIN_SCALE) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > MIN_SCALE) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle background click to close
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={handleBackgroundClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className={styles.modalContent}>
        {/* Close button */}
        <button className={styles.closeButton} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Zoom controls */}
        <div className={styles.zoomControls}>
          <button
            className={styles.zoomButton}
            onClick={handleZoomOut}
            disabled={scale <= MIN_SCALE}
            title="Zoom Out"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
              <path d="M8 11h6"/>
            </svg>
          </button>

          <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>

          <button
            className={styles.zoomButton}
            onClick={handleZoomIn}
            disabled={scale >= MAX_SCALE}
            title="Zoom In"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
              <path d="M11 8v6M8 11h6"/>
            </svg>
          </button>

          <button
            className={styles.resetButton}
            onClick={handleReset}
            disabled={scale === MIN_SCALE && position.x === 0 && position.y === 0}
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>

        {/* Image container */}
        <div
          ref={containerRef}
          className={styles.imageContainer}
          onWheel={handleWheel}
        >
          <img
            ref={imageRef}
            src={photo.url}
            alt={photo.name || 'Photo'}
            className={styles.image}
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              cursor: scale > MIN_SCALE ? (isDragging ? 'grabbing' : 'grab') : 'default',
            }}
            onMouseDown={handleMouseDown}
            draggable={false}
          />
        </div>

        {/* Photo info */}
        {photo.name && (
          <div className={styles.photoInfo}>
            {photo.name}
          </div>
        )}

        {/* Hint text */}
        <div className={styles.hintText}>
          Use scroll wheel to zoom • Drag to pan when zoomed • ESC to close
        </div>
      </div>
    </div>
  );
};

export default PhotoModal;
