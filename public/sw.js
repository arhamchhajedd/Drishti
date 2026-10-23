// Drishti AI Service Worker
// Strictly follows AGENTS.md:
// "Service worker caches only static assets. NEVER cache /api/* responses or images."

const CACHE_NAME = "drishti-static-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Never cache non-GET requests (e.g. POST to /api/describe)
  if (event.request.method !== "GET") {
    return;
  }

  // 2. NEVER cache /api/* responses or dynamically captured images (AGENTS.md rule)
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // 3. Cache-first strategy for static assets only
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache static JS/CSS bundles and fonts
        if (
          networkResponse.status === 200 &&
          (url.pathname.startsWith("/_next/static/") || url.pathname.endsWith(".svg"))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
