// Media + gallery shared types & tiny helpers

export type MediaType = "photo" | "video";

export interface PhotoItem {
  id: string; // uuid
  projectId: string; // uuid of the project

  // URLs
  url: string; // full media URL (jpg/mp4/etc)
  thumbUrl?: string | null;
  posterUrl?: string | null; // preferred for videos, safe fallback for images

  // Labels / metadata
  section: string; // e.g., "Solar Panel 1"
  tag?: string | null; // optional tag
  fileName?: string | null;

  // Notes (original typed note + optional AI summary)
  originalNotes?: string | null;
  aiSummary?: string | null;

  // Timestamps
  capturedAt: string; // ISO string
  createdAt: string; // ISO string

  // Media properties
  mediaType: MediaType; // "photo" | "video"
  durationMs?: number | null; // only for video
  mimeType?: string | null;
  fileSize?: number | null;
}

// Grouping type used by the gallery screen when bucketing by section
export type SectionMap = Record<string, PhotoItem[]>;

/** Client → API payload for creating a media row.
 *  We accept both camelCase and snake_case to keep interop easy.
 */
export interface CreateMediaRequest {
  url: string;
  section: string;
  tag?: string | null;

  capturedAt?: string;
  // either of these keys is accepted
  type?: MediaType;
  media_type?: MediaType;

  // notes
  originalNotes?: string | null;
  note?: string | null;

  aiSummary?: string | null;
  ai_summary?: string | null;

  // optional video/meta extras
  durationMs?: number | null;
  duration_ms?: number | null;

  mimeType?: string | null;
  mime_type?: string | null;

  fileSize?: number | null;
  file_size?: number | null;

  posterUrl?: string | null;
  poster_url?: string | null;

  thumbUrl?: string | null;
  thumb_url?: string | null;

  fileName?: string | null;
  file_name?: string | null;
}

export interface BulkDeleteRequest {
  ids: string[];
}

/* ------------------------- helpers ------------------------- */

export const isVideoItem = (m: {
  mediaType?: string | null | undefined;
}): boolean => m.mediaType === "video";

export const isPhotoItem = (m: {
  mediaType?: string | null | undefined;
}): boolean => m.mediaType !== "video";

export const sortByCapturedDesc = (a: PhotoItem, b: PhotoItem): number => {
  if (a.capturedAt === b.capturedAt) return 0;
  return a.capturedAt < b.capturedAt ? 1 : -1;
};
