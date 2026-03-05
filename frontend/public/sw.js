/* eslint-disable no-undef */
const CACHE_NAME = 'tb-cache-v2';
const OFFLINE_URL = '/offline';

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/icons/logo.svg',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
];

// Install: pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for navigations, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET, non-http(s), and cross-origin API calls
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;
  if (request.url.includes('/api/')) return;
  if (request.url.includes('firebaseio.com')) return;
  if (request.url.includes('googleapis.com')) return;
  if (request.url.includes('facebook.com')) return;
  if (request.url.includes('facebook.net')) return;

  // Navigation requests: network-first, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL) || caches.match('/'))
    );
    return;
  }

  // Static assets: stale-while-revalidate
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.url.includes('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetched = fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
        return cached || fetched;
      })
    );
    return;
  }
});
