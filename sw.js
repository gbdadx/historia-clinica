const CACHE_NAME = 'anotador-guardia-v2'; // subí este número cada vez que cambies index.html
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './img/GreenFavicon.png'
];

// Instala el Service Worker y guarda los archivos en caché
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activa el Service Worker y limpia cachés viejos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null)))
    )
  );
  self.clients.claim();
});

// Intercepta los pedidos: intenta red, si falla usa el caché (con fallback correcto)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() =>
      caches.match(e.request).then((cached) => cached || caches.match('./index.html'))
    )
  );
});
