import React, { useState } from 'react';
import { Calendar, Tag, FileText, Image, Video, Edit2, Trash2 } from 'lucide-react';
import logger from '../../services/devLogger';
import PhotoPlaceholder from './PhotoPlaceholder';
import VideoPlaceholder from './VideoPlaceholder';
import styles from '../../styles/MediaListView.module.css';

/**
 * MediaListView - List view for media with metadata display
 * Shows photos/videos in a table-like format with inline metadata
 *
 * @param {Array} media - Array of media items
 * @param {Set} selectedIds - Set of selected media IDs
 * @param {Function} onSelect - Callback for selection
 * @param {Function} onDelete - Callback for delete
 * @param {Function} onEdit - Callback for edit
 * @param {Function} onLightboxOpen - Callback to open lightbox
 */
const MediaListView = ({
  media = [],
  selectedIds = new Set(),
  onSelect,
  onDelete,
  onEdit,
  onLightboxOpen,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editNote, setEditNote] = useState('');

  const handleEditStart = (item) => {
    setEditingId(item.id);
    setEditNote(item.note || '');
  };

  const handleEditSave = (item) => {
    if (onEdit) {
      onEdit(item.id, { note: editNote });
    }
    setEditingId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditNote('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (url) => {
    // Since we don't have file size in the data, we'll estimate based on type
    // In a real implementation, this would come from the backend
    return 'N/A';
  };

  const getSectionLabel = (sectionId) => {
    if (!sectionId) return 'N/A';
    const match = sectionId.match(/_(\d+)$/);
    const number = match ? match[1] : '';
    const baseName = sectionId.replace(/_\d+$/, '').split('_').map(
      word => word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    return number ? `${baseName} ${number}` : baseName;
  };

  if (media.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>No media items to display</p>
      </div>
    );
  }

  return (
    <div className={styles.listViewContainer}>
      <div className={styles.listHeader}>
        <div className={`${styles.headerCell} ${styles.colCheckbox}`}>
          <input
            type="checkbox"
            checked={selectedIds.size === media.length && media.length > 0}
            onChange={() => {
              if (selectedIds.size === media.length) {
                media.forEach(item => onSelect && onSelect(item.id, { shiftKey: false }));
              } else {
                media.forEach(item => {
                  if (!selectedIds.has(item.id)) {
                    onSelect && onSelect(item.id, { shiftKey: false });
                  }
                });
              }
            }}
          />
        </div>
        <div className={`${styles.headerCell} ${styles.colPreview}`}>Preview</div>
        <div className={`${styles.headerCell} ${styles.colFilename}`}>Filename</div>
        <div className={`${styles.headerCell} ${styles.colSection}`}>Section</div>
        <div className={`${styles.headerCell} ${styles.colTag}`}>Tag</div>
        <div className={`${styles.headerCell} ${styles.colNotes}`}>Notes</div>
        <div className={`${styles.headerCell} ${styles.colDate}`}>Date</div>
        <div className={`${styles.headerCell} ${styles.colActions}`}>Actions</div>
      </div>

      <div className={styles.listBody}>
        {media.map((item) => (
          <div
            key={item.id}
            className={`${styles.listRow} ${selectedIds.has(item.id) ? styles.selected : ''}`}
          >
            <div className={`${styles.cell} ${styles.colCheckbox}`}>
              <input
                type="checkbox"
                checked={selectedIds.has(item.id)}
                onChange={(e) => onSelect && onSelect(item.id, e)}
              />
            </div>

            <div
              className={`${styles.cell} ${styles.colPreview}`}
              onClick={() => onLightboxOpen && onLightboxOpen(media.indexOf(item))}
            >
              <div className={styles.thumbnail}>
                {item.url ? (
                  item.filename?.toLowerCase().endsWith('.mp4') ||
                  item.filename?.toLowerCase().endsWith('.mov') ? (
                    <VideoPlaceholder
                      video={item}
                      selected={false}
                      showCheckbox={false}
                    />
                  ) : (
                    <PhotoPlaceholder
                      photo={item}
                      selected={false}
                      showCheckbox={false}
                    />
                  )
                ) : (
                  <div className={styles.placeholderIcon}>
                    {item.filename?.toLowerCase().endsWith('.mp4') ||
                     item.filename?.toLowerCase().endsWith('.mov') ? (
                      <Video size={24} />
                    ) : (
                      <Image size={24} />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className={`${styles.cell} ${styles.colFilename}`}>
              <div className={styles.filename}>
                {item.filename || 'Untitled'}
              </div>
            </div>

            <div className={`${styles.cell} ${styles.colSection}`}>
              <div className={styles.section}>
                {getSectionLabel(item.section)}
              </div>
            </div>

            <div className={`${styles.cell} ${styles.colTag}`}>
              <div className={styles.tag}>
                {item.tag ? (
                  <span className={styles.tagBadge}>
                    <Tag size={12} />
                    {item.tag}
                  </span>
                ) : (
                  <span className={styles.noTag}>—</span>
                )}
              </div>
            </div>

            <div className={`${styles.cell} ${styles.colNotes}`}>
              {editingId === item.id ? (
                <div className={styles.editField}>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className={styles.editInput}
                    autoFocus
                  />
                  <div className={styles.editActions}>
                    <button
                      className={styles.editSaveBtn}
                      onClick={() => handleEditSave(item)}
                    >
                      Save
                    </button>
                    <button
                      className={styles.editCancelBtn}
                      onClick={handleEditCancel}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.note}>
                  {item.note || <span className={styles.noNote}>No notes</span>}
                </div>
              )}
            </div>

            <div className={`${styles.cell} ${styles.colDate}`}>
              <div className={styles.date}>
                <Calendar size={12} />
                {formatDate(item.uploadedAt || item.createdAt)}
              </div>
            </div>

            <div className={`${styles.cell} ${styles.colActions}`}>
              <div className={styles.actions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleEditStart(item)}
                  title="Edit note"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => onDelete && onDelete(item.id)}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaListView;
