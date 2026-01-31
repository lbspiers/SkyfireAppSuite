// src/utils/videoThumbnailSimple.ts
// Simplified video thumbnail generation that works without native modules
// Uses video URI as poster frame with Video component's built-in poster extraction

import RNFS from 'react-native-fs';
import RNFetchBlob from 'rn-fetch-blob';
import { Platform } from 'react-native';

export interface VideoThumbnailInfo {
  thumbnailUri: string | null;
  durationMs: number | null;
  fileSize: number | null;
}

/**
 * SIMPLIFIED approach for video thumbnails
 *
 * Since we don't have native video processing libraries, we use a pragmatic approach:
 * 1. For UI display: Return video URI itself (Video component can show poster frame)
 * 2. For upload: Extract basic metadata
 * 3. Backend can generate actual thumbnails server-side if needed
 *
 * This avoids requiring react-native-video or native modules while still providing
 * a functional thumbnail system.
 */
export async function getVideoThumbnailInfo(
  videoUri: string
): Promise<VideoThumbnailInfo> {
  try {
    console.log('[VideoThumbnailSimple] Getting info for:', videoUri);

    const normalizedUri = videoUri.replace('file://', '');

    // Get file stats
    const stats = await RNFS.stat(normalizedUri);
    const fileSize = parseInt(stats.size, 10);

    console.log('[VideoThumbnailSimple] Video file size:', fileSize);

    // For thumbnail, we'll use the video URI itself
    // Most video players and components can extract the first frame
    const thumbnailUri = videoUri;

    // Duration extraction would require native modules
    // For now, we'll return null and let the backend handle it
    const durationMs = null;

    return {
      thumbnailUri,
      durationMs,
      fileSize,
    };

  } catch (error) {
    console.error('[VideoThumbnailSimple] Error:', error);
    return {
      thumbnailUri: null,
      durationMs: null,
      fileSize: null,
    };
  }
}

/**
 * Batch process multiple videos
 */
export async function getMultipleVideoThumbnails(
  videoUris: string[]
): Promise<Map<string, VideoThumbnailInfo>> {
  const results = await Promise.all(
    videoUris.map(async (uri) => {
      const info = await getVideoThumbnailInfo(uri);
      return { uri, info };
    })
  );

  return new Map(results.map(({ uri, info }) => [uri, info]));
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Format duration for display (e.g., "1:23", "12:34")
 */
export function formatDuration(durationMs: number | null | undefined): string {
  if (!durationMs || durationMs <= 0) return '0:00';

  const seconds = Math.floor(durationMs / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Check if a file is a video based on extension or MIME type
 */
export function isVideoFile(fileName: string, mimeType?: string): boolean {
  if (mimeType && mimeType.startsWith('video/')) {
    return true;
  }

  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.m4v', '.3gp'];
  const lowerFileName = fileName.toLowerCase();

  return videoExtensions.some(ext => lowerFileName.endsWith(ext));
}

/**
 * Extract video metadata from file path
 * This is a basic implementation that can be enhanced with native modules later
 */
export async function extractVideoMetadata(videoUri: string): Promise<{
  fileName: string;
  fileSize: number | null;
  extension: string;
  mimeType: string;
}> {
  try {
    const normalizedUri = videoUri.replace('file://', '');
    const fileName = normalizedUri.split('/').pop() || 'video.mp4';
    const extension = fileName.split('.').pop()?.toLowerCase() || 'mp4';

    // Get file size
    const stats = await RNFS.stat(normalizedUri);
    const fileSize = parseInt(stats.size, 10);

    // Determine MIME type from extension
    const mimeTypeMap: Record<string, string> = {
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'mkv': 'video/x-matroska',
      'm4v': 'video/x-m4v',
      '3gp': 'video/3gpp',
    };

    const mimeType = mimeTypeMap[extension] || 'video/mp4';

    return {
      fileName,
      fileSize,
      extension,
      mimeType,
    };

  } catch (error) {
    console.error('[VideoThumbnailSimple] Metadata extraction error:', error);
    return {
      fileName: 'video.mp4',
      fileSize: null,
      extension: 'mp4',
      mimeType: 'video/mp4',
    };
  }
}

/**
 * Create a placeholder thumbnail for video
 * Returns a data URI with a simple video icon
 * This can be used as a fallback when video poster extraction fails
 */
export function getVideoPlaceholderThumbnail(): string {
  // Simple gray square with play icon (as data URI)
  // This is a 1x1 gray pixel - in real app, you'd use a proper video icon
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}

/**
 * Test utilities
 */
export const VideoThumbnailTestUtils = {
  // Generate mock data for testing
  mockVideoInfo(videoUri: string): VideoThumbnailInfo {
    return {
      thumbnailUri: videoUri,
      durationMs: 15000, // 15 seconds
      fileSize: 5242880, // 5 MB
    };
  },

  // Check if video processing would work
  canProcessVideos(): boolean {
    // Always true for simplified approach
    return true;
  },
};
