const CACHE_NAME = 'pgqbank-cache-v1';

// On install, activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// On activate, take control of all clients and clear old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// On fetch, use a network-first strategy
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For HTML pages, always go to the network first to get the latest version.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For other assets (CSS, JS, images), use cache-first for performance
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Clone the response stream
        const responseToCache = networkResponse.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
           // Don't cache chrome-extension URLs or API calls
           if (!event.request.url.startsWith('chrome-extension') && event.request.url.includes('http')) {
             cache.put(event.request, responseToCache);
           }
        });

        return networkResponse;
      });
    })
  );
});
