// src/utils/videoThumbnailGenerator.ts
// Video thumbnail generation utility for gallery display

import RNFS from 'react-native-fs';
import { Platform, NativeModules } from 'react-native';

export interface ThumbnailOptions {
  quality?: number; // 0-100, default 80
  timeMs?: number; // Frame time in milliseconds, default 0 (first frame)
  format?: 'jpeg' | 'png'; // Output format, default 'jpeg'
}

const DEFAULT_OPTIONS: Required<ThumbnailOptions> = {
  quality: 80,
  timeMs: 0,
  format: 'jpeg',
};

/**
 * Generates a thumbnail from a video file
 *
 * Strategy:
 * - Android: Use MediaMetadataRetriever via native module
 * - iOS: Use AVAssetImageGenerator via native module
 * - Fallback: Return video URI (let Video component handle poster)
 *
 * @param videoUri - URI of the video file
 * @param options - Thumbnail generation options
 * @returns Promise with local thumbnail file path
 */
export async function generateVideoThumbnail(
  videoUri: string,
  options?: ThumbnailOptions
): Promise<string | null> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    console.log('[VideoThumbnail] Generating thumbnail for:', videoUri);

    // Normalize URI
    const normalizedUri = videoUri.replace('file://', '');

    // Check if file exists
    const exists = await RNFS.exists(normalizedUri);
    if (!exists) {
      console.error('[VideoThumbnail] Video file does not exist:', normalizedUri);
      return null;
    }

    // Generate thumbnail using platform-specific method
    let thumbnailPath: string | null = null;

    if (Platform.OS === 'android') {
      thumbnailPath = await generateThumbnailAndroid(normalizedUri, opts);
    } else if (Platform.OS === 'ios') {
      thumbnailPath = await generateThumbnailIOS(normalizedUri, opts);
    }

    if (thumbnailPath) {
      console.log('[VideoThumbnail] Thumbnail generated:', thumbnailPath);
      return `file://${thumbnailPath}`;
    }

    // Fallback: return null, caller can use video URI
    console.warn('[VideoThumbnail] Could not generate thumbnail, returning null');
    return null;

  } catch (error) {
    console.error('[VideoThumbnail] Error generating thumbnail:', error);
    return null;
  }
}

/**
 * Android implementation using MediaMetadataRetriever
 * Falls back to extracting first frame manually
 */
async function generateThumbnailAndroid(
  videoPath: string,
  options: Required<ThumbnailOptions>
): Promise<string | null> {
  try {
    // Try using native MediaMetadataRetriever if available
    const { RNVideoThumbnails } = NativeModules;

    if (RNVideoThumbnails && RNVideoThumbnails.getThumbnail) {
      const result = await RNVideoThumbnails.getThumbnail({
        path: videoPath,
        format: options.format,
        quality: options.quality,
        time: options.timeMs,
      });
      return result.path;
    }

    // Fallback: Use RNFS and native modules
    console.log('[VideoThumbnail] Native module not available, using fallback');

    // For now, return null and let the gallery use video URI
    // We can implement a more sophisticated fallback later
    return null;

  } catch (error) {
    console.error('[VideoThumbnail] Android generation failed:', error);
    return null;
  }
}

/**
 * iOS implementation using AVAssetImageGenerator
 * Falls back to extracting first frame manually
 */
async function generateThumbnailIOS(
  videoPath: string,
  options: Required<ThumbnailOptions>
): Promise<string | null> {
  try {
    // Try using native AVAssetImageGenerator if available
    const { RNVideoThumbnails } = NativeModules;

    if (RNVideoThumbnails && RNVideoThumbnails.getThumbnail) {
      const result = await RNVideoThumbnails.getThumbnail({
        path: videoPath,
        format: options.format,
        quality: options.quality,
        time: options.timeMs,
      });
      return result.path;
    }

    // Fallback: Use RNFS and native modules
    console.log('[VideoThumbnail] Native module not available, using fallback');

    // For now, return null and let the gallery use video URI
    // We can implement a more sophisticated fallback later
    return null;

  } catch (error) {
    console.error('[VideoThumbnail] iOS generation failed:', error);
    return null;
  }
}

/**
 * Generates thumbnails for multiple videos in parallel
 *
 * @param videoUris - Array of video URIs
 * @param options - Thumbnail generation options
 * @returns Promise with map of video URI to thumbnail path
 */
export async function generateMultipleThumbnails(
  videoUris: string[],
  options?: ThumbnailOptions
): Promise<Map<string, string | null>> {
  const results = await Promise.all(
    videoUris.map(async (uri) => {
      const thumbnail = await generateVideoThumbnail(uri, options);
      return { uri, thumbnail };
    })
  );

  return new Map(results.map(({ uri, thumbnail }) => [uri, thumbnail]));
}

/**
 * Cleans up temporary thumbnail files
 *
 * @param thumbnailPaths - Array of thumbnail file paths to delete
 */
export async function cleanupThumbnails(thumbnailPaths: string[]): Promise<void> {
  try {
    await Promise.all(
      thumbnailPaths.map(async (path) => {
        const normalizedPath = path.replace('file://', '');
        const exists = await RNFS.exists(normalizedPath);
        if (exists) {
          await RNFS.unlink(normalizedPath);
          console.log('[VideoThumbnail] Cleaned up:', normalizedPath);
        }
      })
    );
  } catch (error) {
    console.error('[VideoThumbnail] Cleanup error:', error);
  }
}

/**
 * Gets video duration in milliseconds
 * Useful for displaying video length in gallery
 *
 * @param videoUri - URI of the video file
 * @returns Promise with duration in milliseconds
 */
export async function getVideoDuration(videoUri: string): Promise<number | null> {
  try {
    const { RNVideoThumbnails } = NativeModules;

    if (RNVideoThumbnails && RNVideoThumbnails.getDuration) {
      const normalizedUri = videoUri.replace('file://', '');
      const duration = await RNVideoThumbnails.getDuration({ path: normalizedUri });
      return duration;
    }

    return null;
  } catch (error) {
    console.error('[VideoThumbnail] Error getting duration:', error);
    return null;
  }
}

/**
 * Formats duration for display (e.g., "1:23", "12:34")
 */
export function formatVideoDuration(durationMs: number | null | undefined): string {
  if (!durationMs || durationMs <= 0) return '0:00';

  const seconds = Math.floor(durationMs / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Test utilities for development
 */
export const VideoThumbnailTestUtils = {
  // Check if native module is available
  isNativeModuleAvailable(): boolean {
    const { RNVideoThumbnails } = NativeModules;
    return !!(RNVideoThumbnails && RNVideoThumbnails.getThumbnail);
  },

  // Generate mock thumbnail for testing
  generateMockThumbnail(videoUri: string): string {
    return videoUri; // Return video URI as fallback
  },
};
