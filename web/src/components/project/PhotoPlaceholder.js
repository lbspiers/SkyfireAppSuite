import React from 'react';
import styles from './PhotoPlaceholder.module.css';

/**
 * PhotoPlaceholder - Visual placeholder for photo thumbnails
 * Simulates real images with colored gradients and metadata
 *
 * Props:
 * - photo: Photo object with id, filename, tags, etc.
 * - aspectRatio: 'landscape' | 'portrait' | 'square'
 * - selected: boolean - whether photo is selected
 * - onSelect: function - selection callback
 * - onClick: function - click callback for lightbox
 * - onDelete: function - delete callback
 * - showCheckbox: boolean - show selection checkbox
 */
const PhotoPlaceholder = ({
  photo,
  aspectRatio = 'landscape',
  selected = false,
  onSelect,
  onClick,
  onDelete,
  showCheckbox = true,
}) => {
  // Generate deterministic color based on photo ID
  const getPhotoColor = (id) => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    if (onSelect) onSelect(photo.id);
  };

  const handleClick = () => {
    if (onClick) onClick(photo);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  // Check if photo has actual image URL from backend
  // Prioritize thumbnail for grid view performance (compressed images)
  const imageUrl = photo.thumbnail_url || photo.thumbUrl || photo.url || photo.photo_url || photo.image_url || photo.s3_url;
  const hasRealImage = !!imageUrl;

  return (
    <div
      className={`${styles.placeholder} ${styles[aspectRatio]} ${selected ? styles.selected : ''}`}
      onClick={handleClick}
      style={!hasRealImage ? { background: getPhotoColor(photo.id) } : {}}
    >
      {/* Render actual photo if URL exists, otherwise show placeholder gradient */}
      {hasRealImage ? (
        <img
          src={imageUrl}
          alt={photo.filename || 'Photo'}
          className={styles.image}
          loading="lazy"
          decoding="async"
          fetchpriority="low"
        />
      ) : (
        /* Photo icon overlay for placeholder */
        <div className={styles.iconOverlay}>
          <svg
            className={styles.icon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Selection checkbox */}
      {showCheckbox && (
        <div className={styles.checkbox} onClick={handleCheckboxClick}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => {}}
            aria-label={`Select ${photo.filename}`}
          />
        </div>
      )}

      {/* Filename label */}
      <div className={styles.filename}>
        {photo.filename}
      </div>

      {/* Tags badge */}
      {photo.tags && photo.tags.length > 0 && (
        <div className={styles.tagsBadge}>
          {photo.tags.length} {photo.tags.length === 1 ? 'tag' : 'tags'}
        </div>
      )}

      {/* Delete button */}
      {onDelete && (
        <button
          className={styles.deleteButton}
          onClick={handleDeleteClick}
          aria-label="Delete photo"
          title="Delete photo"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default PhotoPlaceholder;
