import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import logger from '../../services/devLogger';
import surveyService from '../../services/surveyService';
import axiosInstance from '../../api/axiosInstance';
import { getPreviewUrl, getThumbUrl } from '../../utils/photoUtils';
import styles from '../../styles/PhotoPanelViewer.module.css';

/**
 * PhotoPanelViewer - Inline photo viewer for right panel
 * Replaces full-screen modal with panel-based viewing
 * Allows users to view photos while working on forms to the left
 */
const PhotoPanelViewer = ({
  media,
  currentIndex,
  onClose,
  onNavigate,
  onUpdatePhoto,
  projectUuid,
  mediaType = 'photo',
  zoom,
  pan,
  rotation = 0,
  setZoom,
  setPan
}) => {
  const currentItem = media[currentIndex];
  const [editData, setEditData] = useState({
    fileName: currentItem?.fileName || currentItem?.filename || '',
    section: currentItem?.section || '',
    tag: currentItem?.tag || '',
    note: currentItem?.originalNotes || ''
  });
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const imageContainerRef = useRef(null);
  const imageRef = useRef(null);

  // Rotary scroll state for image navigation
  const [isRotaryScrolling, setIsRotaryScrolling] = useState(false);
  const rotaryStartRef = useRef({ x: 0, accumulatedDelta: 0, velocity: 0, lastTime: 0, lastX: 0 });
  const momentumAnimationRef = useRef(null);

  // Carousel drag-to-scroll state
  const [isCarouselDragging, setIsCarouselDragging] = useState(false);
  const carouselRef = useRef(null);
  const carouselScrollStartRef = useRef({ scrollLeft: 0, clientX: 0 });

  // Fetch categories on mount
  useEffect(() => {
    console.log('🎨 PhotoPanelViewer MOUNTED');
    const fetchCategories = async () => {
      try {
        console.log('🎨 Fetching categories from /api/media-categories');
        const res = await axiosInstance.get('/api/media-categories');
        console.log('🎨 Categories response:', res.data);
        if (res.data?.status === 'SUCCESS') {
          console.log('🎨 Setting categories:', res.data.data);
          setCategories(res.data.data);
        }
      } catch (error) {
        console.error('🎨 Failed to fetch categories:', error);
        logger.error('PhotoPanelViewer', 'Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Reset edit data when photo changes or categories load
  useEffect(() => {
    console.log('🎨 Photo change effect triggered', { hasCurrentItem: !!currentItem, categoriesCount: categories.length });
    if (currentItem) {
      console.log('🎨 Photo changed - FULL DATA:', currentItem);
      console.log('🎨 Photo metadata:', {
        id: currentItem.id,
        filename: currentItem.fileName || currentItem.filename,
        section: currentItem.section,
        tag: currentItem.tag,
        note: currentItem.originalNotes,
        hasUrl: !!currentItem.url,
        categoriesLoaded: categories.length > 0,
        availableCategories: categories.map(c => c.label)
      });
      logger.log('PhotoPanelViewer', 'Photo changed - FULL DATA:', currentItem);
      logger.log('PhotoPanelViewer', 'Photo metadata:', {
        id: currentItem.id,
        filename: currentItem.fileName || currentItem.filename,
        section: currentItem.section,
        tag: currentItem.tag,
        note: currentItem.originalNotes,
        hasUrl: !!currentItem.url,
        categoriesLoaded: categories.length > 0,
        availableCategories: categories.map(c => c.label)
      });

      // Find matching category value, handling singular/plural mismatch
      let sectionValue = currentItem.section || '';
      if (sectionValue && categories.length > 0) {
        // Try exact match first
        let matchingCategory = categories.find(cat => cat.value === sectionValue);

        // If no exact match, try singular/plural variants
        if (!matchingCategory) {
          // Try adding 's' for plural
          matchingCategory = categories.find(cat => cat.value === sectionValue + 's');
          if (matchingCategory) {
            sectionValue = matchingCategory.value;
            console.log('🎨 Matched plural variant:', sectionValue);
          } else {
            // Try removing 's' for singular
            matchingCategory = categories.find(cat => cat.value === sectionValue.replace(/s$/, ''));
            if (matchingCategory) {
              sectionValue = matchingCategory.value;
              console.log('🎨 Matched singular variant:', sectionValue);
            }
          }
        }
      }

      setEditData({
        fileName: currentItem.fileName || currentItem.filename || '',
        section: sectionValue,
        tag: currentItem.tag || '',
        note: currentItem.originalNotes || ''
      });
    }
  }, [currentItem?.id, categories]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await surveyService.photos.updateMetadata(projectUuid, currentItem.id, {
        fileName: editData.fileName,
        section: editData.section,
        tag: editData.tag,
        note: editData.note
      });
      onUpdatePhoto(currentItem.id, editData);
      toast.success('Photo updated');
    } catch (error) {
      toast.error('Failed to save changes');
      logger.error('PhotoPanelViewer', 'Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  // Scroll wheel zoom handler
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 5));
  }, [setZoom]);

  // Pan and rotary scroll handlers
  const handleMouseDown = (e) => {
    // Cancel any ongoing momentum animation
    if (momentumAnimationRef.current) {
      cancelAnimationFrame(momentumAnimationRef.current);
      momentumAnimationRef.current = null;
    }

    if (zoom > 1) {
      // When zoomed in, enable panning
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      };
    } else {
      // When not zoomed, enable rotary scrolling
      setIsRotaryScrolling(true);
      const now = Date.now();
      rotaryStartRef.current = {
        x: e.clientX,
        accumulatedDelta: 0,
        velocity: 0,
        lastTime: now,
        lastX: e.clientX
      };
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
    } else if (isRotaryScrolling) {
      const now = Date.now();
      const deltaX = e.clientX - rotaryStartRef.current.x;
      const deltaTime = now - rotaryStartRef.current.lastTime;

      // Calculate velocity (px/ms)
      if (deltaTime > 0) {
        rotaryStartRef.current.velocity = (e.clientX - rotaryStartRef.current.lastX) / deltaTime;
      }

      rotaryStartRef.current.accumulatedDelta += deltaX;
      rotaryStartRef.current.x = e.clientX;
      rotaryStartRef.current.lastX = e.clientX;
      rotaryStartRef.current.lastTime = now;

      // Navigate when accumulated delta exceeds threshold (100px)
      const threshold = 100;
      if (Math.abs(rotaryStartRef.current.accumulatedDelta) >= threshold) {
        const direction = rotaryStartRef.current.accumulatedDelta > 0 ? 1 : -1;
        onNavigate(direction);
        rotaryStartRef.current.accumulatedDelta = 0;
      }
    }
  };

  const applyMomentum = useCallback(() => {
    const friction = 0.92; // Apple-like friction - slightly more aggressive
    const minVelocity = 5; // Minimum velocity threshold (px/s)
    const threshold = 80; // Slightly lower threshold for more responsive feel
    const velocityMultiplier = 2.5; // Amplify velocity for more dramatic effect

    let currentVelocity = rotaryStartRef.current.velocity * 1000 * velocityMultiplier; // Convert to px/s and amplify
    let accumulatedDelta = rotaryStartRef.current.accumulatedDelta;
    let lastTimestamp = performance.now();

    const animate = (timestamp) => {
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      // More natural deceleration
      if (Math.abs(currentVelocity) < minVelocity) {
        momentumAnimationRef.current = null;
        rotaryStartRef.current.accumulatedDelta = 0;
        return;
      }

      // Apply friction based on actual time delta for consistent physics
      const frameFriction = Math.pow(friction, deltaTime / 16.67);
      currentVelocity *= frameFriction;

      // Accumulate delta based on velocity and time
      const deltaX = (currentVelocity * deltaTime) / 1000;
      accumulatedDelta += deltaX;

      // Navigate when threshold is exceeded
      if (Math.abs(accumulatedDelta) >= threshold) {
        const direction = accumulatedDelta > 0 ? 1 : -1;
        onNavigate(direction);
        accumulatedDelta = 0;
      }

      rotaryStartRef.current.accumulatedDelta = accumulatedDelta;
      momentumAnimationRef.current = requestAnimationFrame(animate);
    };

    momentumAnimationRef.current = requestAnimationFrame(animate);
  }, [onNavigate]);

  const handleMouseUp = () => {
    if (isRotaryScrolling) {
      // Start momentum animation if velocity is significant
      if (Math.abs(rotaryStartRef.current.velocity) > 0.5) {
        applyMomentum();
      }
    }

    setIsPanning(false);
    setIsRotaryScrolling(false);
  };

  // Carousel drag-to-scroll handlers
  const handleCarouselMouseDown = (e) => {
    setIsCarouselDragging(true);
    carouselScrollStartRef.current = {
      scrollLeft: carouselRef.current.scrollLeft,
      clientX: e.clientX
    };
  };

  const handleCarouselMouseMove = (e) => {
    if (!isCarouselDragging) return;
    e.preventDefault();
    const dx = e.clientX - carouselScrollStartRef.current.clientX;
    carouselRef.current.scrollLeft = carouselScrollStartRef.current.scrollLeft - dx;
  };

  const handleCarouselMouseUp = () => {
    setIsCarouselDragging(false);
  };

  // Track hovered thumbnail for size expansion
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onNavigate) onNavigate(-1);
      if (e.key === 'ArrowRight' && onNavigate) onNavigate(1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigate]);

  // Cleanup momentum animation on unmount
  useEffect(() => {
    return () => {
      if (momentumAnimationRef.current) {
        cancelAnimationFrame(momentumAnimationRef.current);
      }
    };
  }, []);

  if (!currentItem) {
    return <div className={styles.emptyState}>No photo selected</div>;
  }

  // Use optimized preview for viewing (~300KB vs 4MB full resolution)
  const photoUrl = getPreviewUrl(currentItem);

  return (
    <div className={styles.viewerContainer}>
      {/* Top section - Image viewer and metadata panel side by side */}
      <div className={styles.topSection}>
        {/* Left sidebar - Metadata panel */}
        <div className={styles.metadataPanel}>
          <div className={styles.metadataBody}>
            <div className={styles.formGroup}>
              <input
                type="text"
                className={styles.input}
                value={editData.fileName}
                onChange={(e) => setEditData({ ...editData, fileName: e.target.value })}
                placeholder="Filename"
              />
            </div>

            <div className={styles.formGroup}>
              <select
                className={styles.input}
                value={editData.section}
                onChange={(e) => setEditData({ ...editData, section: e.target.value })}
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.uuid} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <input
                type="text"
                className={styles.input}
                value={editData.tag}
                onChange={(e) => setEditData({ ...editData, tag: e.target.value })}
                placeholder="Tag"
              />
            </div>

            <div className={styles.formGroup}>
              <textarea
                className={styles.textarea}
                value={editData.note}
                onChange={(e) => setEditData({ ...editData, note: e.target.value })}
                placeholder="Notes..."
                rows={4}
              />
            </div>
          </div>

          <div className={styles.metadataFooter}>
            <button
              className={styles.saveButton}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Right side - Image viewer */}
        <div className={styles.imageViewerSection}>
          {/* Image container with zoom/pan */}
          <div
            ref={imageContainerRef}
            className={styles.imageContainer}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              className={styles.imageWrapper}
              style={{
                transform: `rotate(${rotation}deg) scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transition: (isPanning || isRotaryScrolling) ? 'none' : 'transform 0.3s ease-out',
                cursor: zoom > 1
                  ? (isPanning ? 'grabbing' : 'grab')
                  : (isRotaryScrolling ? 'grabbing' : 'grab')
              }}
            >
              <img
                ref={imageRef}
                src={photoUrl}
                alt={currentItem.fileName || currentItem.filename || 'Photo'}
                className={styles.image}
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer with thumbnail carousel - full width */}
      <div className={styles.footer}>
        <div
          ref={carouselRef}
          className={styles.thumbnailCarousel}
          onMouseDown={handleCarouselMouseDown}
          onMouseMove={handleCarouselMouseMove}
          onMouseUp={handleCarouselMouseUp}
          onMouseLeave={handleCarouselMouseUp}
        >
          {media.map((item, index) => {
            // Use optimized thumbnail for carousel (~40KB vs 4MB)
            const thumbnailUrl = getThumbUrl(item);
            const isActive = index === currentIndex;

            // Calculate size tier based on hover (if hovering) or selection (if not)
            const targetIndex = hoveredIndex !== null ? hoveredIndex : currentIndex;
            const distance = Math.abs(index - targetIndex);

            // Apply size classes based on distance from target (hover or selection)
            // When hovering, ONLY the hovered thumbnail gets sizing, not the selected one
            const shouldApplyActiveSize = hoveredIndex !== null
              ? index === hoveredIndex
              : isActive;
            const isAdjacent = distance === 1;
            const isSecondary = distance === 2;

            return (
              <button
                key={item.id || index}
                className={`${styles.thumbnail} ${shouldApplyActiveSize ? styles.thumbnailActive : ''} ${isAdjacent ? styles.thumbnailAdjacent : ''} ${isSecondary ? styles.thumbnailSecondary : ''}`}
                onClick={() => onNavigate(index - currentIndex)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                title={item.fileName || item.filename || `Photo ${index + 1}`}
              >
                <img
                  src={thumbnailUrl}
                  alt={item.fileName || item.filename || `Thumbnail ${index + 1}`}
                  className={styles.thumbnailImage}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PhotoPanelViewer;
