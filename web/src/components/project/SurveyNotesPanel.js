/**
 * SurveyNotesPanel - Equipment-organized notes display
 * Matches MediaGallery UI: simple section headers, gradient dividers, search bar
 */

import React, { useState, useEffect, useMemo } from 'react';
import surveyService from '../../services/surveyService';
import logger from '../../services/devLogger';
import { Button, SectionHeader, Note } from '../ui';
import styles from '../../styles/SurveyNotesPanel.module.css';

// Helper function to get friendly label for section type
const getSectionTypeLabel = (sectionType) => {
  return sectionType.split('_').map(
    word => word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Helper function to get section label from full ID (e.g., "solar_panel_1" → "Solar Panel 1")
const getSectionLabel = (sectionId) => {
  const match = sectionId.match(/_(\d+)$/);
  const number = match ? match[1] : '';
  const baseName = sectionId.replace(/_\d+$/, '').split('_').map(
    word => word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  return number ? `${baseName} ${number}` : baseName;
};

const SurveyNotesPanel = ({ projectUuid, compact = false }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' or section type
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch notes on mount
  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const data = await surveyService.notes.list(projectUuid);
        setNotes(data);
        logger.log('SurveyNotes', `Loaded ${data.length} notes`);
      } catch (err) {
        logger.error('SurveyNotes', 'Failed to fetch notes:', err);
      } finally {
        setLoading(false);
      }
    };

    if (projectUuid) {
      fetchNotes();
    }
  }, [projectUuid]);

  // Get unique section types from notes
  const sectionTypes = useMemo(() => {
    const types = new Set();
    notes.forEach(note => {
      if (note.section) {
        // Extract base type (e.g., "solar_panel_1" -> "solar_panel")
        const baseType = note.section.replace(/_\d+$/, '');
        types.add(baseType);
      }
    });
    return Array.from(types).sort();
  }, [notes]);

  // Group notes by full section ID for display
  const notesBySection = useMemo(() => {
    const grouped = {};

    notes.forEach(note => {
      if (note.section) {
        if (!grouped[note.section]) {
          grouped[note.section] = [];
        }
        grouped[note.section].push(note);
      }
    });

    // Sort notes within each section: pinned first, then by date
    Object.keys(grouped).forEach(section => {
      grouped[section].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    });

    return grouped;
  }, [notes]);

  // Get filtered sections based on active filter
  const filteredSectionIds = useMemo(() => {
    if (activeFilter === 'all') {
      return Object.keys(notesBySection).sort();
    }

    // Filter to sections that start with the selected type
    return Object.keys(notesBySection)
      .filter(sectionId => sectionId.startsWith(activeFilter))
      .sort();
  }, [activeFilter, notesBySection]);

  // Filter notes by search query
  const searchFilteredSections = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredSectionIds;
    }

    const query = searchQuery.toLowerCase();
    return filteredSectionIds.filter(sectionId => {
      const sectionNotes = notesBySection[sectionId] || [];
      return sectionNotes.some(note =>
        note.content.toLowerCase().includes(query) ||
        note.createdBy?.name?.toLowerCase().includes(query) ||
        getSectionLabel(sectionId).toLowerCase().includes(query)
      );
    });
  }, [filteredSectionIds, notesBySection, searchQuery]);

  // Get all notes in filtered sections (for search highlighting)
  const getFilteredNotesForSection = (sectionId) => {
    const sectionNotes = notesBySection[sectionId] || [];

    if (!searchQuery.trim()) {
      return sectionNotes;
    }

    const query = searchQuery.toLowerCase();
    return sectionNotes.filter(note =>
      note.content.toLowerCase().includes(query) ||
      note.createdBy?.name?.toLowerCase().includes(query)
    );
  };

  if (loading) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.loadingGrid}>
          {[...Array(compact ? 2 : 6)].map((_, i) => (
            <div key={i} className={styles.loadingSkeleton} />
          ))}
        </div>
      </div>
    );
  }

  // In compact mode with no notes, show minimal empty state
  if (compact && notes.length === 0) {
    return (
      <div className={`${styles.container} ${styles.compact}`}>
        <div className={styles.compactEmptyState}>
          <span className={styles.compactEmptyText}>No notes yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      {/* Toolbar - Hide in compact mode */}
      {!compact && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <span className={styles.noteCount}>
                {notes.length} {notes.length !== 1 ? 'notes' : 'note'}
              </span>
            </div>

            <div className={styles.toolbarRight}>
              {/* Search Bar */}
              <div className={styles.searchBar}>
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={styles.clearButton}
                    aria-label="Clear search"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section Filter Tabs */}
          <div className={styles.filterTabs}>
            <Button
              variant={activeFilter === 'all' ? 'primary' : 'secondary'}
              onClick={() => setActiveFilter('all')}
              className={styles.filterButton}
            >
              All
            </Button>
            {sectionTypes.map(sectionType => (
              <Button
                key={sectionType}
                variant={activeFilter === sectionType ? 'primary' : 'secondary'}
                onClick={() => setActiveFilter(sectionType)}
                className={styles.filterButton}
              >
                {getSectionTypeLabel(sectionType)}
              </Button>
            ))}
          </div>
        </>
      )}

      {/* Content */}
      {notes.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h4 className={styles.emptyTitle}>No Survey Notes Yet</h4>
          <p className={styles.emptyText}>Survey notes from the mobile app will appear here.</p>
        </div>
      ) : searchFilteredSections.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <h4 className={styles.emptyTitle}>No Results Found</h4>
          <p className={styles.emptyText}>Try a different search term</p>
        </div>
      ) : (
        <div className={styles.sectionList}>
          {searchFilteredSections.map(sectionId => {
            const sectionNotes = getFilteredNotesForSection(sectionId);

            return (
              <div key={sectionId} className={styles.section}>
                {/* Section Header */}
                <SectionHeader title={getSectionLabel(sectionId)} />

                {/* Notes List */}
                <div className={styles.notesList}>
                  {sectionNotes.map(note => (
                    <Note key={note.id} text={note.content} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Icon Components
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="7" cy="7" r="4" />
    <path d="M14 14l-3.5-3.5" strokeLinecap="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 4L4 12M4 4l8 8" strokeLinecap="round" />
  </svg>
);

export default SurveyNotesPanel;
