/**
 * DocumentationPanel - Combined Photos and Notes display with unified filtering
 * Consolidates Photos and Notes with shared section type filters and search
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import surveyService from '../../services/surveyService';
import logger from '../../services/devLogger';
import { PillButton, SectionHeader, ConfirmDialog, TableRowButton } from '../ui';
import useMediaSocket from '../../hooks/useMediaSocket';
import { toast } from 'react-toastify';
import { getThumbUrl } from '../../utils/photoUtils';
import { downloadMultipleFiles } from '../../utils/fileDownload';
import { PHOTO_SECTIONS } from '../../constants/photoSections';
import MediaListView from './MediaListView';
import styles from '../../styles/DocumentationPanel.module.css';

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

const DocumentationPanel = ({
  projectUuid,
  gridSize,
  viewMode = 'grid',
  onCountChange,
  onPhotoClick
}) => {
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [selectedPhotoIds, setSelectedPhotoIds] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Fetch photos and notes on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [photosData, notesData] = await Promise.all([
          surveyService.photos.list(projectUuid),
          surveyService.notes.list(projectUuid)
        ]);
        setPhotos(photosData);
        setNotes(notesData);
        logger.log('Documentation', `Loaded ${photosData.length} photos, ${notesData.length} notes`);
      } catch (err) {
        logger.error('Documentation', 'Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (projectUuid) {
      fetchData();
    }
  }, [projectUuid]);

  // Listen for new media uploads via WebSocket
  useMediaSocket(projectUuid, useCallback((data) => {
    if (data.mediaType === 'photo' || data.mediaType === 'video') {
      logger.log('Documentation', `[Socket] New ${data.mediaType} uploaded:`, data.media);
      setPhotos(prev => [data.media, ...prev]);
      toast.success(`New ${data.mediaType} uploaded by ${data.media.uploadedBy || 'surveyor'}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  }, []));

  // Report photo count to parent
  useEffect(() => {
    if (onCountChange) {
      onCountChange(photos.length);
    }
  }, [photos.length, onCountChange]);

  // Note editing handlers
  const handleNoteEdit = (note) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.content);
  };

  const handleNoteSave = async (noteId) => {
    try {
      await surveyService.notes.update(projectUuid, noteId, { content: editingNoteText });
      setNotes(prev => prev.map(note =>
        note.id === noteId ? { ...note, content: editingNoteText } : note
      ));
      setEditingNoteId(null);
      setEditingNoteText('');
      toast.success('Note updated');
    } catch (error) {
      logger.error('Documentation', 'Failed to update note:', error);
      toast.error('Failed to update note');
    }
  };

  const handleNoteCancel = () => {
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const handleNoteDelete = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;

    try {
      await surveyService.notes.delete(projectUuid, noteId);
      setNotes(prev => prev.filter(note => note.id !== noteId));
      toast.success('Note deleted');
    } catch (error) {
      logger.error('Documentation', 'Failed to delete note:', error);
      toast.error('Failed to delete note');
    }
  };

  // Photo selection handlers
  const handlePhotoSelect = (photoId, event) => {
    event?.stopPropagation();
    const newSelected = new Set(selectedPhotoIds);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotoIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPhotoIds.size === photos.length) {
      setSelectedPhotoIds(new Set());
    } else {
      setSelectedPhotoIds(new Set(photos.map(p => p.id)));
    }
  };

  // Bulk delete photos
  const handleBulkDelete = async () => {
    if (selectedPhotoIds.size === 0) return;

    try {
      await surveyService.photos.bulkDelete(projectUuid, Array.from(selectedPhotoIds));
      setPhotos(prev => prev.filter(p => !selectedPhotoIds.has(p.id)));
      setSelectedPhotoIds(new Set());
      setShowDeleteConfirm(false);
      toast.success(`Deleted ${selectedPhotoIds.size} photo${selectedPhotoIds.size > 1 ? 's' : ''}`);
    } catch (error) {
      logger.error('Documentation', 'Failed to delete photos:', error);
      toast.error('Failed to delete photos');
    }
  };

  // Bulk download photos
  const handleBulkDownload = async () => {
    if (selectedPhotoIds.size === 0) return;

    const selectedPhotos = photos.filter(p => selectedPhotoIds.has(p.id));

    await downloadMultipleFiles(selectedPhotos, {
      getUrl: (photo) => photo.url || photo.preview_url || photo.photo_url,
      getName: (photo) => photo.fileName || photo.filename || photo.name || `photo_${photo.id}`,
      componentName: 'DocumentationPanel',
      delayMs: 300,
    });

    toast.success(`Downloading ${selectedPhotoIds.size} photo${selectedPhotoIds.size > 1 ? 's' : ''}...`);
  };

  // Bulk change category
  const handleBulkCategoryChange = async (newSection) => {
    if (selectedPhotoIds.size === 0) return;

    try {
      const photoIds = Array.from(selectedPhotoIds);

      // Update photos locally first for instant feedback
      setPhotos(prev => prev.map(photo =>
        selectedPhotoIds.has(photo.id) ? { ...photo, section: newSection } : photo
      ));

      // Update on server
      await Promise.all(
        photoIds.map(photoId =>
          surveyService.photos.updateMetadata(projectUuid, photoId, { section: newSection })
        )
      );

      setSelectedPhotoIds(new Set());
      setShowCategoryDropdown(false);
      toast.success(`Updated ${photoIds.length} photo${photoIds.length > 1 ? 's' : ''} to ${newSection}`);
    } catch (error) {
      logger.error('Documentation', 'Failed to update photo categories:', error);
      toast.error('Failed to update categories');
      // Refresh to get correct state
      const photosData = await surveyService.photos.list(projectUuid);
      setPhotos(photosData);
    }
  };

  // Get unique section types from both photos and notes
  const sectionTypes = useMemo(() => {
    const types = new Set();

    // Extract from photos
    photos.forEach(photo => {
      if (photo.section) {
        const baseType = photo.section.replace(/_\d+$/, '');
        types.add(baseType);
      }
    });

    // Extract from notes
    notes.forEach(note => {
      if (note.section) {
        const baseType = note.section.replace(/_\d+$/, '');
        types.add(baseType);
      }
    });

    return Array.from(types).sort();
  }, [photos, notes]);

  // Group photos by section
  const photosBySection = useMemo(() => {
    const grouped = {};
    photos.forEach(photo => {
      if (photo.section) {
        if (!grouped[photo.section]) {
          grouped[photo.section] = [];
        }
        grouped[photo.section].push(photo);
      }
    });
    return grouped;
  }, [photos]);

  // Group notes by section
  const notesBySection = useMemo(() => {
    const grouped = {};
    notes.forEach(note => {
      if (note.section) {
        if (!grouped[note.section]) {
          grouped[note.section] = [];
        }
        grouped[note.section].push(note);
      }
    });

    // Sort notes within each section: pinned first, then by date
    Object.keys(grouped).forEach(section => {
      grouped[section].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    });

    return grouped;
  }, [notes]);

  // Get all unique sections (from both photos and notes)
  const allSections = useMemo(() => {
    const sections = new Set([
      ...Object.keys(photosBySection),
      ...Object.keys(notesBySection)
    ]);
    return Array.from(sections).sort();
  }, [photosBySection, notesBySection]);

  // Filter sections based on active filter
  const filteredSections = useMemo(() => {
    if (activeFilter === 'all') {
      return allSections;
    }
    return allSections.filter(sectionId => sectionId.startsWith(activeFilter));
  }, [activeFilter, allSections]);

  // Apply search filter
  const searchFilteredSections = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredSections;
    }

    const query = searchQuery.toLowerCase();
    return filteredSections.filter(sectionId => {
      const sectionPhotos = photosBySection[sectionId] || [];
      const sectionNotes = notesBySection[sectionId] || [];

      // Search in section name
      if (getSectionLabel(sectionId).toLowerCase().includes(query)) {
        return true;
      }

      // Search in photo metadata
      const hasMatchingPhoto = sectionPhotos.some(photo =>
        photo.notes?.toLowerCase().includes(query) ||
        photo.tags?.some(tag => tag.toLowerCase().includes(query))
      );

      // Search in note content
      const hasMatchingNote = sectionNotes.some(note =>
        note.content.toLowerCase().includes(query) ||
        note.createdBy?.name?.toLowerCase().includes(query)
      );

      return hasMatchingPhoto || hasMatchingNote;
    });
  }, [filteredSections, photosBySection, notesBySection, searchQuery]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingGrid}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={styles.loadingSkeleton} />
          ))}
        </div>
      </div>
    );
  }

  const totalItems = photos.length + notes.length;

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.itemCount}>
            {photos.length} photo{photos.length !== 1 ? 's' : ''}, {notes.length} note{notes.length !== 1 ? 's' : ''}
          </span>
          {photos.length > 0 && (
            <button
              className={styles.selectAllButton}
              onClick={handleSelectAll}
            >
              {selectedPhotoIds.size === photos.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        <div className={styles.toolbarRight}>
          {/* Search Bar */}
          <div className={styles.searchBar}>
            <SearchIcon />
            <input
              type="text"
              placeholder="Search photos and notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={styles.clearButton}
                aria-label="Clear search"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section Filter Tabs */}
      <div className={styles.filterTabs}>
        <PillButton
          active={activeFilter === 'all'}
          onClick={() => setActiveFilter('all')}
        >
          All
        </PillButton>
        {sectionTypes.map(sectionType => (
          <PillButton
            key={sectionType}
            active={activeFilter === sectionType}
            onClick={() => setActiveFilter(sectionType)}
          >
            {getSectionTypeLabel(sectionType)}
          </PillButton>
        ))}
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedPhotoIds.size > 0 && (
        <div className={styles.bulkActionsBar}>
          <div className={styles.bulkActionsLeft}>
            <button
              className={styles.deselectButton}
              onClick={() => setSelectedPhotoIds(new Set())}
              title="Deselect all"
            >
              <CloseIcon />
            </button>
            <span className={styles.selectionCount}>
              {selectedPhotoIds.size} selected
            </span>
          </div>

          <div className={styles.bulkActionsRight}>
            <TableRowButton
              variant="outline"
              label="Unselect All"
              onClick={() => setSelectedPhotoIds(new Set())}
            />

            <TableRowButton
              variant="outline"
              label={`Download (${selectedPhotoIds.size})`}
              onClick={handleBulkDownload}
            />

            <div className={styles.dropdownWrapper}>
              <TableRowButton
                variant="outline"
                label="Change Category"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              />
              {showCategoryDropdown && (
                <div className={styles.categoryDropdown}>
                  {PHOTO_SECTIONS.map((section) => (
                    <button
                      key={section.value}
                      className={styles.categoryOption}
                      onClick={() => handleBulkCategoryChange(section.value)}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <TableRowButton
              variant="danger"
              label={`Delete (${selectedPhotoIds.size})`}
              onClick={() => setShowDeleteConfirm(true)}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {totalItems === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h4 className={styles.emptyTitle}>No Documentation Yet</h4>
          <p className={styles.emptyText}>Photos and notes from the mobile app will appear here.</p>
        </div>
      ) : searchFilteredSections.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <h4 className={styles.emptyTitle}>No Results Found</h4>
          <p className={styles.emptyText}>Try a different search term or filter</p>
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW - Show all photos in flat list */
        <MediaListView
          media={photos.filter(photo =>
            activeFilter === 'all' || photo.section?.startsWith(activeFilter)
          )}
          selectedIds={selectedPhotoIds}
          onSelect={handlePhotoSelect}
          onDelete={async (photoId) => {
            try {
              await surveyService.photos.delete(projectUuid, photoId);
              setPhotos(prev => prev.filter(p => p.id !== photoId));
              toast.success('Photo deleted');
            } catch (error) {
              logger.error('Documentation', 'Failed to delete photo:', error);
              toast.error('Failed to delete photo');
            }
          }}
          onEdit={async (photoId, updates) => {
            try {
              await surveyService.photos.updateMetadata(projectUuid, photoId, updates);
              setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, ...updates } : p));
              toast.success('Photo updated');
            } catch (error) {
              logger.error('Documentation', 'Failed to update photo:', error);
              toast.error('Failed to update photo');
            }
          }}
          onLightboxOpen={(index) => {
            const filteredPhotos = photos.filter(photo =>
              activeFilter === 'all' || photo.section?.startsWith(activeFilter)
            );
            onPhotoClick(filteredPhotos, index);
          }}
        />
      ) : (
        /* GRID VIEW - Show photos organized by sections */
        <div className={styles.sectionList}>
          {searchFilteredSections.map(sectionId => {
            const sectionPhotos = photosBySection[sectionId] || [];
            const sectionNotes = notesBySection[sectionId] || [];

            return (
              <div key={sectionId} className={styles.section}>
                <SectionHeader title={getSectionLabel(sectionId)} />

                {/* Photos for this section */}
                {sectionPhotos.length > 0 && (
                  <div className={styles.photosSection}>
                    <h4 className={styles.subsectionTitle}>Photos ({sectionPhotos.length})</h4>
                    <div className={`${styles.photoGrid} ${styles[`grid-${gridSize}`]}`}>
                      {sectionPhotos.map((photo, index) => {
                        const isSelected = selectedPhotoIds.has(photo.id);
                        return (
                          <div
                            key={photo.id}
                            className={`${styles.photoItem} ${isSelected ? styles.selected : ''}`}
                            onClick={() => onPhotoClick(sectionPhotos, index)}
                          >
                            {/* Selection Checkbox */}
                            <div
                              className={styles.checkbox}
                              onClick={(e) => handlePhotoSelect(photo.id, e)}
                              role="checkbox"
                              aria-checked={isSelected}
                              aria-label={`Select photo ${photo.id}`}
                            >
                              {isSelected && (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                  <path
                                    d="M11.5 3.5L5.5 9.5L2.5 6.5"
                                    stroke="#f97316"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </div>

                            <img
                              src={getThumbUrl(photo)} // Use optimized thumbnail (~40KB vs 4MB)
                              alt={photo.notes || `Photo ${photo.id}`}
                              className={styles.thumbnail}
                            />
                            {photo.notes && (
                              <div className={styles.photoCaption}>{photo.notes}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notes for this section */}
                {sectionNotes.length > 0 && (
                  <div className={styles.notesSection}>
                    <div className={styles.notesList}>
                      {sectionNotes.map(note => (
                        <div key={note.id} className={styles.noteItem}>
                          {editingNoteId === note.id ? (
                            <div className={styles.noteEditor}>
                              <textarea
                                className={styles.noteTextarea}
                                value={editingNoteText}
                                onChange={(e) => setEditingNoteText(e.target.value)}
                                autoFocus
                                rows={3}
                              />
                              <div className={styles.noteActions}>
                                <button
                                  className={styles.noteSaveBtn}
                                  onClick={() => handleNoteSave(note.id)}
                                >
                                  Save
                                </button>
                                <button
                                  className={styles.noteCancelBtn}
                                  onClick={handleNoteCancel}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className={styles.noteDisplay}>
                              <div className={styles.noteContent}>{note.content}</div>
                              <div className={styles.noteActions}>
                                <button
                                  className={styles.noteEditBtn}
                                  onClick={() => handleNoteEdit(note)}
                                  title="Edit note"
                                >
                                  <EditIcon />
                                </button>
                                <button
                                  className={styles.noteDeleteBtn}
                                  onClick={() => handleNoteDelete(note.id)}
                                  title="Delete note"
                                >
                                  <DeleteIcon />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Photos"
        message={`Are you sure you want to delete ${selectedPhotoIds.size} photo${selectedPhotoIds.size > 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

// Icon Components
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="7" cy="7" r="4" />
    <path d="M14 14l-3.5-3.5" strokeLinecap="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 4L4 12M4 4l8 8" strokeLinecap="round" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11.5 1.5l3 3L6 13H3v-3L11.5 1.5z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 4h10M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M13 4v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4h10z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default DocumentationPanel;
