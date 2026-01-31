/**
 * useDevNotes - Custom hook for consuming DevNotesContext
 * Provides access to dev notes state and actions
 */
import { useContext } from 'react';
import { DevNotesContext } from '../contexts/DevNotesContext';

export const useDevNotes = () => {
  const context = useContext(DevNotesContext);

  if (!context) {
    throw new Error('useDevNotes must be used within DevNotesProvider');
  }

  return context;
};
