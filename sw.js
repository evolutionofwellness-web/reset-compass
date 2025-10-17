// sw.js — The Reset Compass v1.0.5
const CACHE_NAME = 'reset-compass-cache-v105';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: pre-cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k !== CACHE_NAME)
        .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Network-first strategy with offline fallback
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Don’t cache analytics, tracking, or external assets
  if (
    url.hostname.includes('plausible.io') ||
    url.hostname.includes('googletagmanager.com') ||
    url.protocol.startsWith('chrome-extension')
  ) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        // Clone & cache successful GET requests only
        if (req.method === 'GET' && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(cached => cached || caches.match('./index.html'))
      )
  );
});

// Manual skipWaiting (optional trigger)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
