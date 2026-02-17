import React, { useState } from 'react';
import styles from './EquipmentRow.module.css';
import cameraIcon from '../../assets/images/icons/camera.png';
import pencilIcon from '../../assets/images/icons/pencil_icon_white.png';
import TableRowButton from './TableRowButton';
import ActionButton from './ActionButton';

/**
 * EquipmentRow - Reusable expandable equipment component
 *
 * COLLAPSED: Chevron + Title + Subtitle + Badge (clean, no icons)
 * EXPANDED: Optional New/Existing toggle row + Fields table + Edit/Delete icons
 *
 * @param {boolean} showNewExistingToggle - Show New/Existing toggle as first row when expanded
 * @param {boolean} isNew - Current state of New/Existing toggle (true = New, false = Existing)
 * @param {function} onNewExistingChange - Callback when New/Existing toggle changes
 * @param {React.ReactNode} toggleRowRightContent - Optional content to show on the right side of the toggle row
 * @param {React.ReactNode} titleRowCenterContent - Optional content to show centered in the title row when expanded
 * @param {React.ReactNode} headerRightContent - Optional content to show in header row to the left of action icons
 * @param {React.ReactNode} topRowContent - Optional content row that appears above the New/Existing toggle
 */
const EquipmentRow = ({
  title,
  subtitle,
  badge,
  fields = [],
  isComplete = false,
  initiallyExpanded = false,
  expanded: controlledExpanded,
  onToggle,
  onEdit,
  onDelete,
  onCamera,
  showNewExistingToggle = false,
  isNew = true,
  onNewExistingChange,
  isExisting,
  onExistingChange,
  toggleRowRightContent,
  titleRowCenterContent,
  headerRightContent,
  topRowContent,
  children,
  className = '',
  style = {},
  noWrapTitle = false,
  titleSubline,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(initiallyExpanded);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  return (
    <div className={`${styles.row} ${isExpanded ? styles.expanded : ''} ${className}`} style={style}>
      {/* Header - Always Visible */}
      <div className={styles.headerContainer}>
        <button
          type="button"
          className={styles.header}
          onClick={handleToggle}
          aria-expanded={isExpanded}
        >
          {/* Left side - 25% label area */}
          <div className={styles.headerLeft}>
            <span className={`${styles.title} ${noWrapTitle ? styles.titleNoWrap : ''}`}>{title}</span>
            {titleSubline && (
              <span className={styles.titleSubline}>{titleSubline}</span>
            )}
            {!isExpanded && subtitle && (
              <span className={`${styles.subtitle} ${!subtitle ? styles.empty : ''}`}>
                {subtitle || '-'}
              </span>
            )}
          </div>

          {/* Right side - 75% content area */}
          <div className={styles.headerRight}>
            <span className={styles.chevron}>
              <ChevronIcon expanded={isExpanded} />
            </span>
          </div>
        </button>
        {/* Header right content (e.g., Inventory/Preferred buttons) - positioned outside button to avoid nesting */}
        {isExpanded && headerRightContent && (
          <div className={styles.headerRightContent}>
            {headerRightContent}
          </div>
        )}
        {/* Action buttons aligned right */}
        {isExpanded && (
          <div className={styles.actions}>
            <ActionButton
              icon={pencilIcon}
              label="Edit"
              onClick={onEdit || (() => {})}
            />
            <ActionButton
              icon={cameraIcon}
              label="Camera"
              onClick={onCamera || (() => {})}
            />
            <ActionButton
              icon="trash"
              label="Delete"
              onClick={onDelete || (() => {})}
            />
          </div>
        )}
      </div>

      {/* Expandable Body */}
      <div className={styles.body}>
        <div className={styles.bodyInner}>
          {/* Top Row Content (optional, appears first) */}
          {topRowContent && (
            <div className={styles.topRow}>
              {topRowContent}
            </div>
          )}

          {/* New/Existing Toggle Row (optional, appears after topRowContent) */}
          {showNewExistingToggle && (
            <div className={styles.toggleRow}>
              <div className={styles.toggleLabel}>Select</div>
              <div className={styles.toggleButtons}>
                <TableRowButton
                  label="New"
                  variant="outline"
                  active={onExistingChange ? isExisting === false : isNew}
                  onClick={() => onExistingChange ? onExistingChange(false) : onNewExistingChange && onNewExistingChange(true)}
                />
                <TableRowButton
                  label="Existing"
                  variant="outline"
                  active={onExistingChange ? isExisting === true : !isNew}
                  onClick={() => onExistingChange ? onExistingChange(true) : onNewExistingChange && onNewExistingChange(false)}
                />
                {toggleRowRightContent && (
                  <div style={{ marginLeft: 'auto' }}>
                    {toggleRowRightContent}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fields Table - Only show if no children (interactive fields) provided */}
          {fields.length > 0 && !children && (
            <div className={styles.fields}>
              {fields.map((field, idx) => (
                <div key={idx} className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>{field.label}</span>
                  <span className={styles.fieldValue}>{field.value || '—'}</span>
                </div>
              ))}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

const ChevronIcon = ({ expanded }) => {
  if (expanded) {
    // Minus icon when expanded
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path fillRule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8Z"/>
      </svg>
    );
  }
  // Down chevron when collapsed
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
    </svg>
  );
};

export default EquipmentRow;
