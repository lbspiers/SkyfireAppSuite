import { useState, useEffect } from 'react';

/**
 * Standalone Mode Detection Hook
 *
 * Detects if the app is running in standalone PWA mode (installed to desktop/dock)
 * vs. running in a browser tab.
 *
 * Use this to adjust UI when app is installed:
 * - Hide "Install App" prompts
 * - Show back button (no browser navigation)
 * - Adjust navigation UI
 * - Display standalone-specific features
 *
 * Returns:
 * - isStandalone: boolean - true if running as installed PWA
 * - displayMode: string - 'standalone', 'fullscreen', 'minimal-ui', or 'browser'
 * - isInstalled: boolean - same as isStandalone (alias for clarity)
 *
 * Usage:
 *   const { isStandalone, displayMode } = useStandaloneMode();
 *
 *   if (isStandalone) {
 *     // Show back button, hide install prompt, etc.
 *   }
 */
export function useStandaloneMode() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [displayMode, setDisplayMode] = useState('browser');

  useEffect(() => {
    const detectStandaloneMode = () => {
      // Method 1: Check display-mode media query (most reliable)
      const standaloneQuery = window.matchMedia('(display-mode: standalone)');
      const fullscreenQuery = window.matchMedia('(display-mode: fullscreen)');
      const minimalUiQuery = window.matchMedia('(display-mode: minimal-ui)');

      if (standaloneQuery.matches) {
        setIsStandalone(true);
        setDisplayMode('standalone');
        return;
      }

      if (fullscreenQuery.matches) {
        setIsStandalone(true);
        setDisplayMode('fullscreen');
        return;
      }

      if (minimalUiQuery.matches) {
        setIsStandalone(true);
        setDisplayMode('minimal-ui');
        return;
      }

      // Method 2: Check window.navigator.standalone (iOS Safari)
      if (window.navigator.standalone === true) {
        setIsStandalone(true);
        setDisplayMode('standalone');
        return;
      }

      // Method 3: Check for PWA window features
      // When installed, window.matchMedia('(display-mode: browser)') should be false
      const browserQuery = window.matchMedia('(display-mode: browser)');
      if (!browserQuery.matches) {
        setIsStandalone(true);
        setDisplayMode('standalone');
        return;
      }

      // Default: running in browser
      setIsStandalone(false);
      setDisplayMode('browser');
    };

    detectStandaloneMode();

    // Listen for display mode changes
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => detectStandaloneMode();

    // Modern browsers
    if (standaloneQuery.addEventListener) {
      standaloneQuery.addEventListener('change', handleChange);
    } else if (standaloneQuery.addListener) {
      // Safari < 14
      standaloneQuery.addListener(handleChange);
    }

    return () => {
      if (standaloneQuery.removeEventListener) {
        standaloneQuery.removeEventListener('change', handleChange);
      } else if (standaloneQuery.removeListener) {
        standaloneQuery.removeListener(handleChange);
      }
    };
  }, []);

  return {
    isStandalone,
    displayMode,
    isInstalled: isStandalone, // Alias for clarity
    isBrowser: !isStandalone
  };
}

/**
 * Get standalone mode synchronously (non-hook version)
 * Use this for one-time checks outside of React components
 *
 * @returns {Object} { isStandalone, displayMode }
 */
export function getStandaloneMode() {
  if (typeof window === 'undefined') {
    return { isStandalone: false, displayMode: 'browser' };
  }

  const standaloneQuery = window.matchMedia('(display-mode: standalone)');
  const fullscreenQuery = window.matchMedia('(display-mode: fullscreen)');
  const minimalUiQuery = window.matchMedia('(display-mode: minimal-ui)');

  if (standaloneQuery.matches) {
    return { isStandalone: true, displayMode: 'standalone' };
  }

  if (fullscreenQuery.matches) {
    return { isStandalone: true, displayMode: 'fullscreen' };
  }

  if (minimalUiQuery.matches) {
    return { isStandalone: true, displayMode: 'minimal-ui' };
  }

  if (window.navigator.standalone === true) {
    return { isStandalone: true, displayMode: 'standalone' };
  }

  return { isStandalone: false, displayMode: 'browser' };
}

export default useStandaloneMode;
