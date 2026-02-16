const CACHE_NAME = 'permis-free-v3'; // Incremented to force update
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './logo.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force activation
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  // Claim clients immediately
  event.waitUntil(self.clients.claim());
  
  // Clear old caches
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Navigation (HTML): Network First -> Fallback to Cache
  // This ensures we always get the latest index.html pointing to latest JS
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // Clone and cache latest version
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(event.request) || caches.match('./index.html');
        })
    );
    return;
  }

  // 2. Assets (JS, CSS, Images): Cache First -> Fallback to Network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          function(response) {
            // Check if valid
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Dynamically cache new assets (especially hashed ones)
            if (url.pathname.includes('/assets/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
                 const responseToCache = response.clone();
                 caches.open(CACHE_NAME).then(function(cache) {
                   cache.put(event.request, responseToCache);
                 });
            }

            return response;
          }
        );
      })
  );
});
