// Skyfire Service Worker
// Version format: YYYY.MM.DD.increment (e.g., 2024.12.25.1)
// IMPORTANT: Increment version when changing caching behavior to force browser updates
const CACHE_VERSION = '2026.01.29.1745';
const CACHE_NAME = `skyfire-cache-v${CACHE_VERSION}`;

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png'
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker version:', CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching critical assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate immediately for faster updates
        console.log('[SW] Skipping waiting - activating new version immediately');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker version:', CACHE_VERSION);

  event.waitUntil(
    Promise.all([
      // Delete ALL old caches (not just with our prefix)
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activation complete - all old caches deleted, clients claimed');
    })
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // CRITICAL: Skip ALL API calls - NEVER cache API responses
  // This ensures equipment data, project data, and all other API calls
  // always fetch fresh data from the backend
  if (url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/equipment/') ||
      url.pathname.startsWith('/socket.io/') ||
      url.hostname !== self.location.hostname) {
    // Return early without calling event.respondWith()
    // This tells the browser to handle the request normally (network-only)
    return;
  }

  // For navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Return offline page if network fails
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // For static assets - stale-while-revalidate strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        // Update cache with fresh response
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      });

      // Return cached version immediately, update in background
      return cachedResponse || fetchPromise;
    })
  );
});

// Message event - handle skip waiting from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING message received - activating immediately');
    self.skipWaiting().then(() => {
      console.log('[SW] skipWaiting() completed');
    });
  }
});

// Push notification support (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Skyfire', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if needed
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
