// src/api/sectionNotes.service.ts
import apiEndpoints from "../config/apiEndPoint";
import { ApiResponse } from "./types"; // Adjust import path as needed

export interface SectionNote {
  id?: string;
  projectId: string;
  section: string;
  notes: string;
  tag?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SectionNotesResponse {
  sectionNote: SectionNote;
  message?: string;
}

export interface SectionNotesListResponse {
  sectionNotes: SectionNote[];
  total?: number;
}

/**
 * Save or update section notes for a specific project and section
 */
export const saveSectionNotes = async (
  projectId: string,
  section: string,
  notes: string,
  tag?: string
): Promise<ApiResponse<SectionNotesResponse>> => {
  try {
    const url = apiEndpoints.PROJECT.PHOTOS.SECTION_NOTES_UPSERT(projectId);

    const requestBody = {
      section: section.trim(),
      notes: notes.trim(),
      ...(tag && { tag: tag.trim() }),
    };

    console.log("[SectionNotesService] Saving notes:", {
      projectId,
      section,
      notesLength: notes.length,
      tag,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add authorization headers as needed
        // "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("[SectionNotesService] Notes saved successfully");

    return {
      status: response.status,
      data,
      message: "Section notes saved successfully",
    };
  } catch (error) {
    console.error("[SectionNotesService] Failed to save notes:", error);
    throw error;
  }
};

/**
 * Load section notes for a specific project and section
 */
export const loadSectionNotes = async (
  projectId: string,
  section?: string
): Promise<ApiResponse<SectionNote | SectionNotesListResponse>> => {
  try {
    let url = apiEndpoints.PROJECT.PHOTOS.LIST(projectId) + "/section-notes";

    if (section) {
      url += `?section=${encodeURIComponent(section.trim())}`;
    }

    console.log("[SectionNotesService] Loading notes:", {
      projectId,
      section,
    });

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Add authorization headers as needed
        // "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No notes found is not an error
        return {
          status: 200,
          data: section ? undefined : { sectionNotes: [], total: 0 },
          message: "No notes found",
        };
      }

      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("[SectionNotesService] Notes loaded successfully");

    return {
      status: response.status,
      data,
      message: "Section notes loaded successfully",
    };
  } catch (error) {
    console.error("[SectionNotesService] Failed to load notes:", error);
    throw error;
  }
};

/**
 * Clear/delete section notes for a specific project and section
 */
export const clearSectionNotes = async (
  projectId: string,
  section: string
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const url = apiEndpoints.PROJECT.PHOTOS.SECTION_NOTES_CLEAR(projectId);

    const requestBody = {
      section: section.trim(),
    };

    console.log("[SectionNotesService] Clearing notes:", {
      projectId,
      section,
    });

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        // Add authorization headers as needed
        // "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("[SectionNotesService] Notes cleared successfully");

    return {
      status: response.status,
      data: data || { message: "Section notes cleared successfully" },
      message: "Section notes cleared successfully",
    };
  } catch (error) {
    console.error("[SectionNotesService] Failed to clear notes:", error);
    throw error;
  }
};

/**
 * Get all section notes for a project (for reporting/overview)
 */
export const getAllSectionNotes = async (
  projectId: string
): Promise<ApiResponse<SectionNotesListResponse>> => {
  try {
    const response = await loadSectionNotes(projectId); // No section = get all

    // Ensure we always return a list format
    if (response.data && typeof response.data === "object") {
      // If it's already a list response, return as-is
      if ("sectionNotes" in response.data) {
        return response as ApiResponse<SectionNotesListResponse>;
      }
      // If it's a single note (shouldn't happen when no section specified), wrap it
      if ("notes" in response.data) {
        return {
          ...response,
          data: {
            sectionNotes: [response.data as SectionNote],
            total: 1,
          },
        };
      }
    }

    // Default to empty list
    return {
      ...response,
      data: {
        sectionNotes: [],
        total: 0,
      },
    };
  } catch (error) {
    console.error("[SectionNotesService] Failed to get all notes:", error);
    throw error;
  }
};

/**
 * Bulk update multiple section notes at once
 */
export const bulkUpdateSectionNotes = async (
  projectId: string,
  notes: Array<{ section: string; notes: string; tag?: string }>
): Promise<ApiResponse<{ updated: number; message: string }>> => {
  try {
    const results = await Promise.allSettled(
      notes.map((note) =>
        saveSectionNotes(projectId, note.section, note.notes, note.tag)
      )
    );

    const successful = results.filter(
      (result) => result.status === "fulfilled"
    );
    const failed = results.filter((result) => result.status === "rejected");

    if (failed.length > 0) {
      console.warn("[SectionNotesService] Some bulk updates failed:", failed);
    }

    return {
      status: 200,
      data: {
        updated: successful.length,
        message: `Updated ${successful.length} of ${notes.length} section notes`,
      },
      message: `Bulk update completed: ${successful.length}/${notes.length} successful`,
    };
  } catch (error) {
    console.error("[SectionNotesService] Bulk update failed:", error);
    throw error;
  }
};

// Export default service object
const SectionNotesService = {
  saveSectionNotes,
  loadSectionNotes,
  clearSectionNotes,
  getAllSectionNotes,
  bulkUpdateSectionNotes,
};

export default SectionNotesService;
