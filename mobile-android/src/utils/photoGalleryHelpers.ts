// src/utils/photoGalleryHelpers.ts
// Helper utilities for photo gallery functionality

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PhotoItem } from '../screens/Project/Photos/types';

// ==================== DURATION FORMATTER ====================

/**
 * Format video duration in milliseconds to human-readable string
 * @param durationMs - Duration in milliseconds
 * @returns Formatted string (e.g., "0:45", "1:23", "12:34")
 */
export function formatVideoDuration(durationMs: number | null | undefined): string {
  if (!durationMs || durationMs <= 0) return '0:00';

  const seconds = Math.floor(durationMs / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ==================== SEARCH/FILTER ====================

/**
 * Filter photos by search query (searches notes and tags)
 * @param photos - Array of photos to filter
 * @param query - Search query string
 * @returns Filtered array of photos
 */
export function filterPhotosBySearch(photos: PhotoItem[], query: string): PhotoItem[] {
  if (!query || query.trim() === '') return photos;

  const lowerQuery = query.toLowerCase().trim();

  return photos.filter(photo => {
    // Search in notes
    const notesMatch =
      (photo.originalNotes?.toLowerCase().includes(lowerQuery)) ||
      (photo.aiSummary?.toLowerCase().includes(lowerQuery));

    // Search in tag
    const tagMatch = photo.tag?.toLowerCase().includes(lowerQuery);

    // Search in section/filename
    const sectionMatch = photo.section?.toLowerCase().includes(lowerQuery);
    const fileNameMatch = photo.fileName?.toLowerCase().includes(lowerQuery);

    return notesMatch || tagMatch || sectionMatch || fileNameMatch;
  });
}

// ==================== OFFLINE CACHE ====================

const CACHE_KEY_PREFIX = '@photo_gallery_cache_';
const CACHE_METADATA_KEY = '@photo_gallery_cache_metadata';

export interface CacheMetadata {
  projectId: string;
  lastSynced: string; // ISO timestamp
  photoCount: number;
}

/**
 * Save photos to cache for offline viewing
 * @param projectId - Project ID
 * @param photos - Array of photos to cache
 */
export async function cachePhotos(projectId: string, photos: PhotoItem[]): Promise<void> {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${projectId}`;
    const metadata: CacheMetadata = {
      projectId,
      lastSynced: new Date().toISOString(),
      photoCount: photos.length,
    };

    // Save photos data
    await AsyncStorage.setItem(cacheKey, JSON.stringify(photos));

    // Save metadata
    await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));

    console.log(`[PhotoGalleryCache] Cached ${photos.length} photos for project ${projectId}`);
  } catch (error) {
    console.error('[PhotoGalleryCache] Failed to cache photos:', error);
  }
}

/**
 * Load photos from cache
 * @param projectId - Project ID
 * @returns Cached photos or null if not found
 */
export async function loadCachedPhotos(projectId: string): Promise<PhotoItem[] | null> {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${projectId}`;
    const cached = await AsyncStorage.getItem(cacheKey);

    if (!cached) return null;

    const photos = JSON.parse(cached) as PhotoItem[];
    console.log(`[PhotoGalleryCache] Loaded ${photos.length} cached photos for project ${projectId}`);
    return photos;
  } catch (error) {
    console.error('[PhotoGalleryCache] Failed to load cached photos:', error);
    return null;
  }
}

/**
 * Get cache metadata (last sync time, photo count)
 * @returns Cache metadata or null if not found
 */
export async function getCacheMetadata(): Promise<CacheMetadata | null> {
  try {
    const metadata = await AsyncStorage.getItem(CACHE_METADATA_KEY);
    return metadata ? JSON.parse(metadata) : null;
  } catch (error) {
    console.error('[PhotoGalleryCache] Failed to load cache metadata:', error);
    return null;
  }
}

/**
 * Clear photo cache for a project
 * @param projectId - Project ID
 */
export async function clearPhotoCache(projectId: string): Promise<void> {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${projectId}`;
    await AsyncStorage.removeItem(cacheKey);
    await AsyncStorage.removeItem(CACHE_METADATA_KEY);
    console.log(`[PhotoGalleryCache] Cleared cache for project ${projectId}`);
  } catch (error) {
    console.error('[PhotoGalleryCache] Failed to clear cache:', error);
  }
}

/**
 * Get human-readable time since last sync
 * @param lastSyncedISO - ISO timestamp of last sync
 * @returns Human-readable string (e.g., "2 minutes ago", "1 hour ago")
 */
export function getTimeSinceSync(lastSyncedISO: string): string {
  const now = new Date();
  const lastSynced = new Date(lastSyncedISO);
  const diffMs = now.getTime() - lastSynced.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

// ==================== IMAGE LOADING ====================

/**
 * Preload image to check if it's available
 * @param uri - Image URI
 * @returns Promise that resolves to true if image loaded successfully
 */
export async function preloadImage(uri: string): Promise<boolean> {
  return new Promise((resolve) => {
    const Image = require('react-native').Image;
    Image.prefetch(uri)
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
}

/**
 * Batch preload multiple images
 * @param uris - Array of image URIs
 * @returns Promise that resolves when all images are loaded
 */
export async function preloadImages(uris: string[]): Promise<void> {
  try {
    await Promise.all(uris.map(uri => preloadImage(uri)));
    console.log(`[PhotoGallery] Preloaded ${uris.length} images`);
  } catch (error) {
    console.error('[PhotoGallery] Failed to preload images:', error);
  }
}
