import React from 'react';
import styles from './PhotoToolbar.module.css';
import { Button } from '../ui';

const PhotoToolbar = ({
  currentTool = 'select',
  onToolChange,
  currentColor = 'var(--color-danger)',
  onColorChange,
  onSaveAsCopy,
  onUndo,
  onRedo,
  onDelete,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  hasAnnotations = false,
}) => {
  const tools = [
    {
      id: 'select',
      label: 'Select',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3 1L13 8L8 9L6 14L3 1Z" />
        </svg>
      )
    },
    {
      id: 'circle',
      label: 'Circle',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6" />
        </svg>
      )
    },
    {
      id: 'square',
      label: 'Square',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="12" height="12" />
        </svg>
      )
    },
    {
      id: 'arrow',
      label: 'Arrow',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="2" y1="14" x2="14" y2="2" />
          <polyline points="8,2 14,2 14,8" />
        </svg>
      )
    },
    {
      id: 'line',
      label: 'Line',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
          <line x1="2" y1="14" x2="14" y2="2" />
        </svg>
      )
    },
    {
      id: 'text',
      label: 'Text',
      icon: 'T'
    },
    {
      id: 'leader',
      label: 'Leader',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="3" y1="13" x2="10" y2="3" />
          <polygon points="3,13 5,11 4,10" fill="currentColor" />
          <rect x="9" y="2" width="5" height="3" rx="1" fill="none" stroke="currentColor" strokeWidth="1"/>
          <line x1="10" y1="3.5" x2="13" y2="3.5" strokeWidth="1"/>
        </svg>
      )
    },
    {
      id: 'cloud',
      label: 'Rev Cloud',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 8 Q2 6 3 5 Q4 4 5 5 Q5 3 7 3 Q9 3 9 5 Q10 4 11 5 Q12 6 11 8 Q13 9 11 11 Q10 12 9 11 Q9 13 7 13 Q5 13 5 11 Q4 12 3 11 Q2 10 3 8 Z"/>
        </svg>
      )
    },
  ];

  const colors = [
    { value: '#DC2626', label: 'Red' },
    { value: '#1F2937', label: 'Black' },
    { value: '#1E40AF', label: 'Blue' },
    { value: '#16A34A', label: 'Green' },
    { value: '#F59E0B', label: 'Yellow' },
  ];

  return (
    <div className={styles.toolbarContainer}>
      <div className={styles.toolbarContent}>
        {/* Zoom Section */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Zoom</h4>
          <div className={styles.zoomControls}>
            <button className={styles.zoomBtn} onClick={onZoomOut} title="Zoom Out">−</button>
            <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
            <button className={styles.zoomBtn} onClick={onZoomIn} title="Zoom In">+</button>
            <button className={styles.zoomBtn} onClick={onZoomReset} title="Reset">⟲</button>
          </div>
        </div>

        {/* Tools Section */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Markup Tools</h4>
          <div className={styles.toolsGrid}>
            {tools.map((tool) => (
              <button
                key={tool.id}
                className={`${styles.toolButton} ${currentTool === tool.id ? styles.active : ''}`}
                onClick={() => onToolChange(tool.id)}
                title={tool.label}
              >
                <span className={styles.toolIcon}>
                  {typeof tool.icon === 'string' ? tool.icon : tool.icon}
                </span>
                <span className={styles.toolLabel}>{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color Section */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Color</h4>
          <div className={styles.colorOptions}>
            {colors.map(color => (
              <button
                key={color.value}
                className={`${styles.colorSwatch} ${currentColor === color.value ? styles.selected : ''}`}
                style={{ backgroundColor: color.value }}
                onClick={() => onColorChange(color.value)}
                title={color.label}
              />
            ))}
          </div>
        </div>

        {/* Edit Actions */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Edit</h4>
          <div className={styles.editActions}>
            <button className={styles.actionBtn} onClick={onUndo} title="Undo (Ctrl+Z)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 7h8a4 4 0 0 1 0 8H7" />
                <polyline points="6,4 3,7 6,10" />
              </svg>
            </button>
            <button className={styles.actionBtn} onClick={onRedo} title="Redo (Ctrl+Y)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13 7H5a4 4 0 0 0 0 8h4" />
                <polyline points="10,4 13,7 10,10" />
              </svg>
            </button>
            <button className={styles.actionBtn} onClick={onDelete} title="Delete Selected">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M13 4v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Save Section */}
        <div className={styles.section}>
          <Button
            variant="primary"
            onClick={onSaveAsCopy}
            fullWidth
            disabled={!hasAnnotations}
          >
            Save as Copy
          </Button>
          <p className={styles.saveHint}>
            Saves annotated photo as a new file
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhotoToolbar;
