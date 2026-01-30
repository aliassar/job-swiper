/**
 * Service Worker for Job Swiper PWA
 * Handles offline caching and navigation for Next.js App Router
 */

const CACHE_NAME = 'job-swiper-v4';
const OFFLINE_FALLBACK = '/';

// Pages to pre-cache for offline navigation
const STATIC_CACHE_URLS = [
  '/',
  '/applications',
  '/saved',
  '/skipped',
  '/reported',
  '/settings',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static pages');
      return Promise.allSettled(
        STATIC_CACHE_URLS.map(url =>
          cache.add(url).catch(err => console.warn(`[SW] Failed to cache ${url}:`, err))
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip webpack HMR and development requests
  if (url.pathname.includes('webpack') || url.pathname.includes('_next/webpack')) {
    return;
  }

  // API requests - network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Next.js RSC (React Server Components) requests - these have special headers
  // They're used for client-side navigation in App Router
  const isRSCRequest = request.headers.get('RSC') === '1' ||
    request.headers.get('Next-Router-State-Tree') ||
    url.searchParams.has('_rsc');

  if (isRSCRequest) {
    // RSC requests should always go to network to get fresh data
    // Don't cache these as they contain dynamic content that can become stale
    event.respondWith(handleRSCRequest(request, url));
    return;
  }

  // Next.js static files (_next) - cache first for performance
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Navigation requests (HTML pages) - network first with offline fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(navigationStrategy(request, url));
    return;
  }

  // Everything else - network first to avoid stale cache issues
  event.respondWith(networkFirstStrategy(request));
});

/**
 * Handle Next.js RSC navigation requests
 * RSC responses contain dynamic content and should NOT be cached
 * to prevent stale data issues on page refresh
 */
async function handleRSCRequest(request, url) {
  try {
    // Always fetch from network for RSC requests - don't cache
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('[SW] RSC request failed, attempting fallback for:', url.pathname);

    // Fall back to cached HTML page for this route (offline fallback only)
    const pageUrl = new URL(url.pathname, url.origin);
    const cachedPage = await caches.match(pageUrl.href);
    if (cachedPage) {
      // Return a response that tells Next.js to do a full page navigation
      return new Response(null, {
        status: 200,
        headers: {
          'x-nextjs-cache': 'STALE',
          'content-type': 'text/x-component',
        }
      });
    }

    // Return error that will trigger client-side fallback
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network first strategy - try network, fall back to cache
 */
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(
      JSON.stringify({ error: 'Offline - data not available', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Cache first strategy - try cache, fall back to network
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('', { status: 503 });
  }
}

/**
 * Navigation strategy - network first with fallback to cached page or home
 */
async function navigationStrategy(request, url) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Navigation failed, trying cache for:', url.pathname);

    // Try to return cached version of this page
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Returning cached page');
      return cachedResponse;
    }

    // Try to match by pathname only (without query params)
    const pathOnlyUrl = new URL(url.pathname, url.origin);
    const cachedByPath = await caches.match(pathOnlyUrl.href);
    if (cachedByPath) {
      console.log('[SW] Returning cached page by path');
      return cachedByPath;
    }

    // Try to return cached home page as fallback
    const fallbackResponse = await caches.match(OFFLINE_FALLBACK);
    if (fallbackResponse) {
      console.log('[SW] Returning home page fallback');
      return fallbackResponse;
    }

    // Last resort - offline error page
    console.log('[SW] No cache available, showing offline page');
    return offlineErrorPage();
  }
}

/**
 * Generate offline error page
 */
function offlineErrorPage() {
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Offline - Job Swiper</title>
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            margin: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container { 
            text-align: center; 
            padding: 2rem; 
            background: white;
            border-radius: 1rem;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 400px;
            margin: 1rem;
          }
          .icon { font-size: 4rem; margin-bottom: 1rem; }
          h1 { color: #1e293b; margin: 0 0 0.5rem 0; font-size: 1.5rem; }
          p { color: #64748b; margin: 0 0 1.5rem 0; }
          button { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            border: none; 
            padding: 0.875rem 2rem; 
            border-radius: 0.5rem; 
            cursor: pointer; 
            font-size: 1rem;
            font-weight: 600;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }
          button:active { transform: translateY(0); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📶</div>
          <h1>You're Offline</h1>
          <p>Please check your internet connection and try again.</p>
          <button onclick="location.reload()">Try Again</button>
        </div>
      </body>
    </html>`,
    {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    }
  );
}

/**
 * Stale while revalidate - return cache immediately, update in background
 */
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, response.clone());
      });
    }
    return response;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Background sync for offline queue
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'PROCESS_OFFLINE_QUEUE' });
        });
      })
    );
  }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
