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
  currentColor = 'var(--color-danger)',
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
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 8 Q2 6 3 5 Q4 4 5 5 Q5 3 7 3 Q9 3 9 5 Q10 4 11 5 Q12 6 11 8 Q13 9 11 11 Q10 12 9 11 Q9 13 7 13 Q5 13 5 11 Q4 12 3 11 Q2 10 3 8 Z"/>
        </svg>
      )
    },
    {
      id: 'delta',
      label: 'Delta',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
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
        <svg width="16" height="16" viewBox="0 0 16 16">
          <rect x="2" y="2" width="12" height="12" fill="white" stroke='var(--gray-400)' strokeWidth="1" />
        </svg>
      )
    },
    {
      id: 'leader',
      label: 'Leader Line',
      icon: (
        <svg width="28" height="16" viewBox="0 0 28 16" fill="currentColor">
          <path d="M0 8 L8 8 M5 5 L8 8 L5 11" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <text x="10" y="12" fontSize="10" fontWeight="bold" fill="currentColor">ABC</text>
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
      id: 'square',
      label: 'Square',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="12" height="12" />
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
            {/* Dynamic color for swatch */}
            <button
              className={`${styles.colorSwatch} ${currentColor === 'var(--color-danger)' ? styles.selected : ''}`}
              style={{ backgroundColor: 'var(--color-danger)' }}
              onClick={() => onColorChange('var(--color-danger)')}
              title="Red"
            />
            {/* Dynamic color for swatch */}
            <button
              className={`${styles.colorSwatch} ${currentColor === 'var(--gray-900)' ? styles.selected : ''}`}
              style={{ backgroundColor: 'var(--gray-900)' }}
              onClick={() => onColorChange('var(--gray-900)')}
              title="Black"
            />
          </div>
        </div>

        {/* Publish Button - Only show on Draft tab */}
        {statusTab === 'draft' && (
          <div className={styles.section}>
            <Button
              variant="outline"
              onClick={onSave}
              disabled={!canSave}
              fullWidth
            >
              Publish
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfToolbar;
