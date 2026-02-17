import React, { useState } from 'react';
import styles from './PdfToolbar.module.css';
import { Button } from '../ui';

/**
 * PdfToolbar - Right-side annotation toolbar
 *
 * Features:
 * - Collapsible panel
 * - Tool selection: Select, Text, Arrow, Delta, Revision Cloud
 * - Color picker with 4 presets: Red, Blue, Green, Yellow
 * - Undo/Redo buttons
 * - Delete Selected button
 * - Save Markup button (Phase 4)
 *
 * @param {string} currentTool - Currently selected tool
 * @param {function} onToolChange - Callback when tool changes
 * @param {string} currentColor - Currently selected color
 * @param {function} onColorChange - Callback when color changes
 * @param {boolean} canSave - Whether save button should be enabled
 * @param {function} onSave - Callback when save is clicked
 * @param {string} statusTab - Current status tab ('draft' or 'published')
 * @param {function} onUndo - Callback when undo is clicked
 * @param {function} onRedo - Callback when redo is clicked
 * @param {function} onDelete - Callback when delete is clicked
 */
const PdfToolbar = ({
  currentTool = 'select',
  onToolChange,
  currentColor = '#dc2626',
  onColorChange,
  canSave = false,
  onSave,
  statusTab = 'draft'
}) => {
  const tools = [
    {
      id: 'cloud',
      label: 'Rev Cloud',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 18 C4 18 3 16 3 14 C3 12 4 11 6 11 C6 9 7 7 10 7 C11 5 13 5 14 7 C17 7 18 9 18 11 C20 11 21 12 21 14 C21 16 20 18 18 18 Z"/>
        </svg>
      )
    },
    {
      id: 'delta',
      label: 'Delta',
      icon: (
        <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 3 L13 13 L3 13 Z" />
        </svg>
      )
    },
    {
      id: 'text',
      label: 'Text',
      icon: 'T'
    },
    {
      id: 'whiteout',
      label: 'Whiteout',
      icon: (
        <svg width="24" height="24" viewBox="0 0 16 16">
          <rect x="2" y="2" width="12" height="12" fill="white" stroke='var(--gray-400)' strokeWidth="1" />
        </svg>
      )
    },
    {
      id: 'leader',
      label: 'Leader Line',
      icon: (
        <span style={{ fontSize: '16px', fontWeight: 'bold', whiteSpace: 'nowrap', display: 'block', marginBottom: '2px' }}>
          Text →
        </span>
      )
    },
    {
      id: 'line',
      label: 'Line',
      icon: (
        <svg width="24" height="24" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
          <line x1="2" y1="14" x2="14" y2="2" />
        </svg>
      )
    },
    {
      id: 'square',
      label: 'Square',
      icon: (
        <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="12" height="12" />
        </svg>
      )
    },
    {
      id: 'circle',
      label: 'Circle',
      icon: (
        <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6" />
        </svg>
      )
    }
  ];

  return (
    <div className={styles.toolbarContainer}>
      <div className={styles.toolbarContent}>
        {/* Tools Section */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Tools</h4>
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

        {/* Color Selector Section */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Color</h4>
          <div className={styles.colorOptions}>
            {/* Red */}
            <button
              className={`${styles.colorSwatch} ${currentColor === '#dc2626' ? styles.selected : ''}`}
              style={{ backgroundColor: '#dc2626' }}
              onClick={() => onColorChange('#dc2626')}
              title="Red"
            />
            {/* Orange */}
            <button
              className={`${styles.colorSwatch} ${currentColor === '#fd7332' ? styles.selected : ''}`}
              style={{ backgroundColor: '#fd7332' }}
              onClick={() => onColorChange('#fd7332')}
              title="Orange"
            />
            {/* Black */}
            <button
              className={`${styles.colorSwatch} ${currentColor === '#000000' ? styles.selected : ''}`}
              style={{ backgroundColor: '#000000' }}
              onClick={() => onColorChange('#000000')}
              title="Black"
            />
            {/* Blue */}
            <button
              className={`${styles.colorSwatch} ${currentColor === '#2563eb' ? styles.selected : ''}`}
              style={{ backgroundColor: '#2563eb' }}
              onClick={() => onColorChange('#2563eb')}
              title="Blue"
            />
          </div>
        </div>

        {/* Save Button - Only show on Draft tab */}
        {statusTab === 'draft' && (
          <div className={styles.section}>
            <Button
              variant="outline"
              onClick={onSave}
              disabled={!canSave}
              fullWidth
            >
              Save
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfToolbar;
