const CACHE_VERSION = "nexora-pwa-v2";
const APP_SHELL_CACHE = `${CACHE_VERSION}-app-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL_FILES = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/logo.png",
];

const PWA_ALLOWED_ROUTES = ["/dashboards", "/ai-assistant", "/alerts"];

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isAllowedNavigationPath(pathname) {
  return PWA_ALLOWED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_FILES)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => !cacheName.startsWith(CACHE_VERSION))
          .map((cacheName) => caches.delete(cacheName)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!isSameOrigin(url)) {
    return;
  }

  if (request.mode === "navigate") {
    if (!isAllowedNavigationPath(url.pathname)) {
      return;
    }

    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);

          // Handles servers that return 404 for SPA routes (/dashboards, etc.)
          if (networkResponse && networkResponse.ok) {
            return networkResponse;
          }

          const cachedIndex = await caches.match("/index.html");
          if (cachedIndex) {
            return cachedIndex;
          }

          return fetch("/index.html");
        } catch {
          const cachedIndex = await caches.match("/index.html");
          return cachedIndex || Response.error();
        }
      })(),
    );
    return;
  }

  const isRuntimeAsset =
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font";

  if (!isRuntimeAsset) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse || Response.error());

      return cachedResponse || networkFetch;
    }),
  );
});
