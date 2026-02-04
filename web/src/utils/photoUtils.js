/**
 * Photo URL utilities for handling multiple URL variants and sizes
 *
 * The backend now provides compressed versions of photos:
 * - thumbUrl/thumb_url: 300x300, ~40KB - for grid thumbnails
 * - previewUrl/preview_url: 1920px, ~300KB - for modal viewing
 * - optimizedUrl/optimized_url: 2560px, ~700KB - for high-res viewing
 * - url: Full resolution - for downloads
 */

/**
 * Get the appropriate photo URL based on desired size
 * Handles both camelCase and snake_case property names for backward compatibility
 *
 * @param {Object} photo - Photo object from API
 * @param {string} size - Desired size: 'thumb', 'preview', 'optimized', or 'full'
 * @returns {string|null} - URL for the photo or null if photo is invalid
 *
 * @example
 * // Get thumbnail for grid view (40KB)
 * <img src={getPhotoUrl(photo, 'thumb')} />
 *
 * @example
 * // Get preview for modal view (300KB)
 * <img src={getPhotoUrl(photo, 'preview')} />
 *
 * @example
 * // Get full resolution for download
 * <a href={getPhotoUrl(photo, 'full')} download>Download</a>
 */
export const getPhotoUrl = (photo, size = 'thumb') => {
  if (!photo) return null;

  switch (size) {
    case 'thumb':
      // 300x300 thumbnail - ideal for grid views (~40KB)
      return photo.thumbUrl ||
             photo.thumb_url ||
             photo.thumbnail_url ||
             photo.thumbnailUrl ||
             photo.url;

    case 'preview':
      // 1920px preview - ideal for modal viewing (~300KB)
      return photo.previewUrl ||
             photo.preview_url ||
             photo.optimizedUrl ||
             photo.optimized_url ||
             photo.url;

    case 'optimized':
      // 2560px optimized - high quality viewing (~700KB)
      return photo.optimizedUrl ||
             photo.optimized_url ||
             photo.previewUrl ||
             photo.preview_url ||
             photo.url;

    case 'full':
    default:
      // Full resolution - for downloads
      return photo.url ||
             photo.photo_url ||
             photo.s3_url ||
             photo.image_url;
  }
};

/**
 * Get thumbnail URL with legacy property fallbacks
 * Optimized for grid displays
 *
 * @param {Object} photo - Photo object from API
 * @returns {string|null} - Thumbnail URL or null
 */
export const getThumbUrl = (photo) => {
  if (!photo) return null;

  return photo.thumbUrl ||
         photo.thumb_url ||
         photo.thumbnail_url ||
         photo.thumbnailUrl ||
         photo.url ||
         photo.photo_url ||
         photo.s3_url ||
         photo.image_url;
};

/**
 * Get preview URL with legacy property fallbacks
 * Optimized for modal/lightbox viewing
 *
 * @param {Object} photo - Photo object from API
 * @returns {string|null} - Preview URL or null
 */
export const getPreviewUrl = (photo) => {
  if (!photo) return null;

  return photo.previewUrl ||
         photo.preview_url ||
         photo.optimizedUrl ||
         photo.optimized_url ||
         photo.url ||
         photo.photo_url ||
         photo.s3_url;
};

/**
 * Get full resolution URL for downloads
 *
 * @param {Object} photo - Photo object from API
 * @returns {string|null} - Full resolution URL or null
 */
export const getFullUrl = (photo) => {
  if (!photo) return null;

  return photo.url ||
         photo.photo_url ||
         photo.s3_url ||
         photo.image_url ||
         photo.previewUrl ||
         photo.preview_url;
};

/**
 * Check if photo has compressed versions available
 *
 * @param {Object} photo - Photo object from API
 * @returns {boolean} - True if compressed versions exist
 */
export const hasCompressedVersions = (photo) => {
  if (!photo) return false;

  return !!(photo.thumbUrl || photo.thumb_url ||
            photo.previewUrl || photo.preview_url ||
            photo.optimizedUrl || photo.optimized_url);
};

/**
 * Get video thumbnail URL with fallbacks
 *
 * @param {Object} video - Video object from API
 * @returns {string|null} - Thumbnail URL or null
 */
export const getVideoThumbUrl = (video) => {
  if (!video) return null;

  return video.thumbnail_url ||
         video.thumbUrl ||
         video.thumb_url ||
         video.url;
};

/**
 * Format file size for display
 *
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * Calculate compression savings percentage
 *
 * @param {number} originalSize - Original file size in bytes
 * @param {number} compressedSize - Compressed file size in bytes
 * @returns {string} - Savings percentage (e.g., "91.8%")
 */
export const calculateSavings = (originalSize, compressedSize) => {
  if (!originalSize || !compressedSize) return '0%';

  const savings = ((originalSize - compressedSize) / originalSize) * 100;
  return `${savings.toFixed(1)}%`;
};
