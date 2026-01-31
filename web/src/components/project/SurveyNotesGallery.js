import React, { useState } from 'react';
import Button from '../ui/Button';
import { mockSurveyNotes, getNotesByCategory, formatRelativeTime, getCategoryColor } from '../../mockData/surveyMockData';
import styles from '../../styles/SurveyNotesGallery.module.css';

// Toggle for development - set to false to use real backend data
const USE_MOCK_DATA = false;

const EQUIPMENT_SECTIONS = [
  { id: 'all', label: 'All' },
  { id: 'general', label: 'General' },
  { id: 'roof', label: 'Roof' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'panel', label: 'Panel' },
  { id: 'meter', label: 'Meter' },
  { id: 'inverter', label: 'Inverter' },
  { id: 'battery', label: 'Battery' },
  { id: 'trenching', label: 'Trenching' },
];

const SurveyNotesGallery = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  // Get filtered notes
  const notes = USE_MOCK_DATA
    ? (activeFilter === 'all' ? mockSurveyNotes : getNotesByCategory(activeFilter))
    : [];

  return (
    <div className={styles.notesContainer}>
      {/* Filter Pills */}
      <div className={styles.filterTabs}>
        {EQUIPMENT_SECTIONS.map(section => (
          <Button
            key={section.id}
            variant={activeFilter === section.id ? 'primary' : 'secondary'}
            onClick={() => setActiveFilter(section.id)}
            className={styles.filterButton}
          >
            {section.label}
          </Button>
        ))}
      </div>

      {/* Notes List */}
      <div className={styles.notesList}>
        {notes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <p className={styles.emptyText}>No notes found for this category.</p>
          </div>
        ) : (
          notes.map(note => (
            <NoteCard key={note.id} note={note} />
          ))
        )}
      </div>
    </div>
  );
};

// NoteCard Component
const NoteCard = ({ note }) => {
  const categoryColor = getCategoryColor(note.category);

  return (
    <div className={styles.noteCard}>
      {/* Header */}
      <div className={styles.noteHeader}>
        <div className={styles.authorInfo}>
          <div className={styles.authorAvatar} style={{ background: categoryColor }}>
            {note.authorInitials}
          </div>
          <div className={styles.authorDetails}>
            <div className={styles.authorName}>{note.author}</div>
            <div className={styles.noteTimestamp}>{formatRelativeTime(note.timestamp)}</div>
          </div>
        </div>

        <div className={styles.noteActions}>
          {note.isPinned && (
            <div className={styles.pinIcon} title="Pinned">
              📌
            </div>
          )}
          <div className={styles.categoryBadge} style={{ background: categoryColor }}>
            {note.category}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={styles.noteContent}>
        {note.content}
      </div>

      {/* Footer - mentions/edited indicator */}
      {(note.edited || note.mentions?.length > 0) && (
        <div className={styles.noteFooter}>
          {note.edited && <span className={styles.editedLabel}>Edited</span>}
          {note.mentions?.length > 0 && (
            <span className={styles.mentionsLabel}>
              Mentions: {note.mentions.join(', ')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SurveyNotesGallery;
