import { useState, useEffect, useCallback } from 'react';
import { register, setupControllerChangeReload } from '../utils/serviceWorkerRegistration';

/**
 * Hook to manage PWA service worker updates
 * Returns state and controls for the update notification
 */
export function useServiceWorker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Register the service worker
    register({
      onUpdate: (reg) => {
        setRegistration(reg);
        setUpdateAvailable(true);
      },
      onSuccess: () => {
        // Content cached for offline use
      }
    });

    // Setup auto-reload when new SW takes control
    setupControllerChangeReload();

    // Monitor online/offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Listen for version mismatch events from axios
    const handleVersionMismatch = (event) => {
      setUpdateAvailable(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('app-update-available', handleVersionMismatch);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('app-update-available', handleVersionMismatch);
    };
  }, []);

  // Apply update and reload
  const applyUpdate = useCallback(async () => {
    // Step 1: Clear all caches from client side
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      } catch (error) {
        console.error('[Update] Error clearing caches:', error);
      }
    }

    // Step 2: Tell waiting SW to skip waiting
    if (registration && registration.waiting) {
      // Set up reload handler BEFORE sending skip waiting
      let reloadTriggered = false;
      const handleControllerChange = () => {
        if (!reloadTriggered) {
          reloadTriggered = true;
          // Small delay to ensure new SW is fully active
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      // Fallback: If controllerchange doesn't fire within 2 seconds, force reload
      setTimeout(() => {
        if (!reloadTriggered) {
          window.location.reload();
        }
      }, 2000);

      // Tell the waiting SW to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // No waiting SW - just force reload
      window.location.reload();
    }
  }, [registration]);

  // Dismiss update notification (user wants to update later)
  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return {
    updateAvailable,
    applyUpdate,
    dismissUpdate,
    isOffline
  };
}
