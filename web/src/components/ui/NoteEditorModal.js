/**
 * NoteEditorModal - Modal for creating and editing survey notes
 */

import React, { useState, useEffect } from 'react';
import styles from './NoteEditorModal.module.css';

const NoteEditorModal = ({
  isOpen,
  onClose,
  onSave,
  initialNote = null,
  projectSections = [],
  title = 'Add Note',
}) => {
  const [content, setContent] = useState('');
  const [section, setSection] = useState('');
  const [priority, setPriority] = useState('info');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when modal opens or initialNote changes
  useEffect(() => {
    if (isOpen) {
      setContent(initialNote?.content || '');
      setSection(initialNote?.section || '');
      setPriority(initialNote?.priority || 'info');
    }
  }, [isOpen, initialNote]);

  const handleSave = async () => {
    if (!content.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        content: content.trim(),
        section: section || null,
        priority,
      });
      handleClose();
    } catch (error) {
      console.error('[NoteEditorModal] Save failed:', error);
      // Error handling is done in parent component
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setSection('');
    setPriority('info');
    onClose();
  };

  const handleKeyDown = (e) => {
    // Save on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSave();
    }
    // Close on Escape
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          {/* Note Content */}
          <div className={styles.field}>
            <label htmlFor="note-content" className={styles.label}>
              Note <span className={styles.required}>*</span>
            </label>
            <textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your note..."
              className={styles.textarea}
              rows={6}
              autoFocus
            />
            <div className={styles.charCount}>
              {content.length} characters
            </div>
          </div>

          {/* Section Dropdown */}
          {projectSections.length > 0 && (
            <div className={styles.field}>
              <label htmlFor="note-section" className={styles.label}>
                Section <span className={styles.optional}>(optional)</span>
              </label>
              <select
                id="note-section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className={styles.select}
              >
                <option value="">No section</option>
                {projectSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Priority Selector */}
          <div className={styles.field}>
            <label htmlFor="note-priority" className={styles.label}>
              Priority
            </label>
            <select
              id="note-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={styles.select}
            >
              <option value="info">Info</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.cancelButton}
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
          >
            {isSaving ? 'Saving...' : initialNote ? 'Save Changes' : 'Create Note'}
          </button>
        </div>

        <div className={styles.hint}>
          Press <kbd>⌘/Ctrl + Enter</kbd> to save • <kbd>Esc</kbd> to cancel
        </div>
      </div>
    </div>
  );
};

export default NoteEditorModal;
