const CACHE_NAME = 'anotador-guardia-v1';
// Lista de archivos a guardar en el teléfono (en tu caso, solo el index)
const ASSETS = [
  './',
  './index.html'
];

// Instala el Service Worker y guarda el HTML en caché
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activa el Service Worker y limpia cachés viejos si los hubiera
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// El truco mágico: Intercepta las búsquedas. Si no hay red, usa el caché.
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request) || caches.match('./index.html');
    })
  );
});
