import React from 'react';
import styles from './VideoPlaceholder.module.css';
import { formatDuration } from '../../mockData/surveyMockData';
import { getVideoThumbUrl } from '../../utils/photoUtils';

/**
 * VideoPlaceholder - Visual placeholder for video thumbnails
 * Simulates real videos with colored gradients, play button, and duration
 *
 * Props:
 * - video: Video object with id, filename, duration, tags, etc.
 * - selected: boolean - whether video is selected
 * - onSelect: function - selection callback
 * - onClick: function - click callback for lightbox/player
 * - onDelete: function - delete callback
 * - showCheckbox: boolean - show selection checkbox
 */
const VideoPlaceholder = ({
  video,
  selected = false,
  onSelect,
  onClick,
  onDelete,
  showCheckbox = true,
}) => {
  // Generate deterministic color based on video ID
  const getVideoColor = (id) => {
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
    if (onSelect) onSelect(video.id);
  };

  const handleClick = () => {
    if (onClick) onClick(video);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  // Check if video has actual thumbnail URL from backend
  const thumbnailUrl = getVideoThumbUrl(video);
  const hasRealThumbnail = !!thumbnailUrl;

  return (
    <div
      className={`${styles.placeholder} ${selected ? styles.selected : ''}`}
      onClick={handleClick}
      style={!hasRealThumbnail ? { background: getVideoColor(video.id) } : {}}
    >
      {/* Render actual video thumbnail if URL exists */}
      {hasRealThumbnail && (
        <img
          src={thumbnailUrl}
          alt={video.filename || 'Video'}
          className={styles.thumbnail}
          loading="lazy"
        />
      )}

      {/* Selection checkbox */}
      {showCheckbox && (
        <div className={styles.checkbox} onClick={handleCheckboxClick}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => {}}
            aria-label={`Select ${video.filename}`}
          />
        </div>
      )}

      {/* Play button overlay (always show for videos) */}
      <div className={styles.playButton}>
        <svg
          className={styles.playIcon}
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>

      {/* Video icon indicator (top right) */}
      <div className={styles.videoIndicator}>
        <svg
          className={styles.videoIcon}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </div>

      {/* Duration badge */}
      <div className={styles.duration}>
        {formatDuration(video.duration)}
      </div>

      {/* Filename label */}
      <div className={styles.filename}>
        {video.filename}
      </div>

      {/* Tags badge */}
      {video.tags && video.tags.length > 0 && (
        <div className={styles.tagsBadge}>
          {video.tags.length} {video.tags.length === 1 ? 'tag' : 'tags'}
        </div>
      )}

      {/* Delete button */}
      {onDelete && (
        <button
          className={styles.deleteButton}
          onClick={handleDeleteClick}
          aria-label="Delete video"
          title="Delete video"
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

export default VideoPlaceholder;
