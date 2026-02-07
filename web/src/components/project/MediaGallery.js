import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import * as Icons from 'lucide-react';
import logger from '../../services/devLogger';
import surveyService from '../../services/surveyService';
import useMediaSocket from '../../hooks/useMediaSocket';
import uploadManager from '../../services/uploadManager';
import axiosInstance from '../../api/axiosInstance';
import { Button, SectionHeader, Dropdown } from '../ui';
import PhotoPlaceholder from './PhotoPlaceholder';
import VideoPlaceholder from './VideoPlaceholder';
import PhotoAnnotationLayer from '../survey/PhotoAnnotationLayer';
import PhotoToolbar from '../survey/PhotoToolbar';
import PerformanceMonitor from '../debug/PerformanceMonitor';
import MediaListView from './MediaListView';
import CategoryManager from '../survey/CategoryManager';
import { mockPhotos, mockVideos, EQUIPMENT_CATEGORIES } from '../../mockData/surveyMockData';
import { PHOTO_SECTIONS, SECTION_CATEGORIES, formatSectionLabel, getSectionsByCategory } from '../../constants/photoSections';
import { downloadMultipleFiles } from '../../utils/fileDownload';
import { getFullUrl, getPreviewUrl, getThumbUrl } from '../../utils/photoUtils';
import styles from '../../styles/MediaGallery.module.css';

// Toggle for development - set to false to use real backend data
const USE_MOCK_DATA = false;

// Helper function to get friendly label for section type
const getSectionTypeLabel = (sectionType) => {
  return sectionType.split('_').map(
    word => word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Helper function to get section label from full ID (e.g., "solar_panel_1" → "Solar Panel 1")
const getSectionLabel = (sectionId) => {
  const match = sectionId.match(/_(\d+)$/);
  const number = match ? match[1] : '';
  const baseName = sectionId.replace(/_\d+$/, '').split('_').map(
    word => word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  return number ? `${baseName} ${number}` : baseName;
};

const MediaGallery = ({
  projectUuid,
  mediaType = 'photo',
  gridSize = 'medium',
  viewMode = 'grid',
  onCountChange,
  uploadTrigger = 0,
  enableUploads = true,
  onTabSwitch,
  enableDragReorganize = true,
  onPhotoClick, // NEW: callback for inline photo viewer instead of modal
}) => {
  const [media, setMedia] = useState(USE_MOCK_DATA ? (mediaType === 'photo' ? mockPhotos : mockVideos) : []);
  const [loading, setLoading] = useState(!USE_MOCK_DATA);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' or section name (e.g., 'solar_panel', 'inverter')
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [perfMonitorEnabled, setPerfMonitorEnabled] = useState(false);
  const [categories, setCategories] = useState([]);

  const fileInputRef = useRef(null);
  const lastSelectedRef = useRef(null);

  // Performance Monitor Toggle - Press Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setPerfMonitorEnabled(prev => !prev);
        logger.log('MediaGallery', `Performance Monitor ${!perfMonitorEnabled ? 'ENABLED' : 'DISABLED'}`);
        toast.info(`Performance Monitor ${!perfMonitorEnabled ? 'Enabled' : 'Disabled'} (Ctrl+Shift+P to toggle)`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [perfMonitorEnabled]);

  // Fetch media categories from API on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get('/api/media-categories');
        if (res.data?.status === 'SUCCESS') {
          setCategories(res.data.data);
        }
      } catch (err) {
        logger.warn('MediaGallery', 'Failed to fetch categories, using defaults:', err);
        // Fallback to PHOTO_SECTIONS constant
        setCategories(PHOTO_SECTIONS.map(s => ({
          ...s,
          parent_category: s.category,
          is_default: true,
          uuid: s.value
        })));
      }
    };
    fetchCategories();
  }, []);

  // Trigger upload when uploadTrigger changes (only if uploads are enabled)
  useEffect(() => {
    if (enableUploads && uploadTrigger > 0) {
      fileInputRef.current?.click();
    }
  }, [uploadTrigger, enableUploads]);

  // Fetch media function - defined before useEffect to avoid initialization error
  const fetchMedia = useCallback(async () => {
    if (!projectUuid) {
      logger.warn('MediaGallery', 'No projectUuid provided');
      return;
    }

    // Use mock data in development mode
    if (USE_MOCK_DATA) {
      setLoading(true);
      // Simulate loading delay for realistic UX
      setTimeout(() => {
        if (mediaType === 'both') {
          setMedia([...mockPhotos, ...mockVideos]);
        } else {
          setMedia(mediaType === 'photo' ? mockPhotos : mockVideos);
        }
        setLoading(false);
      }, 500);
      return;
    }

    // Real backend data fetch using surveyService
    setLoading(true);
    try {
      logger.log('MediaGallery', `[Fetch] Starting fetch for ProjectUuid: ${projectUuid}, MediaType: ${mediaType}`);

      let data = [];

      if (mediaType === 'both') {
        // Fetch both photos and videos
        const [photos, videos] = await Promise.all([
          surveyService.photos.list(projectUuid),
          surveyService.videos.list(projectUuid)
        ]);
        data = [...photos, ...videos];
        logger.log('MediaGallery', `[Fetch] SUCCESS - Fetched ${photos.length} photos and ${videos.length} videos`);
      } else {
        const api = mediaType === 'photo' ? surveyService.photos : surveyService.videos;
        logger.log('MediaGallery', `[Fetch] Using API: surveyService.${mediaType}s.list()`);
        data = await api.list(projectUuid);
        logger.log('MediaGallery', `[Fetch] SUCCESS - Fetched ${data.length} ${mediaType}s`);
      }

      setMedia(data);
    } catch (error) {
      logger.error('MediaGallery', `[Fetch] ERROR fetching ${mediaType}s:`, error);
      toast.error(`Failed to load media: ${error.message}`);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }, [projectUuid, mediaType]);

  // Fetch media on mount
  useEffect(() => {
    if (projectUuid) {
      fetchMedia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectUuid, mediaType]);

  // Real-time socket listener for new uploads
  useMediaSocket(projectUuid, useCallback((data) => {
    // Add if it matches our current media type, or if we're showing both types
    const shouldAdd = mediaType === 'both' || data.mediaType === mediaType;

    if (shouldAdd) {
      logger.log('MediaGallery', `[Socket] New ${data.mediaType} uploaded:`, data.media);

      // Add new media to the beginning of the list
      setMedia(prev => [data.media, ...prev]);

      // Show toast notification
      toast.success(`New ${data.mediaType} uploaded by ${data.media.uploadedBy || 'surveyor'}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  }, [mediaType]));

  // Get unique section types from media (e.g., "solar_panel", "inverter", etc.)
  const sectionTypes = useMemo(() => {
    const types = new Set();
    media.forEach(item => {
      if (item.section) {
        // Extract base type (e.g., "solar_panel_1" -> "solar_panel")
        const baseType = item.section.replace(/_\d+$/, '');
        types.add(baseType);
      }
    });
    return Array.from(types).sort();
  }, [media]);

  // Group photos by full section ID for display
  const photosBySection = useMemo(() => {
    const grouped = {};

    media.forEach(item => {
      if (item.section) {
        if (!grouped[item.section]) {
          grouped[item.section] = [];
        }
        grouped[item.section].push(item);
      }
    });

    return grouped;
  }, [media]);

  // Get filtered sections based on active filter
  const filteredSectionIds = useMemo(() => {
    if (activeFilter === 'all') {
      return Object.keys(photosBySection).sort();
    }

    // Filter to sections that start with the selected type
    return Object.keys(photosBySection)
      .filter(sectionId => sectionId.startsWith(activeFilter))
      .sort();
  }, [activeFilter, photosBySection]);

  // Get filtered media for lightbox
  const filteredMedia = useMemo(() => {
    return filteredSectionIds.flatMap(sectionId => photosBySection[sectionId] || []);
  }, [filteredSectionIds, photosBySection]);

  // Report media count to parent
  useEffect(() => {
    if (onCountChange) {
      onCountChange(media.length);
    }
  }, [media.length, onCountChange]);

  // Selection handlers
  const handleSelect = (id, event) => {
    const newSelected = new Set(selectedIds);

    // Shift+click for range selection
    if (event.shiftKey && lastSelectedRef.current !== null) {
      const currentIndex = media.findIndex(m => m.id === id);
      const lastIndex = media.findIndex(m => m.id === lastSelectedRef.current);
      const [start, end] = [Math.min(currentIndex, lastIndex), Math.max(currentIndex, lastIndex)];

      for (let i = start; i <= end; i++) {
        newSelected.add(media[i].id);
      }
    } else {
      // Toggle selection
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
    }

    lastSelectedRef.current = id;
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredMedia.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMedia.map(m => m.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    lastSelectedRef.current = null;
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedIds.size} ${mediaType}${selectedIds.size > 1 ? 's' : ''}?`
    );

    if (!confirmed) return;

    try {
      const api = mediaType === 'photo' ? surveyService.photos : surveyService.videos;
      await api.bulkDelete(projectUuid, Array.from(selectedIds));

      setMedia(prev => prev.filter(m => !selectedIds.has(m.id)));
      clearSelection();
      toast.success(`Deleted ${selectedIds.size} ${mediaType}${selectedIds.size > 1 ? 's' : ''}`);
    } catch (error) {
      logger.error('MediaGallery', 'Error deleting media:', error);
      toast.error(`Failed to delete ${mediaType}s. Please try again.`);
    }
  };

  // Delete single item
  const handleDeleteOne = async (itemId) => {
    const confirmed = window.confirm(
      `Delete this ${mediaType}?`
    );

    if (!confirmed) return;

    try {
      const api = mediaType === 'photo' ? surveyService.photos : surveyService.videos;
      await api.deleteOne(projectUuid, itemId);

      setMedia(prev => prev.filter(m => m.id !== itemId));
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      toast.success(`Deleted ${mediaType}`);
    } catch (error) {
      logger.error('MediaGallery', `Error deleting ${mediaType}:`, error);
      toast.error(`Failed to delete ${mediaType}. Please try again.`);
    }
  };

  // Bulk move to section
  const handleBulkMoveToSection = async (newSection) => {
    if (selectedIds.size === 0) return;

    const photoIds = Array.from(selectedIds);

    // Optimistic UI update
    setMedia(prev => prev.map(photo =>
      selectedIds.has(photo.id) ? { ...photo, section: newSection } : photo
    ));

    try {
      // Use bulk update if available, otherwise individual updates
      await Promise.all(
        photoIds.map(photoId =>
          surveyService.photos.updateMetadata(projectUuid, photoId, { section: newSection })
        )
      );

      clearSelection();
      toast.success(`Moved ${photoIds.length} photo${photoIds.length > 1 ? 's' : ''} to ${formatSectionLabel(newSection)}`);
    } catch (error) {
      // Revert on failure
      await fetchMedia();
      toast.error('Failed to move photos');
      logger.error('MediaGallery', 'Bulk move failed:', error);
    }
  };

  // Download selected media
  const handleDownloadSelected = async () => {
    if (selectedIds.size === 0) {
      toast.warning('No files selected');
      return;
    }

    const selectedFiles = media.filter(m => selectedIds.has(m.id));

    await downloadMultipleFiles(selectedFiles, {
      getUrl: (file) => getFullUrl(file), // Use full resolution for downloads
      getName: (file) => file.fileName || file.filename || file.name || file.original_filename || `${mediaType}_${file.id}`,
      componentName: 'MediaGallery',
      delayMs: 300,
    });
  };

  // Update photo metadata (for lightbox edits)
  const handleUpdatePhoto = (photoId, updates) => {
    setMedia(prev => prev.map(photo =>
      photo.id === photoId ? { ...photo, ...updates } : photo
    ));
  };

  // Update metadata (for list view inline editing)
  const handleUpdateMetadata = async (itemId, updates) => {
    try {
      const api = mediaType === 'photo' ? surveyService.photos : surveyService.videos;
      await api.updateMetadata(projectUuid, itemId, updates);

      // Update local state
      setMedia(prev => prev.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ));

      toast.success('Updated successfully');
    } catch (error) {
      logger.error('MediaGallery', 'Failed to update metadata:', error);
      toast.error('Failed to update. Please try again.');
    }
  };

  // CategoryManager handlers
  const handleCategoryAdded = useCallback((newCat) => {
    setCategories(prev => [...prev, newCat]);
  }, []);

  const handleCategoryDeleted = useCallback((uuid) => {
    setCategories(prev => prev.filter(c => c.uuid !== uuid));
  }, []);

  // Upload handlers (only active if uploads are enabled)
  const handleUpload = () => {
    if (enableUploads) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e) => {
    if (!enableUploads) return;
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    await uploadFiles(files);
    e.target.value = '';
  };

  const uploadFiles = async (files) => {
    if (!enableUploads || !files.length) return;

    logger.log('MediaGallery', `Enqueuing ${files.length} files to uploadManager`);

    // Enqueue files to global uploadManager
    uploadManager.enqueue(files, projectUuid);

    // Subscribe to completion event to refresh media list
    const unsubscribe = uploadManager.subscribe((event, data) => {
      if (event === 'upload:complete') {
        logger.log('MediaGallery', 'Upload batch complete, refreshing media list');
        fetchMedia();
        unsubscribe(); // Clean up subscription
      }
    });
  };

  // Drag & drop (only active if uploads are enabled)
  const handleDragOver = (e) => {
    e.preventDefault();
    if (enableUploads) {
      setDragActive(true);
    }
  };

  const handleDragLeave = () => {
    if (enableUploads) {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!enableUploads) return;
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(
      f => mediaType === 'video' ? f.type.startsWith('video/') : f.type.startsWith('image/')
    );
    if (files.length > 0) uploadFiles(files);
  };

  // Lightbox navigation - use callback if provided, otherwise use modal
  const openLightbox = (index) => {
    if (onPhotoClick) {
      // Use inline viewer in panel
      onPhotoClick(filteredMedia, index);
    } else {
      // Use modal (legacy behavior)
      setLightboxIndex(index);
    }
  };
  const closeLightbox = () => setLightboxIndex(null);

  const navigateLightbox = (direction) => {
    setLightboxIndex(prev => {
      const newIndex = prev + direction;
      if (newIndex < 0) return filteredMedia.length - 1;
      if (newIndex >= filteredMedia.length) return 0;
      return newIndex;
    });
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex]);

  // Animation variants
  const gridVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.03 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <div className={styles.galleryContainer}>
      {/* Performance Monitor - Toggle with Ctrl+Shift+P */}
      <PerformanceMonitor projectUuid={projectUuid} enabled={perfMonitorEnabled} />

      {/* Filter Row - directly below sub-tabs */}
      <div className={styles.filterRow}>
        <button
          className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.active : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All
        </button>
        {sectionTypes.map(sectionType => (
          <button
            key={sectionType}
            className={`${styles.filterBtn} ${activeFilter === sectionType ? styles.active : ''}`}
            onClick={() => setActiveFilter(sectionType)}
          >
            {getSectionTypeLabel(sectionType)}
          </button>
        ))}
      </div>

      {/* CategoryManager - Custom categories with Claude AI suggestions */}
      <CategoryManager
        categories={categories}
        onCategoryAdded={handleCategoryAdded}
        onCategoryDeleted={handleCategoryDeleted}
      />

      {/* Selection toolbar - shown when items are selected */}
      {selectedIds.size > 0 && (
        <motion.div
          className={styles.selectionToolbar}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
        >
          <span className={styles.selectionCount}>
            <CheckIcon className={styles.checkIcon} />
            {selectedIds.size} selected
          </span>

          <div className={styles.selectionActions}>
            {/* Move to Section - Grouped Dropdown - Show for photos or mixed mode */}
            {(mediaType === 'photo' || mediaType === 'both') && (
              <Dropdown
                trigger={
                  <Button variant="secondary" size="sm">
                    <Icons.Folder size={14} />
                    Move to Section
                    <Icons.ChevronDown size={14} />
                  </Button>
                }
                align="left"
                closeOnClick={true}
              >
                <div className={styles.sectionDropdown}>
                  {SECTION_CATEGORIES.map(category => (
                    <div key={category.value}>
                      <Dropdown.Label>{category.label}</Dropdown.Label>
                      {getSectionsByCategory(category.value).map(section => {
                        const IconComponent = Icons[section.icon] || Icons.Folder;
                        return (
                          <Dropdown.Item
                            key={section.value}
                            icon={<IconComponent size={14} />}
                            onClick={() => handleBulkMoveToSection(section.value)}
                          >
                            {section.label}
                          </Dropdown.Item>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </Dropdown>
            )}

            <Button variant="secondary" size="sm" onClick={handleDownloadSelected}>
              <Icons.Download size={14} /> Download
            </Button>

            <Button variant="secondary" size="sm" onClick={clearSelection}>
              Clear
            </Button>

            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
              <TrashIcon /> Delete ({selectedIds.size})
            </Button>
          </div>
        </motion.div>
      )}

      {/* Hidden file input (only if uploads enabled) */}
      {enableUploads && (
        <input
          ref={fileInputRef}
          type="file"
          accept={mediaType === 'video' ? 'video/*' : 'image/*'}
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      )}

      {/* Content */}
      {loading ? (
        <div className={styles.loadingGrid}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={styles.loadingSkeleton} />
          ))}
        </div>
      ) : media.length === 0 ? (
        enableUploads ? (
          <div
            className={`${styles.uploadZone} ${dragActive ? styles.dragActive : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleUpload}
          >
            <UploadIcon className={styles.uploadIcon} />
            <span className={styles.uploadText}>
              Drag & drop {mediaType}s here, or click to upload
            </span>
            <span className={styles.uploadHint}>
              Supports {mediaType === 'video' ? 'MP4, MOV, WebM' : 'JPG, PNG, HEIC, WebP'} files
            </span>
          </div>
        ) : (
          <div className={styles.emptyState}>
            {mediaType === 'photo' ? <PhotoIcon className={styles.emptyIcon} /> : <VideoIcon className={styles.emptyIcon} />}
            <h3 className={styles.emptyTitle}>No {mediaType === 'both' ? 'photos or videos' : `${mediaType}s`} yet</h3>
            <p className={styles.emptyMessage}>
              Upload {mediaType === 'both' ? 'photos or videos' : `${mediaType}s`} on the{' '}
              <button
                className={styles.tabLink}
                onClick={() => onTabSwitch?.()}
              >
                Files
              </button>
              {' '}tab
            </p>
          </div>
        )
      ) : viewMode === 'list' ? (
        /* LIST VIEW */
        <MediaListView
          media={filteredMedia}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onDelete={handleDeleteOne}
          onEdit={handleUpdateMetadata}
          onLightboxOpen={openLightbox}
        />
      ) : (
        /* GRID VIEW */
        <div
          className={styles.sectionList}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {filteredSectionIds.map(sectionId => {
            const sectionItems = photosBySection[sectionId] || [];

            return (
              <div key={sectionId} className={styles.section}>
                {/* Section Header */}
                <SectionHeader title={getSectionLabel(sectionId)} />

                {/* Photo Grid */}
                <div className={`${styles.photoGrid} ${styles[`grid-${gridSize}`]}`}>
                  {sectionItems.map((item) => {
                    const itemIndex = filteredMedia.findIndex(m => m.id === item.id);
                    // Determine if this item is a video based on type field or duration presence
                    const isVideo = item.type === 'video' || item.mediaType === 'video' || (item.duration !== undefined && item.duration !== null);

                    return (
                      <div key={item.id} className={styles.gridItem}>
                        {isVideo ? (
                          <VideoPlaceholder
                            video={item}
                            selected={selectedIds.has(item.id)}
                            onSelect={(id) => handleSelect(id, {})}
                            onClick={() => openLightbox(itemIndex)}
                            onDelete={() => handleDeleteOne(item.id)}
                            showCheckbox={true}
                          />
                        ) : (
                          <PhotoPlaceholder
                            photo={item}
                            aspectRatio={item.aspectRatio || 'landscape'}
                            selected={selectedIds.has(item.id)}
                            onSelect={(id) => handleSelect(id, {})}
                            onClick={() => openLightbox(itemIndex)}
                            onDelete={() => handleDeleteOne(item.id)}
                            showCheckbox={true}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox - only show if onPhotoClick not provided (legacy modal behavior) */}
      {!onPhotoClick && (
        <AnimatePresence>
          {lightboxIndex !== null && (
            <MediaLightbox
              media={filteredMedia}
              currentIndex={lightboxIndex}
              mediaType={mediaType}
              onClose={closeLightbox}
              onNavigate={navigateLightbox}
              onUpdatePhoto={handleUpdatePhoto}
              projectUuid={projectUuid}
            />
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

// Lightbox Component with Enhanced Metadata Panel
const MediaLightbox = ({
  media,
  currentIndex,
  mediaType,
  onClose,
  onNavigate,
  onUpdatePhoto,
  projectUuid
}) => {
  const currentItem = media[currentIndex];
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    section: currentItem?.section || 'general',
    tag: currentItem?.tag || '',
    note: currentItem?.originalNotes || ''
  });
  const [saving, setSaving] = useState(false);

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const imageContainerRef = useRef(null);

  // Annotation state
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [currentTool, setCurrentTool] = useState('select');
  const [currentColor, setCurrentColor] = useState('#DC2626'); // Red default
  const [annotations, setAnnotations] = useState([]);
  const annotationLayerRef = useRef(null);
  const imageRef = useRef(null);

  // Reset edit data when photo changes
  useEffect(() => {
    if (currentItem) {
      logger.log('MediaLightbox', 'Photo changed:', {
        id: currentItem.id,
        filename: currentItem.fileName || currentItem.filename,
        hasUrl: !!currentItem.url,
        hasPreviewUrl: !!currentItem.preview_url,
        hasThumbnailUrl: !!currentItem.thumbnail_url,
        mediaType
      });
      setEditData({
        section: currentItem.section || 'general',
        tag: currentItem.tag || '',
        note: currentItem.originalNotes || ''
      });
      setIsEditing(false);
    }
  }, [currentItem?.id, mediaType]);

  // Reset zoom when photo changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentItem?.id]);

  // Reset annotation state when photo changes
  useEffect(() => {
    setIsAnnotationMode(false);
    setAnnotations([]);
    setCurrentTool('select');
  }, [currentItem?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await surveyService.photos.updateMetadata(projectUuid, currentItem.id, {
        section: editData.section,
        tag: editData.tag,
        note: editData.note
      });
      onUpdatePhoto(currentItem.id, editData);
      setIsEditing(false);
      toast.success('Photo updated');
    } catch (error) {
      toast.error('Failed to save changes');
      logger.error('MediaLightbox', 'Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  // Scroll wheel zoom handler
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 5)); // Min 0.5x, max 5x
  }, []);

  // Zoom button handlers
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Pan handlers (when zoomed in and not in annotation mode)
  const handleMouseDown = (e) => {
    if (zoom > 1 && !isAnnotationMode) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && zoom > 1 && !isAnnotationMode) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  // Annotation handlers
  const handleSaveAsCopy = async () => {
    try {
      const canvas = annotationLayerRef.current?.getCanvas();
      const image = imageRef.current;

      if (!canvas || !image) {
        toast.error('Unable to save annotated photo');
        return;
      }

      // Create a new canvas to merge the image and annotations
      const mergedCanvas = document.createElement('canvas');
      const ctx = mergedCanvas.getContext('2d');

      // Set canvas size to match the image
      mergedCanvas.width = image.naturalWidth;
      mergedCanvas.height = image.naturalHeight;

      // Draw the original image
      ctx.drawImage(image, 0, 0);

      // Draw the annotations on top
      const annotationDataURL = canvas.toDataURL('image/png');
      const annotationImage = new Image();

      await new Promise((resolve, reject) => {
        annotationImage.onload = resolve;
        annotationImage.onerror = reject;
        annotationImage.src = annotationDataURL;
      });

      ctx.drawImage(annotationImage, 0, 0, mergedCanvas.width, mergedCanvas.height);

      // Convert to blob and upload
      mergedCanvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('photo', blob, `annotated_${currentItem.filename}`);
        formData.append('section', currentItem.section || 'general');
        formData.append('tag', currentItem.tag || '');
        formData.append('note', `Annotated copy of ${currentItem.filename}`);

        try {
          await surveyService.photos.upload(projectUuid, formData);
          toast.success('Annotated photo saved as new copy');
          setIsAnnotationMode(false);
          setAnnotations([]);
          // Note: The new photo will appear when the gallery refreshes via WebSocket
        } catch (error) {
          toast.error('Failed to save annotated photo');
          logger.error('MediaLightbox', 'Save annotation error:', error);
        }
      }, 'image/png');
    } catch (error) {
      toast.error('Failed to save annotated photo');
      logger.error('MediaLightbox', 'Annotation save error:', error);
    }
  };

  const handleUndo = () => annotationLayerRef.current?.undo();
  const handleRedo = () => annotationLayerRef.current?.redo();
  const handleDelete = () => annotationLayerRef.current?.deleteSelected();

  // Add wheel listener to image container for photos
  useEffect(() => {
    const container = imageContainerRef.current;
    const isPhoto = mediaType === 'photo' || (mediaType === 'both' && currentItem.type !== 'video' && currentItem.mediaType !== 'video' && !currentItem.duration);
    if (container && isPhoto) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel, mediaType, currentItem]);

  return (
    <motion.div
      className={styles.lightboxOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className={styles.lightboxContainer} onClick={e => e.stopPropagation()}>
        {/* Clean Header */}
        <div className={styles.lightboxHeader}>
          <div className={styles.lightboxNav}>
            <span className={styles.lightboxCounter}>
              {currentIndex + 1} / {media.length}
            </span>
          </div>

          {/* Zoom Controls - Photos only (check actual item type when mediaType is 'both') */}
          {(mediaType === 'photo' || (mediaType === 'both' && currentItem.type !== 'video' && currentItem.mediaType !== 'video' && !currentItem.duration)) && (
            <div className={styles.zoomControls}>
              <button onClick={handleZoomOut} title="Zoom Out" className={styles.zoomBtn}>
                <Icons.ZoomOut size={18} />
              </button>
              <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
              <button onClick={handleZoomIn} title="Zoom In" className={styles.zoomBtn}>
                <Icons.ZoomIn size={18} />
              </button>
              <button onClick={handleZoomReset} title="Reset Zoom" className={styles.zoomBtn}>
                <Icons.Maximize2 size={18} />
              </button>
            </div>
          )}

          <div className={styles.lightboxActions}>
            {/* Show photo tools for actual photos, even when mediaType is 'both' */}
            {(mediaType === 'photo' || (mediaType === 'both' && currentItem.type !== 'video' && currentItem.mediaType !== 'video' && !currentItem.duration)) && (
              <>
                <button
                  className={`${styles.iconButton} ${isAnnotationMode ? styles.active : ''}`}
                  onClick={() => setIsAnnotationMode(!isAnnotationMode)}
                  title={isAnnotationMode ? "Show photo details" : "Annotate photo"}
                >
                  {isAnnotationMode ? <Icons.Info size={18} /> : <Icons.Wrench size={18} />}
                </button>
                <button
                  className={styles.iconButton}
                  onClick={() => setIsEditing(!isEditing)}
                  title={isEditing ? "Cancel editing" : "Edit metadata"}
                >
                  <Icons.Edit size={18} />
                </button>
              </>
            )}
            {/* Download full resolution */}
            <a
              href={currentItem.url}
              download={currentItem.fileName || currentItem.filename || `photo_${currentItem.id}`}
              className={styles.iconButton}
              title="Download full resolution"
            >
              <Icons.Download size={18} />
            </a>
            <button className={styles.iconButton} onClick={onClose} title="Close">
              <Icons.X size={20} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={styles.lightboxMain}>
          {/* Navigation Arrow - Left */}
          <button
            className={`${styles.navArrow} ${styles.navPrev}`}
            onClick={() => onNavigate(-1)}
            title="Previous"
          >
            <Icons.ChevronLeft size={32} />
          </button>

          {/* Image or Video */}
          <div
            ref={imageContainerRef}
            className={styles.lightboxImageContainer}
            onMouseDown={!isAnnotationMode ? handleMouseDown : undefined}
            onMouseMove={!isAnnotationMode ? handleMouseMove : undefined}
            onMouseUp={!isAnnotationMode ? handleMouseUp : undefined}
            onMouseLeave={!isAnnotationMode ? handleMouseUp : undefined}
            style={{
              cursor: (() => {
                const isPhoto = mediaType === 'photo' || (mediaType === 'both' && currentItem.type !== 'video' && currentItem.mediaType !== 'video' && !currentItem.duration);
                return isPhoto && zoom > 1 && !isAnnotationMode ? (isPanning ? 'grabbing' : 'grab') : 'default';
              })()
            }}
          >
            {(mediaType === 'video' || (mediaType === 'both' && (currentItem.type === 'video' || currentItem.mediaType === 'video' || currentItem.duration !== undefined))) ? (
              currentItem.url ? (
                <video
                  src={currentItem.url}
                  controls
                  autoPlay
                  className={styles.lightboxVideo}
                />
              ) : (
                <div className={styles.lightboxPlaceholder}>
                  <VideoPlaceholder
                    video={currentItem}
                    selected={false}
                    showCheckbox={false}
                  />
                </div>
              )
            ) : (
              currentItem.url ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <motion.img
                    ref={imageRef}
                    key={currentItem.id}
                    src={getPreviewUrl(currentItem)} // Use optimized preview for lightbox (~300KB vs 4MB)
                    alt={currentItem.name}
                    className={styles.lightboxImage}
                    style={{
                      transform: isAnnotationMode ? 'none' : `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                      transformOrigin: 'center center',
                    }}
                    draggable={false}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />

                  {/* Annotation Layer */}
                  {isAnnotationMode && (
                    <PhotoAnnotationLayer
                      ref={annotationLayerRef}
                      isActive={isAnnotationMode}
                      currentTool={currentTool}
                      currentColor={currentColor}
                      annotations={annotations}
                      onAnnotationsChange={setAnnotations}
                      onToolChange={setCurrentTool}
                    />
                  )}
                </div>
              ) : (
                <div className={styles.lightboxPlaceholder}>
                  <PhotoPlaceholder
                    photo={currentItem}
                    aspectRatio={currentItem.aspectRatio || 'landscape'}
                    selected={false}
                    showCheckbox={false}
                  />
                </div>
              )
            )}
          </div>

          {/* Navigation Arrow - Right */}
          <button
            className={`${styles.navArrow} ${styles.navNext}`}
            onClick={() => onNavigate(1)}
            title="Next"
          >
            <Icons.ChevronRight size={32} />
          </button>

          {/* Show either Annotation Toolbar OR Metadata Panel, not both */}
          {(mediaType === 'photo' || (mediaType === 'both' && currentItem.type !== 'video' && currentItem.mediaType !== 'video' && !currentItem.duration)) && (
            isAnnotationMode ? (
              <motion.div
                className={styles.photoToolbar}
                initial={{ x: 200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 200, opacity: 0 }}
              >
                <PhotoToolbar
                  currentTool={currentTool}
                  onToolChange={setCurrentTool}
                  currentColor={currentColor}
                  onColorChange={setCurrentColor}
                  onSaveAsCopy={handleSaveAsCopy}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onDelete={handleDelete}
                  zoom={zoom}
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onZoomReset={handleZoomReset}
                  hasAnnotations={annotations.length > 0}
                />
              </motion.div>
            ) : (
              <motion.div
                className={styles.metadataPanel}
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
              >
              <div className={styles.metadataContent}>
                {/* Section Badge */}
                <div className={styles.metadataRow}>
                  <label>Section</label>
                  {isEditing ? (
                    <select
                      value={editData.section}
                      onChange={(e) => setEditData(prev => ({ ...prev, section: e.target.value }))}
                      className={styles.metadataSelect}
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className={styles.sectionBadge}>
                      {(() => {
                        const section = categories.find(s => s.value === currentItem.section)
                          || PHOTO_SECTIONS.find(s => s.value === currentItem.section);
                        const IconComp = section ? Icons[section.icon] : Icons.Folder;
                        return (
                          <>
                            {IconComp && <IconComp size={14} />}
                            {section?.label || formatSectionLabel(currentItem.section)}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className={styles.metadataRow}>
                  <label>Tag</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.tag}
                      onChange={(e) => setEditData(prev => ({ ...prev, tag: e.target.value }))}
                      className={styles.metadataSelect}
                      placeholder="Add a tag..."
                    />
                  ) : (
                    <div className={styles.tags}>
                      {currentItem.tag ? (
                        <span className={styles.tag}>{currentItem.tag}</span>
                      ) : (
                        <span className={styles.noData}>No tag</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className={styles.metadataRow}>
                  <label>Notes</label>
                  {isEditing ? (
                    <textarea
                      value={editData.note}
                      onChange={(e) => setEditData(prev => ({ ...prev, note: e.target.value }))}
                      className={styles.metadataTextarea}
                      placeholder="Add notes about this photo..."
                      rows={4}
                    />
                  ) : (
                    <p className={styles.notes}>
                      {currentItem.originalNotes || <span className={styles.noData}>No notes</span>}
                    </p>
                  )}
                </div>

                {/* File Info */}
                <div className={styles.metadataRow}>
                  <label>Details</label>
                  <div className={styles.fileInfo}>
                    <div><span>Filename:</span> {currentItem.fileName || 'Unknown'}</div>
                    <div><span>Captured:</span> {currentItem.capturedAt ? new Date(currentItem.capturedAt).toLocaleDateString() : 'Unknown'}</div>
                    {currentItem.fileSize && (
                      <div><span>Size:</span> {(currentItem.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                    )}
                  </div>
                </div>

                {/* Save/Cancel buttons when editing */}
                {isEditing && (
                  <div className={styles.editActions}>
                    <Button variant="secondary" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
              </motion.div>
            )
          )}
        </div>

        {/* Thumbnail Strip */}
        <div className={styles.thumbnailStrip}>
          {media.map((item, idx) => (
            <motion.button
              key={item.id}
              className={`${styles.thumbnail} ${idx === currentIndex ? styles.active : ''}`}
              onClick={() => onNavigate(idx - currentIndex)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <img src={getThumbUrl(item)} alt="" /> {/* Optimized thumbnail for navigation strip */}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Icon Components (inline SVGs)
const UploadIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 14V3M10 3L6 7M10 3L14 7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 14v2a2 2 0 002 2h10a2 2 0 002-2v-2" strokeLinecap="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M13 4v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4" strokeLinecap="round"/>
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const ZoomIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="7" cy="7" r="4"/>
    <path d="M14 14l-3.5-3.5" strokeLinecap="round"/>
    <path d="M7 5v4M5 7h4" strokeLinecap="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 5L5 15M5 5l10 10" strokeLinecap="round"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PhotoIcon = ({ className }) => (
  <svg className={className} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const VideoIcon = ({ className }) => (
  <svg className={className} width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

export default MediaGallery;
