const CACHE_NAME = 'ludus-verborum-cache-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './icon.svg',
  './manifest.json'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Stale-While-Revalidate strategy)
self.addEventListener('fetch', (e) => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;
  
  const url = e.request.url;

  // Skip dev environment socket connections and hot reloads
  if (url.includes('ws://') || url.includes('/@vite/') || url.includes('hot-update') || url.includes('/node_modules/')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, cacheCopy);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          console.log('Fetch failed; returning cached resource if available.', err);
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
