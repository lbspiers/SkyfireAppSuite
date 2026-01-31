import React from 'react';
import styles from './SpecSheetGrid.module.css';

/**
 * SpecSheetGrid - Displays spec sheets in a grid layout with thumbnails
 * Used in Plan Set section to show all attached spec sheets for a project
 */
const SpecSheetGrid = ({
  attachments,
  loading,
  onView,
  onRefresh,
  emptyMessage = 'No spec sheets attached yet'
}) => {
  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Loading spec sheets...</p>
      </div>
    );
  }

  if (!attachments || attachments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateIcon}>📄</div>
        <h4 className={styles.emptyStateTitle}>No Spec Sheets Attached</h4>
        <p className={styles.emptyStateDesc}>{emptyMessage}</p>
        <p className={styles.emptyStateHint}>
          Attach spec sheets in the Submit → Spec Sheets tab
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.count}>
          {attachments.length} Spec Sheet{attachments.length !== 1 ? 's' : ''}
        </span>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className={styles.refreshButton}
          >
            ↻ Refresh
          </button>
        )}
      </div>

      <div className={styles.grid}>
        {attachments.map((att) => (
          <div key={att.uuid} className={styles.card}>
            {/* Thumbnail */}
            <div
              className={styles.thumbnail}
              onClick={() => onView && onView(att.specSheet)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onView && onView(att.specSheet);
                }
              }}
            >
              {att.specSheet?.thumbnail_url ? (
                <img
                  src={att.specSheet.thumbnail_url}
                  alt={`${att.specSheet.manufacturer} ${att.specSheet.model_number}`}
                />
              ) : (
                <div className={styles.thumbnailPlaceholder}>📄</div>
              )}
            </div>

            {/* Info */}
            <div className={styles.cardInfo}>
              <div className={styles.equipmentType}>
                {att.specSheet?.equipment_type || 'Equipment'}
              </div>
              <div className={styles.manufacturer}>
                {att.specSheet?.manufacturer}
              </div>
              <div className={styles.model}>
                {att.specSheet?.model_number}
              </div>
            </div>

            {/* Actions */}
            <div className={styles.cardActions}>
              <button
                type="button"
                onClick={() => onView && onView(att.specSheet)}
                className={styles.viewButton}
              >
                View
              </button>
              <a
                href={att.specSheet?.download_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className={styles.downloadButton}
              >
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpecSheetGrid;
