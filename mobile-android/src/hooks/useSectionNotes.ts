// src/hooks/useSectionNotes.ts
import { useState, useCallback, useEffect } from "react";
import SectionNotesService, { SectionNote } from "../api/sectionNotes.service";

export interface UseSectionNotesReturn {
  // State
  notes: string;
  tag: string;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSaved: Date | null;
  isDirty: boolean;

  // Actions
  setNotes: (notes: string) => void;
  setTag: (tag: string) => void;
  saveNotes: () => Promise<boolean>;
  clearNotes: () => Promise<boolean>;
  loadNotes: () => Promise<boolean>;
  reset: () => void;

  // Utilities
  hasUnsavedChanges: boolean;
}

export interface UseSectionNotesOptions {
  projectId: string;
  section: string;
  autoLoad?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export function useSectionNotes({
  projectId,
  section,
  autoLoad = true,
  autoSave = false,
  autoSaveDelay = 2000,
}: UseSectionNotesOptions): UseSectionNotesReturn {
  // State
  const [notes, setNotesState] = useState<string>("");
  const [tag, setTagState] = useState<string>("");
  const [originalNotes, setOriginalNotes] = useState<string>("");
  const [originalTag, setOriginalTag] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Computed state
  const isDirty = notes !== originalNotes || tag !== originalTag;
  const hasUnsavedChanges =
    isDirty && (notes.trim() !== "" || tag.trim() !== "");

  // Load notes from backend
  const loadNotes = useCallback(async (): Promise<boolean> => {
    if (!projectId || !section) {
      console.warn("[useSectionNotes] Missing projectId or section");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await SectionNotesService.loadSectionNotes(
        projectId,
        section
      );

      if (
        response.data &&
        typeof response.data === "object" &&
        "notes" in response.data
      ) {
        const sectionNote = response.data as SectionNote;
        const loadedNotes = sectionNote.notes || "";
        const loadedTag = sectionNote.tag || "";

        setNotesState(loadedNotes);
        setTagState(loadedTag);
        setOriginalNotes(loadedNotes);
        setOriginalTag(loadedTag);

        console.log("[useSectionNotes] Loaded notes successfully:", {
          projectId,
          section,
          notesLength: loadedNotes.length,
          tag: loadedTag,
        });
      } else {
        // No existing notes
        setNotesState("");
        setTagState("");
        setOriginalNotes("");
        setOriginalTag("");
      }

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load notes";
      setError(errorMessage);
      console.error("[useSectionNotes] Load failed:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [projectId, section]);

  // Save notes to backend
  const saveNotes = useCallback(async (): Promise<boolean> => {
    if (!projectId || !section) {
      console.warn("[useSectionNotes] Missing projectId or section");
      return false;
    }

    if (!isDirty) {
      console.log("[useSectionNotes] No changes to save");
      return true;
    }

    setIsSaving(true);
    setError(null);

    try {
      await SectionNotesService.saveSectionNotes(
        projectId,
        section,
        notes.trim(),
        tag.trim() || undefined
      );

      setOriginalNotes(notes);
      setOriginalTag(tag);
      setLastSaved(new Date());

      console.log("[useSectionNotes] Saved notes successfully:", {
        projectId,
        section,
        notesLength: notes.trim().length,
        tag: tag.trim(),
      });

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save notes";
      setError(errorMessage);
      console.error("[useSectionNotes] Save failed:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [projectId, section, notes, tag, isDirty]);

  // Clear notes from backend and local state
  const clearNotes = useCallback(async (): Promise<boolean> => {
    if (!projectId || !section) {
      console.warn("[useSectionNotes] Missing projectId or section");
      return false;
    }

    setIsSaving(true);
    setError(null);

    try {
      await SectionNotesService.clearSectionNotes(projectId, section);

      setNotesState("");
      setTagState("");
      setOriginalNotes("");
      setOriginalTag("");
      setLastSaved(new Date());

      console.log("[useSectionNotes] Cleared notes successfully:", {
        projectId,
        section,
      });

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to clear notes";
      setError(errorMessage);
      console.error("[useSectionNotes] Clear failed:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [projectId, section]);

  // Reset to original state
  const reset = useCallback(() => {
    setNotesState(originalNotes);
    setTagState(originalTag);
    setError(null);
  }, [originalNotes, originalTag]);

  // Update notes with validation
  const setNotes = useCallback((newNotes: string) => {
    // Limit to 750 characters as specified
    const truncatedNotes = newNotes.slice(0, 750);
    setNotesState(truncatedNotes);
    setError(null);
  }, []);

  // Update tag
  const setTag = useCallback((newTag: string) => {
    setTagState(newTag);
    setError(null);
  }, []);

  // Auto-load on mount and when dependencies change
  useEffect(() => {
    if (autoLoad && projectId && section) {
      loadNotes();
    }
  }, [autoLoad, projectId, section, loadNotes]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !isDirty || !hasUnsavedChanges) {
      return;
    }

    const timeoutId = setTimeout(() => {
      saveNotes();
    }, autoSaveDelay);

    return () => clearTimeout(timeoutId);
  }, [autoSave, isDirty, hasUnsavedChanges, autoSaveDelay, saveNotes]);

  // Cleanup function to warn about unsaved changes
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges) {
        console.warn(
          "[useSectionNotes] Component unmounted with unsaved changes:",
          {
            projectId,
            section,
            notesLength: notes.length,
          }
        );
      }
    };
  }, [hasUnsavedChanges, projectId, section, notes.length]);

  return {
    // State
    notes,
    tag,
    isLoading,
    isSaving,
    error,
    lastSaved,
    isDirty,

    // Actions
    setNotes,
    setTag,
    saveNotes,
    clearNotes,
    loadNotes,
    reset,

    // Utilities
    hasUnsavedChanges,
  };
}

export default useSectionNotes;
