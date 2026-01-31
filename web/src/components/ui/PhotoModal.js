import React, { useState, useRef } from 'react';
import Modal from './Modal';
import Button from './Button';
import styles from './PhotoModal.module.css';

/**
 * PhotoModal - Full-screen photo viewer with zoom/pan
 *
 * Features:
 * - Zoom in/out with buttons or mouse wheel
 * - Pan when zoomed (drag to move)
 * - Reset to original size
 * - Escape key to close
 * - Click overlay to close
 *
 * @param {Object} photo - Photo object with url and name
 * @param {Function} onClose - Close handler
 */
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

  return (
    <Modal
      isOpen={!!photo}
      onClose={onClose}
      size="full"
      showCloseButton={false}
      closeOnOverlay={true}
      closeOnEscape={true}
      className={styles.photoModal}
    >
      <div
        className={styles.modalContent}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Close button - top right */}
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close photo viewer"
          title="Close (ESC)"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Zoom controls */}
        <div className={styles.zoomControls}>
          <Button
            variant="ghost"
            onClick={handleZoomOut}
            disabled={scale <= MIN_SCALE}
            title="Zoom Out"
            className={styles.zoomButton}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
              <path d="M8 11h6"/>
            </svg>
          </Button>

          <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>

          <Button
            variant="ghost"
            onClick={handleZoomIn}
            disabled={scale >= MAX_SCALE}
            title="Zoom In"
            className={styles.zoomButton}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
              <path d="M11 8v6M8 11h6"/>
            </svg>
          </Button>

          <Button
            variant="ghost"
            onClick={handleReset}
            disabled={scale === MIN_SCALE && position.x === 0 && position.y === 0}
            title="Reset Zoom"
            className={styles.resetButton}
          >
            Reset
          </Button>
        </div>

        {/* Image container */}
        <div
          ref={containerRef}
          className={styles.imageContainer}
          onWheel={handleWheel}
        >
          <img
            ref={imageRef}
            src={photo?.url}
            alt={photo?.name || 'Photo'}
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
        {photo?.name && (
          <div className={styles.photoInfo}>
            {photo.name}
          </div>
        )}

        {/* Hint text */}
        <div className={styles.hintText}>
          Use scroll wheel to zoom • Drag to pan when zoomed • ESC to close
        </div>
      </div>
    </Modal>
  );
};

export default PhotoModal;
