// Service Worker for The Reset Compass
const CACHE_VERSION = 'reset-compass-v2.1.0';
const CACHE_NAME = `${CACHE_VERSION}`;

// Files to cache on install (offline fallback)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/data/modes.json',
  '/data/activities.json',
  '/assets/images/compass.svg',
  '/assets/images/compass.png',
  '/about.html',
  '/onboarding.html',
  '/css/cinematic.css',
  '/css/onboarding.css',
  '/js/intro.js',
  '/js/modes-loader.js',
  '/js/modes-ui.js',
  '/js/onboarding.js',
  '/js/mode-activity-view.js',
  '/js/quick-wins-view.js',
  '/js/shuffle-mode.js',
  '/assets/compass.svg',
  '/assets/images/compass-192.png',
  '/assets/images/compass-512.png',
  '/assets/images/app-icon.png',
  '/assets/images/app-icon-rounded.png'
];

// Define which files should use network-first vs cache-first
const NETWORK_FIRST_PATHS = [
  '/index.html',
  '/about.html',
  '/onboarding.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/data/modes.json',
  '/data/activities.json',
  '/css/cinematic.css',
  '/css/onboarding.css',
  '/js/intro.js',
  '/js/modes-loader.js',
  '/js/modes-ui.js',
  '/js/onboarding.js',
  '/js/mode-activity-view.js',
  '/js/quick-wins-view.js',
  '/js/shuffle-mode.js'
];

// Helper to check if URL should use network-first
function shouldUseNetworkFirst(url) {
  const pathname = new URL(url).pathname;
  return NETWORK_FIRST_PATHS.some(path => pathname.endsWith(path) || pathname === path || pathname === '/');
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - network-first for app files, cache-first for assets
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Use network-first strategy for app files to ensure updates are fetched
  if (shouldUseNetworkFirst(event.request.url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response before caching
          const responseToCache = response.clone();

          // Update cache with fresh content
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          console.log('[SW] Serving fresh from network:', event.request.url);
          return response;
        })
        .catch((error) => {
          // If network fails, fall back to cache
          console.log('[SW] Network failed, falling back to cache:', event.request.url);
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              console.error('[SW] No cached version available:', error);
              throw error;
            });
        })
    );
  } else {
    // Use cache-first for images and other static assets
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Serving from cache:', event.request.url);
            return cachedResponse;
          }

          console.log('[SW] Fetching from network:', event.request.url);
          return fetch(event.request)
            .then((response) => {
              // Don't cache non-successful responses
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }

              // Clone the response
              const responseToCache = response.clone();

              // Cache the fetched resource
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            })
            .catch((error) => {
              console.error('[SW] Fetch failed:', error);
              throw error;
            });
        })
    );
  }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notify clients when a new version is ready
self.addEventListener('controllerchange', () => {
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_UPDATED',
        message: 'A new version is available!'
      });
    });
  });
});