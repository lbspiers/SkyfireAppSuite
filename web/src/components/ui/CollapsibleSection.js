import React, { useState } from 'react';
import styles from './CollapsibleSection.module.css';

/**
 * CollapsibleSection - Reusable collapsible container
 *
 * Features:
 * - Expand/collapse with smooth animation
 * - Visual state indicators (dirty, complete)
 * - Optional action buttons (edit, delete)
 * - Follows Skyfire design system
 */
const CollapsibleSection = ({
  title,
  subtitle,
  badge,
  statusBadge,
  initiallyExpanded = false,
  expanded: controlledExpanded,
  onToggle,
  isDirty = false,
  isComplete = false,
  onEdit,
  onDelete,
  children,
  className = '',
}) => {
  const [internalExpanded, setInternalExpanded] = useState(initiallyExpanded);

  // Support both controlled and uncontrolled modes
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  return (
    <div
      className={`
        ${styles.section}
        ${isExpanded ? styles.expanded : styles.collapsed}
        ${isDirty ? styles.dirty : ''}
        ${isComplete ? styles.complete : ''}
        ${className}
      `.trim()}
    >
      {/* Header - Always visible */}
      <button
        type="button"
        className={styles.header}
        onClick={handleToggle}
        aria-expanded={isExpanded}
      >
        {/* Left: Chevron + Title */}
        <div className={styles.headerLeft}>
          <span className={styles.chevron}>
            <ChevronIcon direction={isExpanded ? 'down' : 'right'} />
          </span>
          <div className={styles.titleGroup}>
            <span className={styles.title}>{title}</span>
            {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
          </div>
        </div>

        {/* Right: Badge + Status + Actions */}
        <div className={styles.headerRight}>
          {badge && <span className={styles.badge}>{badge}</span>}

          {statusBadge && (
            <span className={statusBadge === 'NEW' ? styles.statusNew : styles.statusExisting}>
              {statusBadge}
            </span>
          )}
          {!statusBadge && isDirty && !isComplete && (
            <span className={styles.statusNew}>NEW</span>
          )}
          {!statusBadge && isComplete && (
            <span className={styles.statusComplete}>
              <CheckIcon />
            </span>
          )}

          {/* Action buttons (stop propagation to prevent toggle) */}
          {onEdit && (
            <button
              type="button"
              className={styles.actionBtn}
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              aria-label="Edit"
            >
              <EditIcon />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              aria-label="Delete"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </button>

      {/* Body - Collapsible */}
      <div className={styles.body}>
        <div className={styles.bodyInner}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Icons as inline components
const ChevronIcon = ({ direction }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="currentColor"
    style={{ transform: direction === 'down' ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s ease' }}
  >
    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
  </svg>
);

const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
  </svg>
);

export default CollapsibleSection;
