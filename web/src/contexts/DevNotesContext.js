/**
 * DevNotesContext - Global state management for dev notes
 * Provides access to dev notes functionality from anywhere in the app
 */
import React, { createContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { isSuperAdmin } from '../services/authService';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  sendNote,
} from '../services/devNoteService';

export const DevNotesContext = createContext(null);

export const DevNotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);

  /**
   * Fetch all notes from the backend
   */
  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getNotes();
      if (response.status === 'SUCCESS') {
        setNotes(response.data || []);
      }
    } catch (error) {
      console.error('[DevNotes] Failed to fetch notes:', error);
      // Silent fail - don't show toast on initial load
      // Only show error if user explicitly tries to open panel
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new note
   */
  const handleCreateNote = useCallback(async (noteData) => {
    try {
      const response = await createNote(noteData);
      if (response.status === 'SUCCESS') {
        setNotes((prev) => [response.data, ...prev]);
        return response.data;
      }
    } catch (error) {
      console.error('[DevNotes] Failed to create note:', error);
      toast.error('Failed to create note');
      throw error;
    }
  }, []);

  /**
   * Update an existing note
   */
  const handleUpdateNote = useCallback(async (noteId, updates) => {
    try {
      const response = await updateNote(noteId, updates);
      if (response.status === 'SUCCESS') {
        setNotes((prev) =>
          prev.map((note) =>
            note.id === noteId ? { ...note, ...updates } : note
          )
        );
        return response.data;
      }
    } catch (error) {
      console.error('[DevNotes] Failed to update note:', error);
      toast.error('Failed to update note');
      throw error;
    }
  }, []);

  /**
   * Delete a note
   */
  const handleDeleteNote = useCallback(async (noteId) => {
    try {
      await deleteNote(noteId);
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
    } catch (error) {
      console.error('[DevNotes] Failed to delete note:', error);
      toast.error('Failed to delete note');
      throw error;
    }
  }, []);

  /**
   * Send a note (marks as sent)
   */
  const handleSendNote = useCallback(async (noteId) => {
    try {
      await sendNote(noteId);
      setNotes((prev) =>
        prev.map((note) =>
          note.id === noteId ? { ...note, sent: true } : note
        )
      );
    } catch (error) {
      console.error('[DevNotes] Failed to send note:', error);
      toast.error('Failed to send note');
      throw error;
    }
  }, []);

  /**
   * Open the dev notes panel
   */
  const openPanel = useCallback(() => {
    setIsPanelOpen(true);
  }, []);

  /**
   * Close the dev notes panel
   */
  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    setCurrentNote(null);
  }, []);

  /**
   * Open panel with a specific note
   */
  const openNoteInPanel = useCallback((note) => {
    setCurrentNote(note);
    setIsPanelOpen(true);
  }, []);

  // Fetch notes on mount - only for super admins
  useEffect(() => {
    if (isSuperAdmin()) {
      fetchNotes();
    }
  }, [fetchNotes]);

  const value = {
    // State
    notes,
    isLoading,
    isPanelOpen,
    currentNote,

    // Actions
    fetchNotes,
    createNote: handleCreateNote,
    updateNote: handleUpdateNote,
    deleteNote: handleDeleteNote,
    sendNote: handleSendNote,
    openPanel,
    closePanel,
    openNoteInPanel,
  };

  return (
    <DevNotesContext.Provider value={value}>
      {children}
    </DevNotesContext.Provider>
  );
};
