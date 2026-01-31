// Service Worker Registration Utility
// Handles registration, updates, and communication with the SW

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config = {}) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';

      if (isLocalhost) {
        // Running on localhost - check if SW exists
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log('[SW] App is being served cache-first by service worker.');
        });
      } else {
        // Production - register SW
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('[SW] Service worker registered:', registration.scope);

      // Check for updates periodically (every 5 minutes)
      setInterval(() => {
        registration.update();
      }, 5 * 60 * 1000); // 5 minutes

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available - notify the app
              console.log('[SW] New content available, will update on next reload.');

              if (config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // Content is cached for offline use
              console.log('[SW] Content cached for offline use.');

              if (config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('[SW] Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found, proceed with registration
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('[SW] No internet connection. App running in offline mode.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('[SW] Error unregistering service worker:', error);
      });
  }
}

// Tell the waiting service worker to activate
export function skipWaiting() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
}

// Force reload all tabs when new SW takes over
export function setupControllerChangeReload() {
  if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }
}
