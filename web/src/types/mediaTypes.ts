/**
 * Media Types - Photo and Video interfaces
 */

/**
 * Photo object with compression tiers
 * Server automatically generates 3 optimized versions:
 * - thumbUrl: 300x300, ~30-50KB (for grid thumbnails)
 * - previewUrl: 1920px max, ~200-400KB (for lightbox viewing)
 * - optimizedUrl: 2560px max, ~500KB-1MB (for high-res viewing)
 * - url: Original full resolution (for downloads)
 */
export interface Photo {
  id: string;
  uuid?: string;
  projectId: string;

  // Photo URLs - prioritize compressed versions for performance
  url: string;                  // Full resolution original (8-12MB for HEIC)
  thumbUrl?: string;            // 300x300 thumbnail (~30-50KB) - USE FOR GRIDS
  previewUrl?: string;          // 1920px preview (~200-400KB) - USE FOR VIEWING
  optimizedUrl?: string;        // 2560px optimized (~500KB-1MB) - USE FOR HIGH-RES

  // Legacy field names (for backward compatibility)
  thumbnail_url?: string;       // Alias for thumbUrl
  preview_url?: string;         // Alias for previewUrl
  photo_url?: string;           // Alias for url
  s3_url?: string;              // Alias for url

  // Metadata
  section: string;              // Required: 'general', 'solar_panel', 'msp', etc.
  tag?: string;                 // Optional tag
  note?: string;                // Optional notes
  fileName?: string;            // Original filename
  filename?: string;            // Alias for fileName
  name?: string;                // Alias for fileName
  original_filename?: string;   // Alias for fileName

  // Photo details
  mimeType?: string;            // e.g., 'image/jpeg', 'image/heic'
  fileSize?: number;            // Original file size in bytes
  capturedAt?: string;          // ISO date when photo was taken
  createdAt: string;            // ISO date when uploaded
  updatedAt?: string;           // ISO date when last modified

  // Media type
  mediaType?: 'photo' | 'video'; // Type discriminator
  type?: 'photo' | 'video';      // Alias for mediaType

  // Other properties
  originalNotes?: string;        // Legacy notes field
  duration?: number;             // Video duration (undefined for photos)
}

/**
 * Video object
 */
export interface Video {
  id: string;
  uuid?: string;
  projectId: string;

  // Video URL
  url: string;

  // Metadata
  section: string;
  tag?: string;
  note?: string;
  fileName?: string;
  filename?: string;
  name?: string;

  // Video details
  mimeType?: string;
  fileSize?: number;
  duration?: number;              // Video duration in seconds
  capturedAt?: string;
  createdAt: string;
  updatedAt?: string;

  // Media type
  mediaType: 'video';
  type?: 'video';
}

/**
 * Union type for media (photos or videos)
 */
export type Media = Photo | Video;

/**
 * Photo upload response from server
 */
export interface PhotoUploadResponse {
  status: 'SUCCESS' | 'ERROR';
  data: Photo;
  compression?: {
    originalSize: string;        // e.g., "8.2 MB"
    compressedSize: string;      // e.g., "1.1 MB"
    savings: string;             // e.g., "86.6%"
    wasHeic: boolean;            // true if HEIC was converted to JPEG
  };
}

/**
 * Photo metadata update request
 */
export interface PhotoMetadataUpdate {
  section?: string;
  tag?: string;
  note?: string;
}

/**
 * Photo list filter options
 */
export interface PhotoFilters {
  section?: string;
  tag?: string;
  mediaType?: 'photo' | 'video';
  type?: 'photo' | 'video' | 'document';
}
