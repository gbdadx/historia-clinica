const CACHE_NAME = 'anotador-guardia-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/img/GreenFavicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // App shell / navigation requests: respond from cache (index.html) for reliable offline
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => cached || fetch('/index.html'))
    );
    return;
  }

  // For same-origin GET requests, try cache first then network and update cache
  if (req.method === 'GET' && req.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((networkRes) => {
          // put a copy in cache for future
          return caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(req, networkRes.clone());
            } catch (e) {
              // some responses aren't cacheable; ignore errors
            }
            return networkRes;
          });
        }).catch(() => caches.match('/index.html'));
      })
    );
  }
  // For other requests (cross-origin), use network as default
});
