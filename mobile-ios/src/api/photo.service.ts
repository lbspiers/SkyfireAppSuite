// src/api/photo.service.ts
import apiEndpoints from "../config/apiEndPoint";
import axiosInstance from "./axiosInstance";
import { fileUploadGeneric } from "./uploadfiles.service";
import { withRetry, getErrorMessage } from "../utils/apiRetry";

// API returns camelCase, but we use snake_case internally
interface ApiPhotoResponse {
  id: string;
  projectId: string;
  url: string;
  s3Key?: string;
  thumbUrl?: string;
  posterUrl?: string;
  section: string;
  tag?: string;
  fileName: string;
  note?: string;
  aiSummary?: string;
  capturedAt: string;
  createdAt: string;
  deletedAt?: string;
  mediaType: "photo" | "video";
  durationMs?: number;
  mimeType: string;
  fileSize?: number;
  originalNotes?: string;
  keys?: number;
  more?: string;
}

export interface PhotoRecord {
  id: string;
  project_uuid: string;
  url: string;
  s3_key?: string;
  thumb_url?: string;
  section: string;
  tag?: string;
  file_name: string;
  note?: string;
  ai_summary?: string;
  captured_at: string;
  created_at: string;
  deleted_at?: string;
  media_type: "photo" | "video";
  duration_ms?: number;
  mime_type: string;
  file_size?: number;
  poster_url?: string;
  original_notes?: string;
}

export interface CreatePhotoData {
  section: string;
  tag?: string;
  note?: string;
  media_type: "photo" | "video";
  file_name: string;
  mime_type: string;
  file_size?: number;
  duration_ms?: number;
  thumb_url?: string;
  poster_url?: string;
}

export interface PhotosBySection {
  [section: string]: PhotoRecord[];
}

// Helper function to convert API response to internal format
function convertApiResponseToPhotoRecord(apiPhoto: ApiPhotoResponse): PhotoRecord {
  return {
    id: apiPhoto.id,
    project_uuid: apiPhoto.projectId,
    url: apiPhoto.url,
    s3_key: apiPhoto.s3Key,
    thumb_url: apiPhoto.thumbUrl,
    section: apiPhoto.section,
    tag: apiPhoto.tag,
    file_name: apiPhoto.fileName,
    note: apiPhoto.note,
    ai_summary: apiPhoto.aiSummary,
    captured_at: apiPhoto.capturedAt,
    created_at: apiPhoto.createdAt,
    deleted_at: apiPhoto.deletedAt,
    media_type: apiPhoto.mediaType,
    duration_ms: apiPhoto.durationMs,
    mime_type: apiPhoto.mimeType,
    file_size: apiPhoto.fileSize,
    poster_url: apiPhoto.posterUrl,
    original_notes: apiPhoto.originalNotes,
  };
}

class PhotoService {
  private baseUrl = apiEndpoints.BASE_URL;

  /**
   * Get all photos for a project, grouped by section
   */
  async getPhotosByProject(projectId: string): Promise<PhotosBySection> {
    try {
      const response = await axiosInstance.get(
        `${this.baseUrl}/project/${projectId}/photos`
      );

      // API might return array directly or wrapped in data property
      const rawPhotos = response.data?.data || response.data || [];
      
      // Convert each photo from API format to internal format
      const photos: PhotoRecord[] = Array.isArray(rawPhotos) 
        ? rawPhotos.map(convertApiResponseToPhotoRecord)
        : [];

      // Group photos by section
      const photosBySection: PhotosBySection = {};
      photos.forEach((photo) => {
        if (!photosBySection[photo.section]) {
          photosBySection[photo.section] = [];
        }
        photosBySection[photo.section].push(photo);
      });

      // Sort photos within each section by captured_at (newest first)
      Object.keys(photosBySection).forEach((section) => {
        photosBySection[section].sort(
          (a, b) =>
            new Date(b.captured_at).getTime() -
            new Date(a.captured_at).getTime()
        );
      });

      console.log(
        "[PhotoService] Loaded photos by section:",
        Object.keys(photosBySection).map(
          (section) => `${section}: ${photosBySection[section].length}`
        )
      );

      return photosBySection;
    } catch (error) {
      console.error("[PhotoService] Failed to get photos:", error);
      throw error;
    }
  }

  /**
   * Upload a photo/video file and create database record
   */
  async createPhoto(
    projectId: string,
    companyId: string,
    localUri: string,
    data: CreatePhotoData
  ): Promise<PhotoRecord> {
    try {
      console.log("[PhotoService] Creating photo with params:", {
        projectId,
        companyId,
        localUri,
        data
      });

      // Step 1: Upload file to S3
      console.log("[PhotoService] Starting S3 upload...");
      const uploadResult = await fileUploadGeneric({
        companyId,
        fileName: data.file_name,
        fileUri: localUri,
        fileType: data.mime_type,
        directory: "photos",
      });

      console.log("[PhotoService] File uploaded successfully:", uploadResult);

      // Step 2: Create database record
      const photoData = {
        ...data,
        url: uploadResult, // S3 URL from upload
        captured_at: new Date().toISOString(),
      };

      // Use retry logic for API call with 30s timeout
      const response = await withRetry(
        () =>
          axiosInstance.post(
            `${this.baseUrl}/project/${projectId}/photos`,
            photoData
          ),
        {
          maxRetries: 2, // Try up to 3 times total
          timeoutMs: 30000, // 30 second timeout
          retryDelayMs: 1500, // 1.5 seconds between retries
        }
      );

      // The API returns the photo data directly in response.data
      const apiResponse: ApiPhotoResponse = response.data;

      // Add defensive check before accessing properties
      if (!apiResponse) {
        throw new Error("No photo data in response");
      }

      if (!apiResponse.id) {
        console.error("[PhotoService] Response missing ID:", apiResponse);
        throw new Error("Response missing required id field");
      }

      // Convert API response format to internal format
      const photo: PhotoRecord = convertApiResponseToPhotoRecord(apiResponse);

      console.log("[PhotoService] Photo created successfully:", photo.id);

      return photo;
    } catch (error: any) {
      const userMessage = getErrorMessage(error);
      console.error("[PhotoService] Failed to create photo:", {
        userMessage,
        error: error?.message,
        status: error?.response?.status,
      });

      // Attach user-friendly message to error
      error.userMessage = userMessage;
      throw error;
    }
  }

  /**
   * Update photo metadata (note, tag, etc.)
   */
  async updatePhoto(
    projectId: string,
    photoId: string,
    updates: Partial<CreatePhotoData>
  ): Promise<PhotoRecord> {
    try {
      console.log("[PhotoService] Updating photo:", photoId, updates);

      const response = await axiosInstance.put(
        `${this.baseUrl}/project/${projectId}/photos/${photoId}`,
        updates
      );

      // API returns photo data directly in response.data
      const apiResponse: ApiPhotoResponse = response.data;
      
      if (!apiResponse) {
        throw new Error("[PhotoService] No photo data in update response");
      }
      
      return convertApiResponseToPhotoRecord(apiResponse);
    } catch (error) {
      console.error("[PhotoService] Failed to update photo:", error);
      throw error;
    }
  }

  /**
   * Delete a single photo
   */
  async deletePhoto(projectId: string, photoId: string): Promise<void> {
    try {
      console.log("[PhotoService] Deleting photo:", photoId);

      await axiosInstance.delete(
        `${this.baseUrl}/project/${projectId}/photos/${photoId}`
      );

      console.log("[PhotoService] Photo deleted successfully");
    } catch (error) {
      console.error("[PhotoService] Failed to delete photo:", error);
      throw error;
    }
  }

  /**
   * Bulk delete multiple photos
   */
  async bulkDeletePhotos(projectId: string, photoIds: string[]): Promise<void> {
    try {
      console.log("[PhotoService] Bulk deleting photos:", photoIds.length);

      await axiosInstance.delete(
        `${this.baseUrl}/project/${projectId}/photos/bulk-delete`,
        {
          data: { photoIds },
        }
      );

      console.log("[PhotoService] Photos bulk deleted successfully");
    } catch (error) {
      console.error("[PhotoService] Failed to bulk delete photos:", error);
      throw error;
    }
  }

  /**
   * Get photos for a specific section
   */
  async getPhotosBySection(
    projectId: string,
    section: string
  ): Promise<PhotoRecord[]> {
    try {
      const allPhotos = await this.getPhotosByProject(projectId);
      return allPhotos[section] || [];
    } catch (error) {
      console.error("[PhotoService] Failed to get photos by section:", error);
      throw error;
    }
  }
}

export const photoService = new PhotoService();
export default photoService;
