/**
 * EquipmentSectionGroup - Groups notes, photos, and videos by equipment section
 *
 * Displays all content (notes, photos, videos) organized by equipment section
 * instead of separating them by type.
 */

import React, { useState, useEffect, useMemo } from 'react';
import surveyService from '../../services/surveyService';
import logger from '../../services/devLogger';
import { SectionHeader, Note } from '../ui';
import PhotoPlaceholder from './PhotoPlaceholder';
import VideoPlaceholder from './VideoPlaceholder';
import { PHOTO_SECTIONS, getSectionIcon, formatSectionLabel } from '../../constants/photoSections';
import styles from '../../styles/EquipmentSectionGroup.module.css';

const EquipmentSectionGroup = ({ projectUuid, gridSize = 'medium' }) => {
  const [notes, setNotes] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      if (!projectUuid) return;

      setLoading(true);
      try {
        const [notesData, photosData, videosData] = await Promise.all([
          surveyService.notes.list(projectUuid).catch(err => {
            logger.error('EquipmentSectionGroup', 'Failed to fetch notes:', err);
            return [];
          }),
          surveyService.photos.list(projectUuid).catch(err => {
            logger.error('EquipmentSectionGroup', 'Failed to fetch photos:', err);
            return [];
          }),
          surveyService.videos.list(projectUuid).catch(err => {
            logger.error('EquipmentSectionGroup', 'Failed to fetch videos:', err);
            return [];
          })
        ]);

        setNotes(notesData);
        setPhotos(photosData);
        setVideos(videosData);
      } catch (err) {
        logger.error('EquipmentSectionGroup', 'Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [projectUuid]);

  // Group all content by section
  const groupedBySection = useMemo(() => {
    const grouped = {};

    // Group notes
    notes.forEach(note => {
      const section = note.section || 'general';
      if (!grouped[section]) {
        grouped[section] = { notes: [], photos: [], videos: [] };
      }
      grouped[section].notes.push(note);
    });

    // Group photos
    photos.forEach(photo => {
      const section = photo.section || 'general';
      if (!grouped[section]) {
        grouped[section] = { notes: [], photos: [], videos: [] };
      }
      grouped[section].photos.push(photo);
    });

    // Group videos
    videos.forEach(video => {
      const section = video.section || 'general';
      if (!grouped[section]) {
        grouped[section] = { notes: [], photos: [], videos: [] };
      }
      grouped[section].videos.push(video);
    });

    // Sort sections by PHOTO_SECTIONS order
    const sectionOrder = PHOTO_SECTIONS.map(s => s.value);
    const sortedSections = Object.keys(grouped).sort((a, b) => {
      const aIndex = sectionOrder.indexOf(a);
      const bIndex = sectionOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    const sortedGrouped = {};
    sortedSections.forEach(section => {
      sortedGrouped[section] = grouped[section];
    });

    return sortedGrouped;
  }, [notes, photos, videos]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Loading survey data...</div>
      </div>
    );
  }

  const sections = Object.keys(groupedBySection);

  if (sections.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h4 className={styles.emptyTitle}>No media files or notes</h4>
          <p className={styles.emptyText}>Notes, photos, and videos from the mobile app will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {sections.map(sectionId => {
        const sectionData = groupedBySection[sectionId];
        const hasContent = sectionData.notes.length > 0 || sectionData.photos.length > 0 || sectionData.videos.length > 0;

        if (!hasContent) return null;

        return (
          <div key={sectionId} className={styles.sectionGroup}>
            <SectionHeader title={formatSectionLabel(sectionId)} />

            {/* Notes */}
            {sectionData.notes.length > 0 && (
              <div className={styles.contentBlock}>
                <h4 className={styles.contentTypeLabel}>Notes ({sectionData.notes.length})</h4>
                <div className={styles.notesList}>
                  {sectionData.notes.map(note => (
                    <Note key={note.id} text={note.content} />
                  ))}
                </div>
              </div>
            )}

            {/* Photos */}
            {sectionData.photos.length > 0 && (
              <div className={styles.contentBlock}>
                <h4 className={styles.contentTypeLabel}>Photos ({sectionData.photos.length})</h4>
                <div className={`${styles.mediaGrid} ${styles[`grid-${gridSize}`]}`}>
                  {sectionData.photos.map(photo => (
                    <div key={photo.id} className={styles.mediaItem}>
                      <PhotoPlaceholder
                        photo={photo}
                        aspectRatio={photo.aspectRatio || 'landscape'}
                        selected={false}
                        showCheckbox={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {sectionData.videos.length > 0 && (
              <div className={styles.contentBlock}>
                <h4 className={styles.contentTypeLabel}>Videos ({sectionData.videos.length})</h4>
                <div className={`${styles.mediaGrid} ${styles[`grid-${gridSize}`]}`}>
                  {sectionData.videos.map(video => (
                    <div key={video.id} className={styles.mediaItem}>
                      <VideoPlaceholder
                        video={video}
                        selected={false}
                        showCheckbox={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EquipmentSectionGroup;
