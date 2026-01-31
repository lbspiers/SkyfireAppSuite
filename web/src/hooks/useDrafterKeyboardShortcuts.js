import { useEffect, useCallback } from 'react';

export const useDrafterKeyboardShortcuts = (options = {}) => {
  const {
    onClaimProject,
    onSubmit,
    onRelease,
    enabled = true
  } = options;

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Don't trigger if typing in input/textarea
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      // Allow Ctrl+Enter in textareas for submit
      if (!(event.ctrlKey && event.key === 'Enter')) {
        return;
      }
    }

    // Enter - Claim project (on dashboard)
    if (event.key === 'Enter' && !event.ctrlKey && !event.shiftKey) {
      onClaimProject?.();
    }

    // Ctrl+Enter - Submit (in workspace)
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      onSubmit?.();
    }

    // Escape - Close modals / Release confirmation
    if (event.key === 'Escape') {
      onRelease?.();
    }

    // Ctrl+Shift+R - Release project (with confirmation)
    if (event.ctrlKey && event.shiftKey && event.key === 'R') {
      event.preventDefault();
      onRelease?.();
    }
  }, [enabled, onClaimProject, onSubmit, onRelease]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export default useDrafterKeyboardShortcuts;
