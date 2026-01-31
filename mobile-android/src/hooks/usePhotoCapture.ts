// src/hooks/usePhotoCapture.ts
import { useCallback, useState } from "react";
import { useProjectContext } from "./useProjectContext";
import { useOpenPhotoCapture, TagOption } from "../context/PhotoCaptureContext";
import { photoService } from "../api/photo.service";

export interface PhotoCaptureOptions {
  section: string;
  tagOptions?: TagOption[];
  initialTag?: string;
  initialNote?: string;
  onPhotoAdded?: () => void;
  onNotesSaved?: (note: string) => void;
}

export function usePhotoCapture() {
  const { projectId, companyId } = useProjectContext();
  const openCaptureModal = useOpenPhotoCapture();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Open the photo capture modal for a specific section
  const openForSection = useCallback(
    (options: PhotoCaptureOptions) => {
      if (!projectId || !companyId) {
        console.warn("[usePhotoCapture] Missing project or company ID");
        return;
      }

      const {
        section,
        tagOptions = [
          { label: "Closeup", value: "closeup" },
          { label: "Overview", value: "overview" },
          { label: "Before", value: "before" },
          { label: "After", value: "after" },
          { label: "Issue", value: "issue" },
          { label: "Complete", value: "complete" },
        ],
        initialTag,
        initialNote = "",
        onPhotoAdded,
        onNotesSaved,
      } = options;

      console.log("[usePhotoCapture] Opening modal for section:", section);

      openCaptureModal({
        projectId,
        companyId,
        section,
        tagOptions,
        tagValue: initialTag || null,
        initialNote,
        onSaveNote: (note: string) => {
          console.log("[usePhotoCapture] Note saved:", note);
          onNotesSaved?.(note);
        },
        onMediaAdded: (type: "photo" | "video") => {
          console.log("[usePhotoCapture] Media added:", type);
          setRefreshTrigger((prev) => prev + 1);
          onPhotoAdded?.();
        },
      });
    },
    [projectId, companyId, openCaptureModal]
  );

  // Get photos for a specific section
  const getPhotosForSection = useCallback(
    async (section: string) => {
      if (!projectId) return [];

      try {
        return await photoService.getPhotosBySection(projectId, section);
      } catch (error) {
        console.error(
          "[usePhotoCapture] Failed to get photos for section:",
          error
        );
        return [];
      }
    },
    [projectId]
  );

  // Get photo count for a section
  const getPhotoCount = useCallback(
    async (section: string) => {
      const photos = await getPhotosForSection(section);
      return photos.length;
    },
    [getPhotosForSection]
  );

  // Delete a photo
  const deletePhoto = useCallback(
    async (photoId: string) => {
      if (!projectId) return false;

      try {
        await photoService.deletePhoto(projectId, photoId);
        setRefreshTrigger((prev) => prev + 1);
        return true;
      } catch (error) {
        console.error("[usePhotoCapture] Failed to delete photo:", error);
        return false;
      }
    },
    [projectId]
  );

  return {
    // Actions
    openForSection,
    getPhotosForSection,
    getPhotoCount,
    deletePhoto,

    // State
    refreshTrigger,
    hasProjectContext: Boolean(projectId && companyId),
  };
}

export default usePhotoCapture;
