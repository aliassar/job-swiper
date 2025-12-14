
const CACHE_NAME = 'job-swiper';
const STATIC_CACHE_URLS = [
  '/',
  '/applications',
  '/saved',
  '/skipped',
  '/reported',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches and legacy routes
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
      // Clean up legacy routes from current cache
      caches.open(CACHE_NAME).then((cache) => {
        return Promise.all(
          LEGACY_ROUTES.map((route) => cache.delete(route))
        );
      }),
    ])
  );
  self.clients.claim();
});

// Fetch event - network-first strategy for API calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return a custom offline response for API calls
            return new Response(
              JSON.stringify({ error: 'Offline - data not available' }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'application/json',
                }),
              }
            );
          });
        })
    );
    return;
  }

  // Static assets - cache first, then network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache non-GET requests or error responses
        if (request.method !== 'GET' || !response || response.status !== 200) {
          return response;
        }

        // Clone the response before caching
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Background sync for offline queue
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(
      // Trigger queue processing
      // The actual queue processing is handled by the offlineQueue.js module
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'PROCESS_OFFLINE_QUEUE',
          });
        });
      })
    );
  }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
