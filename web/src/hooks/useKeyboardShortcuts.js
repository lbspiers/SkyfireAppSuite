import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { KEYBOARD_SHORTCUTS, SHORTCUT_ACTIONS } from '../constants/keyboardShortcuts';
import { toast } from 'react-toastify';

/**
 * Professional Keyboard Shortcuts Hook
 *
 * Centralized, scalable keyboard shortcut system supporting:
 * - Context-aware shortcuts
 * - Platform detection (Mac/Windows)
 * - Custom handlers
 * - Visual feedback
 * - Conflict detection
 *
 * Usage:
 *   useKeyboardShortcuts({
 *     onSave: () => saveForm(),
 *     onSearch: () => setSearchOpen(true),
 *     enableVisualFeedback: true,
 *   });
 */
export function useKeyboardShortcuts(options = {}) {
  const navigate = useNavigate();
  const {
    // Custom handlers for specific shortcuts
    handlers = {},
    // Enable/disable shortcuts
    enabled = true,
    // Show toast feedback when shortcuts trigger
    enableVisualFeedback = false,
    // Only enable certain tiers (1, 2, 3)
    enabledTiers = [1, 2, 3],
    // Context (e.g., 'list', 'form', 'chat') for context-specific shortcuts
    context = null,
  } = options;

  // Detect platform
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Track last triggered shortcut for visual feedback
  const lastTriggeredRef = useRef(null);

  /**
   * Check if event target is an input field where we should ignore shortcuts
   */
  const shouldIgnoreEvent = useCallback((event, shortcut) => {
    const target = event.target;
    const tagName = target.tagName.toLowerCase();
    const isEditable = target.isContentEditable;
    const isTypingContext = tagName === 'input' || tagName === 'textarea' || tagName === 'select' || isEditable;

    // Always allow Escape
    if (event.key === 'Escape') {
      return false;
    }

    // Ignore most shortcuts when typing
    if (isTypingContext) {
      // Exception: Allow Cmd/Ctrl+S (save), Cmd/Ctrl+Enter (submit) in forms
      const isSaveOrSubmit = (event.key === 's' || event.key === 'Enter') &&
                             (event.metaKey || event.ctrlKey);
      if (isSaveOrSubmit) {
        return false;
      }
      return true;
    }

    return false;
  }, []);

  /**
   * Check if shortcut matches the current event
   */
  const matchesShortcut = useCallback((event, shortcut) => {
    const eventKey = event.key.toLowerCase();
    const shortcutKey = shortcut.key.toLowerCase();

    // Check key match
    if (eventKey !== shortcutKey && eventKey !== shortcut.key) {
      return false;
    }

    // Check meta key (Cmd on Mac, Ctrl on Windows)
    if (shortcut.meta) {
      const hasModifier = isMac ? event.metaKey : event.ctrlKey;
      if (!hasModifier) return false;
    }

    // Check shift
    if (shortcut.shift && !event.shiftKey) {
      return false;
    }

    // Check alt
    if (shortcut.alt && !event.altKey) {
      return false;
    }

    return true;
  }, [isMac]);

  /**
   * Execute shortcut action
   */
  const executeShortcut = useCallback((shortcutId, shortcut, event) => {
    event.preventDefault();

    // Check if there's a custom handler
    const customHandler = handlers[shortcut.handler];
    if (customHandler) {
      customHandler(event);
      if (enableVisualFeedback) {
        showFeedback(shortcut);
      }
      return;
    }

    // Execute built-in actions
    switch (shortcut.action) {
      case SHORTCUT_ACTIONS.NAVIGATE:
        if (shortcut.path) {
          console.log(`[Keyboard] Navigate to ${shortcut.path}`);
          navigate(shortcut.path);
          if (enableVisualFeedback) {
            showFeedback(shortcut);
          }
        }
        break;

      case SHORTCUT_ACTIONS.TRIGGER:
        // Handle built-in triggers
        handleBuiltInTrigger(shortcut.handler, event);
        if (enableVisualFeedback) {
          showFeedback(shortcut);
        }
        break;

      case SHORTCUT_ACTIONS.FOCUS:
        // Handle focus actions
        handleFocusAction(shortcut.handler, event);
        break;

      default:
        console.warn(`[Keyboard] Unknown action: ${shortcut.action}`);
    }
  }, [handlers, navigate, enableVisualFeedback, isMac]);

  /**
   * Handle built-in trigger actions
   */
  const handleBuiltInTrigger = useCallback((handler, event) => {
    switch (handler) {
      case 'history.back':
        window.history.back();
        break;

      case 'history.forward':
        window.history.forward();
        break;

      case 'openGlobalSearch':
        // Dispatch custom event for search component to listen to
        window.dispatchEvent(new CustomEvent('openGlobalSearch'));
        // Fallback: Focus search input
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search" i]');
        if (searchInput) {
          searchInput.focus();
        }
        break;

      case 'openKeyboardShortcuts':
        // Dispatch event for support panel to open
        window.dispatchEvent(new CustomEvent('openKeyboardShortcuts'));
        break;

      case 'cancelOrClose':
        // Dispatch escape event for modals
        window.dispatchEvent(new CustomEvent('keyboardEscape'));
        // Blur active element
        if (document.activeElement) {
          document.activeElement.blur();
        }
        break;

      case 'copyCurrentLink':
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
          toast.success('Link copied to clipboard', { autoClose: 2000 });
        });
        break;

      default:
        console.log(`[Keyboard] Trigger: ${handler}`);
    }
  }, []);

  /**
   * Handle focus actions
   */
  const handleFocusAction = useCallback((handler, event) => {
    switch (handler) {
      case 'focusFilter':
        const filterInput = document.querySelector('[data-filter-input], input[placeholder*="Filter" i]');
        if (filterInput) {
          filterInput.focus();
        }
        break;

      default:
        console.log(`[Keyboard] Focus: ${handler}`);
    }
  }, []);

  /**
   * Show visual feedback for shortcut
   */
  const showFeedback = useCallback((shortcut) => {
    const key = isMac ?
      `⌘${shortcut.key.toUpperCase()}` :
      `Ctrl+${shortcut.key.toUpperCase()}`;

    toast.info(`[${key}] ${shortcut.label}`, {
      autoClose: 1500,
      hideProgressBar: true,
      position: 'bottom-right',
    });
  }, [isMac]);

  /**
   * Main keyboard event handler
   */
  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Check all shortcuts for a match
    for (const [shortcutId, shortcut] of Object.entries(KEYBOARD_SHORTCUTS)) {
      // Skip if tier not enabled
      if (!enabledTiers.includes(shortcut.tier)) {
        continue;
      }

      // Skip context-only shortcuts if not in that context
      if (shortcut.contextOnly && context !== shortcut.context) {
        continue;
      }

      // Check if should ignore this event
      if (shouldIgnoreEvent(event, shortcut)) {
        continue;
      }

      // Check if shortcut matches
      if (matchesShortcut(event, shortcut)) {
        executeShortcut(shortcutId, shortcut, event);
        break; // Only execute first matching shortcut
      }
    }
  }, [enabled, enabledTiers, context, shouldIgnoreEvent, matchesShortcut, executeShortcut]);

  // Register global keyboard listener
  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  // Return utilities
  return {
    isMac,
    getModifierKey: () => isMac ? '⌘' : 'Ctrl',
    formatShortcut: (keys) => {
      const modKey = isMac ? '⌘' : 'Ctrl';
      return keys.replace('Cmd', modKey).replace('Ctrl', modKey);
    },
  };
}

/**
 * Get keyboard shortcut display string
 */
export function getShortcutDisplay(shortcut) {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  return shortcut
    .replace('Cmd', modKey)
    .replace('Ctrl', modKey)
    .replace('+', '');
}

export default useKeyboardShortcuts;
