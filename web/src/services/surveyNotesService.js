/**
 * Survey Notes Service - API endpoints for project notes
 * Handles CRUD operations for survey notes
 */

import axiosInstance from '../api/axiosInstance';
import logger from './devLogger';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.skyfireapp.io';

/**
 * Get all notes for a project, optionally filtered by section
 * @param {string} projectUuid - Project UUID
 * @param {string} [section] - Optional section filter (e.g., 'solar_panel_1')
 * @returns {Promise<Array>} Array of note objects
 */
export const getSurveyNotes = async (projectUuid, section = null) => {
  try {
    const url = section
      ? `/project/${projectUuid}/notes?section=${encodeURIComponent(section)}`
      : `/project/${projectUuid}/notes`;

    logger.log('SurveyNotesService', `Getting notes for project ${projectUuid}${section ? ` (section: ${section})` : ''}`);

    const response = await axiosInstance.get(url);

    // Handle different response formats
    const notes = response.data?.data || response.data || [];

    logger.log('SurveyNotesService', `Retrieved ${notes.length} notes`);

    return notes;
  } catch (error) {
    logger.error('SurveyNotesService', 'Failed to get notes:', error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Create a new note
 * @param {string} projectUuid - Project UUID
 * @param {Object} noteData - Note data
 * @param {string} noteData.content - Note content (required)
 * @param {string} [noteData.section] - Section identifier (optional)
 * @param {string} [noteData.priority] - Priority: 'high' | 'medium' | 'info' (optional, default: 'info')
 * @returns {Promise<Object>} Created note object
 */
export const createSurveyNote = async (projectUuid, { content, section = null, priority = 'info' }) => {
  try {
    logger.log('SurveyNotesService', `Creating note for project ${projectUuid}`, { section, priority });

    const response = await axiosInstance.post(`/project/${projectUuid}/notes`, {
      content,
      section,
      priority,
    });

    const note = response.data?.data || response.data;

    logger.log('SurveyNotesService', `Note created successfully:`, note.id);

    return note;
  } catch (error) {
    logger.error('SurveyNotesService', 'Failed to create note:', error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Update an existing note
 * @param {string} projectUuid - Project UUID
 * @param {string} noteId - Note UUID
 * @param {Object} updates - Fields to update
 * @param {string} [updates.content] - Updated content
 * @param {string} [updates.section] - Updated section
 * @param {string} [updates.priority] - Updated priority
 * @param {boolean} [updates.isPinned] - Updated pin status
 * @returns {Promise<Object>} Updated note object
 */
export const updateSurveyNote = async (projectUuid, noteId, updates) => {
  try {
    logger.log('SurveyNotesService', `Updating note ${noteId}`, updates);

    const response = await axiosInstance.put(`/project/${projectUuid}/notes/${noteId}`, updates);

    const note = response.data?.data || response.data;

    logger.log('SurveyNotesService', `Note updated successfully`);

    return note;
  } catch (error) {
    logger.error('SurveyNotesService', 'Failed to update note:', error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Toggle the pin status of a note
 * @param {string} projectUuid - Project UUID
 * @param {string} noteId - Note UUID
 * @returns {Promise<Object>} Updated note object with new pin status
 */
export const toggleNotePin = async (projectUuid, noteId) => {
  try {
    logger.log('SurveyNotesService', `Toggling pin for note ${noteId}`);

    const response = await axiosInstance.patch(`/project/${projectUuid}/notes/${noteId}/pin`);

    const note = response.data?.data || response.data;

    logger.log('SurveyNotesService', `Note pin toggled: ${note.isPinned}`);

    return note;
  } catch (error) {
    logger.error('SurveyNotesService', 'Failed to toggle pin:', error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Delete a note
 * @param {string} projectUuid - Project UUID
 * @param {string} noteId - Note UUID
 * @returns {Promise<void>}
 */
export const deleteSurveyNote = async (projectUuid, noteId) => {
  try {
    logger.log('SurveyNotesService', `Deleting note ${noteId}`);

    await axiosInstance.delete(`/project/${projectUuid}/notes/${noteId}`);

    logger.log('SurveyNotesService', `Note deleted successfully`);
  } catch (error) {
    logger.error('SurveyNotesService', 'Failed to delete note:', error?.response?.data || error?.message);
    throw error;
  }
};

export default {
  getSurveyNotes,
  createSurveyNote,
  updateSurveyNote,
  toggleNotePin,
  deleteSurveyNote,
};
