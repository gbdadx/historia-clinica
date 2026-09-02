const CACHE_NAME = 'anotador-guardia-v2';
const OFFLINE_URL = '/offline.html';
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/img/GreenFavicon.png',
  OFFLINE_URL
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Intent: cache what we can but don't fail installation if some fetches fail
    await Promise.all(PRECACHE.map(async (url) => {
      try {
        const res = await fetch(url, {cache: 'no-cache'});
        if (res && res.ok) {
          await cache.put(url, res.clone());
        } else {
          console.warn('Precaching failed (no-ok):', url, res && res.status);
        }
      } catch (err) {
        console.warn('Precaching failed (fetch error):', url, err);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Navigation (HTML pages): network-first with fallback to cache/offline
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(req);
        // update cached index.html for future navigations
        const cache = await caches.open(CACHE_NAME);
        cache.put('/index.html', networkResponse.clone()).catch(() => {});
        return networkResponse;
      } catch (err) {
        const cached = await caches.match('/index.html');
        if (cached) return cached;
        return caches.match(OFFLINE_URL);
      }
    })());
    return;
  }

  // Assets same-origin: cache-first, then update from network
  if (req.method === 'GET' && req.url.startsWith(self.location.origin)) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const networkRes = await fetch(req);
        if (networkRes && networkRes.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, networkRes.clone()).catch(() => {});
        }
        return networkRes;
      } catch (err) {
        return caches.match('/index.html');
      }
    })());
  }
});
