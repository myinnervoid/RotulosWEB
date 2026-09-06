const CACHE_NAME = 'rotulos-editor-v3.3.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.min.css',
  '/style.css',
  '/app.min.js',
  '/app.js',
  '/vendor/grapesjs/css/grapes.min.css',
  '/vendor/grapesjs/grapes.min.js',
  '/vendor/grapesjs-blocks-basic/index.js',
  '/locales/es.json',
  '/locales/en.json',
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

// Estrategia Stale-While-Revalidate para máxima velocidad y resiliencia offline
self.addEventListener('fetch', event => {
  // No interceptar llamadas a la API dinámica ni websockets
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
              const cloned = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, cloned);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Si la red falla por falta de internet, se usa la caché
          });
        return response || fetchPromise;
      })
  );
});
