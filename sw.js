// sw.js — The Reset Compass v1.0.3
const CACHE_NAME = 'reset-compass-cache-v103';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: Precache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: Clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(k => {
        if (k !== CACHE_NAME) return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

// Fetch: Network-first, fallback to cache if offline
self.addEventListener('fetch', event => {
  const req = event.request;
  event.respondWith(
    fetch(req)
      .then(networkRes => {
        // Update cache silently
        caches.open(CACHE_NAME).then(cache => cache.put(req, networkRes.clone()));
        return networkRes;
      })
      .catch(() => caches.match(req).then(cachedRes => cachedRes || caches.match('./index.html')))
  );
});

// Listen for skipWaiting trigger (in case of manual updates)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
