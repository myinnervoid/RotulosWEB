const CACHE_NAME = 'rotulos-editor-v5.2.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/style.min.css',
  '/style.css',
  '/modules/main.js',
  '/vendor/grapesjs.min.js',
  '/vendor/grapesjs-blocks-basic.min.js',
  '/locales/es.json',
  '/locales/en.json',
  '/diagnostics.js',
  '/vendor/axe.min.js',
  '/fonts/SpaceGrotesk.ttf',
  '/fonts/SpaceMono-Regular.ttf',
  '/fonts/SpaceMono-Bold.ttf'
];

// Instalación: Precargar recursos en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache).catch(err => console.warn('[SW] Aviso al precargar algunos assets:', err)))
      .then(() => self.skipWaiting())
  );
});

// Activación y depuración de cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Purgando caché obsoleta:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia Network-First con Fallback Offline para evitar servir módulos o estilos obsoletos
self.addEventListener('fetch', event => {
  // No interceptar llamadas a la API dinámica, vista en vivo (/live) ni peticiones que no sean GET
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('/live')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, cloned);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si la red falla por falta de conexión, servir desde caché
        return caches.match(event.request);
      })
  );
});
